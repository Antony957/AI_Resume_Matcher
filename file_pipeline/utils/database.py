from supabase import create_client, Client
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path
import time
from utils.logger import setup_logger
from config.settings import SUPABASE_URL, SUPABASE_KEY

logger = setup_logger("database")

def retry_db_operation(max_retries=3, initial_delay=2):
    """数据库操作重试装饰器"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            retry_delay = initial_delay
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    logger.warning(f"数据库操作失败 (第{attempt + 1}次): {e}")
                    if attempt < max_retries - 1:
                        logger.info(f"等待 {retry_delay} 秒后重试...")
                        time.sleep(retry_delay)
                        retry_delay *= 2  # 指数退避
                    else:
                        logger.error(f"重试 {max_retries} 次后仍然失败")
                        raise e
            return None
        return wrapper
    return decorator

class DatabaseManager:
    def __init__(self):
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self._connection_retries = 0
        self._max_connection_retries = 5
    
    def _reconnect_if_needed(self):
        """检查连接并在必要时重连"""
        if self._connection_retries < self._max_connection_retries:
            try:
                # 简单的连接测试
                self.client.table("files").select("id").limit(1).execute()
                self._connection_retries = 0  # 重置计数器
            except Exception as e:
                self._connection_retries += 1
                logger.warning(f"数据库连接测试失败 (第{self._connection_retries}次): {e}")
                if self._connection_retries >= self._max_connection_retries:
                    logger.error("数据库连接重试次数过多，需要手动检查")
                    raise e
                # 重新创建客户端
                self.client = create_client(SUPABASE_URL, SUPABASE_KEY)
                time.sleep(2)
    
    def create_resume_file_record(self, file_path: Path, user_id: Optional[str] = None) -> Optional[str]:
        """创建简历文件记录"""
        try:
            file_size = file_path.stat().st_size
            
            result = self.client.table("files").insert({
                "file_name": file_path.name,
                "storage_path": str(file_path),
                "file_size": file_size,
                "user_id": user_id,
                "ocr_status": "pending",
                "llm_status": "pending"
            }).execute()
            
            file_id = result.data[0]['id']
            logger.info(f"创建文件记录成功: {file_id}")
            return file_id
            
        except Exception as e:
            logger.error(f"创建文件记录失败: {e}")
            return None
    
    def update_ocr_status(self, file_id: str, status: str, error: Optional[str] = None):
        """更新OCR状态"""
        try:
            update_data = {
                "ocr_status": status,
                "ocr_started_at": datetime.now().isoformat() if status == "processing" else None,
                "ocr_completed_at": datetime.now().isoformat() if status in ["completed", "failed"] else None,
                "ocr_error": error if status == "failed" else None
            }
            
            # 移除None值
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            self.client.table("files").update(update_data).eq("id", file_id).execute()
            logger.info(f"更新OCR状态: {file_id} -> {status}")
            
        except Exception as e:
            logger.error(f"更新OCR状态失败: {e}")
            raise
    
    def update_llm_status(self, file_id: str, status: str, error: Optional[str] = None):
        """更新LLM状态"""
        try:
            update_data = {
                "llm_status": status,
                "llm_started_at": datetime.now().isoformat() if status == "processing" else None,
                "llm_completed_at": datetime.now().isoformat() if status in ["completed", "failed"] else None,
                "llm_error": error if status == "failed" else None
            }
            
            # 移除None值
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            self.client.table("files").update(update_data).eq("id", file_id).execute()
            logger.info(f"更新LLM状态: {file_id} -> {status}")
            
        except Exception as e:
            logger.error(f"更新LLM状态失败: {e}")
            raise
    
    def create_resume_profile(self, file_id: str, profile_data: Dict[str, Any]) -> Optional[str]:
        """创建简历档案记录"""
        try:
            # 从结构化数据中提取字段
            basic_info = profile_data.get('basic_info', {})
            
            # 计算工作年限
            years_experience = self._calculate_years_experience(profile_data.get('work_experience', []))
            
            insert_data = {
                "file_id": file_id,
                "full_name": basic_info.get('name', '暂无'),
                "email": basic_info.get('email', '暂无'),
                "phone": basic_info.get('phone', '暂无'),
                "location": basic_info.get('location', '暂无'),
                "headline": profile_data.get('job_intention', '暂无'),
                "summary": self._format_expertise(profile_data.get('personal_expertise', [])),
                "years_experience": years_experience,
                "education": profile_data.get('education', []),
                "work_experience": profile_data.get('work_experience', []),
                "projects": profile_data.get('projects', []),
                "skills": profile_data.get('skills', []),
                "certifications": profile_data.get('certifications', []),
                "languages": profile_data.get('languages', []),
                "extra_sections": {"others": profile_data.get('others', [])},
                "raw_json": profile_data
            }
            
            result = self.client.table("resume").insert(insert_data).execute()
            profile_id = result.data[0]['id']
            
            logger.info(f"创建简历档案成功: {profile_id}")
            return profile_id
            
        except Exception as e:
            logger.error(f"创建简历档案失败: {e}")
            return None
    
    def create_resume_profile_with_tags(self, file_id: str, profile_data: Dict[str, Any], tags: List[str]) -> Optional[str]:
        """创建包含标签的简历档案记录"""
        try:
            # 原有的档案创建逻辑
            basic_info = profile_data.get('basic_info', {})
            years_experience = self._calculate_years_experience(profile_data.get('work_experience', []))
            
            insert_data = {
                "file_id": file_id,
                "full_name": basic_info.get('name', '暂无'),
                "email": basic_info.get('email', '暂无'),
                "phone": basic_info.get('phone', '暂无'),
                "location": basic_info.get('location', '暂无'),
                "headline": profile_data.get('job_intention', '暂无'),
                "summary": self._format_expertise(profile_data.get('personal_expertise', [])),
                "years_experience": years_experience,
                "education": profile_data.get('education', []),
                "work_experience": profile_data.get('work_experience', []),
                "projects": profile_data.get('projects', []),
                "skills": profile_data.get('skills', []),
                "certifications": profile_data.get('certifications', []),
                "languages": profile_data.get('languages', []),
                "extra_sections": {"others": profile_data.get('others', [])},
                "raw_json": profile_data,
                # 新增：标签字段
                "tags": tags,
                "status": "tagged"  # 标记为已标签化
            }
            
            result = self.client.table("resume").insert(insert_data).execute()
            profile_id = result.data[0]['id']
            
            logger.info(f"创建简历档案成功: {profile_id}, 标签: {tags}")
            return profile_id
            
        except Exception as e:
            logger.error(f"创建简历档案失败: {e}")
            return None
    
    def _calculate_years_experience(self, work_experience: list) -> int:
        """计算工作年限"""
        try:
            from datetime import datetime
            
            total_months = 0
            current_year = datetime.now().year
            
            for exp in work_experience:
                start_date = exp.get("start_date", "")
                end_date = exp.get("end_date", "")
                
                if not start_date or start_date == "暂无":
                    continue
                
                try:
                    # 提取年份
                    if "-" in start_date:
                        start_year = int(start_date.split("-")[0])
                    else:
                        start_year = int(start_date[:4])
                    
                    if end_date and end_date != "暂无" and "至今" not in end_date and "现在" not in end_date:
                        if "-" in end_date:
                            end_year = int(end_date.split("-")[0])
                        else:
                            end_year = int(end_date[:4])
                    else:
                        end_year = current_year
                    
                    years = max(0, end_year - start_year)
                    total_months += years * 12
                    
                except ValueError:
                    continue
            
            return max(0, total_months // 12)
            
        except Exception as e:
            logger.warning(f"计算工作年限失败: {e}")
            return 0
    
    def _format_expertise(self, expertise_list: list) -> str:
        """格式化专业技能"""
        try:
            if not expertise_list:
                return "暂无"
            
            # 过滤掉"暂无"项
            filtered_list = [item for item in expertise_list if item and item != "暂无"]
            
            if not filtered_list:
                return "暂无"
            
            return ', '.join(filtered_list)
            
        except Exception:
            return "暂无"
    
    def get_resume_file(self, file_id: str) -> Optional[Dict[str, Any]]:
        """获取简历文件信息"""
        try:
            result = self.client.table("files").select("*").eq("id", file_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"获取简历文件信息失败: {e}")
            return None
    
    def test_connection(self) -> bool:
        """测试数据库连接"""
        try:
            # 尝试查询一个简单的表
            result = self.client.table("files").select("id").limit(1).execute()
            logger.info("数据库连接测试成功")
            return True
        except Exception as e:
            logger.error(f"数据库连接测试失败: {e}")
            return False

    def get_unextracted_resume(self):
        try:
            # 获取所有简历档案
            all_resumes = self.client.table("resume").select("*").execute()
            
            # 获取已提取标签的简历ID
            tagged_resumes = self.client.table("resume_tags").select("resume_id").execute()
            used_ids = set([row['resume_id'] for row in tagged_resumes.data] if tagged_resumes.data else [])
            
            # 过滤出未提取标签的简历
            unextracted = []
            if all_resumes.data:
                for resume in all_resumes.data:
                    if resume['id'] not in used_ids:
                        unextracted.append(resume)
            
            print(f"找到 {len(unextracted)} 个未提取标签的简历")
            return unextracted
            
        except Exception as e:
            logger.error(f"获取未打标签简历信息失败: {e}")
            import traceback
            traceback.print_exc()
        return []

    def get_unextracted_position(self):
        try:
            # 获取所有职位
            all_positions = self.client.table("positions").select("*").execute()
            
            # 获取已提取标签的职位ID
            tagged_positions = self.client.table("position_tags").select("position_id").execute()
            used_ids = set([row['position_id'] for row in tagged_positions.data] if tagged_positions.data else [])
            
            # 过滤出未提取标签的职位
            unextracted = []
            if all_positions.data:
                for position in all_positions.data:
                    if position['id'] not in used_ids:
                        unextracted.append(position)
            
            print(f"找到 {len(unextracted)} 个未提取标签的职位")
            return unextracted
            
        except Exception as e:
            logger.error(f"获取未打标签职位信息失败: {e}")
            import traceback
            traceback.print_exc()
        return []


    def create_resume_tags_record(self, parsed_resume, resume_id):
        max_retries = 3
        retry_delay = 2  # seconds
        
        for attempt in range(max_retries):
            try:
                print(f"尝试创建简历tag记录 (第{attempt + 1}次): {resume_id}")
                
                result = self.client.table("resume_tags").insert({
                    "resume_id": resume_id,
                    "category": parsed_resume.get('category', ''),
                    "market": parsed_resume.get('market', ''),
                    "tags": parsed_resume,
                }).execute()

                if result.data and len(result.data) > 0:
                    file_id = result.data[0]['id']
                    logger.info(f"创建简历tag记录成功: {file_id}")
                    print(f"简历tag记录创建成功: {file_id}")
                    return file_id
                else:
                    print(f"创建记录返回空数据")
                    
            except Exception as e:
                logger.error(f"创建简历tag记录失败 (第{attempt + 1}次): {e}")
                print(f"创建失败 (第{attempt + 1}次): {e}")
                
                if attempt < max_retries - 1:
                    print(f"等待 {retry_delay} 秒后重试...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 2  # 指数退避
                else:
                    print(f"重试 {max_retries} 次后仍然失败")
                    
        return None

    def create_position_tags_record(self, parsed_position, position_id):
        max_retries = 3
        retry_delay = 2  # seconds
        
        for attempt in range(max_retries):
            try:
                print(f"尝试创建职位tag记录 (第{attempt + 1}次): {position_id}")
                
                result = self.client.table("position_tags").insert({
                    "position_id": position_id,
                    "category": parsed_position.get('category', ''),
                    "market": parsed_position.get('market', ''),
                    "tags": parsed_position,
                    "status": "uploaded"
                }).execute()

                if result.data and len(result.data) > 0:
                    file_id = result.data[0]['id']
                    logger.info(f"创建职位tag记录成功: {file_id}")
                    print(f"职位tag记录创建成功: {file_id}")
                    return file_id
                else:
                    print(f"创建记录返回空数据")
                    
            except Exception as e:
                logger.error(f"创建职位tag记录失败 (第{attempt + 1}次): {e}")
                print(f"创建失败 (第{attempt + 1}次): {e}")
                
                if attempt < max_retries - 1:
                    print(f"等待 {retry_delay} 秒后重试...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 2  # 指数退避
                else:
                    print(f"重试 {max_retries} 次后仍然失败")
                    
        return None

    def get_all_position_unmatched(self):
        try:
            result = self.client.table("position_tags").select("*").eq("status", "uploaded").execute()
            return result.data if result.data else None
        except Exception as e:
            logger.error(f"获取未打标签职位信息失败: {e}")
        return None

    def get_all_resume(self):
        try:
            result = self.client.table("resume_tags").select("*").execute()
            return result.data if result.data else None
        except Exception as e:
            logger.error(f"获取未打标签职位信息失败: {e}")
        return None


    def get_resume_tag_by_id(self, resume_id):
        try:
            result = self.client.table("resume_tags").select("*").eq("resume_id", resume_id).execute()
            return result.data if result.data else None
        except Exception as e:
            logger.error(f"获取未打标签职位信息失败: {e}")
        return None

    @retry_db_operation(max_retries=3, initial_delay=2)
    def update_match_result(self, position, match_result):
        """
        更新匹配结果
        :param position: 职位信息字典，包含position_id等
        :param match_result: 匹配结果列表，每项包含{'resume': resume_data, 'score': total_score}
        """
        try:
            position_id = position.get('position_id') or position.get('id')
            if not position_id:
                logger.error("职位ID不能为空")
                return False
            
            # 1. 清除该职位的旧匹配结果
            delete_result = self.client.table("match_result").delete().eq("position_id", position_id).execute()
            logger.info(f"清除职位 {position_id} 的旧匹配结果: {len(delete_result.data) if delete_result.data else 0} 条")
            
            # 2. 如果没有匹配结果，只更新职位状态
            if not match_result or len(match_result) == 0:
                self._update_position_match_status(position_id, "matched", 0)
                logger.info(f"职位 {position_id} 无匹配结果")
                return True
            
            # 3. 批量插入新的匹配结果
            insert_data = []
            for i, item in enumerate(match_result):
                resume = item.get('resume', {})
                score = item.get('score', 0)
                
                # 解析评分（如果有详细评分）
                skill_score = item.get('skill_score', 0)
                education_score = item.get('education_score', 0) 
                other_score = item.get('other_score', 0)
                
                # 如果没有详细评分，假设总分平均分配
                if skill_score == 0 and education_score == 0 and other_score == 0:
                    skill_score = score / 3
                    education_score = score / 3
                    other_score = score / 3
                
                resume_id = resume.get('resume_id') or resume.get('id')
                if not resume_id:
                    logger.warning(f"简历ID为空，跳过匹配结果 {i}")
                    continue
                
                insert_data.append({
                    'position_id': position_id,
                    'match_resume': resume_id,
                    'skill_score': float(skill_score),
                    'education_score': float(education_score),
                    'other_score': float(other_score),
                    'sum_score': float(score)
                })
            
            if insert_data:
                result = self.client.table("match_result").insert(insert_data).execute()
                inserted_count = len(result.data) if result.data else 0
                logger.info(f"职位 {position_id} 插入匹配结果: {inserted_count} 条")
                
                # 4. 更新职位匹配状态
                self._update_position_match_status(position_id, "matched", inserted_count)
                
                return True
            else:
                logger.warning(f"职位 {position_id} 没有有效的匹配数据")
                return False
                
        except Exception as e:
            logger.error(f"更新匹配结果失败: {e}")
            return False
    
    def _update_position_match_status(self, position_id, status, match_count=0):
        """更新职位的匹配状态"""
        try:
            # 更新position_tags表的状态
            update_result = self.client.table("position_tags").update({
                "status": status,
                "match_count": match_count,  # 如果表中有这个字段的话
                "matched_at": datetime.now().isoformat()  # 匹配时间
            }).eq("position_id", position_id).execute()
            
            logger.info(f"更新职位 {position_id} 状态为 {status}, 匹配数量: {match_count}")
            return True
            
        except Exception as e:
            logger.error(f"更新职位状态失败: {e}")
            return False

