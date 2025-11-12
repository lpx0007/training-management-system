-- =================================================================
-- 权限系统诊断与修复脚本
-- 功能：
-- 1. 诊断权限配置不一致的问题
-- 2. 修复默认角色权限与数据库不同步的问题
-- 3. 清理无效权限数据
-- =================================================================

-- 1. 查看所有部门经理的菜单权限状态
SELECT 
  '部门经理菜单权限检查' as check_type,
  up.id,
  up.name,
  up.role,
  ARRAY_AGG(uma.menu_feature_id ORDER BY uma.menu_feature_id) as menu_features
FROM user_profiles up
LEFT JOIN user_menu_access uma ON up.id = uma.user_id
WHERE up.role = 'manager'
GROUP BY up.id, up.name, up.role;

-- 2. 查看部门经理的操作权限状态
SELECT 
  '部门经理操作权限检查' as check_type,
  up.id,
  up.name,
  COUNT(CASE WHEN uper.permission_id = 'prospectus_view' THEN 1 END) as has_prospectus_view,
  COUNT(CASE WHEN uper.permission_id = 'prospectus_download' THEN 1 END) as has_prospectus_download
FROM user_profiles up
LEFT JOIN user_permissions uper ON up.id = uper.user_id
WHERE up.role = 'manager'
GROUP BY up.id, up.name;

-- 3. 修复部门经理的菜单权限（移除course_management，添加sales_tracking和prospectus_management）
DO $$
DECLARE
  manager_record RECORD;
BEGIN
  FOR manager_record IN 
    SELECT id, name FROM user_profiles WHERE role = 'manager'
  LOOP
    -- 删除不应该有的权限
    DELETE FROM user_menu_access 
    WHERE user_id = manager_record.id 
    AND menu_feature_id IN ('course_management');
    
    -- 添加应该有的权限（如果不存在）
    INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
    VALUES 
      (manager_record.id, 'sales_tracking', true),
      (manager_record.id, 'prospectus_management', true)
    ON CONFLICT (user_id, menu_feature_id) 
    DO UPDATE SET enabled = true;
    
    RAISE NOTICE '已修复部门经理 % 的菜单权限', manager_record.name;
  END LOOP;
END $$;

-- 4. 修复部门经理的操作权限
DO $$
DECLARE
  manager_record RECORD;
BEGIN
  FOR manager_record IN 
    SELECT id, name FROM user_profiles WHERE role = 'manager'
  LOOP
    -- 添加招商简章查看和下载权限（如果不存在）
    INSERT INTO user_permissions (user_id, permission_id)
    VALUES 
      (manager_record.id, 'prospectus_view'),
      (manager_record.id, 'prospectus_download')
    ON CONFLICT (user_id, permission_id) 
    DO NOTHING;
    
    RAISE NOTICE '已修复部门经理 % 的操作权限', manager_record.name;
  END LOOP;
END $$;

-- 5. 清理无效的菜单权限（删除不存在的功能面板引用）
DELETE FROM user_menu_access 
WHERE menu_feature_id NOT IN (
  'dashboard',
  'customer_management',
  'training_management',
  'course_management',
  'expert_management',
  'salesperson_management',
  'sales_tracking',
  'prospectus_management',
  'permission_management',
  'profile_settings'
);

-- 6. 确保管理员拥有所有菜单权限
DO $$
DECLARE
  admin_record RECORD;
  feature_id TEXT;
BEGIN
  FOR admin_record IN 
    SELECT id, name FROM user_profiles WHERE role = 'admin'
  LOOP
    -- 添加所有功能面板权限
    FOREACH feature_id IN ARRAY ARRAY[
      'dashboard',
      'customer_management', 
      'training_management',
      'course_management',
      'expert_management',
      'salesperson_management',
      'sales_tracking',
      'prospectus_management',
      'permission_management',
      'profile_settings'
    ]
    LOOP
      INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
      VALUES (admin_record.id, feature_id, true)
      ON CONFLICT (user_id, menu_feature_id) 
      DO UPDATE SET enabled = true;
    END LOOP;
    
    RAISE NOTICE '已确保管理员 % 拥有所有菜单权限', admin_record.name;
  END LOOP;
END $$;

-- 7. 最终验证：显示修复后的权限状态
SELECT 
  '修复后的权限状态汇总' as report_type,
  up.role,
  COUNT(DISTINCT up.id) as user_count,
  ARRAY_AGG(DISTINCT uma.menu_feature_id ORDER BY uma.menu_feature_id) as menu_features
FROM user_profiles up
LEFT JOIN user_menu_access uma ON up.id = uma.user_id
WHERE up.role IN ('admin', 'manager', 'salesperson')
GROUP BY up.role
ORDER BY up.role;

-- 8. 创建权限一致性检查函数
CREATE OR REPLACE FUNCTION check_permission_consistency()
RETURNS TABLE (
  user_id UUID,
  user_name VARCHAR,
  user_role VARCHAR,
  issue_type TEXT,
  details TEXT
) AS $$
BEGIN
  -- 检查部门经理不应有的权限
  RETURN QUERY
  SELECT 
    up.id,
    up.name::VARCHAR,
    up.role::VARCHAR,
    '无效菜单权限'::TEXT,
    ('拥有不应该有的菜单: ' || uma.menu_feature_id)::TEXT
  FROM user_profiles up
  JOIN user_menu_access uma ON up.id = uma.user_id
  WHERE up.role = 'manager' 
  AND uma.menu_feature_id = 'course_management';
  
  -- 检查部门经理缺少的必要权限
  RETURN QUERY
  SELECT 
    up.id,
    up.name::VARCHAR,
    up.role::VARCHAR,
    '缺少必要权限'::TEXT,
    '缺少招商简章查看权限'::TEXT
  FROM user_profiles up
  WHERE up.role = 'manager'
  AND NOT EXISTS (
    SELECT 1 FROM user_permissions uper 
    WHERE uper.user_id = up.id 
    AND uper.permission_id = 'prospectus_view'
  );
  
  RETURN QUERY
  SELECT 
    up.id,
    up.name::VARCHAR,
    up.role::VARCHAR,
    '缺少必要菜单'::TEXT,
    '缺少销售追踪菜单'::TEXT
  FROM user_profiles up
  WHERE up.role = 'manager'
  AND NOT EXISTS (
    SELECT 1 FROM user_menu_access uma 
    WHERE uma.user_id = up.id 
    AND uma.menu_feature_id = 'sales_tracking'
  );
END;
$$ LANGUAGE plpgsql;

-- 执行权限一致性检查
SELECT * FROM check_permission_consistency();

-- 提示信息
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE '权限系统诊断与修复完成！';
  RAISE NOTICE '请通知所有受影响的用户重新登录';
  RAISE NOTICE '====================================';
END $$;
