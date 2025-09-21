#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
职位表格导入脚本
功能：将Excel表格中的职位数据处理并插入到数据库中
"""

import pandas as pd
import json
import sys
import os
from pathlib import Path
from typing import Dict, List, Optional, Any
import uuid
from datetime import datetime

# 添加项目路径
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from utils.database import DatabaseManager
from utils.logger import setup_logger
from modules.llm_processor import LLMProcessor

logger = setup_logger("position_import")

class PositionImporter:
    """职位导入器"""
    
    def __init__(self):
        self.database = DatabaseManager()
        self.llm_processor = LLMProcessor()
        
        # 加载可用标签
        self._load_available_tags()
        
        # 技术类关键词映射
        self.tech_keywords = {
            '后端', '前端', '全栈', 'AI', '区块链开发', '移动端', 'iOS', 
            '测试', '运维', '数据', '算法', '开发', '工程师', '架构师',
            'java', 'python', 'golang', 'react', 'vue', 'nodejs',
            'android', 'ios', 'flutter', 'devops', 'qa', 'ml', 'nlp'
        }
        
        # 非技术类关键词映射
        self.non_tech_keywords = {
            '产品', '运营', '商务', '销售', '市场', '投资', '法务', 'HR',
            '设计', 'UI', 'UX', '品牌', '合规', '风控', '量化'
        }
    
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
    
    def _classify_position(self, position_data: Dict[str, Any]) -> str:
        """分类职位：技术类 or 非技术类"""
        # 获取职位信息
        category = str(position_data.get('分类', '')).strip()
        position_title = str(position_data.get('职位', '')).strip()
        requirements = str(position_data.get('要求要点', '')).strip()
        jd = str(position_data.get('JD', '')).strip()
        
        # 合并所有文本进行分析
        full_text = f"{category} {position_title} {requirements} {jd}".lower()
        
        # 技术类关键词匹配得分
        tech_score = sum(1 for keyword in self.tech_keywords if keyword.lower() in full_text)
        
        # 非技术类关键词匹配得分
        non_tech_score = sum(1 for keyword in self.non_tech_keywords if keyword.lower() in full_text)
        
        # 基于分类字段的直接映射
        if category in ['后端', '前端', '全栈', 'AI', '区块链开发', '移动端', 'iOS', '测试', '运维', '数据']:
            return "技术类"
        elif category in ['产品', '运营', '商务', '销售', '投资', 'HR', '设计', 'UI/UX', '法务合规', '量化']:
            return "非技术类"
        
        # 基于关键词得分判断
        if tech_score > non_tech_score:
            return "技术类"
        elif non_tech_score > tech_score:
            return "非技术类"
        else:
            # 默认为非技术类
            return "非技术类"
    
    def _extract_tags_with_llm(self, position_data: Dict[str, Any], category: str) -> List[str]:
        """使用LLM提取标签"""
        try:
            # 构建职位描述文本
            position_text = self._build_position_summary(position_data)
            
            # 构建标签列表文本
            available_tags_for_category = self.available_tags.get(category, [])
            tags_text = "、".join(available_tags_for_category)
            
            if not tags_text:
                logger.warning(f"分类 {category} 没有可用标签")
                return []
            
            # 调用LLM进行标签分析
            response = self.llm_processor.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": f"""你是一个专业的职位分析师。请从以下标签列表中选择最匹配的标签：

{category}可选标签：{tags_text}

**严格要求：**
1. 【重要】只能从上述标签列表中精确选择标签，一个字都不能改变
2. 【重要】绝对禁止创造、修改或组合新标签
3. 【重要】如果职位中的技能不在标签列表中，就不要选择，宁可少选也不要创造
4. 选择1-5个最匹配的标签（不要超过5个）
5. 返回JSON格式: {{"tags": ["标签1", "标签2"]}}

