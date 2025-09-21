# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered resume processing system with three main components:
1. **AI Resume App** (`AI_resume_app/ai_resume_app/`) - Next.js frontend for resume upload, analysis, and management
2. **File Pipeline** (`file_pipeline/`) - Python backend for automated resume processing with OCR and LLM analysis
3. **Data Processing** (`data_process/`) - Python scripts for resume data transformation

## Common Development Commands

### Frontend (Next.js App)
```bash
cd AI_resume_app/ai_resume_app/
npm run dev          # Start development server with turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint with auto-fix
```

### Backend (File Pipeline)
```bash
cd file_pipeline/
python main.py       # Start the file processing pipeline
pip install -r requirements.txt  # Install dependencies
tail -f logs/pipeline.log  # Monitor processing logs
```

## Architecture Overview

### Frontend Structure
- **Next.js 15** with App Router
- **HeroUI** component library for consistent UI
- **Supabase** for database and authentication
- **TypeScript** for type safety
- **Tailwind CSS** for styling

Key directories:
- `app/` - Next.js app router pages (upload, result, filter, manage, about)
- `components/` - Reusable UI components
- `lib/` - Utility functions and API helpers
- `config/` - Site configuration and Supabase client
- `types/` - TypeScript type definitions

### Backend Pipeline
- **File monitoring** system watching `uploads/pending/` directory
- **OCR processing** using MinerU for PDF text extraction
- **LLM analysis** using OpenAI API for structured data extraction
- **Database storage** in Supabase with status tracking

Processing flow:
1. PDF files → `uploads/pending/`
2. Move to `uploads/processing/` 
3. OCR extraction → LLM parsing → Database storage
4. Success → `uploads/completed/` | Failure → `uploads/failed/`

### Database Schema
**Core Tables:**
- `resume_files` - File metadata and processing status (OCR/LLM tracking)
- `resume_profiles` - Structured resume data (JSONB fields for education, work_experience, projects, skills)

**Classification & Position Tables:**
- `resume_label_categorys` - Resume label categories
- `resume_labels` - Resume labels
- `resume_position_categorys` - Job position categories (技术职位, 非技术职位, 业务-web3, 业务-AI, 业务-金融)
- `resume_positions` - Job positions with detailed requirements

**Tagging & Analysis Tables:**
- `resume_tags` - Extracted tags from resumes (category, market, tags JSONB)
- `position_tags` - Extracted tags from positions (with status: uploaded/matched)

**Matching & Results:**
- `match_result` - Position-resume matching results (skill_score, education_score, other_score, sum_score)

**Reference Tables (via API):**
- `resume_languages` - Language options (普通话, 英语, 日语, 法语, 粤语, 其他)
- `resume_college_requirements` - Education requirements
- `resume_education_experiences` - Education experience types

**Complete schema documentation**: `document/database_schema_complete.md`

## Key Files and Configurations

### Frontend Configuration
- `config/supabaseClient.ts` - Supabase client setup
- `lib/supabaseApi.ts` - Generic database operations (fetch, insert, update, delete)
- `config/site.ts` - Site navigation and metadata

### Backend Configuration
- `config/settings.py` - Environment variables and database settings
- `modules/pipeline_processor.py` - Main processing orchestrator
- `modules/ocr_processor.py` - MinerU OCR integration
- `modules/llm_processor.py` - OpenAI API integration
- `modules/database.py` - Supabase database operations

## Development Notes

### Frontend Development
- Uses App Router with Chinese navigation labels
- API routes in `app/api/` for database operations
- Generic `supabaseApi.ts` provides CRUD operations for all tables
- Components use HeroUI library conventions

### Backend Development
- File processing is event-driven based on file system monitoring
- All processing status tracked in database with timestamps
- Comprehensive error handling and logging
- Modular design for easy maintenance

### Environment Variables Required
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://az.gptplus5.com/v1
LOG_LEVEL=INFO
```

## Testing and Deployment

- Frontend uses ESLint for code quality
- Backend logging available in `file_pipeline/logs/pipeline.log`
- Processing statistics displayed in pipeline console output
- Manual testing by placing PDF files in `uploads/pending/`