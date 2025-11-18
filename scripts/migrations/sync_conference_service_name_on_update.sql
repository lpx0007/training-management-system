-- =====================================================
-- 同步会务客服姓名变更到培训记录
-- =====================================================
-- 功能：当用户姓名修改时，自动更新培训表中的冗余姓名字段
-- 创建日期：2025-11-16
-- 版本：v1.0
-- =====================================================

-- 1. 创建触发器函数：同步会务客服姓名
CREATE OR REPLACE FUNCTION sync_conference_service_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查姓名是否发生变化
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    -- 更新所有相关培训的会务客服姓名
    UPDATE training_sessions
    SET conference_service_name = NEW.name,
        updated_at = NOW()
    WHERE conference_service_id = NEW.id;
    
    -- 记录日志
    RAISE NOTICE '已同步用户 % 的姓名变更: % -> %, 影响 % 条培训记录', 
      NEW.id, 
      OLD.name, 
      NEW.name,
      (SELECT COUNT(*) FROM training_sessions WHERE conference_service_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 添加注释
COMMENT ON FUNCTION sync_conference_service_name() IS '自动同步会务客服姓名变更到培训表';

-- 3. 创建触发器
DROP TRIGGER IF EXISTS sync_conference_service_name_trigger ON user_profiles;

CREATE TRIGGER sync_conference_service_name_trigger
  AFTER UPDATE OF name ON user_profiles
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name)
  EXECUTE FUNCTION sync_conference_service_name();

-- 4. 添加触发器注释
COMMENT ON TRIGGER sync_conference_service_name_trigger ON user_profiles IS '当用户姓名修改时，同步更新培训表中的会务客服姓名';

-- =====================================================
-- 同步负责人姓名变更到培训记录
-- =====================================================

-- 5. 创建触发器函数：同步负责人姓名
CREATE OR REPLACE FUNCTION sync_salesperson_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查姓名是否发生变化
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    -- 更新所有相关培训的负责人姓名
    UPDATE training_sessions
    SET salesperson_name = NEW.name,
        updated_at = NOW()
    WHERE salesperson_id = NEW.id;
    
    -- 记录日志
    RAISE NOTICE '已同步用户 % 的姓名变更: % -> %, 影响 % 条培训记录', 
      NEW.id, 
      OLD.name, 
      NEW.name,
      (SELECT COUNT(*) FROM training_sessions WHERE salesperson_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 添加注释
COMMENT ON FUNCTION sync_salesperson_name() IS '自动同步负责人姓名变更到培训表';

-- 7. 创建触发器
DROP TRIGGER IF EXISTS sync_salesperson_name_trigger ON user_profiles;

CREATE TRIGGER sync_salesperson_name_trigger
  AFTER UPDATE OF name ON user_profiles
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name)
  EXECUTE FUNCTION sync_salesperson_name();

-- 8. 添加触发器注释
COMMENT ON TRIGGER sync_salesperson_name_trigger ON user_profiles IS '当用户姓名修改时，同步更新培训表中的负责人姓名';

-- =====================================================
-- 同步专家姓名变更到培训记录
-- =====================================================

-- 9. 创建触发器函数：同步专家姓名
CREATE OR REPLACE FUNCTION sync_expert_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 检查姓名是否发生变化
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    -- 更新所有相关培训的专家姓名
    UPDATE training_sessions
    SET expert_name = NEW.name,
        updated_at = NOW()
    WHERE expert_id = NEW.id;
    
    -- 记录日志
    RAISE NOTICE '已同步专家 % 的姓名变更: % -> %, 影响 % 条培训记录', 
      NEW.id, 
      OLD.name, 
      NEW.name,
      (SELECT COUNT(*) FROM training_sessions WHERE expert_id = NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. 添加注释
COMMENT ON FUNCTION sync_expert_name() IS '自动同步专家姓名变更到培训表';

-- 11. 创建触发器（注意：expert_id 在 experts 表中，不是 user_profiles）
-- 如果专家信息在 experts 表，需要在 experts 表上创建触发器
-- 这里假设 experts 表也有 name 字段

DROP TRIGGER IF EXISTS sync_expert_name_trigger ON experts;

CREATE TRIGGER sync_expert_name_trigger
  AFTER UPDATE OF name ON experts
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name)
  EXECUTE FUNCTION sync_expert_name();

-- 12. 添加触发器注释
COMMENT ON TRIGGER sync_expert_name_trigger ON experts IS '当专家姓名修改时，同步更新培训表中的专家姓名';

-- =====================================================
-- 手动修复现有数据（一次性执行）
-- =====================================================

-- 13. 修复会务客服姓名
UPDATE training_sessions ts
SET conference_service_name = up.name,
    updated_at = NOW()
FROM user_profiles up
WHERE ts.conference_service_id = up.id
  AND ts.conference_service_name IS DISTINCT FROM up.name
  AND ts.conference_service_id IS NOT NULL;

-- 14. 修复负责人姓名
UPDATE training_sessions ts
SET salesperson_name = up.name,
    updated_at = NOW()
FROM user_profiles up
WHERE ts.salesperson_id = up.id
  AND ts.salesperson_name IS DISTINCT FROM up.name
  AND ts.salesperson_id IS NOT NULL;

-- 15. 修复专家姓名
UPDATE training_sessions ts
SET expert_name = e.name,
    updated_at = NOW()
FROM experts e
WHERE ts.expert_id = e.id
  AND ts.expert_name IS DISTINCT FROM e.name
  AND ts.expert_id IS NOT NULL;

-- 16. 显示修复结果
DO $$
DECLARE
  conference_count INTEGER;
  salesperson_count INTEGER;
  expert_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conference_count
  FROM training_sessions ts
  INNER JOIN user_profiles up ON ts.conference_service_id = up.id
  WHERE ts.conference_service_name = up.name;
  
  SELECT COUNT(*) INTO salesperson_count
  FROM training_sessions ts
  INNER JOIN user_profiles up ON ts.salesperson_id = up.id
  WHERE ts.salesperson_name = up.name;
  
  SELECT COUNT(*) INTO expert_count
  FROM training_sessions ts
  INNER JOIN experts e ON ts.expert_id = e.id
  WHERE ts.expert_name = e.name;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '数据修复完成统计:';
  RAISE NOTICE '会务客服姓名已同步: % 条记录', conference_count;
  RAISE NOTICE '负责人姓名已同步: % 条记录', salesperson_count;
  RAISE NOTICE '专家姓名已同步: % 条记录', expert_count;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 验证触发器
-- =====================================================

-- 查看已创建的触发器
SELECT 
  trigger_name,
  event_object_table,
  action_statement,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%sync%name%'
ORDER BY event_object_table, trigger_name;
