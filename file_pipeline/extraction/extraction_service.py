# queue_manager.py
from queue import Queue
import threading
import time

from numpy.f2py.auxfuncs import throw_error

from extraction.position_processor import PositionProcessor
from extraction.resume_processor import ResumeProcessor
# from match.match_service import MatchService  # 暂时取消匹配服务
from utils.database import DatabaseManager
from utils.logger import setup_logger

logger = setup_logger("extraction_service")


class ExtractionService:
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.queue = Queue()
        self._running = False
        self.db_manager = DatabaseManager()
        self.resume_processor = ResumeProcessor()
        self.position_processor = PositionProcessor()
        # self.match_service = MatchService().get_instance()  # 暂时取消匹配服务

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
                message = self.queue.get(timeout=5)
                self.handle_message(message)
            except Exception:
                continue  # timeout, continue looping


    def handle_scan_resume(self):
        scan_result = self.db_manager.get_unextracted_resume()
        for item in scan_result:
            resume_json = item['raw_json']
            resume_id = item['id']
            self.handle_single_resume(resume_json, resume_id)


    def handle_single_resume(self, resume_json, resume_id):
        try:
            print(f"开始处理简历标签提取: {resume_id}")
            parsed_tags = self.resume_processor.parse_resume_content(resume_json)
            
            if parsed_tags is None:
                print(f"简历 {resume_id} 标签提取返回None，跳过处理")
                return
            
            print(f"简历 {resume_id} 标签提取成功，准备存储到数据库")
            result = self.db_manager.create_resume_tags_record(parsed_tags, resume_id)
            
            if result:
                print(f"简历 {resume_id} 标签存储成功")
            else:
                print(f"简历 {resume_id} 标签存储失败")
                
        except Exception as e:
            print(f"处理简历 {resume_id} 时出错: {e}")
            import traceback
            traceback.print_exc()


    def handle_scan_position(self):
        scan_result = self.db_manager.get_unextracted_position()
        for item in scan_result:
            self.handle_single_position(item)

    def handle_single_position(self, position_record):
        try:
            print(f"开始处理职位标签提取: {position_record['id']}")
            print(f"职位数据: {position_record}")
            
            # 将位置记录转换为文本内容
            position_content = self._format_position_content(position_record)
            print(f"格式化后的职位内容: {position_content}")
            
            # 润色内容
            polished_content = self.position_processor.polish_position_content(position_content)
            if polished_content is None:
                print(f"职位 {position_record['id']} 内容润色失败，跳过处理")
                return
                
            print(f"润色后的内容: {polished_content}")
            
            # 解析标签
            parsed_tags = self.position_processor.parse_resume_content(polished_content)
            if parsed_tags is None:
                print(f"职位 {position_record['id']} 标签提取返回None，跳过处理")
                return
                
            print(f"职位 {position_record['id']} 标签提取成功，准备存储到数据库")
            result = self.db_manager.create_position_tags_record(parsed_tags, position_record['id'])
            
            if result:
                print(f"职位 {position_record['id']} 标签存储成功")
            else:
                print(f"职位 {position_record['id']} 标签存储失败")
                
        except Exception as e:
            print(f"处理职位 {position_record['id']} 时出错: {e}")
            import traceback
            traceback.print_exc()
    
    def _format_position_content(self, position_record):
        """将职位记录格式化为文本内容"""
        try:
            content_parts = []
            
            # 添加职位标题 - 修复字段名: position_name → position
            if position_record.get('position'):
                content_parts.append(f"职位名称: {position_record['position']}")
            
            # 添加职位描述 - 修复字段名: position_description → jd
            if position_record.get('jd'):
                content_parts.append(f"职位描述: {position_record['jd']}")
            
            # 添加职位要求 - 修复字段名: position_requirements → require
            if position_record.get('require'):
                content_parts.append(f"职位要求: {position_record['require']}")
            
            # 添加其他相关信息
            if position_record.get('company_name'):
                content_parts.append(f"公司名称: {position_record['company_name']}")
                
            # 修复字段名: salary_range → salary
            if position_record.get('salary'):
                content_parts.append(f"薪资范围: {position_record['salary']}")
                
            # 修复字段名: work_location → location
            if position_record.get('location'):
                content_parts.append(f"工作地点: {position_record['location']}")
            
            # 添加其他可能有用的字段
            if position_record.get('racetrack'):
                content_parts.append(f"赛道: {position_record['racetrack']}")
                
            if position_record.get('adviser'):
                content_parts.append(f"顾问: {position_record['adviser']}")
                
            if position_record.get('level'):
                content_parts.append(f"级别: {position_record['level']}")
                
            if position_record.get('hc'):
                content_parts.append(f"招聘人数: {position_record['hc']}")
                
            if position_record.get('reference'):
                content_parts.append(f"参考信息: {position_record['reference']}")
                
            if position_record.get('intern'):
                content_parts.append(f"实习相关: {position_record['intern']}")
            
            return "\n".join(content_parts) if content_parts else str(position_record)
            
        except Exception as e:
            print(f"格式化职位内容失败: {e}")
            return str(position_record)


    def handle_message(self, message):
        print(f"Processing message: {message}")
        param = message['starter']
        if param == 'scheduler':
            self.handle_scan_resume()
            self.handle_scan_position()
        elif param == 'pipeline':
            self.handle_single_resume(message['payload']['data'], message['payload']['id'])
            # self.match_service.push({'source': "upload", "payload": {"id": message['payload']['id']}})  # 暂时取消匹配服务


