#!/usr/bin/env python3
"""
检查数据库中的resume_files和resume_profiles记录
"""

import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent))

from file_pipeline.utils.database import DatabaseManager

def check_database_records():
    """检查数据库记录"""
    print("=" * 60)
    print("检查数据库记录")
    print("=" * 60)
    
    try:
        db = DatabaseManager()
        
        # 测试连接
        print("\n1. 测试数据库连接...")
        if not db.test_connection():
            print("❌ 数据库连接失败")
            return
        print("✅ 数据库连接成功")
        
        # 查询resume_files表最近的记录
        print("\n2. 查询resume_files表最近的记录...")
        try:
            result = db.client.table("resume_files").select("*").order("created_at", desc=True).limit(10).execute()
            
            if not result.data:
                print("❌ 没有找到任何记录")
                return
            
            print(f"✅ 找到 {len(result.data)} 条记录")
            
            for i, record in enumerate(result.data, 1):
                print(f"\n--- 记录 {i} ---")
                print(f"ID: {record.get('id')}")
                print(f"文件名: {record.get('file_name')}")
                print(f"存储路径: {record.get('storage_path')}")
                print(f"文件大小: {record.get('file_size')} bytes")
                print(f"用户ID: {record.get('user_id')}")
                print(f"OCR状态: {record.get('ocr_status')}")
                print(f"LLM状态: {record.get('llm_status')}")
                print(f"创建时间: {record.get('created_at')}")
                print(f"OCR开始时间: {record.get('ocr_started_at')}")
                print(f"OCR完成时间: {record.get('ocr_completed_at')}")
                print(f"LLM开始时间: {record.get('llm_started_at')}")
                print(f"LLM完成时间: {record.get('llm_completed_at')}")
                
                if record.get('ocr_error'):
                    print(f"OCR错误: {record.get('ocr_error')}")
                if record.get('llm_error'):
                    print(f"LLM错误: {record.get('llm_error')}")
                
                # 检查对应的resume_profiles记录
                file_id = record.get('id')
                profile_result = db.client.table("resume_profiles").select("*").eq("file_id", file_id).execute()
                
                if profile_result.data:
                    profile = profile_result.data[0]
                    print(f"关联档案ID: {profile.get('id')}")
                    print(f"姓名: {profile.get('full_name')}")
                    print(f"邮箱: {profile.get('email')}")
                    print(f"电话: {profile.get('phone')}")
                    print(f"位置: {profile.get('location')}")
                    print(f"职位意向: {profile.get('headline')}")
                    print(f"工作年限: {profile.get('years_experience')}")
                    print(f"技能摘要: {profile.get('summary')}")
                    print(f"档案创建时间: {profile.get('created_at')}")
                else:
                    print("❌ 没有找到对应的resume_profiles记录")
                
        except Exception as e:
            print(f"❌ 查询resume_files失败: {e}")
            return
        
        # 统计不同状态的记录数量
        print("\n3. 统计不同状态的记录数量...")
        try:
            # OCR状态统计
            ocr_stats = {}
            for status in ['pending', 'processing', 'completed', 'failed']:
                count_result = db.client.table("resume_files").select("id", count="exact").eq("ocr_status", status).execute()
                ocr_stats[status] = count_result.count
            
            print("OCR状态统计:")
            for status, count in ocr_stats.items():
                print(f"  {status}: {count}")
            
            # LLM状态统计
            llm_stats = {}
            for status in ['pending', 'processing', 'completed', 'failed']:
                count_result = db.client.table("resume_files").select("id", count="exact").eq("llm_status", status).execute()
                llm_stats[status] = count_result.count
            
            print("LLM状态统计:")
            for status, count in llm_stats.items():
                print(f"  {status}: {count}")
            
            # 查看completed状态的记录
            print("\n4. 查看所有completed状态的记录...")
            completed_result = db.client.table("resume_files").select("*").eq("ocr_status", "completed").eq("llm_status", "completed").order("created_at", desc=True).execute()
            
            if completed_result.data:
                print(f"✅ 找到 {len(completed_result.data)} 条完成的记录")
                for record in completed_result.data:
                    print(f"  - {record.get('file_name')} (ID: {record.get('id')}) - {record.get('created_at')}")
            else:
                print("❌ 没有找到completed状态的记录")
                
        except Exception as e:
            print(f"❌ 统计失败: {e}")
        
        # 检查最近的文件路径
        print("\n5. 检查最近的文件路径...")
        try:
            recent_files = db.client.table("resume_files").select("file_name, storage_path, created_at").order("created_at", desc=True).limit(5).execute()
            
            if recent_files.data:
                print("最近的文件:")
                for record in recent_files.data:
                    file_path = Path(record.get('storage_path', ''))
                    exists = file_path.exists() if file_path else False
                    print(f"  - {record.get('file_name')} ({record.get('created_at')})")
                    print(f"    路径: {record.get('storage_path')}")
                    print(f"    文件存在: {'✅' if exists else '❌'}")
                    
        except Exception as e:
            print(f"❌ 检查文件路径失败: {e}")
            
    except Exception as e:
        print(f"❌ 检查数据库记录失败: {e}")

if __name__ == "__main__":
    check_database_records()