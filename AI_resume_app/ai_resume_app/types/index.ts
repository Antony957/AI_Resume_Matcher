import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// Resume related types
export interface ResumeFile {
  id: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  uploaded_at: string;
  ocr_status: "pending" | "processing" | "completed" | "failed";
  ocr_started_at: string | null;
  ocr_completed_at: string | null;
  ocr_error: string | null;
  llm_status: "pending" | "processing" | "completed" | "failed";
  llm_started_at: string | null;
  llm_completed_at: string | null;
  llm_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
  gpa: string;
  description: string;
}

export interface WorkExperience {
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  responsibilities: string[];
  achievements: string[];
}

export interface Project {
  name: string;
  role: string;
  tech_stack: string[];
  description: string[];
  start_date: string;
  end_date: string;
  link: string;
}

export interface Certification {
  name: string;
  issued_date: string;
  expiry_date: string;
  credential_id: string;
}

export interface Language {
  language: string;
  proficiency: string;
  certificate: string;
}

export interface ResumeProfile {
  id: string;
  file_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  years_experience: number | null;
  education: Education[];
  work_experience: WorkExperience[];
  projects: Project[];
  skills: string[];
  certifications: Certification[];
  languages: Language[];
  extra_sections: Record<string, any>;
  raw_json: Record<string, any>;
  status: "init" | "processed" | "tagged" | "matched";
  recommend_person: string | null;
  tags: string[];
  created_at: string | null;
  updated_at: string | null;
}
export interface PositionCategory {
  id: string;
  category: string;
  created_at: string;
  update_at: string;
}
export interface Position {
  id: string;
  position_name: string;
  company_name: string | null;
  location: string | null;
  hc: number | null;
  salary_range: string | null;
  job_description: string;
  requirements: string | null;
  tags: string[] | null;
  racetrack: string | null;
  adviser: string | null;
  level: string | null;
  intern_available: boolean | null;
  reference: string | null;
  requirement_json: Record<string, any> | null;
  status: "active" | "paused" | "closed" | "filled" | null;
  urgency: "low" | "normal" | "high" | "urgent" | null;
  match_count: number | null;
  matched_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  // 新增：硬性关键字支持
  mandatory_keywords?: string[] | null;
  mandatory_logic?: "all" | "any" | null;
}

export interface ResumePositionCategorys {
  id: string;
  category: string;
  created_at: string;
  update_at: string;
  category_id: string;
  resume_label_categorys: PositionCategory;
}
export interface MatchResult {
  id: string;
  created_at: string;
  position_id: string;
  match_resume: string;
  skill_score: number;
  education_score: number;
  other_score: number;
  sum_score: number;
}