请严格遵守标签约束，绝不创造新标签！"""
                    },
                    {
                        "role": "user", 
                        "content": f"请分析以下职位并选择匹配的标签：\\n\\n{position_text}"
                    }
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "position_tags",
                        "schema": {
                            "type": "object",
                            "strict": True,
                            "properties": {
                                "tags": {
                                    "type": "array",
                                    "items": {"type": "string"}
                                }
                            },
                            "additionalProperties": False,
                            "required": ["tags"]
                        }
                    }
                }
            )
            
            # 解析结果
            result = json.loads(response.choices[0].message.content)
            raw_tags = result.get("tags", [])
            
            # 清理和验证标签
            valid_tags = []
            for tag in raw_tags:
                clean_tag = str(tag).strip()
                if clean_tag in available_tags_for_category:
                    valid_tags.append(clean_tag)
                else:
                    logger.warning(f"无效标签被过滤: {clean_tag}")
            
            logger.info(f"LLM标签提取: 原始{len(raw_tags)}个 -> 有效{len(valid_tags)}个")
            return valid_tags
            
        except Exception as e:
            logger.error(f"LLM标签提取失败: {e}")
            return []
    
    def _build_position_summary(self, position_data: Dict[str, Any]) -> str:
        """构建职位摘要文本"""
        summary_parts = []
        
        # 职位基本信息
        category = position_data.get('分类', '')
        position_title = position_data.get('职位', '')
        location = position_data.get('地点', '')
        
        if category and str(category).strip() != 'nan':
            summary_parts.append(f"分类: {category}")
        
        if position_title and str(position_title).strip() != 'nan':
            summary_parts.append(f"职位: {position_title}")
        
        if location and str(location).strip() != 'nan':
            summary_parts.append(f"地点: {location}")
        
        # 要求要点
        requirements = position_data.get('要求要点', '')
        if requirements and str(requirements).strip() != 'nan':
            summary_parts.append(f"要求要点: {requirements}")
        
        # JD描述
        jd = position_data.get('JD', '')
        if jd and str(jd).strip() != 'nan':
            # JD可能很长，取前500字符
            jd_text = str(jd)[:500]
            summary_parts.append(f"职位描述: {jd_text}")
        
        return "\\n".join(summary_parts)
    

    def _prepare_position_data(self, row: pd.Series) -> Optional[Dict[str, Any]]:
        """准备职位数据"""
        try:
            # 基本字段映射
            position_data = {
                '分类': row.get('分类'),
                '职位': row.get('职位'),
                '地点': row.get('地点'),
                '薪资': row.get('薪资'),
                '要求要点': row.get('要求要点'),
                'JD': row.get('JD'),
            }
            
            # 检查必要字段
            title = str(position_data.get('职位', '')).strip()
            if not title or title == 'nan':
                logger.warning("职位标题为空，跳过该条记录")
                return None
            
            # 分类职位
            classification = self._classify_position(position_data)
            
            # 提取标签
            tags = self._extract_tags_with_llm(position_data, classification)
            
            # 处理HC字段
            hc_value = None
            hc_raw = position_data.get('HC', '')
            if hc_raw and str(hc_raw).strip() != 'nan':
                try:
                    hc_value = int(float(str(hc_raw).strip()))
                except (ValueError, TypeError):
                    hc_value = None
            
            # 获取Excel中的额外字段
            category_name = str(position_data.get('分类', '')).strip()
            if category_name == 'nan':
                category_name = None
                
            racetrack = str(row.get('赛道', '')).strip() if str(row.get('赛道', '')).strip() != 'nan' else None
            adviser = str(row.get('顾问', '')).strip() if str(row.get('顾问', '')).strip() != 'nan' else None
            level = str(row.get('分级', '')).strip() if str(row.get('分级', '')).strip() != 'nan' else None
            
            # 构建最终数据 - 匹配新的positions表结构
            final_data = {
                'id': str(uuid.uuid4()),
                'position_name': title,
                'company_name': None,  # Excel中没有公司字段
                'location': str(position_data.get('地点', '')).strip() if str(position_data.get('地点', '')).strip() != 'nan' else None,
                'hc': hc_value,
                'salary_range': str(position_data.get('薪资', '')).strip() if str(position_data.get('薪资', '')).strip() != 'nan' else None,
                'job_description': str(position_data.get('JD', '')).strip() if str(position_data.get('JD', '')).strip() != 'nan' else '',
                'requirements': str(position_data.get('要求要点', '')).strip() if str(position_data.get('要求要点', '')).strip() != 'nan' else None,
                'tags': tags,  # 直接存储标签数组
                'racetrack': racetrack,
                'adviser': adviser,
                'level': level,
                'intern_available': False,  # 默认值
                'reference': str(position_data.get('参考简历及评价', '')).strip() if str(position_data.get('参考简历及评价', '')).strip() != 'nan' else None,
                'requirement_json': {
                    'classification': classification,
                    'original_category': category_name,
                    'intern_requirements': str(position_data.get('要求要点（给实习生）', '')).strip() if str(position_data.get('要求要点（给实习生）', '')).strip() != 'nan' else None
                },
                'status': 'active',
                'urgency': 'normal',
                'match_count': 0,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            return final_data
            
        except Exception as e:
            logger.error(f"准备职位数据失败: {e}")
            return None
    
    def import_from_excel(self, excel_path: str) -> Dict[str, int]:
        """从Excel导入职位数据"""
        stats = {
            'total': 0,
            'success': 0,
            'failed': 0,
            'skipped': 0
        }
        
        try:
            # 读取Excel文件
            logger.info(f"开始读取Excel文件: {excel_path}")
            df = pd.read_excel(excel_path)
            
            logger.info(f"Excel文件包含 {len(df)} 行数据")
            stats['total'] = len(df)
            
            # 处理每一行
            for index, row in df.iterrows():
                try:
                    logger.info(f"处理第 {index + 1}/{len(df)} 行数据")
                    
                    # 准备数据
                    position_data = self._prepare_position_data(row)
                    if not position_data:
                        stats['skipped'] += 1
                        continue
                    
                    # 插入数据库
                    success = self._insert_position(position_data)
                    if success:
                        stats['success'] += 1
                        logger.info(f"职位导入成功: {position_data['position_name']} ({position_data['requirement_json']['classification']}) - 标签: {position_data['tags']}")
                    else:
                        stats['failed'] += 1
                        
                except Exception as e:
                    logger.error(f"处理第 {index + 1} 行失败: {e}")
                    stats['failed'] += 1
            
            logger.info(f"导入完成: 总计{stats['total']}，成功{stats['success']}，失败{stats['failed']}，跳过{stats['skipped']}")
            return stats
            
        except Exception as e:
            logger.error(f"导入过程失败: {e}")
            return stats
    
    def _insert_position(self, position_data: Dict[str, Any]) -> bool:
        """插入职位到数据库"""
        try:
            # 插入到positions表
            result = self.database.client.table("positions").insert(position_data).execute()
            return bool(result.data)
            
        except Exception as e:
            logger.error(f"插入职位失败: {e}")
            return False

def main():
    """主函数"""
    excel_path = r"D:\FeiYuzi\project\AI_resume\position.xlsx"
    
    if not os.path.exists(excel_path):
        logger.error(f"Excel文件不存在: {excel_path}")
        return
    
    try:
        importer = PositionImporter()
        stats = importer.import_from_excel(excel_path)
        
        print("\\n" + "="*50)
        print("职位导入统计")
        print("="*50)
        print(f"总计处理: {stats['total']} 条")
        print(f"成功导入: {stats['success']} 条")
        print(f"导入失败: {stats['failed']} 条") 
        print(f"跳过记录: {stats['skipped']} 条")
        print("="*50)
        
    except Exception as e:
        logger.error(f"主程序执行失败: {e}")

if __name__ == "__main__":
    main()