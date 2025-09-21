### 1. `resume_files` —— 文件与流程状态

| 字段                                    | 类型                                              | 说明                  |
| ------------------------------------- | ----------------------------------------------- | ------------------- |
| id                                    | uuid PK                                         | 主键                  |
| user\_id                              | uuid FK                                         | 上传者，可空              |
| file\_name                            | text                                            | 原始文件名               |
| storage\_path                         | text                                            | Supabase Storage 路径 |
| file\_size                            | integer                                         | 字节大小                |
| uploaded\_at                          | timestamptz                                     | 上传时间                |
| ocr\_status                           | enum(pending / processing / completed / failed) | OCR 状态              |
| ocr\_started\_at / ocr\_completed\_at | timestamptz                                     | OCR 开始 / 结束         |
| ocr\_error                            | text                                            | OCR 失败原因            |
| llm\_status                           | 同上                                              | LLM 解析状态            |
| llm\_started\_at / llm\_completed\_at | timestamptz                                     | LLM 开始 / 结束         |
| llm\_error                            | text                                            | LLM 失败原因            |
| created\_at / updated\_at             | timestamptz                                     | 记录创建 / 更新时间         |

> 索引：`user_id`, `ocr_status`, `llm_status`

---

### resume\_profiles —— 结构化简历内容（加⼤颗粒度）

| 字段                        | 类型                                | 说明                                                                                      |
| ------------------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| id                        | uuid PK                           | 主键                                                                                      |
| file\_id                  | uuid FK → resume\_files (cascade) | 对应上传文件                                                                                  |
| full\_name                | text                              | 姓名                                                                                      |
| email                     | text                              | 邮箱                                                                                      |
| phone                     | text                              | 电话                                                                                      |
| location                  | text                              | 地区／城市                                                                                   |
| headline                  | text                              | 求职意向或职业头衔                                                                               |
| summary                   | text                              | 个人简介                                                                                    |
| years\_experience         | integer                           | 总工作年限（可由 LLM 推算）                                                                        |
| **education**             | jsonb                             | `[{ school, degree, field, start_date, end_date, gpa, description }]`                   |
| **work\_experience**      | jsonb                             | `[{ company, position, start_date, end_date, responsibilities:[…], achievements:[…] }]` |
| **projects**              | jsonb                             | `[{ name, role, tech_stack:[…], description, links:[…] }]`                              |
| **skills**                | text\[]                           | 纯技能关键字列表，便于索引检索                                                                         |
| **certifications**        | jsonb                             | `[{ name, issuer, issued_date, expiry_date, credential_id }]`                           |
| **languages**             | jsonb                             | `[{ language, proficiency (native/fluent/…), certificate }]`                            |
| extra\_sections           | jsonb                             | 其他自由块                                                                                   |
| raw\_json                 | jsonb                             | LLM 原始输出（完整保底）                                                                          |
| created\_at / updated\_at | timestamptz                       | 记录创建 / 更新时间                                                                             |

**设计要点**

* **work\_experience**：

  * company、position、起止时间是常规字段；
  * responsibilities——主要职责数组；
  * achievements——量化结果或亮点数组，便于后续展示与匹配。

* **skills / certifications / languages** 独立存放，避免混淆：

  * skills 用 `text[]` 方便用 GIN 加速 `@>` 查询（如 `skills @> '{"Redis"}'`)；
  * certifications、languages 细节差异大，用 `jsonb` 承载灵活结构。

* **projects**：不少候选人会单列项目经验，这里提供标准结构；如不需要可忽略。

* **years\_experience**：提前拆分数值字段，便于排序／过滤（例如 >5 年经验）。

> **索引建议**
>
> * `skills` → `GIN`
> * `work_experience`、`projects` 需要全文或键检索时再加 `jsonb_path_ops` 或 `pg_trgm`。



database sql code:

