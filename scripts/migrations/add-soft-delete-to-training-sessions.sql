-- 为 training_sessions 表添加软删除字段
-- 用于方案B：软删除（逻辑删除）
-- 创建时间：2025-11-09

-- 添加软删除相关字段
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS deleted_by UUID NULL;

ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS deleted_by_name TEXT NULL;

ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS delete_reason TEXT NULL;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_training_sessions_deleted_at 
ON training_sessions(deleted_at);

-- 添加注释
COMMENT ON COLUMN training_sessions.deleted_at IS '软删除时间-NULL表示未删除，有值表示已删除';
COMMENT ON COLUMN training_sessions.deleted_by IS '删除操作人的用户ID';
COMMENT ON COLUMN training_sessions.deleted_by_name IS '删除操作人的姓名（冗余字段，便于显示）';
COMMENT ON COLUMN training_sessions.delete_reason IS '删除原因说明';

-- 验证字段已添加
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'training_sessions' 
  AND column_name IN ('deleted_at', 'deleted_by', 'deleted_by_name', 'delete_reason')
ORDER BY ordinal_position;

-- 使用说明
/*
软删除操作：
UPDATE training_sessions 
SET deleted_at = NOW(),
    deleted_by = '{user_id}',
    deleted_by_name = '{user_name}',
    delete_reason = '{reason}'
WHERE id = {session_id};

恢复操作：
UPDATE training_sessions 
SET deleted_at = NULL,
    deleted_by = NULL,
    deleted_by_name = NULL,
    delete_reason = NULL
WHERE id = {session_id};

查询未删除的培训：
SELECT * FROM training_sessions 
WHERE deleted_at IS NULL;

查询已删除的培训（管理员）：
SELECT * FROM training_sessions 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
*/
