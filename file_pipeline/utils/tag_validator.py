from typing import List, Dict, Any, Optional
from utils.database import DatabaseManager
from utils.logger import setup_logger

logger = setup_logger("tag_validator")

class TagValidator:
    """标签验证器"""
    
    def __init__(self):
        self.database = DatabaseManager()
        self.available_tags = {}
        self._load_tags()
    
    def _load_tags(self):
        """加载所有可用标签"""
        try:
            result = self.database.client.table("tag_dictionary").select("tag_name, category").execute()
            
            self.available_tags = {
                "技术类": set(),
                "非技术类": set()
            }
            
            if result.data:
                for tag in result.data:
                    category = tag["category"]
                    tag_name = tag["tag_name"]
                    if category in self.available_tags:
                        self.available_tags[category].add(tag_name)
            
            logger.info(f"加载标签完成: 技术类{len(self.available_tags['技术类'])}个, 非技术类{len(self.available_tags['非技术类'])}个")
            
        except Exception as e:
            logger.error(f"加载标签字典失败: {e}")
            self.available_tags = {"技术类": set(), "非技术类": set()}
    
    def validate_category(self, category: str) -> bool:
        """验证分类是否有效"""
        return category in ["技术类", "非技术类"]
    
    def validate_tags_for_category(self, tags: List[str], category: str) -> Dict[str, Any]:
        """验证标签是否属于指定分类"""
        if not self.validate_category(category):
            return {
                "valid": False,
                "error": f"无效的分类: {category}",
                "valid_tags": [],
                "invalid_tags": tags
            }
        
        available_tags_set = self.available_tags[category]
        valid_tags = []
        invalid_tags = []
        
        for tag in tags:
            if tag in available_tags_set:
                valid_tags.append(tag)
            else:
                invalid_tags.append(tag)
        
        is_valid = len(invalid_tags) == 0 and len(valid_tags) > 0
        
        return {
            "valid": is_valid,
            "error": f"发现无效标签: {invalid_tags}" if invalid_tags else None,
            "valid_tags": valid_tags,
            "invalid_tags": invalid_tags,
            "total_count": len(tags),
            "valid_count": len(valid_tags),
            "invalid_count": len(invalid_tags)
        }
    
    def filter_valid_tags(self, tags: List[str], category: str) -> List[str]:
        """过滤出有效的标签"""
        validation_result = self.validate_tags_for_category(tags, category)
        return validation_result["valid_tags"]
    
    def get_available_tags(self, category: Optional[str] = None) -> Dict[str, List[str]]:
        """获取可用标签列表"""
        if category:
            return {category: list(self.available_tags.get(category, set()))}
        else:
            return {k: list(v) for k, v in self.available_tags.items()}
    
    def suggest_similar_tags(self, invalid_tag: str, category: str, max_suggestions: int = 3) -> List[str]:
        """为无效标签建议相似标签"""
        import difflib
        
        available_tags_list = list(self.available_tags.get(category, set()))
        if not available_tags_list:
            return []
        
        # 使用difflib找到最相似的标签
        similar_tags = difflib.get_close_matches(
            invalid_tag, 
            available_tags_list, 
            n=max_suggestions, 
            cutoff=0.6
        )
        
        return similar_tags
    
    def validate_and_fix_tags(self, tags: List[str], category: str) -> Dict[str, Any]:
        """验证标签并尝试修复"""
        validation_result = self.validate_tags_for_category(tags, category)
        
        # 为无效标签提供建议
        suggestions = {}
        for invalid_tag in validation_result["invalid_tags"]:
            similar_tags = self.suggest_similar_tags(invalid_tag, category)
            if similar_tags:
                suggestions[invalid_tag] = similar_tags
        
        return {
            **validation_result,
            "suggestions": suggestions
        }
    
    def reload_tags(self):
        """重新加载标签（当标签字典更新时调用）"""
        self._load_tags()