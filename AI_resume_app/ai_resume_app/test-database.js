const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? '已设置' : '未设置');
console.log('Supabase Key:', supabaseKey ? '已设置' : '未设置');

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase环境变量未正确配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    console.log('\n=== 测试数据库连接 ===');
    
    // 测试连接
    const { data: tables, error: tableError } = await supabase
      .from('resume')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error('数据库连接错误:', tableError);
      return;
    }
    
    console.log('数据库连接成功！');
    
    // 查询所有简历数据
    const { data: resumes, error: resumeError } = await supabase
      .from('resume')
      .select('*');
      
    if (resumeError) {
      console.error('查询简历数据错误:', resumeError);
      return;
    }
    
    console.log('\n=== 简历数据统计 ===');
    console.log('总数量:', resumes?.length || 0);
    
    if (resumes && resumes.length > 0) {
      console.log('\n=== 前5条数据示例 ===');
      resumes.slice(0, 5).forEach((resume, index) => {
        console.log(`${index + 1}. ID: ${resume.id}, 文件ID: ${resume.file_id}, 姓名: ${resume.name || 'N/A'}`);
      });
    } else {
      console.log('resume表中没有数据');
    }
    
    // 查询文件表
    const { data: files, error: fileError } = await supabase
      .from('files')
      .select('*');
      
    if (fileError) {
      console.error('查询文件数据错误:', fileError);
    } else {
      console.log('\n=== 文件数据统计 ===');
      console.log('文件总数量:', files?.length || 0);
      
      if (files && files.length > 0) {
        console.log('处理状态统计:');
        const statusCount = files.reduce((acc, file) => {
          acc[file.status] = (acc[file.status] || 0) + 1;
          return acc;
        }, {});
        console.log(statusCount);
      }
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testDatabase();