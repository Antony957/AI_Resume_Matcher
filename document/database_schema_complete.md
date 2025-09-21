# AI Resume 数据库完整表结构

## 概述

此文档记录了 AI Resume 项目的完整数据库表结构，包括所有表的字段定义、索引、外键约束等详细信息。

## 枚举类型

```sql
create type resume_process_status as enum (
  'pending',
  'processing', 
  'completed',
  'failed'
);
```

## 核心数据表

### 1. resume_files - 简历文件管理表

存储上传的简历文件基本信息和处理状态。

```sql
create table public.resume_files (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  file_name text not null,
  storage_path text not null,
  file_size integer not null,
  uploaded_at timestamp with time zone not null default now(),
  ocr_status public.resume_process_status null default 'pending'::resume_process_status,
  ocr_started_at timestamp with time zone null,
  ocr_completed_at timestamp with time zone null,
  ocr_error text null,
  llm_status public.resume_process_status null default 'pending'::resume_process_status,
  llm_started_at timestamp with time zone null,
  llm_completed_at timestamp with time zone null,
  llm_error text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint resume_files_pkey primary key (id),
  constraint resume_files_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null
);
```

**索引：**
- `idx_resume_files_user` on (user_id)
- `idx_resume_files_ocr` on (ocr_status) 
- `idx_resume_files_llm` on (llm_status)

**触发器：**
- `trg_resume_files_updated` - 自动更新 updated_at 字段

### 2. resume_profiles - 简历档案表

存储简历的结构化内容数据。

```sql
create table public.resume_profiles (
  id uuid not null default gen_random_uuid (),
  file_id uuid not null,
  full_name text null,
  email text null,
  phone text null,
  location text null,
  headline text null,
  summary text null,
  years_experience integer null,
  education jsonb null,
  work_experience jsonb null,
  projects jsonb null,
  skills text[] null,
  certifications jsonb null,
  languages jsonb null,
  extra_sections jsonb null,
  raw_json jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  status text null default 'init'::text,
  recommend_person text null,
  constraint resume_profiles_pkey primary key (id),
  constraint resume_profiles_file_id_fkey foreign KEY (file_id) references resume_files (id) on delete CASCADE
);
```

**索引：**
- `idx_profiles_skills` using gin (skills)
- `idx_profiles_education` using gin (education)

**触发器：**
- `trg_resume_profiles_updated` - 自动更新 updated_at 字段

**JSONB 字段结构：**
- `education`: `[{ school, degree, field, start_date, end_date, gpa, description }]`
- `work_experience`: `[{ company, position, start_date, end_date, responsibilities, achievements }]`
- `projects`: `[{ name, role, tech_stack, description, links }]`
- `certifications`: `[{ name, issuer, issued_date, expiry_date, credential_id }]`
- `languages`: `[{ language, proficiency, certificate }]`

## 标签和分类表

### 3. resume_label_categorys - 简历标签类别表

定义简历标签的类别。

```sql
create table public.resume_label_categorys (
  id uuid not null default gen_random_uuid (),
  category text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint resume_position_categorys_pkey primary key (id, category, created_at, updated_at),
  constraint resume_position_categorys_id_key unique (id)
);
```

### 4. resume_labels - 简历标签表

存储具体的简历标签。

```sql
create table public.resume_labels (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  position text not null,
  category_id uuid not null,
  constraint resume_positions_pkey primary key (id),
  constraint resume_positions_id_key unique (id),
  constraint resume_positions_category_id_fkey foreign KEY (category_id) references resume_label_categorys (id)
);
```

### 5. resume_position_categorys - 职位类别表

定义职位的类别分类。

```sql
create table public.resume_position_categorys (
  id uuid not null default gen_random_uuid (),
  category text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  category_id uuid null,
  constraint resume_position_categorys_pkey1 primary key (id),
  constraint resume_position_categorys_id_key1 unique (id),
  constraint resume_position_categorys_category_id_fkey foreign KEY (category_id) references resume_label_categorys (id)
);
```

**类别包括：**
- 技术职位
- 非技术职位  
- 业务-web3
- 业务-AI
- 业务-金融

### 6. resume_positions - 职位表

存储具体的职位信息。

