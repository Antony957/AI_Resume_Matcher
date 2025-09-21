import json
import os
from typing import Optional, Dict, Any, List
from openai import OpenAI
from utils.logger import setup_logger
from utils.openai_client_manager import OpenAIClientManager
from utils.database import DatabaseManager

logger = setup_logger("llm_processor")

class LLMProcessor:
    """LLM解析处理器"""
    
    def __init__(self):
        self.client = OpenAIClientManager.get_client()
        self.database = DatabaseManager()  # 用于获取标签字典
        
        # 获取所有可用标签
        self._load_available_tags()
        
        # JSON Schema定义
        self.schema = {
            "type": "object",
            "strict": True,
            "properties": {
                "basic_info": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "email": {"type": "string"},
                        "phone": {"type": "string"},
                        "location": {"type": "string"},
                    },
                    "additionalProperties": False,
                    "required": ["name", "email", "phone", "location"]
                },
                "job_intention": {"type": "string"},
                "personal_expertise": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "education": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "school": {"type": "string"},
                            "degree": {"type": "string"},
                            "field": {"type": "string"},
                            "start_date": {"type": "string"},
                            "end_date": {"type": "string"},
                            "gpa": {"type": "string"},
                            "description": {"type": "string"}
                        },
                        "additionalProperties": False,
                        "required": ["school", "degree", "field", "start_date", "end_date", "gpa", "description"]
                    }
                },
                "work_experience": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "company": {"type": "string"},
                            "position": {"type": "string"},
                            "start_date": {"type": "string"},
                            "end_date": {"type": "string"},
                            "responsibilities": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "achievements": {
                                "type": "array",
                                "items": {"type": "string"}
                            }
                        },
                        "additionalProperties": False,
                        "required": ["company", "position", "start_date", "end_date", "responsibilities", "achievements"]
                    }
                },
                "projects": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "role": {"type": "string"},
                            "tech_stack": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "description": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "link": {"type": "string"}
                        },
                        "additionalProperties": False,
                        "required": ["name", "role", "tech_stack", "description", "link"]
                    }
                },
                "skills": {
                    "type": "array",
                    "items": {"type": "string"}
                },
                "certifications": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "issued_date": {"type": "string"},
                            "expiry_date": {"type": "string"},
                            "credential_id": {"type": "string"},
                        },
                        "additionalProperties": False,
                        "required": ["name", "issued_date", "expiry_date", "credential_id"]
                    }
                },
                "languages": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "language": {"type": "string"},
                            "proficiency": {"type": "string"},
                            "certificate": {"type": "string"},
                        },
                        "additionalProperties": False,
                        "required": ["language", "proficiency", "certificate"]
                    }
                },
                "others": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "additionalProperties": False,
            "required": ["basic_info", "job_intention", "personal_expertise", "education","work_experience", "projects", "skills", "certifications", "languages", "others"]
        }
        
        # 新增：标签分析schema
        self.tag_analysis_schema = {
            "type": "object",
            "strict": True,
            "properties": {
                "category": {
                    "type": "string",
                    "enum": ["技术类", "非技术类"]
                },
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "从提供的标签列表中选择最匹配的标签"
                },
                "reasoning": {
                    "type": "string",
                    "description": "分类和标签选择的理由"
                }
            },
            "additionalProperties": False,
            "required": ["category", "tags", "reasoning"]
        }
    
    def parse_resume_content(self, markdown_content: str) -> Optional[Dict[str, Any]]:
        """解析简历内容为结构化数据"""
        try:
            logger.info(f"开始LLM解析，内容长度: {len(markdown_content)}")
            
            # 检查内容长度
            if len(markdown_content) < 50:
                logger.warning("简历内容过短，可能解析失败")
                return None
            
            # 调用OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": """下面是一份转换为markdown格式的简历，请你帮助我将其转化为json格式。如果简历内容全部为英语，也请翻译为以中文为主，英语为辅的表达方式并输出为json。json字段包括：
