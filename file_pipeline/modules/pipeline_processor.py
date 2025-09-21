import queue
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from modules.ocr_processor import MinerUProcessor
from modules.llm_processor import LLMProcessor
from utils.database import DatabaseManager
from utils.file_manager import FileManager
from utils.logger import setup_logger
from config.settings import MAX_WORKERS
from extraction.extraction_service import ExtractionService
from utils.tag_validator import TagValidator

logger = setup_logger("pipeline_processor")

class PipelineProcessor:
    """Pipeline处理器 - 管理整个处理流程"""
    
    def __init__(self):
        self.ocr_processor = MinerUProcessor()
        self.llm_processor = LLMProcessor()
        self.extractor = ExtractionService().get_instance()
        self.database = DatabaseManager()
        self.file_manager = FileManager()
        self.tag_validator = TagValidator()
        
        self.executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)
        self.running = False
        self.stats = {
            'total_processed': 0,
            'successful': 0,
            'failed': 0,
            'ocr_failed': 0,
            'llm_failed': 0,
            'db_failed': 0
        }
    
    def start_processing(self, file_queue: queue.Queue):
        """开始处理队列中的文件"""
        self.running = True
        logger.info("Pipeline处理器启动")
        
        # 检查依赖
        if not self._check_dependencies():
            logger.error("依赖检查失败，处理器无法启动")
            return
        
        try:
            while self.running:
                try:
                    # 从队列获取文件，超时1秒
                    file_path = file_queue.get(timeout=1)
                    
                    # 提交处理任务
                    future = self.executor.submit(self._process_single_file, file_path)
                    
                    # 标记任务完成
                    file_queue.task_done()
                    
                except queue.Empty:
                    continue
                except Exception as e:
                    logger.error(f"处理队列异常: {e}")
                    time.sleep(1)
        
        except KeyboardInterrupt:
            logger.info("接收到中断信号，正在停止...")
        finally:
            self.stop_processing()
    
    def stop_processing(self):
        """停止处理器"""
        self.running = False
        self.executor.shutdown(wait=True)
        logger.info("Pipeline处理器已停止")
    
    def _process_single_file(self, file_path: Path):
        """处理单个文件"""
        file_id = None
        start_time = time.time()
        
        try:
            logger.info(f"开始处理文件: {file_path.name}")
            self.stats['total_processed'] += 1
            
            # 1. 移动文件到处理目录
            processing_path = self.file_manager.move_to_processing(file_path)
            if not processing_path:
                raise Exception("文件移动失败")
            
            # 2. 创建数据库记录
            file_id = self.database.create_resume_file_record(processing_path)
            if not file_id:
                raise Exception("创建数据库记录失败")
            
            # 3. OCR处理
            self.database.update_ocr_status(file_id, "processing")
            
            markdown_content = self.ocr_processor.process_pdf(processing_path)
            if not markdown_content:
                self.database.update_ocr_status(file_id, "failed", "OCR处理失败")
                self.stats['ocr_failed'] += 1
                raise Exception("OCR处理失败")
            
            self.database.update_ocr_status(file_id, "completed")
            logger.info(f"OCR处理完成: {file_path.name}")
            
            # 4. LLM解析
            self.database.update_llm_status(file_id, "processing")
            
            parsed_data = self.llm_processor.parse_resume_content(markdown_content)
            if not parsed_data:
                self.database.update_llm_status(file_id, "failed", "LLM解析失败")
                self.stats['llm_failed'] += 1
                raise Exception("LLM解析失败")
            
            # 验证解析结果
            if not self.llm_processor.validate_parsed_data(parsed_data):
                self.database.update_llm_status(file_id, "failed", "解析数据验证失败")
                self.stats['llm_failed'] += 1
                raise Exception("解析数据验证失败")

            # 5. **新增：标签分析**
            logger.info("开始标签分析...")
            logger.info(f"传递给标签分析的数据类型: {type(parsed_data)}")
            tag_analysis = self.llm_processor.analyze_resume_tags(parsed_data)
            if not tag_analysis:
                logger.warning("标签分析失败，使用默认分类")
                tag_analysis = {"category": "非技术类", "tags": [], "reasoning": "标签分析失败，默认分类"}
            
            # 验证和过滤标签
            category = tag_analysis["category"]
            raw_tags = tag_analysis["tags"]
            valid_tags = self.tag_validator.filter_valid_tags(raw_tags, category)
            
            logger.info(f"标签分析结果: {category}, 原始标签{len(raw_tags)}个, 有效标签{len(valid_tags)}个")

            # 6. 创建简历档案 (修改为包含标签)
            profile_id = self.database.create_resume_profile_with_tags(
                file_id, parsed_data, valid_tags
            )
            if not profile_id:
                self.database.update_llm_status(file_id, "failed", "创建简历档案失败")
                self.stats['db_failed'] += 1
                raise Exception("创建简历档案失败")
            
            self.database.update_llm_status(file_id, "completed")
            
            # 7. 移动到完成目录
            completed_path = self.file_manager.move_to_completed(processing_path)
            if not completed_path:
                logger.warning(f"移动到完成目录失败: {processing_path}")
            
            # 8. 清理临时文件
            self.ocr_processor.cleanup_temp_files(processing_path)

            # 9. 移除原有的异步标签提取，因为已经在这里完成了
            # self.extractor.push({"starter": "pipeline", "payload": {'id': profile_id, 'data': parsed_data}})
            
            # 统计
            self.stats['successful'] += 1
            processing_time = time.time() - start_time
            
            logger.info(f"文件处理完成: {file_path.name}, 用时: {processing_time:.2f}秒, 档案ID: {profile_id}, 分类: {category}, 标签: {valid_tags}")
            
        except Exception as e:
            self.stats['failed'] += 1
            error_msg = str(e)
            
            logger.error(f"文件处理失败: {file_path.name}, 错误: {error_msg}")
            
            # 移动到失败目录
            try:
                processing_path = self.file_manager.dirs['processing'] / file_path.name
                if processing_path.exists():
                    self.file_manager.move_to_failed(processing_path, error_msg)
                else:
                    self.file_manager.move_to_failed(file_path, error_msg)
            except Exception as move_error:
                logger.error(f"移动失败文件时出错: {move_error}")
            
            # 清理临时文件
            try:
                self.ocr_processor.cleanup_temp_files(file_path)
            except:
                pass
    
    def _check_dependencies(self) -> bool:
        """检查依赖是否可用"""
        try:
            # 检查MinerU
            if not self.ocr_processor.is_mineru_available():
                logger.error("MinerU不可用，请确保已正确安装")
                return False
            
            # 检查数据库连接
            if not self.database.test_connection():
                logger.error("数据库连接失败")
                return False
            
            # 检查目录权限
            for dir_name, dir_path in self.file_manager.dirs.items():
                if not dir_path.exists():
                    logger.error(f"目录不存在: {dir_name} -> {dir_path}")
                    return False
            
            logger.info("依赖检查通过")
            return True
            
        except Exception as e:
            logger.error(f"依赖检查失败: {e}")
            return False
    
    def get_stats(self) -> dict:
        """获取处理统计信息"""
        return self.stats.copy()
    
    def get_directory_stats(self) -> dict:
        """获取目录统计信息"""
        return self.file_manager.get_directory_stats()
    
    def is_running(self) -> bool:
        """检查处理器是否正在运行"""
        return self.running