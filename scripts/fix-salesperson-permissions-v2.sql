-- 修复业务员权限脚本 V2
-- 确保所有业务员都有正确的默认权限和功能面板访问权限

BEGIN;

-- 1. 为所有业务员添加基础权限（如果不存在）
INSERT INTO user_permissions (user_id, permission_id)
SELECT 
  up.id,
  perm.permission_id
FROM user_profiles up
CROSS JOIN (
  VALUES 
    ('customer_view'),
    ('customer_add'),
    ('customer_edit'),
    ('training_view'),
    ('training_add_participant'),
    ('expert_view'),
    ('prospectus_view'),
    ('prospectus_download')
) AS perm(permission_id)
WHERE up.role = 'salesperson'
ON CONFLICT (user_id, permission_id) DO NOTHING;

-- 2. 为所有业务员添加功能面板访问权限（如果不存在）
INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
SELECT 
  up.id,
  feat.feature_id,
  true
FROM user_profiles up
CROSS JOIN (
  VALUES 
    ('dashboard'),
    ('customer_management'),
    ('training_management'),
    ('expert_management'),
    ('prospectus_management'),
    ('profile_settings')
) AS feat(feature_id)
WHERE up.role = 'salesperson'
ON CONFLICT (user_id, menu_feature_id) 
DO UPDATE SET enabled = true;

-- 3. 验证结果
SELECT 
  up.name,
  up.role,
  COUNT(DISTINCT uperm.permission_id) as permission_count,
  COUNT(DISTINCT uma.menu_feature_id) as menu_count
FROM user_profiles up
LEFT JOIN user_permissions uperm ON up.id = uperm.user_id
LEFT JOIN user_menu_access uma ON up.id = uma.user_id AND uma.enabled = true
WHERE up.role = 'salesperson'
GROUP BY up.id, up.name, up.role;

COMMIT;
