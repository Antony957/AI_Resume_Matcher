-- 更新files表中storage_path字段，将processing替换为completed
-- 适用于Windows路径格式：D:\...\processing\...

-- 查看当前需要更新的记录
SELECT id, file_name, storage_path 
FROM files 
WHERE storage_path LIKE '%\\processing\\%';

-- 执行更新：将 \processing\ 替换为 \completed\
UPDATE files 
SET storage_path = REPLACE(storage_path, '\\processing\\', '\\completed\\')
WHERE storage_path LIKE '%\\processing\\%';

-- 验证更新结果
SELECT id, file_name, storage_path 
FROM files 
WHERE storage_path LIKE '%\\completed\\%'
ORDER BY updated_at DESC;