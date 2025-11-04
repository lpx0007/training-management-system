-- 权限系统诊断脚本
-- 用于检查权限数据是否正确保存

-- 1. 检查所有用户的权限数量
SELECT 
  up.id,
  up.name,
  up.role,
  COUNT(DISTINCT uperm.permission_id) as permission_count,
  COUNT(DISTINCT uma.menu_feature_id) as menu_access_count
FROM user_profiles up
LEFT JOIN user_permissions uperm ON up.id = uperm.user_id
LEFT JOIN user_menu_access uma ON up.id = uma.user_id AND uma.enabled = true
GROUP BY up.id, up.name, up.role
ORDER BY up.role, up.name;

-- 2. 检查业务员角色的权限详情
SELECT 
  up.name as user_name,
  uperm.permission_id,
  p.name as permission_name
FROM user_profiles up
LEFT JOIN user_permissions uperm ON up.id = uperm.user_id
LEFT JOIN permissions p ON uperm.permission_id = p.id
WHERE up.role = 'salesperson'
ORDER BY up.name, uperm.permission_id;

-- 3. 检查业务员角色的功能面板访问权限
SELECT 
  up.name as user_name,
  uma.menu_feature_id,
  mf.name as feature_name,
  uma.enabled
FROM user_profiles up
LEFT JOIN user_menu_access uma ON up.id = uma.user_id
LEFT JOIN menu_features mf ON uma.menu_feature_id = mf.id
WHERE up.role = 'salesperson'
ORDER BY up.name, uma.menu_feature_id;

-- 4. 检查权限表中是否有所有必需的权限
SELECT id, name, category, description
FROM permissions
WHERE id IN (
  'customer_view',
  'customer_add',
  'customer_edit',
  'training_view',
  'training_add_participant',
  'expert_view',
  'prospectus_view',
  'prospectus_download'
)
ORDER BY category, id;

-- 5. 检查功能面板表中是否有所有必需的功能面板
SELECT id, name, path, required_permissions
FROM menu_features
WHERE id IN (
  'dashboard',
  'customer_management',
  'training_management',
  'expert_management',
  'prospectus_management',
  'profile_settings'
)
ORDER BY display_order;
