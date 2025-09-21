import time
import queue
import threading
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from utils.logger import setup_logger
from config.settings import UPLOAD_DIRS, SUPPORTED_EXTENSIONS

logger = setup_logger("file_watcher")

class ResumeFileHandler(FileSystemEventHandler):
    """文件事件处理器"""
    
    def __init__(self, file_queue: queue.Queue):
        self.file_queue = file_queue
        self.processed_files = set()  # 避免重复处理
    
    def on_created(self, event):
        """当文件被创建时触发"""
        if event.is_directory:
            return
            
        file_path = Path(event.src_path)
        
        # 检查文件扩展名
        if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            logger.warning(f"不支持的文件类型: {file_path}")
            return
        
        # 等待文件上传完成
        self._wait_for_file_complete(file_path)
        
        # 避免重复处理
        if str(file_path) in self.processed_files:
            return
            
        self.processed_files.add(str(file_path))
        
        # 添加到处理队列
        self.file_queue.put(file_path)
        logger.info(f"发现新文件: {file_path}")
    
    def _wait_for_file_complete(self, file_path: Path, timeout=30):
        """等待文件上传完成"""
        start_time = time.time()
        last_size = 0
        
        while time.time() - start_time < timeout:
            try:
                if not file_path.exists():
                    time.sleep(0.1)
                    continue
                    
                current_size = file_path.stat().st_size
                if current_size == last_size and current_size > 0:
                    # 文件大小稳定，认为上传完成
                    break
                    
                last_size = current_size
                time.sleep(0.5)
                
            except Exception as e:
                logger.error(f"检查文件状态失败: {e}")
                time.sleep(0.1)

class FileWatcher:
    """文件监控器"""
    
    def __init__(self):
        self.file_queue = queue.Queue()
        self.observer = Observer()
        self.running = False
        
    def start(self):
        """启动文件监控"""
        pending_dir = UPLOAD_DIRS['pending']
        
        # 创建文件处理器
        event_handler = ResumeFileHandler(self.file_queue)
        
        # 设置监控
        self.observer.schedule(event_handler, str(pending_dir), recursive=False)
        self.observer.start()
        
        self.running = True
        logger.info(f"开始监控目录: {pending_dir}")
        
        # 处理启动时已存在的文件
        self._process_existing_files()
        
    def stop(self):
        """停止文件监控"""
        self.running = False
        self.observer.stop()
        self.observer.join()
        logger.info("文件监控已停止")
    
    def _process_existing_files(self):
        """处理启动时已存在的文件"""
        pending_dir = UPLOAD_DIRS['pending']
        
        for file_path in pending_dir.glob("*.pdf"):
            if file_path.is_file():
                self.file_queue.put(file_path)
                logger.info(f"发现已存在文件: {file_path}")
    
    def get_file_queue(self) -> queue.Queue:
        """获取文件队列"""
        return self.file_queue
    
    def is_running(self) -> bool:
        """检查是否正在运行"""
        return self.running