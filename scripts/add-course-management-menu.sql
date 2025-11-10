-- 添加课程管理功能面板到数据库
-- 执行时间: 2025-11-08

-- 1. 添加课程管理菜单功能
INSERT INTO menu_features (id, name, path, icon, description, display_order)
VALUES (
  'course_management',
  '课程管理',
  '/course-management',
  'calendar',
  '管理培训课程信息',
  4
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- 2. 为管理员添加课程管理菜单权限（如果还没有的话）
INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
SELECT 
  up.id as user_id,
  'course_management' as menu_feature_id,
  true as enabled
FROM user_profiles up
WHERE up.role = 'admin'
AND NOT EXISTS (
  SELECT 1 FROM user_menu_access uma
  WHERE uma.user_id = up.id 
  AND uma.menu_feature_id = 'course_management'
)
ON CONFLICT (user_id, menu_feature_id) DO NOTHING;

-- 3. 为业务员添加课程管理菜单权限
INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
SELECT 
  up.id as user_id,
  'course_management' as menu_feature_id,
  true as enabled
FROM user_profiles up
WHERE up.role = 'salesperson'
AND NOT EXISTS (
  SELECT 1 FROM user_menu_access uma
  WHERE uma.user_id = up.id 
  AND uma.menu_feature_id = 'course_management'
)
ON CONFLICT (user_id, menu_feature_id) DO NOTHING;

-- 4. 为经理添加课程管理菜单权限
INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
SELECT 
  up.id as user_id,
  'course_management' as menu_feature_id,
  true as enabled
FROM user_profiles up
WHERE up.role = 'manager'
AND NOT EXISTS (
  SELECT 1 FROM user_menu_access uma
  WHERE uma.user_id = up.id 
  AND uma.menu_feature_id = 'course_management'
)
ON CONFLICT (user_id, menu_feature_id) DO NOTHING;

-- 5. 更新自动权限分配触发器，包含课程管理菜单
-- 注意：如果trigger已存在，需要先删除再重建
DROP TRIGGER IF EXISTS auto_assign_permissions_trigger ON user_profiles;

CREATE OR REPLACE FUNCTION auto_assign_default_permissions()
RETURNS TRIGGER AS $$
BEGIN
  -- 只为新创建的非管理员用户分配权限
  IF NEW.role != 'admin' THEN
    -- 业务员权限
    IF NEW.role = 'salesperson' THEN
      -- 分配功能权限
      INSERT INTO user_permissions (user_id, permission_id)
      SELECT NEW.id, p.id
      FROM permissions p
      WHERE p.code IN (
        'customer_view', 'customer_add', 'customer_edit', 'customer_import', 'customer_export',
        'training_view', 'training_add_participant',
        'expert_view',
        'prospectus_view', 'prospectus_download',
        'data_download_template'
      )
      ON CONFLICT (user_id, permission_id) DO NOTHING;
      
      -- 分配功能面板
      INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
      VALUES 
        (NEW.id, 'dashboard', true),
        (NEW.id, 'customer_management', true),
        (NEW.id, 'training_management', true),
        (NEW.id, 'course_management', true),
        (NEW.id, 'expert_management', true),
        (NEW.id, 'prospectus_management', true),
        (NEW.id, 'data_management', true),
        (NEW.id, 'profile_settings', true)
      ON CONFLICT (user_id, menu_feature_id) DO NOTHING;
      
    -- 专家权限
    ELSIF NEW.role = 'expert' THEN
      -- 分配功能权限
      INSERT INTO user_permissions (user_id, permission_id)
      SELECT NEW.id, p.id
      FROM permissions p
      WHERE p.code IN (
        'training_view',
        'expert_view',
        'prospectus_view'
      )
      ON CONFLICT (user_id, permission_id) DO NOTHING;
      
      -- 分配功能面板
      INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
      VALUES 
        (NEW.id, 'dashboard', true),
        (NEW.id, 'training_management', true),
        (NEW.id, 'expert_management', true),
        (NEW.id, 'prospectus_management', true),
        (NEW.id, 'profile_settings', true)
      ON CONFLICT (user_id, menu_feature_id) DO NOTHING;
      
    -- 经理权限
    ELSIF NEW.role = 'manager' THEN
      -- 分配功能权限
      INSERT INTO user_permissions (user_id, permission_id)
      SELECT NEW.id, p.id
      FROM permissions p
      WHERE p.code IN (
        'customer_view', 'customer_add', 'customer_edit', 'customer_import', 'customer_export', 'customer_view_all',
        'training_view', 'training_add_participant',
        'expert_view',
        'salesperson_view', 'salesperson_view_performance',
        'data_download_template'
      )
      ON CONFLICT (user_id, permission_id) DO NOTHING;
      
      -- 分配功能面板
      INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
      VALUES 
        (NEW.id, 'dashboard', true),
        (NEW.id, 'customer_management', true),
        (NEW.id, 'training_management', true),
        (NEW.id, 'course_management', true),
        (NEW.id, 'salesperson_management', true),
        (NEW.id, 'data_management', true),
        (NEW.id, 'sales_tracking', true),
        (NEW.id, 'profile_settings', true)
      ON CONFLICT (user_id, menu_feature_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 重新创建触发器
CREATE TRIGGER auto_assign_permissions_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_default_permissions();

-- 6. 验证安装
SELECT 
  'menu_feature' as type,
  id,
  name,
  path
FROM menu_features
WHERE id = 'course_management';

SELECT 
  'user_count' as type,
  role,
  COUNT(*) as user_count_with_access
FROM user_profiles up
INNER JOIN user_menu_access uma ON up.id = uma.user_id
WHERE uma.menu_feature_id = 'course_management'
  AND uma.enabled = true
GROUP BY role;
