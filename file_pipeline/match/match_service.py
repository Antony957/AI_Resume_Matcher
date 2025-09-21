# queue_manager.py
from queue import Queue
import threading
import time

from match.match_processor import MatchProcessor
from utils.database import DatabaseManager


class MatchService:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.queue = Queue()
        self._running = False
        self.db_manager = DatabaseManager()
        self.match_processor = MatchProcessor()


    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def start_worker(self):
        self._running = True
        t = threading.Thread(target=self._worker, daemon=True)
        t.start()

    def stop_worker(self):
        self._running = False

    def push(self, message):
        self.queue.put(message)

    def _worker(self):
        while self._running:
            try:
                message = self.queue.get(timeout=1)
                self.handle_message(message)
            except Exception:
                continue  # timeout, continue looping

    def handle_match(self, all_position, all_resume):
        for item in all_position:
            print(f"开始匹配职位: Category={item.get('category', '无')}, Market={item.get('market', '无')}")
            
            match_result = []
            
            # 修复匹配逻辑
            for resume in all_resume:
                resume_tags = resume.get('tags', {})
                if not isinstance(resume_tags, dict):
                    continue
                
                # 基本条件匹配：类别和市场
                category_match = item.get('category') == resume.get('category')
                market_match = item.get('market') == resume.get('market')
                
                if not (category_match and market_match):
                    continue
                
                # 技能匹配：检查职位要求的技能是否在简历中
                position_tags = item.get('tags', {})
                if isinstance(position_tags, dict):
                    position_market_field = position_tags.get('market_field', {})
                    if isinstance(position_market_field, dict):
                        required_skills = position_market_field.get('required', [])
                        recommended_skills = position_market_field.get('recommended', [])
                        all_position_skills = required_skills + recommended_skills
                        
                        # 简历的市场技能
                        resume_market_field = resume_tags.get('market_field', [])
                        resume_category_skills = resume_tags.get('category_skills', [])
                        all_resume_skills = resume_market_field + resume_category_skills
                        
                        # 检查技能交集
                        skill_overlap = set(all_position_skills) & set(all_resume_skills)
                        
                        # 如果有技能匹配或者职位没有特定技能要求，则进入评分
                        if skill_overlap or not all_position_skills:
                            market_score = self.match_processor.market_score(resume_tags)
                            education_score = self.match_processor.education_score(resume_tags)
                            others_score = self.match_processor.others_score(resume_tags)
                            total_score = market_score + education_score + others_score
                            
                            match_result.append({
                                "resume": resume, 
                                "score": total_score,
                                "skill_score": market_score,
                                "education_score": education_score, 
                                "other_score": others_score,
                                "matched_skills": list(skill_overlap)
                            })
                            
                            print(f"  匹配简历 {resume.get('resume_id', '无')[:8]}...: 总分={total_score}, 匹配技能={list(skill_overlap)}")

            print(f"  总共匹配到 {len(match_result)} 份简历")
            
            # 按分数排序，取前100
            top_100 = sorted(match_result, key=lambda x: x["score"], reverse=True)[:100]
            
            if top_100:
                print(f"  存储前{len(top_100)}个匹配结果")
                self.db_manager.update_match_result(item, top_100)
            else:
                print("  没有匹配的简历")
                self.db_manager.update_match_result(item, [])


    def handle_message(self, message):
        print(f"Processing message: {message}")
        param = message['starter']
        all_position = self.db_manager.get_all_position_unmatched()
        if param == 'scheduler':
            all_resume = self.db_manager.get_all_resume()
            self.handle_match(all_position, all_resume)
        elif param == 'upload':
            match_id = message['payload']['id']
            all_resume = self.db_manager.get_resume_tag_by_id(match_id)
            self.handle_match(all_position, all_resume)