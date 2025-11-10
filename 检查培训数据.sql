-- 检查培训数据完整性

-- 1. 查看11月的所有培训（按开始日期）
SELECT 
  id,
  name,
  date AS start_date,
  end_date,
  area,
  created_at
FROM training_sessions
WHERE date >= '2025-11-01' 
  AND date <= '2025-11-30'
ORDER BY date DESC;

-- 2. 查看培训计划中的所有培训（最近30条）
SELECT 
  id,
  name,
  date AS start_date,
  end_date,
  area,
  created_at
FROM training_sessions
ORDER BY created_at DESC
LIMIT 30;

-- 3. 检查日期字段类型和格式
SELECT 
  id,
  name,
  date,
  typeof(date) AS date_type,
  LENGTH(date) AS date_length
FROM training_sessions
ORDER BY created_at DESC
LIMIT 10;

-- 4. 查看11月有报名记录的所有培训
SELECT DISTINCT
  ts.id,
  ts.name,
  ts.date AS start_date,
  COUNT(tp.id) AS registration_count
FROM training_sessions ts
LEFT JOIN training_participants tp ON ts.id = tp.training_session_id
WHERE tp.registration_date >= '2025-11-01' 
  AND tp.registration_date <= '2025-11-30'
GROUP BY ts.id, ts.name, ts.date
ORDER BY ts.date DESC;

-- 5. 统计：培训日期在11月 vs 报名日期在11月
SELECT 
  'Training in Nov' AS category,
  COUNT(*) AS count
FROM training_sessions
WHERE date >= '2025-11-01' AND date <= '2025-11-30'
UNION ALL
SELECT 
  'Registration in Nov' AS category,
  COUNT(DISTINCT training_session_id) AS count
FROM training_participants
WHERE registration_date >= '2025-11-01' AND registration_date <= '2025-11-30';
