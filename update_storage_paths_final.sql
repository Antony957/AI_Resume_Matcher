-- 更新files表中storage_path字段，将processing替换为completed
-- 注意：PostgreSQL中需要使用REPLACE函数来处理Windows路径

-- 查看当前需要更新的记录数量
SELECT COUNT(*) as total_records
FROM files 
WHERE storage_path LIKE '%processing%';

-- 执行更新：将 processing 替换为 completed
UPDATE files 
SET storage_path = REPLACE(storage_path, 'processing', 'completed')
WHERE storage_path LIKE '%processing%';

-- 验证更新结果 - 查看更新后的记录
SELECT COUNT(*) as updated_records
FROM files 
WHERE storage_path LIKE '%completed%';

-- 显示前5条更新后的记录
SELECT id, file_name, storage_path 
FROM files 
WHERE storage_path LIKE '%completed%'
ORDER BY updated_at DESC
LIMIT 5;