basic_info, 表示用户基本信息。
job_intention, 表示用户求职意图。
personal_expertise, 表示用户的专长，建议使用自我评价提取。
education, 表示用户的学历。
work_experience, 表示用户的工作经历。
projects, 表示用户的项目集。
skills, 表示用户所掌握的技能栈。
certifications, 表示用户所拥有的技能认证。
languages, 表示用户所掌握的语言技能。
others. 
如果某一个字段为空，请用'暂无'代替。"""
                    },
                    {"role": "user", "content": markdown_content}
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "ai_resume",
                        "schema": self.schema
                    }
                }
            )
            
            # 获取JSON响应
            json_result = response.choices[0].message.content
            
            # 解析JSON
            parsed_json = json.loads(json_result)
            
            logger.info("LLM解析成功")
            logger.debug(f"解析结果预览: {str(parsed_json)[:200]}...")
            
            return parsed_json
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON解析错误: {e}")
            return None
        except Exception as e:
            logger.error(f"LLM解析失败: {e}")
            return None
    
    def validate_parsed_data(self, data: Dict[str, Any]) -> bool:
        """验证解析后的数据"""
        try:
            # 检查必要字段
            required_fields = ["basic_info", "job_intention", "education", "work_experience"]
            
            for field in required_fields:
                if field not in data:
                    logger.warning(f"缺少必要字段: {field}")
                    return False
            
            # 检查basic_info字段 - 允许缺少姓名，用默认值处理
            basic_info = data.get("basic_info", {})
            name = basic_info.get("name", "")
            if not name or name == "暂无":
                logger.warning("基本信息中缺少姓名，将使用默认值继续处理")
                # 不阻止处理流程，允许使用默认值
            
            logger.info("数据验证通过")
            return True
            
        except Exception as e:
            logger.error(f"数据验证失败: {e}")
            return False
    
    def extract_years_experience(self, work_experience: list) -> int:
        """从工作经历中计算工作年限"""
        try:
            from datetime import datetime
            
            total_months = 0
            
            for exp in work_experience:
                start_date = exp.get("start_date", "")
                end_date = exp.get("end_date", "")
                
                if not start_date or start_date == "暂无":
                    continue
                
                # 简单的年限计算逻辑
                try:
                    # 提取年份
                    start_year = int(start_date.split("-")[0]) if "-" in start_date else int(start_date[:4])
                    
                    if end_date and end_date != "暂无" and "至今" not in end_date:
                        end_year = int(end_date.split("-")[0]) if "-" in end_date else int(end_date[:4])
                    else:
                        end_year = datetime.now().year
                    
                    years = end_year - start_year
                    total_months += years * 12
                    
                except:
                    continue
            
            return max(0, total_months // 12)
            
        except Exception as e:
            logger.warning(f"计算工作年限失败: {e}")
            return 0
    
    def _load_available_tags(self):
        """从数据库加载所有可用标签"""
        try:
            result = self.database.client.table("tag_dictionary").select("tag_name, category").execute()
            
            self.available_tags = {
                "技术类": [],
                "非技术类": []
            }
            
            if result.data:
                for tag in result.data:
                    category = tag["category"]
                    tag_name = tag["tag_name"]
                    if category in self.available_tags:
                        self.available_tags[category].append(tag_name)
            
            logger.info(f"加载标签: 技术类{len(self.available_tags['技术类'])}个, 非技术类{len(self.available_tags['非技术类'])}个")
            
        except Exception as e:
            logger.error(f"加载标签字典失败: {e}")
            self.available_tags = {"技术类": [], "非技术类": []}
    
    def analyze_resume_tags(self, parsed_resume_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """分析简历并生成分类和标签"""
        try:
            # 调试：打印输入数据类型和内容
            logger.info(f"标签分析输入数据类型: {type(parsed_resume_data)}")
            if not isinstance(parsed_resume_data, dict):
                logger.error(f"输入数据不是字典类型，而是: {type(parsed_resume_data)}")
                return None
            
            # 构建简历摘要文本
            resume_text = self._build_resume_summary(parsed_resume_data)
            
            # 重新加载标签以确保是最新的
            self._load_available_tags()
            
            # 构建标签列表文本
            tech_tags_text = "、".join(self.available_tags["技术类"])
            non_tech_tags_text = "、".join(self.available_tags["非技术类"])
            
            logger.info(f"当前可用标签: 技术类{len(self.available_tags['技术类'])}个, 非技术类{len(self.available_tags['非技术类'])}个")
            
            # 调用LLM进行标签分析
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": f"""你是一个专业的简历分析师。你必须严格按照以下规则进行分类和标签分析。

**分类规则：**
- 技术类：涉及编程、开发、技术实现的岗位
- 非技术类：涉及业务、运营、管理的岗位

**严格标签约束 - 只能从以下列表中选择：**

技术类可选标签：{tech_tags_text}

非技术类可选标签：{non_tech_tags_text}

**严格要求：**
1. 必须且只能选择"技术类"或"非技术类"中的一个分类
2. 【重要】只能从上述标签列表中精确选择标签，一个字都不能改变
3. 【重要】绝对禁止创造、修改或组合新标签
4. 【重要】如果简历中的技能不在标签列表中，就不要选择，宁可少选也不要创造
5. 选择1-5个最匹配的标签（不要超过5个）
6. 提供分类和标签选择的理由

