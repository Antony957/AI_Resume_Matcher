#!/usr/bin/env python3
"""
简历处理Pipeline主服务
功能：监控文件上传目录，自动处理PDF简历文件
"""

import os
import sys
import signal
import time
import threading
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# 加载环境变量
try:
    from dotenv import load_dotenv
    load_dotenv(project_root / '.env')
except ImportError:
    print("警告: python-dotenv 未安装，请运行: pip install python-dotenv")

from modules.file_watcher import FileWatcher
from modules.pipeline_processor import PipelineProcessor
from utils.logger import setup_logger
from config.settings import UPLOAD_DIRS
# from match.match_service import MatchService  # 暂时取消匹配服务
from extraction.extraction_service import ExtractionService
from apscheduler.schedulers.background import BackgroundScheduler

logger = setup_logger("main")

class ResumeProcessingService:
    """简历处理服务主类"""
    
    def __init__(self):
        self.file_watcher = FileWatcher()
        self.pipeline_processor = PipelineProcessor()
        self.running = False
        self.stats_thread = None
        self.extractor_queue = ExtractionService().get_instance()
        # self.match_queue = MatchService().get_instance()  # 暂时取消匹配服务
        self.scheduler = BackgroundScheduler()
        
        # 注册信号处理器
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def start(self):
        """启动服务"""
        try:
            logger.info("=" * 60)
            logger.info("简历处理Pipeline服务启动")
            logger.info("=" * 60)
            
            # 检查环境
            if not self._check_environment():
                logger.error("环境检查失败，服务无法启动")
                return
            
            # 显示配置信息
            self._show_configuration()
            
            # 启动文件监控
            self.file_watcher.start()
            
            # 启动统计线程
            self._start_stats_thread()
            
            # 启动处理器
            self.running = True
            
            logger.info("服务启动成功，开始监控文件...")

            # 启动调度器
            self.scheduler.start()
            
            # 暂时取消定时任务，只进行简历处理和标签提取
            # import datetime
            # run_time = datetime.datetime.now() + datetime.timedelta(seconds=10)
            # self.scheduler.add_job(self._schedule_tasks, 'date', run_date=run_time, id='initial_task')
            # 
            # # 然后每5分钟执行一次
            # self.scheduler.add_job(self._schedule_tasks, 'interval', minutes=5, id='my_job_id')
            # self.match_queue.start_worker()  # 暂时取消匹配服务
            self.extractor_queue.start_worker()
            
            # 开始处理文件队列
            self.pipeline_processor.start_processing(self.file_watcher.get_file_queue())
            
        except Exception as e:
            logger.error(f"服务启动失败: {e}")
            self.stop()
    
    def stop(self):
        """停止服务"""
        if not self.running:
            return
        
        logger.info("正在停止服务...")
        self.running = False

        # 停止调度器
        try:
            self.scheduler.shutdown()
            print("Scheduler shut down.")
        except Exception as e:
            print(f"Error shutting down scheduler: {e}")

        # 停止匹配调度 - 已取消
        # try:
        #     self.match_queue.stop_worker()
        #     print("Match Queue worker shut down.")
        # except Exception as e:
        #     print(f"Error stopping queue worker: {e}")

        # 停止提取标签调度
        try:
            self.extractor_queue.stop_worker()
            print("Extractor Queue worker shut down.")
        except Exception as e:
            print(f"Error stopping queue worker: {e}")
        
        # 停止文件监控
        try:
            self.file_watcher.stop()
        except Exception as e:
            logger.warning(f"停止文件监控时出错: {e}")
        
        # 停止处理器
        try:
            self.pipeline_processor.stop_processing()
        except Exception as e:
            logger.warning(f"停止处理器时出错: {e}")
        
        # 停止统计线程
        if self.stats_thread and self.stats_thread.is_alive():
            self.stats_thread.join(timeout=5)
        
        logger.info("服务已停止")
    
    def _check_environment(self) -> bool:
        """检查运行环境"""
        try:
            # 检查必要的环境变量
            required_env = ['SUPABASE_URL', 'SUPABASE_KEY', 'OPENAI_API_KEY']
            missing_env = [env for env in required_env if not os.getenv(env)]
            
            if missing_env:
                logger.error(f"缺少必要环境变量: {missing_env}")
                logger.error("请创建.env文件并配置必要的环境变量")
                return False
            
            # 检查目录权限
            for dir_name, dir_path in UPLOAD_DIRS.items():
                if not dir_path.exists():
                    logger.error(f"目录不存在: {dir_name} -> {dir_path}")
                    return False
                
                if not os.access(dir_path, os.R_OK | os.W_OK):
                    logger.error(f"目录权限不足: {dir_path}")
                    return False
            
            logger.info("环境检查通过")
            return True
            
        except Exception as e:
            logger.error(f"环境检查失败: {e}")
            return False
    
    def _show_configuration(self):
        """显示配置信息"""
        logger.info("服务配置:")
        logger.info(f"  监控目录: {UPLOAD_DIRS['pending']}")
        logger.info(f"  处理目录: {UPLOAD_DIRS['processing']}")
        logger.info(f"  完成目录: {UPLOAD_DIRS['completed']}")
        logger.info(f"  失败目录: {UPLOAD_DIRS['failed']}")
        logger.info(f"  最大并发数: {self.pipeline_processor.executor._max_workers}")
        logger.info(f"  OpenAI API: {os.getenv('OPENAI_BASE_URL', 'default')}")
        logger.info("-" * 60)
    
    def _start_stats_thread(self):
        """启动统计线程"""
        def stats_worker():
            while self.running:
                try:
                    time.sleep(30)  # 每30秒输出一次统计
                    if self.running:
                        self._print_stats()
                except Exception as e:
                    logger.warning(f"统计线程异常: {e}")
        
        self.stats_thread = threading.Thread(target=stats_worker, daemon=True)
        self.stats_thread.start()
    
    def _print_stats(self):
        """打印统计信息"""
        try:
            processing_stats = self.pipeline_processor.get_stats()
            directory_stats = self.pipeline_processor.get_directory_stats()
            
            logger.info("=" * 40)
            logger.info("处理统计:")
            logger.info(f"  总处理文件: {processing_stats['total_processed']}")
            logger.info(f"  成功: {processing_stats['successful']}")
            logger.info(f"  失败: {processing_stats['failed']}")
            logger.info(f"    OCR失败: {processing_stats['ocr_failed']}")
            logger.info(f"    LLM失败: {processing_stats['llm_failed']}")
            logger.info(f"    数据库失败: {processing_stats['db_failed']}")
            
            logger.info("目录统计:")
            for dir_name, stats in directory_stats.items():
                logger.info(f"  {dir_name}: {stats['count']} 个文件")
            
            logger.info("=" * 40)
            
        except Exception as e:
            logger.warning(f"获取统计信息失败: {e}")
    
    def _signal_handler(self, signum, frame):
        """信号处理器"""
        logger.info(f"接收到信号 {signum}，正在停止服务...")
        self.stop()
        sys.exit(0)

    def _schedule_tasks(self):
        # logger.info(f"定时触发match任务成功") - 已取消匹配
        # self.match_queue.push({"starter": "scheduler"})
        logger.info(f"定时触发extract任务成功")
        self.extractor_queue.push({"starter": "scheduler"})

def main():
    """主函数"""
    try:
        # 加载环境变量
        from dotenv import load_dotenv
        load_dotenv()
        
        # 创建并启动服务
        service = ResumeProcessingService()
        service.start()
        
    except KeyboardInterrupt:
        logger.info("用户中断，服务停止")
    except Exception as e:
        logger.error(f"服务异常: {e}")
    finally:
        logger.info("程序退出")

if __name__ == "__main__":
    main()