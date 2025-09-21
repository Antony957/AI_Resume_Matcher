import json
from typing import Optional, Dict, Any
import numpy as np

from utils.openai_client_manager import OpenAIClientManager
from utils.sentence_model_manager import SentenceModelManager
from utils.logger import setup_logger

logger = setup_logger("match_processor")


class MatchProcessor:
    def __init__(self):
        self.client = OpenAIClientManager.get_client()
        self.sentence_model = SentenceModelManager.get_model()

        self.schema = {
            "type": "object",
            "strict": True,
            "properties": {

            },
            "additionalProperties": False,
            "required": ["category", "category_skills", "market", "market_field", "education", "title","skills", "others"]
        }


    def education_score(self, json_content: str) -> Optional[Dict[str, Any]]:
        """解析简历内容为结构化数据"""
        try:
            # 调用OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """"""
                    },
                    {"role": "user", "content": json_content}
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

            return parsed_json

        except json.JSONDecodeError as e:
            # logger.error(f"JSON解析错误: {e}")
            return None
        except Exception as e:
            # logger.error(f"LLM解析失败: {e}")
            return None

    def others_score(self, json_content: str) -> Optional[Dict[str, Any]]:
        try:
            # 调用OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """"""
                    },
                    {"role": "user", "content": json_content}
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

            return parsed_json

        except json.JSONDecodeError as e:
            # logger.error(f"JSON解析错误: {e}")
            return None
        except Exception as e:
            # logger.error(f"LLM解析失败: {e}")
            return None

    def market_score(self, resume_data):
        """
        计算市场匹配评分
        基于简历在特定市场领域的经验和技能匹配度
        """
        try:
            market = resume_data.get('market', '')
            market_field = resume_data.get('market_field', [])
            
            # 基础市场匹配分 (0-40分)
            base_score = 20 if market else 0
            
            # 市场细分领域匹配分 (0-60分)
            field_score = min(len(market_field) * 10, 60) if market_field else 0
            
            total_score = base_score + field_score
            return min(total_score, 100)  # 最高100分
            
        except Exception as e:
            logger.error(f"计算市场评分失败: {e}")
            return 0
    
    def education_score(self, resume_data):
        """
        计算教育背景评分
        基于学历等级、院校排名等因素
        """
        try:
            education = resume_data.get('education', [])
            if not education:
                return 0
            
            score = 0
            education_weights = {
                '清北': 100,
                'qs50': 90,
                'qs100': 80,
                '985高校': 75,
                '211高校': 65,
                '海外学历': 70,
                '博士': 85,
                '硕士': 70,
                '本科': 60,
                '专升本': 40,
                '专科': 30
            }
            
            # 取最高学历评分
            for edu_item in education:
                for edu_key, weight in education_weights.items():
                    if edu_key in str(edu_item).lower():
                        score = max(score, weight)
                        break
            
            return score
            
        except Exception as e:
            logger.error(f"计算教育评分失败: {e}")
            return 0
    
    def others_score(self, resume_data):
        """
        计算其他维度评分
        包括技能匹配度、工作年限等
        """
        try:
            category_skills = resume_data.get('category_skills', [])
            skills = resume_data.get('skills', [])
            
            # 技能匹配评分 (0-60分)
            skill_score = min(len(category_skills) * 10, 60)
            
            # 通用技能评分 (0-40分)  
            general_skill_score = min(len(skills) * 5, 40)
            
            total_score = skill_score + general_skill_score
            return min(total_score, 100)  # 最高100分
            
        except Exception as e:
            logger.error(f"计算其他评分失败: {e}")
            return 0
