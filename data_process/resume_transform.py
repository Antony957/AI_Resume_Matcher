import json
import os
from datetime import datetime
from openai import OpenAI

def main():
    client = OpenAI(
        base_url='https://az.gptplus5.com/v1',
        api_key='sk-bVfay80ZF8vCZJTE4bFa9fD017774fB4BeDf236b700fD082'
    )
    content = """
# 
# 
"""

    # JSON Schema定义
    schema = {
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

    try:
        # 正确的API调用方法
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": """下面是一份转换为markdown格式的简历，请你帮助我将其转化为json格式。json字段包括：
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
                {"role": "user", "content": content}
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "ai_resume",
                    "schema": schema
                }
            }
        )
        
        # 获取JSON响应
        json_result = response.choices[0].message.content
        
        # 解析JSON以验证格式
        parsed_json = json.loads(json_result)
        
        # 创建输出目录
        output_dir = "resume_output"
        os.makedirs(output_dir, exist_ok=True)
        
        # 生成文件名（带时间戳）
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"resume_chris_{timestamp}.json"
        filepath = os.path.join(output_dir, filename)
        
        # 保存格式化的JSON到文件
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(parsed_json, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 简历已成功转换并保存到: {filepath}")
        print(f"📁 文件大小: {os.path.getsize(filepath)} 字节")
        print("\n🔍 转换结果预览:")
        print(json.dumps(parsed_json, ensure_ascii=False, indent=2)[:500] + "...")
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON解析错误: {e}")
    except Exception as e:
        print(f"❌ 处理错误: {e}")



if __name__ == '__main__':
    main()