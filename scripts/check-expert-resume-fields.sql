-- 检查专家表中的resume字段结构
-- 确认是否有重复的简历相关字段

-- 1. 查看experts表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'experts' 
  AND table_schema = 'public'
  AND column_name LIKE '%resume%'
ORDER BY ordinal_position;

-- 2. 检查是否有多个resume相关字段
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'experts' 
  AND table_schema = 'public'
  AND (column_name LIKE '%resume%' OR column_name LIKE '%cv%' OR column_name LIKE '%简历%')
ORDER BY column_name;

-- 3. 检查experts表中所有字段名
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'experts' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. 检查是否有专家数据包含简历信息
SELECT 
  id,
  name,
  CASE 
    WHEN resume IS NOT NULL AND resume != '' THEN '有简历'
    ELSE '无简历'
  END as resume_status,
  LENGTH(resume) as resume_length
FROM experts 
WHERE resume IS NOT NULL 
LIMIT 10;
