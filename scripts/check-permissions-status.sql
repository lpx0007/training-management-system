-- ============================================
-- 检查权限系统状态
-- ============================================
-- 此脚本用于检查权限系统的当前状态

-- 1. 检查功能面板表是否存在
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'menu_features') 
    THEN '✓ menu_features 表已创建'
    ELSE '✗ menu_features 表不存在'
  END as status;

-- 2. 检查用户功能面板访问表是否存在
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_menu_access') 
    THEN '✓ user_menu_access 表已创建'
    ELSE '✗ user_menu_access 表不存在'
  END as status;

-- 3. 检查功能面板数量
SELECT 
  COUNT(*) as menu_features_count,
  CASE 
    WHEN COUNT(*) >= 12 THEN '✓ 功能面板数量正常'
    ELSE '✗ 功能面板数量不足'
  END as status
FROM public.menu_features;

-- 4. 检查权限数量
SELECT 
  COUNT(*) as permissions_count,
  CASE 
    WHEN COUNT(*) >= 30 THEN '✓ 权限数量正常'
    ELSE '✗ 权限数量不足'
  END as status
FROM public.permissions;

-- 5. 检查各角色的用户数量
SELECT 
  role,
  COUNT(*) as user_count
FROM public.user_profiles
GROUP BY role
ORDER BY role;

-- 6. 检查各角色的平均权限数量
SELECT 
  up.role,
  COUNT(DISTINCT up.id) as user_count,
  ROUND(AVG(perm_count.cnt), 2) as avg_permissions
FROM public.user_profiles up
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt
  FROM public.user_permissions
  GROUP BY user_id
) perm_count ON up.id = perm_count.user_id
GROUP BY up.role
ORDER BY up.role;

-- 7. 检查各角色的平均功能面板访问数量
SELECT 
  up.role,
  COUNT(DISTINCT up.id) as user_count,
  ROUND(AVG(menu_count.cnt), 2) as avg_menu_access
FROM public.user_profiles up
LEFT JOIN (
  SELECT user_id, COUNT(*) as cnt
  FROM public.user_menu_access
  WHERE enabled = true
  GROUP BY user_id
) menu_count ON up.id = menu_count.user_id
GROUP BY up.role
ORDER BY up.role;

-- 8. 检查业务员的详细权限情况
SELECT 
  up.username,
  up.name,
  COUNT(DISTINCT uper.permission_id) as permission_count,
  COUNT(DISTINCT uma.menu_feature_id) FILTER (WHERE uma.enabled = true) as menu_access_count
FROM public.user_profiles up
LEFT JOIN public.user_permissions uper ON up.id = uper.user_id
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id
WHERE up.role = 'salesperson'
GROUP BY up.id, up.username, up.name
ORDER BY up.username;

-- 9. 列出业务员缺失的默认权限
SELECT 
  up.username,
  up.name,
  p.id as missing_permission_id,
  p.name as missing_permission_name
FROM public.user_profiles up
CROSS JOIN public.permissions p
LEFT JOIN public.user_permissions uper ON up.id = uper.user_id AND p.id = uper.permission_id
WHERE up.role = 'salesperson'
AND p.id IN (
  'customer_view',
  'customer_add',
  'customer_edit',
  'training_view',
  'training_add_participant',
  'expert_view',
  'prospectus_view',
  'prospectus_download'
)
AND uper.permission_id IS NULL
ORDER BY up.username, p.id;

-- 10. 列出业务员缺失的默认功能面板访问
SELECT 
  up.username,
  up.name,
  mf.id as missing_menu_feature_id,
  mf.name as missing_menu_feature_name
FROM public.user_profiles up
CROSS JOIN public.menu_features mf
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id AND mf.id = uma.menu_feature_id AND uma.enabled = true
WHERE up.role = 'salesperson'
AND mf.id IN (
  'dashboard', 
  'customer_management', 
  'training_management',
  'expert_management', 
  'prospectus_management', 
  'profile_settings'
)
AND uma.menu_feature_id IS NULL
ORDER BY up.username, mf.display_order;
