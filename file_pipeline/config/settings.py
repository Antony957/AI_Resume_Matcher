import os
from pathlib import Path

# 基础路径
BASE_DIR = Path(__file__).parent.parent

# 加载环境变量
try:
    from dotenv import load_dotenv
    load_dotenv(BASE_DIR / '.env')
except ImportError:
    print("警告: python-dotenv 未安装，请运行: pip install python-dotenv")

# 文件目录配置
UPLOAD_DIRS = {
    'pending': BASE_DIR / 'uploads' / 'pending',
    'processing': BASE_DIR / 'uploads' / 'processing',
    'completed': BASE_DIR / 'uploads' / 'completed',
    'failed': BASE_DIR / 'uploads' / 'failed'
}

# 确保目录存在
for dir_path in UPLOAD_DIRS.values():
    dir_path.mkdir(parents=True, exist_ok=True)

# 监控配置
WATCH_INTERVAL = 2  # 秒
MAX_WORKERS = 3     # 最大并发处理数

# Supabase配置
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# OpenAI配置
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

# 文件处理配置
SUPPORTED_EXTENSIONS = {'.pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# 日志配置
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = BASE_DIR / 'logs' / 'pipeline.log'
LOG_FILE.parent.mkdir(exist_ok=True)