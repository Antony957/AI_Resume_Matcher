-- 更新files表中storage_path字段，将processing替换为completed
-- 执行前请备份数据库

UPDATE files 
SET storage_path = REPLACE(storage_path, '\processing\', '\completed\')
WHERE storage_path LIKE '%\processing\%';

-- 同时更新包含正斜杠的路径（兼容不同操作系统）
UPDATE files 
SET storage_path = REPLACE(storage_path, '/processing/', '/completed/')
WHERE storage_path LIKE '%/processing/%';

-- 查看更新结果
SELECT id, file_name, storage_path 
FROM files 
WHERE storage_path LIKE '%completed%'
ORDER BY updated_at DESC
LIMIT 10;