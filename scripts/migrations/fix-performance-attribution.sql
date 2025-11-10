-- ====================================
-- 修复业绩归属逻辑
-- 日期：2025-11-09
-- 目的：将业绩归属到客户的业务员，而不是操作人
-- 影响：training_participants 表
-- ====================================

-- ⚠️ 警告：执行前请先备份数据库！
-- ⚠️ 此脚本会修改历史数据，可能影响已发放的提成

-- ====================================
-- 步骤1：检查需要修复的记录数量
-- ====================================

SELECT 
  COUNT(*) AS need_fix_count,
  COUNT(DISTINCT tp.salesperson_name) AS affected_salespeople
FROM training_participants tp
INNER JOIN customers c ON tp.customer_id = c.id
WHERE c.salesperson_name IS NOT NULL
  AND c.salesperson_name != ''
  AND tp.salesperson_name != c.salesperson_name;

-- 预期输出：
-- need_fix_count: 需要修复的记录数
-- affected_salespeople: 受影响的业务员数量

-- ====================================
-- 步骤2：查看需要修复的具体记录
-- ====================================

SELECT 
  tp.id AS participant_id,
  tp.name AS participant_name,
  c.name AS customer_name,
  c.company AS customer_company,
  tp.salesperson_name AS current_salesperson,
  c.salesperson_name AS correct_salesperson,
  ts.name AS training_name,
  ts.date AS training_date,
  tp.actual_price AS revenue,
  tp.created_at
FROM training_participants tp
INNER JOIN customers c ON tp.customer_id = c.id
INNER JOIN training_sessions ts ON tp.training_session_id = ts.id
WHERE c.salesperson_name IS NOT NULL
  AND c.salesperson_name != ''
  AND tp.salesperson_name != c.salesperson_name
ORDER BY tp.created_at DESC;

-- 输出说明：
-- current_salesperson: 当前错误的归属（操作人）
-- correct_salesperson: 正确的归属（客户的业务员）

-- ====================================
-- 步骤3：按业务员统计影响
-- ====================================

-- 哪些业务员会增加业绩
SELECT 
  c.salesperson_name AS salesperson,
  COUNT(*) AS gain_count,
  SUM(tp.actual_price) AS gain_revenue
FROM training_participants tp
INNER JOIN customers c ON tp.customer_id = c.id
WHERE c.salesperson_name IS NOT NULL
  AND c.salesperson_name != ''
  AND tp.salesperson_name != c.salesperson_name
GROUP BY c.salesperson_name
ORDER BY gain_revenue DESC;

-- 哪些业务员会减少业绩
SELECT 
  tp.salesperson_name AS salesperson,
  COUNT(*) AS loss_count,
  SUM(tp.actual_price) AS loss_revenue
FROM training_participants tp
INNER JOIN customers c ON tp.customer_id = c.id
WHERE c.salesperson_name IS NOT NULL
  AND c.salesperson_name != ''
  AND tp.salesperson_name != c.salesperson_name
GROUP BY tp.salesperson_name
ORDER BY loss_revenue DESC;

-- ====================================
-- 步骤4：执行修复（请谨慎！）
-- ====================================

-- ⚠️ 执行前确认：
-- 1. 已经备份数据库
-- 2. 已经与业务团队确认修复逻辑
-- 3. 已经通知相关业务员即将变更
-- 4. 已经确认不会影响已发放的提成

-- 取消下面的注释以执行修复：
/*
BEGIN;

-- 修复业绩归属
UPDATE training_participants tp
SET salesperson_name = c.salesperson_name
FROM customers c
WHERE tp.customer_id = c.id
  AND c.salesperson_name IS NOT NULL
  AND c.salesperson_name != ''
  AND tp.salesperson_name != c.salesperson_name;

-- 显示修复结果
SELECT 
  'Fixed' AS status,
  COUNT(*) AS fixed_count
FROM training_participants tp
INNER JOIN customers c ON tp.customer_id = c.id
WHERE c.salesperson_name = tp.salesperson_name;

-- 如果一切正常，提交事务
COMMIT;

-- 如果有问题，可以回滚
-- ROLLBACK;
*/

-- ====================================
-- 步骤5：验证修复结果
-- ====================================

-- 检查是否还有错误的归属
SELECT COUNT(*) AS remaining_errors
FROM training_participants tp
INNER JOIN customers c ON tp.customer_id = c.id
WHERE c.salesperson_name IS NOT NULL
  AND c.salesperson_name != ''
  AND tp.salesperson_name != c.salesperson_name;

-- 预期输出：remaining_errors = 0

-- ====================================
-- 步骤6：更新统计数据（可选）
-- ====================================

-- 如果有缓存或统计表，可能需要刷新
-- 例如：
-- REFRESH MATERIALIZED VIEW salesperson_performance_summary;

-- ====================================
-- 执行记录
-- ====================================

-- 执行人：__________
-- 执行时间：__________
-- 备份位置：__________
-- 受影响记录数：__________
-- 验证结果：__________
-- 备注：__________
