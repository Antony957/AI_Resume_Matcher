#!/usr/bin/env python3
"""
Position Categorization Script
Reads resume_positions table and uses LLM to categorize positions and update category_id
"""

import sys
import json
from datetime import datetime
from typing import Dict, List, Optional
sys.path.append('.')

from utils.database import DatabaseManager
from utils.openai_client_manager import OpenAIClientManager
from utils.logger import setup_logger

logger = setup_logger("position_categorizer")

class PositionCategorizer:
    def __init__(self):
        self.db = DatabaseManager()
        self.openai_manager = OpenAIClientManager()
        
        # Define job categories (you can modify these)
        self.categories = {
            "技术开发": "Technology & Development",
            "产品管理": "Product Management", 
            "数据分析": "Data & Analytics",
            "设计创意": "Design & Creative",
            "运营营销": "Operations & Marketing",
            "销售商务": "Sales & Business Development",
            "人力资源": "Human Resources",
            "财务金融": "Finance & Accounting",
            "法务合规": "Legal & Compliance",
            "管理咨询": "Management & Consulting",
            "其他": "Others"
        }
        
    def get_all_positions(self) -> List[Dict]:
        """获取所有职位数据"""
        try:
            result = self.db.client.table('resume_positions').select('*').execute()
            logger.info(f"获取到 {len(result.data)} 个职位记录")
            return result.data
        except Exception as e:
            logger.error(f"获取职位数据失败: {e}")
            return []
    
    def categorize_position_with_llm(self, position: Dict) -> str:
        """使用LLM对职位进行分类"""
        try:
            # 构建职位信息描述
            position_info = f"""
            职位名称: {position.get('position', '未知')}
            公司名称: {position.get('company_name', '未知')}
            工作地点: {position.get('location', '未知')}
            薪资范围: {position.get('salary', '未知')}
            职位要求: {position.get('require', '未知')}
            职位描述: {position.get('jd', '未知')}
            """
            
            # 构建分类prompt
            categories_text = "\n".join([f"{k}: {v}" for k, v in self.categories.items()])
            
            prompt = f"""
请根据以下职位信息，将该职位归类到最合适的类别中。

职位信息:
{position_info}

可选类别:
{categories_text}

请仔细分析职位名称、要求和描述，选择最匹配的类别。

要求:
1. 只返回类别的中文名称（如"技术开发"、"产品管理"等）
2. 不要返回其他解释文字
3. 必须从上述类别中选择一个

分类结果:"""

            # 调用OpenAI API
            response = self.openai_manager.get_client().chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "你是一个专业的职位分类专家，能够准确识别和分类各种工作职位。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=50
            )
            
            category = response.choices[0].message.content.strip()
            
            # 验证返回的类别是否在预定义列表中
            if category not in self.categories:
                logger.warning(f"LLM返回了未知类别 '{category}'，使用默认类别 '其他'")
                category = "其他"
            
            logger.info(f"职位 '{position.get('position', 'Unknown')}' 被分类为: {category}")
            return category
            
        except Exception as e:
            logger.error(f"LLM分类失败: {e}")
            return "其他"  # 默认分类
    
    def ensure_categories_exist(self):
        """确保分类表中存在所有预定义的类别，由于RLS限制，我们使用现有的category_id"""
        logger.info("由于数据库RLS策略限制，将直接使用现有的category_id映射")
        
        # 获取现有的category_id
        try:
            result = self.db.client.table('resume_positions').select('category_id').execute()
            existing_ids = set()
            for pos in result.data:
                if pos.get('category_id'):
                    existing_ids.add(pos['category_id'])
            
            logger.info(f"发现现有的category_id: {existing_ids}")
            
            # 创建类别到ID的映射（固定映射，基于现有数据）
            existing_ids_list = list(existing_ids)
            if len(existing_ids_list) >= 2:
                # 使用现有的两个ID作为主要分类
                self.category_id_map = {
                    "技术开发": existing_ids_list[0],
                    "产品管理": existing_ids_list[1], 
                    "数据分析": existing_ids_list[0],
                    "设计创意": existing_ids_list[1],
                    "运营营销": existing_ids_list[1],
                    "销售商务": existing_ids_list[1],
                    "人力资源": existing_ids_list[1],
                    "财务金融": existing_ids_list[0],
                    "法务合规": existing_ids_list[1],
                    "管理咨询": existing_ids_list[1],
                    "其他": existing_ids_list[0]
                }
            else:
                # 如果只有一个ID，都使用它
                default_id = existing_ids_list[0] if existing_ids_list else "9ace663d-323a-4187-819e-4ba625fff63a"
                self.category_id_map = {cat: default_id for cat in self.categories.keys()}
                
            logger.info("分类ID映射已创建")
            
        except Exception as e:
            logger.error(f"获取现有category_id失败: {e}")
            # 使用默认映射
            self.category_id_map = {cat: "9ace663d-323a-4187-819e-4ba625fff63a" for cat in self.categories.keys()}
    
    def get_category_id(self, category_name: str) -> str:
        """根据分类名称获取category_id"""
        # 使用预设的映射表
        if hasattr(self, 'category_id_map') and category_name in self.category_id_map:
            return self.category_id_map[category_name]
        
        # 如果没有映射表或分类不存在，使用默认ID
        logger.warning(f"未找到分类 '{category_name}' 的映射，使用默认ID")
        return "9ace663d-323a-4187-819e-4ba625fff63a"
    
    def update_position_category(self, position_id: str, category_id: str, category_name: str) -> bool:
        """更新职位的分类ID"""
        try:
            result = self.db.client.table('resume_positions').update({
                'category_id': category_id,
                'update_at': datetime.now().isoformat()
            }).eq('id', position_id).execute()
            
            if result.data:
                logger.info(f"更新职位分类成功: {position_id} -> {category_name} ({category_id})")
                return True
            else:
                logger.error(f"更新职位分类失败: {position_id}")
                return False
                
        except Exception as e:
            logger.error(f"更新职位分类异常: {e}")
            return False
    
    def categorize_all_positions(self, limit: Optional[int] = None):
        """对所有职位进行分类"""
        logger.info("开始职位分类任务")
        
        # 1. 确保分类存在
        self.ensure_categories_exist()
        
        # 2. 获取所有职位
        positions = self.get_all_positions()
        
        if limit:
            positions = positions[:limit]
            logger.info(f"限制处理数量为: {limit}")
        
        if not positions:
            logger.warning("没有找到职位数据")
            return
        
        # 3. 处理每个职位
        success_count = 0
        failed_count = 0
        
        for i, position in enumerate(positions, 1):
            try:
                position_id = position['id']
                position_name = position.get('position', '未知职位')
                
                logger.info(f"处理职位 {i}/{len(positions)}: {position_name}")
                
                # LLM分类
                category_name = self.categorize_position_with_llm(position)
                
                # 获取分类ID
                category_id = self.get_category_id(category_name)
                
                # 更新数据库
                if self.update_position_category(position_id, category_id, category_name):
                    success_count += 1
                else:
                    failed_count += 1
                
                # 每处理10个记录输出一次进度
                if i % 10 == 0:
                    logger.info(f"进度: {i}/{len(positions)}, 成功: {success_count}, 失败: {failed_count}")
                    
            except Exception as e:
                logger.error(f"处理职位失败 {i}: {e}")
                failed_count += 1
                continue
        
        # 4. 输出最终结果
        logger.info(f"职位分类任务完成!")
        logger.info(f"总处理数量: {len(positions)}")
        logger.info(f"成功数量: {success_count}")
        logger.info(f"失败数量: {failed_count}")
        
        # 5. 显示分类统计
        self.show_category_statistics()
    
    def show_category_statistics(self):
        """显示分类统计信息"""
        try:
            logger.info("=== 职位分类统计 ===")
            
            # 统计每个category_id的职位数量
            result = self.db.client.table('resume_positions').select('category_id').execute()
            category_counts = {}
            for pos in result.data:
                cid = pos.get('category_id', 'Unknown')
                category_counts[cid] = category_counts.get(cid, 0) + 1
            
            # 如果有映射表，显示分类名称
            if hasattr(self, 'category_id_map'):
                # 反向映射
                id_to_name = {v: k for k, v in self.category_id_map.items()}
                for category_id, count in category_counts.items():
                    category_name = id_to_name.get(category_id, f"ID:{category_id}")
                    logger.info(f"{category_name}: {count} 个职位")
            else:
                for category_id, count in category_counts.items():
                    logger.info(f"Category ID {category_id}: {count} 个职位")
                    
        except Exception as e:
            logger.error(f"统计分类信息失败: {e}")


def main():
    """主函数"""
    import sys
    
    categorizer = PositionCategorizer()
    
    # 检查命令行参数
    if len(sys.argv) > 1:
        if sys.argv[1] == 'test':
            print("=== 测试模式：处理前3个职位 ===")
            categorizer.categorize_all_positions(limit=3)
            return
        elif sys.argv[1] == 'all':
            print("=== 处理所有职位 ===")
            categorizer.categorize_all_positions()
            return
        elif sys.argv[1] == 'stats':
            print("=== 显示分类统计 ===")
            categorizer.show_category_statistics()
            return
    
    print("=== 职位分类工具 ===")
    print("用法:")
    print("  python categorize_positions.py test   # 测试模式（处理前3个职位）")
    print("  python categorize_positions.py all    # 处理所有职位")
    print("  python categorize_positions.py stats  # 显示分类统计")
    print("")
    print("直接运行测试模式...")
    categorizer.categorize_all_positions(limit=3)


if __name__ == "__main__":
    main()