```sql
create table public.resume_positions (
  id uuid not null default gen_random_uuid (),
  category_id uuid not null,
  racetrack text null,
  adviser text null,
  level integer null,
  position text null,
  company_name text null,
  location text null,
  hc bigint null,
  salary text null,
  require text null,
  reference text null,
  jd text null,
  intern text null,
  created_at timestamp with time zone not null default now(),
  update_at timestamp with time zone not null default now(),
  requirement_json jsonb null,
  status text null default 'uploaded'::text,
  constraint resume_positions_pkey1 primary key (id),
  constraint resume_positions_category_id_fkey1 foreign KEY (category_id) references resume_position_categorys (id)
);
```

## 标签提取表

### 7. resume_tags - 简历标签提取表

存储从简历中提取的标签信息。

```sql
create table public.resume_tags (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  resume_id uuid null,
  category character varying null,
  market character varying null,
  tags jsonb null,
  constraint resume_tags_pkey primary key (id),
  constraint resume_tags_resume_id_fkey foreign KEY (resume_id) references resume_profiles (id)
);
```

**索引：**
- `idx_resume_tags_resume_id` on (resume_id)

### 8. position_tags - 职位标签提取表

存储从职位中提取的标签信息。

```sql
create table public.position_tags (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  position_id uuid null default gen_random_uuid (),
  category character varying null,
  market character varying null,
  tags jsonb null,
  status text null default 'uploaded'::text,
  match_count integer null default 0,
  matched_at timestamp with time zone null,
  algorithm_version text null default '1.0'::text,
  constraint position_tags_pkey primary key (id),
  constraint position_tags_position_id_fkey foreign KEY (position_id) references resume_positions (id)
);
```

**索引：**
- `idx_position_tags_status` on (status)
- `idx_position_tags_position_id` on (position_id)

**状态值：**
- `uploaded` - 已上传，待匹配
- `matched` - 已完成匹配

## 匹配结果表

### 9. match_result - 匹配结果表

存储职位与简历的匹配结果和评分。

```sql
create table public.match_result (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone not null default now(),
  position_id uuid null default gen_random_uuid (),
  match_resume uuid null default gen_random_uuid (),
  skill_score real null default '0'::real,
  education_score real null default '0'::real,
  other_score real null default '0'::real,
  sum_score real null default '0'::real,
  constraint match_result_pkey primary key (id),
  constraint match_result_match_resume_fkey foreign KEY (match_resume) references resume_profiles (id),
  constraint match_result_position_id_fkey foreign KEY (position_id) references resume_positions (id)
);
```

**索引：**
- `idx_match_result_position_score` on (position_id, sum_score desc) - 按职位查询匹配结果，按分数降序
- `idx_match_result_resume_score` on (match_resume, sum_score desc) - 按简历查询匹配结果，按分数降序  
- `idx_match_result_created_at` on (created_at desc) - 按创建时间降序查询

**评分字段说明：**
- `skill_score` - 技能匹配分数
- `education_score` - 教育背景匹配分数
- `other_score` - 其他因素匹配分数
- `sum_score` - 总分

## 辅助数据表

这些表主要通过 API 路由生成静态数据，不直接存储在数据库中：

### resume_languages - 语言选项
- 普通话、英语、日语、法语、粤语、其他

### resume_college_requirements - 院校要求选项
- 存储不同的院校要求标准

### resume_education_experiences - 教育经历类型
- 存储不同类型的教育经历选项

## 触发器函数

```sql
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
```

## 数据处理流程

1. **文件上传** → `resume_files` 表记录文件信息
2. **OCR处理** → 更新 `resume_files.ocr_status`
3. **LLM解析** → 创建 `resume_profiles` 记录，更新 `resume_files.llm_status`
4. **标签提取** → 创建 `resume_tags` 记录
5. **职位匹配** → 创建 `match_result` 记录，更新 `position_tags.status`

## 权限和安全

- 使用 Supabase 的行级安全策略 (RLS)
- 外键约束确保数据完整性
- 合适的索引优化查询性能

## 更新日志

- **2025-07-27**: 创建完整数据库结构文档
- 包含所有表的完整 SQL 定义
- 添加索引、外键约束和触发器信息