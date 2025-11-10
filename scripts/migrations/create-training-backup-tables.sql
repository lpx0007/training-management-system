-- 创建培训数据备份表
-- 用于方案A：彻底删除时自动备份数据
-- 创建时间：2025-11-09

-- ===== 1. 培训场次备份表 =====
CREATE TABLE IF NOT EXISTS training_sessions_backup (
  -- 备份元数据
  backup_id BIGSERIAL PRIMARY KEY,
  original_id INTEGER NOT NULL,
  deleted_by UUID,
  deleted_by_name TEXT,
  deleted_at TIMESTAMP DEFAULT NOW(),
  delete_reason TEXT,
  can_restore BOOLEAN DEFAULT TRUE,
  
  -- 原始数据（与 training_sessions 表结构相同）
  id INTEGER,
  course_id BIGINT,
  course_name TEXT,
  session_number INTEGER,
  name TEXT,
  date DATE,
  end_date DATE,
  location TEXT,
  area TEXT,
  instructor TEXT,
  expert TEXT,
  salesperson_id UUID,
  salesperson_name TEXT,
  training_mode TEXT,
  online_price NUMERIC(10,2),
  offline_price NUMERIC(10,2),
  participants INTEGER DEFAULT 0,
  capacity INTEGER,
  revenue NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'planned',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_backup_sessions_original_id 
ON training_sessions_backup(original_id);

CREATE INDEX IF NOT EXISTS idx_backup_sessions_deleted_at 
ON training_sessions_backup(deleted_at);

CREATE INDEX IF NOT EXISTS idx_backup_sessions_deleted_by 
ON training_sessions_backup(deleted_by);

CREATE INDEX IF NOT EXISTS idx_backup_sessions_can_restore 
ON training_sessions_backup(can_restore);

-- 添加注释
COMMENT ON TABLE training_sessions_backup IS '培训场次备份表-彻底删除时自动备份数据';
COMMENT ON COLUMN training_sessions_backup.backup_id IS '备份记录的唯一ID（主键）';
COMMENT ON COLUMN training_sessions_backup.original_id IS '原始training_sessions表中的ID';
COMMENT ON COLUMN training_sessions_backup.deleted_by IS '执行删除操作的管理员ID';
COMMENT ON COLUMN training_sessions_backup.deleted_by_name IS '执行删除操作的管理员姓名';
COMMENT ON COLUMN training_sessions_backup.deleted_at IS '删除时间';
COMMENT ON COLUMN training_sessions_backup.delete_reason IS '删除原因说明';
COMMENT ON COLUMN training_sessions_backup.can_restore IS '是否可以恢复-恢复后设为false';

-- ===== 2. 参训记录备份表 =====
CREATE TABLE IF NOT EXISTS training_participants_backup (
  -- 备份元数据
  backup_id BIGSERIAL PRIMARY KEY,
  original_id INTEGER NOT NULL,
  session_backup_id BIGINT,
  deleted_by UUID,
  deleted_by_name TEXT,
  deleted_at TIMESTAMP DEFAULT NOW(),
  
  -- 原始数据（与 training_participants 表结构相同）
  id INTEGER,
  training_session_id INTEGER,
  customer_id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  position TEXT,
  registration_date DATE,
  payment_status TEXT DEFAULT 'pending',
  payment_amount NUMERIC(10,2),
  actual_price NUMERIC(10,2),
  participation_mode TEXT,
  discount_rate NUMERIC(5,2),
  salesperson_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 外键约束
  FOREIGN KEY (session_backup_id) 
    REFERENCES training_sessions_backup(backup_id)
    ON DELETE CASCADE
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_backup_participants_original_id 
ON training_participants_backup(original_id);

CREATE INDEX IF NOT EXISTS idx_backup_participants_session_backup_id 
ON training_participants_backup(session_backup_id);

CREATE INDEX IF NOT EXISTS idx_backup_participants_deleted_at 
ON training_participants_backup(deleted_at);

CREATE INDEX IF NOT EXISTS idx_backup_participants_salesperson 
ON training_participants_backup(salesperson_name);

-- 添加注释
COMMENT ON TABLE training_participants_backup IS '参训记录备份表-级联备份培训的所有参训人';
COMMENT ON COLUMN training_participants_backup.backup_id IS '备份记录的唯一ID（主键）';
COMMENT ON COLUMN training_participants_backup.original_id IS '原始training_participants表中的ID';
COMMENT ON COLUMN training_participants_backup.session_backup_id IS '关联的培训场次备份ID';
COMMENT ON COLUMN training_participants_backup.salesperson_name IS '成交业务员-用于业绩追溯';

-- ===== 3. 创建RLS策略（仅管理员可访问备份表）=====
ALTER TABLE training_sessions_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_participants_backup ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Admin can view backup sessions" ON training_sessions_backup;
DROP POLICY IF EXISTS "Admin can view backup participants" ON training_participants_backup;

-- 只有admin可以查看备份数据
CREATE POLICY "Admin can view backup sessions"
ON training_sessions_backup
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admin can view backup participants"
ON training_participants_backup
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- 只有admin可以插入备份数据
CREATE POLICY "Admin can insert backup sessions"
ON training_sessions_backup
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

CREATE POLICY "Admin can insert backup participants"
ON training_participants_backup
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- ===== 4. 创建恢复统计视图 =====
CREATE OR REPLACE VIEW v_backup_sessions_summary AS
SELECT 
  tsb.backup_id,
  tsb.original_id,
  tsb.name AS session_name,
  tsb.date AS session_date,
  tsb.deleted_at,
  tsb.deleted_by_name,
  tsb.delete_reason,
  tsb.can_restore,
  COUNT(tpb.backup_id) AS participants_count,
  COALESCE(SUM(tpb.payment_amount), 0) AS total_revenue
FROM training_sessions_backup tsb
LEFT JOIN training_participants_backup tpb 
  ON tsb.backup_id = tpb.session_backup_id
GROUP BY 
  tsb.backup_id,
  tsb.original_id,
  tsb.name,
  tsb.date,
  tsb.deleted_at,
  tsb.deleted_by_name,
  tsb.delete_reason,
  tsb.can_restore
ORDER BY tsb.deleted_at DESC;

COMMENT ON VIEW v_backup_sessions_summary IS '备份培训汇总视图-便于管理员查看可恢复的备份';

-- ===== 验证 =====
-- 检查表是否创建成功
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_name IN ('training_sessions_backup', 'training_participants_backup')
  AND table_schema = 'public';

-- 检查索引
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('training_sessions_backup', 'training_participants_backup')
ORDER BY tablename, indexname;

-- 使用说明
/*
===== 备份操作流程 =====

1. 备份培训场次：
INSERT INTO training_sessions_backup 
  (original_id, deleted_by, deleted_by_name, delete_reason, id, name, date, ...)
SELECT 
  id AS original_id,
  '{user_id}' AS deleted_by,
  '{user_name}' AS deleted_by_name,
  '{reason}' AS delete_reason,
  id, name, date, ...
FROM training_sessions
WHERE id = {session_id}
RETURNING backup_id;

2. 备份参训记录：
INSERT INTO training_participants_backup 
  (original_id, session_backup_id, deleted_by, id, name, ...)
SELECT 
  id AS original_id,
  {session_backup_id} AS session_backup_id,
  '{user_id}' AS deleted_by,
  id, name, ...
FROM training_participants
WHERE training_session_id = {session_id};

3. 删除原始数据：
DELETE FROM training_participants WHERE training_session_id = {session_id};
DELETE FROM training_sessions WHERE id = {session_id};

===== 恢复操作流程 =====

1. 恢复培训场次：
INSERT INTO training_sessions (id, name, date, ...)
SELECT id, name, date, ...
FROM training_sessions_backup
WHERE backup_id = {backup_id};

2. 恢复参训记录：
INSERT INTO training_participants (id, name, ...)
SELECT id, name, ...
FROM training_participants_backup
WHERE session_backup_id = {backup_id};

3. 标记已恢复：
UPDATE training_sessions_backup 
SET can_restore = FALSE 
WHERE backup_id = {backup_id};

===== 查询备份 =====

-- 查看所有可恢复的备份
SELECT * FROM v_backup_sessions_summary 
WHERE can_restore = TRUE;

-- 查看特定培训的备份
SELECT * FROM training_sessions_backup 
WHERE original_id = {session_id};
*/