```
/* ---------- 预备：所需扩展 ---------- */
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "uuid-ossp";  -- 若喜欢 uuid_generate_v4()

/* ---------- 1. 枚举类型 ---------- */
create type resume_process_status as enum (
  'pending',
  'processing',
  'completed',
  'failed'
);

/* ---------- 2. resume_files ---------- */
create table public.resume_files (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users on delete set null,
  file_name          text        not null,
  storage_path       text        not null,
  file_size          integer     not null,
  uploaded_at        timestamptz not null default now(),

  ocr_status         resume_process_status default 'pending',
  ocr_started_at     timestamptz,
  ocr_completed_at   timestamptz,
  ocr_error          text,

  llm_status         resume_process_status default 'pending',
  llm_started_at     timestamptz,
  llm_completed_at   timestamptz,
  llm_error          text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

/* 索引 */
create index if not exists idx_resume_files_user  on public.resume_files (user_id);
create index if not exists idx_resume_files_ocr   on public.resume_files (ocr_status);
create index if not exists idx_resume_files_llm   on public.resume_files (llm_status);

/* ---------- 3. resume_profiles ---------- */
create table public.resume_profiles (
  id                 uuid primary key default gen_random_uuid(),
  file_id            uuid not null references public.resume_files on delete cascade,

  full_name          text,
  email              text,
  phone              text,
  location           text,
  headline           text,
  summary            text,
  years_experience   integer,

  education          jsonb,          -- [{ school, degree, field, start_date, end_date, gpa, description }]
  work_experience    jsonb,          -- [{ company, position, start_date, end_date, responsibilities, achievements }]
  projects           jsonb,          -- [{ name, role, tech_stack, description, links }]
  skills             text[],         -- 纯关键词
  certifications     jsonb,          -- [{ name, issuer, issued_date, expiry_date, credential_id }]
  languages          jsonb,          -- [{ language, proficiency, certificate }]
  extra_sections     jsonb,
  raw_json           jsonb,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

/* 索引 */
create index if not exists idx_profiles_skills    on public.resume_profiles using gin (skills);
create index if not exists idx_profiles_education on public.resume_profiles using gin (education);

/* ---------- 4. 自动更新时间戳（可选） ---------- */
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_resume_files_updated
before update on public.resume_files
for each row execute procedure public.set_updated_at();

create trigger trg_resume_profiles_updated
before update on public.resume_profiles
for each row execute procedure public.set_updated_at();
```

### 2. `resume_position_categorys` —— 职位类型

| 字段                                    | 类型                                           | 说明                  |
| ------------------------------------- | ----------------------------------------------- | ------------------- |
| id                                    | uuid PK                                         | 主键                  |
| category                              | text                                            | 职位类型(技术岗，非技术岗等)               |

### 3. `resume_positions` —— 职位

| 字段                                    | 类型                                           | 说明                  |
| ------------------------------------- | ----------------------------------------------- | ------------------- |
| id                                    | uuid PK                                         | 主键                  |
| category_id                           | text                                            | 职位类型(技术岗，非技术岗等)               |
| position                              | text                                            | 职位名               |


### 4. `resume_languages` —— 语言

| 字段                                    | 类型                                           | 说明                  |
| ------------------------------------- | ----------------------------------------------- | ------------------- |
| id                                    | uuid PK                                         | 主键                  |
| language                              | text                                            | 语言               |

### 5. `resume_college_requirements` —— 院校要求

| 字段                                    | 类型                                           | 说明                  |
| ------------------------------------- | ----------------------------------------------- | ------------------- |
| id                                    | uuid PK                                         | 主键                  |
| college_requirement                   | text                                            | 要求                |

### 5. `resume_education_experiences` —— 教育经历

| 字段                                    | 类型                                           | 说明                  |
| ------------------------------------- | ----------------------------------------------- | ------------------- |
| id                                    | uuid PK                                         | 主键                  |
| eduction_experience                   | text                                            | 教育经历                |
