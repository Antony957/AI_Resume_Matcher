import shutil
from pathlib import Path
from typing import Optional
from utils.logger import setup_logger
from config.settings import UPLOAD_DIRS

logger = setup_logger("file_manager")

class FileManager:
    """文件管理器 - 处理文件移动和清理"""
    
    def __init__(self):
        self.dirs = UPLOAD_DIRS
    
    def move_to_processing(self, file_path: Path) -> Optional[Path]:
        """移动文件到处理目录"""
        try:
            target_path = self.dirs['processing'] / file_path.name
            
            # 如果目标文件已存在，添加时间戳
            if target_path.exists():
                from datetime import datetime
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                stem = target_path.stem
                suffix = target_path.suffix
                target_path = self.dirs['processing'] / f"{stem}_{timestamp}{suffix}"
            
            shutil.move(str(file_path), str(target_path))
            logger.info(f"文件移动到处理目录: {file_path.name} -> {target_path}")
            return target_path
            
        except Exception as e:
            logger.error(f"移动文件到处理目录失败: {e}")
            return None
    
    def move_to_completed(self, file_path: Path) -> Optional[Path]:
        """移动文件到完成目录"""
        try:
            target_path = self.dirs['completed'] / file_path.name
            
            # 如果目标文件已存在，添加时间戳
            if target_path.exists():
                from datetime import datetime
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                stem = target_path.stem
                suffix = target_path.suffix
                target_path = self.dirs['completed'] / f"{stem}_{timestamp}{suffix}"
            
            shutil.move(str(file_path), str(target_path))
            logger.info(f"文件移动到完成目录: {file_path.name} -> {target_path}")
            return target_path
            
        except Exception as e:
            logger.error(f"移动文件到完成目录失败: {e}")
            return None
    
    def move_to_failed(self, file_path: Path, error_reason: str = "") -> Optional[Path]:
        """移动文件到失败目录"""
        try:
            # 创建带错误信息的文件名
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            stem = file_path.stem
            suffix = file_path.suffix
            
            if error_reason:
                # 清理错误原因，移除特殊字符
                clean_reason = "".join(c for c in error_reason if c.isalnum() or c in " -_")[:20]
                target_name = f"{stem}_{timestamp}_{clean_reason}{suffix}"
            else:
                target_name = f"{stem}_{timestamp}_failed{suffix}"
            
            target_path = self.dirs['failed'] / target_name
            
            shutil.move(str(file_path), str(target_path))
            logger.info(f"文件移动到失败目录: {file_path.name} -> {target_path}")
            
            # 创建错误日志文件
            if error_reason:
                self._create_error_log(target_path, error_reason)
            
            return target_path
            
        except Exception as e:
            logger.error(f"移动文件到失败目录失败: {e}")
            return None
    
    def _create_error_log(self, file_path: Path, error_reason: str):
        """创建错误日志文件"""
        try:
            from datetime import datetime
            
            log_path = file_path.with_suffix('.error.log')
            
            error_info = f"""
处理时间: {datetime.now().isoformat()}
文件名: {file_path.name}
错误原因: {error_reason}
"""
            
            with open(log_path, 'w', encoding='utf-8') as f:
                f.write(error_info)
                
            logger.debug(f"创建错误日志: {log_path}")
            
        except Exception as e:
            logger.warning(f"创建错误日志失败: {e}")
    
    def cleanup_temp_files(self, base_path: Path):
        """清理临时文件"""
        try:
            if base_path.exists() and base_path.is_dir():
                shutil.rmtree(base_path)
                logger.debug(f"清理临时目录: {base_path}")
        except Exception as e:
            logger.warning(f"清理临时文件失败: {e}")
    
    def get_directory_stats(self) -> dict:
        """获取各目录文件统计"""
        stats = {}
        
        for dir_name, dir_path in self.dirs.items():
            try:
                if dir_path.exists():
                    files = list(dir_path.glob("*.pdf"))
                    stats[dir_name] = {
                        'count': len(files),
                        'files': [f.name for f in files]
                    }
                else:
                    stats[dir_name] = {'count': 0, 'files': []}
            except Exception as e:
                logger.warning(f"获取目录统计失败: {dir_name}, {e}")
                stats[dir_name] = {'count': 0, 'files': []}
        
        return stats