import subprocess
import json
from pathlib import Path
from typing import Optional
from utils.logger import setup_logger
from config.settings import UPLOAD_DIRS

logger = setup_logger("ocr_processor")

class MinerUProcessor:
    """MinerU OCR处理器"""
    
    def __init__(self):
        self.temp_dir = UPLOAD_DIRS['processing'] / 'temp_ocr'
        self.temp_dir.mkdir(exist_ok=True)
    
    def process_pdf(self, pdf_path: Path) -> Optional[str]:
        """使用MinerU处理PDF文件"""
        try:
            logger.info(f"开始MinerU OCR处理: {pdf_path}")
            
            # 检查文件是否存在
            if not pdf_path.exists():
                logger.error(f"文件不存在: {pdf_path}")
                return None
            
            # 检查MinerU是否可用
            if not self.is_mineru_available():
                logger.warning(f"MinerU不可用，使用fallback处理: {pdf_path}")
                return self._fallback_text_extraction(pdf_path)
            
            # 创建输出目录
            # MinerU会在指定目录下创建以文件名命名的子目录
            output_base_dir = self.temp_dir
            output_base_dir.mkdir(exist_ok=True)
            
            # 运行MinerU命令（使用conda环境）
            # MinerU会在output_base_dir下创建pdf_path.stem目录
            cmd = [
                'conda', 'run', '-n', 'mineru_env2',
                'mineru', '-p', str(pdf_path), '-o', str(output_base_dir)
            ]
            
            result = subprocess.run(
                cmd, 
                check=True, 
                capture_output=True, 
                text=True,
                timeout=300,  # 5分钟超时
                shell=True    # Windows环境下需要shell=True
            )
            
            logger.info(f"MinerU处理完成: {pdf_path}")
            
            # 查找生成的markdown文件
            # MinerU会在output_base_dir下创建pdf_path.stem目录
            actual_output_dir = output_base_dir / pdf_path.stem
            markdown_text = self._extract_markdown_content(actual_output_dir)
            
            if markdown_text:
                logger.info(f"成功提取markdown内容，长度: {len(markdown_text)}")
                return markdown_text
            else:
                logger.warning(f"未找到有效的markdown内容: {pdf_path}")
                return self._fallback_text_extraction(pdf_path)
                
        except subprocess.TimeoutExpired:
            logger.error(f"MinerU处理超时: {pdf_path}")
            return self._fallback_text_extraction(pdf_path)
        except subprocess.CalledProcessError as e:
            logger.error(f"MinerU处理失败: {pdf_path}, 错误: {e.stderr}")
            return self._fallback_text_extraction(pdf_path)
        except Exception as e:
            logger.error(f"OCR处理异常: {pdf_path}, 错误: {e}")
            return self._fallback_text_extraction(pdf_path)
    
    def _extract_markdown_content(self, output_dir: Path) -> Optional[str]:
        """从MinerU输出目录中提取markdown内容"""
        try:
            logger.debug(f"查找markdown文件在: {output_dir}")
            
            # MinerU会在输出目录中创建一个以PDF文件名命名的子目录
            # 例如: temp_ocr/file_name/file_name.md
            
            # 查找所有markdown文件
            markdown_files = list(output_dir.glob("**/*.md"))
            
            if not markdown_files:
                logger.warning(f"未找到markdown文件: {output_dir}")
                # 列出目录内容用于调试
                if output_dir.exists():
                    logger.debug(f"输出目录内容: {list(output_dir.iterdir())}")
                return None
            
            logger.info(f"找到 {len(markdown_files)} 个markdown文件")
            
            # 读取所有markdown文件内容
            all_content = []
            
            for md_file in markdown_files:
                try:
                    logger.debug(f"读取文件: {md_file}")
                    with open(md_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if content.strip():
                            all_content.append(content)
                            logger.debug(f"读取markdown文件: {md_file}, 长度: {len(content)}")
                        else:
                            logger.warning(f"文件为空: {md_file}")
                except Exception as e:
                    logger.warning(f"读取markdown文件失败: {md_file}, 错误: {e}")
            
            if not all_content:
                logger.warning("所有markdown文件都为空或无法读取")
                return None
            
            # 合并所有内容
            combined_content = '\n\n'.join(all_content)
            logger.info(f"成功合并内容，总长度: {len(combined_content)}")
            return combined_content
            
        except Exception as e:
            logger.error(f"提取markdown内容失败: {e}")
            return None
    
    def _fallback_text_extraction(self, pdf_path: Path) -> Optional[str]:
        """Fallback文本提取方法（使用PyPDF2或其他库）"""
        try:
            logger.info(f"使用fallback方法提取文本: {pdf_path}")
            
            # 尝试使用PyPDF2
            try:
                import PyPDF2
                with open(pdf_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    text = ""
                    for page in reader.pages:
                        text += page.extract_text() + "\n"
                    
                    if text.strip():
                        logger.info(f"PyPDF2提取成功，长度: {len(text)}")
                        return text
                        
            except ImportError:
                logger.warning("PyPDF2未安装，跳过")
            except Exception as e:
                logger.warning(f"PyPDF2提取失败: {e}")
            
            # 如果PyPDF2不可用，返回一个简单的占位符
            logger.warning(f"所有文本提取方法都失败，返回占位符: {pdf_path}")
            return f"# PDF文件内容\n\n文件名: {pdf_path.name}\n\n注意: 由于OCR处理失败，此处显示的是占位符内容。请检查MinerU配置。"
            
        except Exception as e:
            logger.error(f"Fallback文本提取失败: {e}")
            return None
    
    def cleanup_temp_files(self, pdf_path: Path):
        """清理临时文件"""
        try:
            output_dir = self.temp_dir / pdf_path.stem
            if output_dir.exists():
                import shutil
                shutil.rmtree(output_dir)
                logger.debug(f"清理临时文件: {output_dir}")
        except Exception as e:
            logger.warning(f"清理临时文件失败: {e}")
    
    def is_mineru_available(self) -> bool:
        """检查MinerU是否可用"""
        try:
            # 在Windows环境下测试conda环境中的mineru
            result = subprocess.run([
                'conda', 'run', '-n', 'mineru_env2',
                'mineru', '--help'
            ], capture_output=True, text=True, timeout=15, shell=True)
            
            logger.debug(f"MinerU可用性检查结果: returncode={result.returncode}")
            if result.stderr:
                logger.debug(f"MinerU stderr: {result.stderr}")
            
            return result.returncode == 0
        except Exception as e:
            logger.debug(f"MinerU可用性检查异常: {e}")
            return False