**示例正确做法：**
- 如果简历提到"JavaScript"但标签列表中只有"前端"，那就选择"前端"
- 如果简历提到"数据分析"但标签列表中没有，就不要选择任何相关标签

请严格遵守标签约束，绝不创造新标签！"""
                    },
                    {
                        "role": "user", 
                        "content": f"请分析以下简历内容：\n\n{resume_text}"
                    }
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "resume_tag_analysis",
                        "schema": self.tag_analysis_schema
                    }
                }
            )
            
            # 解析结果
            result = json.loads(response.choices[0].message.content)
            
            # 清理结果中的字符串
            if "category" in result:
                result["category"] = result["category"].strip()
            if "tags" in result and isinstance(result["tags"], list):
                result["tags"] = [tag.strip() for tag in result["tags"] if isinstance(tag, str)]
            
            # 验证标签
            if self._validate_tags(result):
                logger.info(f"简历标签分析成功: {result['category']}, 标签: {result['tags']}")
                return result
            else:
                logger.error("标签验证失败")
                return None
                
        except Exception as e:
            logger.error(f"简历标签分析失败: {e}")
            return None
    
    def _build_resume_summary(self, parsed_data: Dict[str, Any]) -> str:
        """构建简历摘要文本供LLM分析"""
        summary_parts = []
        
        # 基本信息
        basic_info = parsed_data.get("basic_info", {})
        summary_parts.append(f"姓名: {basic_info.get('name', '未知')}")
        
        # 求职意向
        job_intention = parsed_data.get("job_intention", "")
        if job_intention and job_intention != "暂无":
            summary_parts.append(f"求职意向: {job_intention}")
        
        # 专业技能
        expertise = parsed_data.get("personal_expertise", [])
        if expertise and expertise != ["暂无"]:
            # 确保expertise是列表
            if isinstance(expertise, list):
                summary_parts.append(f"专业技能: {', '.join(expertise)}")
            else:
                summary_parts.append(f"专业技能: {str(expertise)}")
        
        # 技能栈
        skills = parsed_data.get("skills", [])
        if skills and skills != ["暂无"]:
            # 确保skills是列表
            if isinstance(skills, list):
                summary_parts.append(f"技能栈: {', '.join(skills)}")
            else:
                summary_parts.append(f"技能栈: {str(skills)}")
        
        # 工作经历（最近2个）
        work_exp = parsed_data.get("work_experience", [])
        if work_exp:
            recent_work = work_exp[:2]
            work_summary = []
            for exp in recent_work:
                company = exp.get("company", "")
                position = exp.get("position", "")
                if company and position:
                    work_summary.append(f"{company} - {position}")
            
            if work_summary:
                summary_parts.append(f"工作经历: {'; '.join(work_summary)}")
        
        # 项目经历
        projects = parsed_data.get("projects", [])
        if projects:
            project_tech = []
            for proj in projects[:2]:  # 最近2个项目
                tech_stack = proj.get("tech_stack", [])
                if tech_stack:
                    project_tech.extend(tech_stack)
            
            if project_tech:
                summary_parts.append(f"项目技术栈: {', '.join(set(project_tech))}")
        
        return "\n".join(summary_parts)
    
    def _validate_tags(self, analysis_result: Dict[str, Any]) -> bool:
        """验证分析结果中的标签是否有效"""
        try:
            # 清理分类字符串和标签列表
            category = analysis_result.get("category", "").strip()
            raw_tags = analysis_result.get("tags", [])
            # 清理每个标签的空白字符
            tags = [tag.strip() for tag in raw_tags if isinstance(tag, str)]
            
            # 检查分类是否有效
            if category not in ["技术类", "非技术类"]:
                logger.error(f"无效的分类: {category}")
                return False
            
            # 检查标签是否有效
            available_tags_for_category = self.available_tags.get(category, [])
            
            invalid_tags = []
            for tag in tags:
                if tag not in available_tags_for_category:
                    invalid_tags.append(tag)
            
            if invalid_tags:
                logger.error(f"发现无效标签: {invalid_tags}")
                return False
            
            # 检查标签数量
            if len(tags) < 1 or len(tags) > 15:
                logger.error(f"标签数量不合理: {len(tags)}个")
                return False
            
            logger.info(f"标签验证通过: {category}, {len(tags)}个标签")
            return True
            
        except Exception as e:
            logger.error(f"标签验证异常: {e}")
            return False