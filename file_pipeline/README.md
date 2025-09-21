# 简历处理Pipeline

基于文件监控的自动简历处理系统，支持PDF文件的OCR识别和LLM解析。

## 功能特性

- 🔍 **自动文件监控**: 监控指定目录中的PDF文件
- 📄 **OCR处理**: 使用MinerU进行PDF文本提取
- 🤖 **LLM解析**: 使用OpenAI API进行结构化数据提取
- 💾 **数据库存储**: 自动存储到Supabase数据库
- 📊 **处理统计**: 实时显示处理状态和统计信息
- 🔄 **容错处理**: 完善的错误处理和重试机制

## 目录结构

```
file_pipeline/
├── uploads/
│   ├── pending/        # 待处理文件
│   ├── processing/     # 处理中文件
│   ├── completed/      # 处理完成文件
│   └── failed/         # 处理失败文件
├── modules/           # 核心模块
├── utils/            # 工具函数
├── config/           # 配置文件
├── logs/             # 日志文件
└── main.py           # 主服务脚本
```

## 安装和配置

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 安装MinerU

```bash
# 根据MinerU官方文档进行安装
pip install mineru
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://az.gptplus5.com/v1
LOG_LEVEL=INFO
```

## 使用方法

### 启动服务

```bash
python main.py
```

### 上传文件

将PDF简历文件放入 `uploads/pending/` 目录，系统会自动处理。

### 查看日志

```bash
tail -f logs/pipeline.log
```

## 处理流程

1. **文件监控**: 监控 `uploads/pending/` 目录
2. **文件移动**: 将文件移至 `uploads/processing/` 目录
3. **数据库记录**: 在 `resume_files` 表中创建记录
4. **OCR处理**: 使用MinerU提取PDF文本
5. **LLM解析**: 使用OpenAI API解析结构化数据
6. **数据存储**: 在 `resume_profiles` 表中保存解析结果
7. **文件归档**: 
   - 成功: 移至 `uploads/completed/`
   - 失败: 移至 `uploads/failed/`

## 数据库表结构

### resume_files
- 存储文件信息和处理状态
- 包含OCR和LLM处理状态追踪

### resume_profiles  
- 存储解析后的结构化简历数据
- 包含基本信息、工作经历、教育背景等

## 监控和统计

服务运行时会定期输出统计信息：

```
处理统计:
  总处理文件: 10
  成功: 8
  失败: 2
    OCR失败: 1
    LLM失败: 1
    数据库失败: 0

目录统计:
  pending: 0 个文件
  processing: 1 个文件
  completed: 8 个文件
  failed: 2 个文件
```

## 故障排除

### 1. MinerU不可用
- 检查MinerU是否正确安装
- 运行 `mineru --version` 验证

### 2. 数据库连接失败
- 检查Supabase配置
- 验证网络连接

### 3. OpenAI API调用失败
- 检查API Key是否正确
- 验证API URL是否可访问

### 4. 文件权限问题
- 确保程序对上传目录有读写权限
- 检查文件是否被其他程序占用

## 日志级别

- `DEBUG`: 详细调试信息
- `INFO`: 一般信息(默认)
- `WARNING`: 警告信息
- `ERROR`: 错误信息

## 注意事项

1. 确保有足够的磁盘空间存储临时文件
2. 建议定期清理 `completed` 和 `failed` 目录
3. 大文件处理可能需要较长时间
4. 监控内存使用情况，必要时调整并发数量