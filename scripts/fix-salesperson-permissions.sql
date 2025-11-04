-- ============================================
-- 修复业务员权限和功能面板访问
-- ============================================
-- 此脚本用于为业务员添加默认权限和功能面板访问权限

-- 1. 为所有业务员添加默认权限
INSERT INTO public.user_permissions (user_id, permission_id)
SELECT up.id, p.id
FROM public.user_profiles up
CROSS JOIN public.permissions p
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
ON CONFLICT (user_id, permission_id) DO NOTHING;

-- 2. 为所有业务员添加默认功能面板访问权限
INSERT INTO public.user_menu_access (user_id, menu_feature_id, enabled)
SELECT up.id, mf.id, true
FROM public.user_profiles up
CROSS JOIN public.menu_features mf
WHERE up.role = 'salesperson'
AND mf.id IN (
  'dashboard', 
  'customer_management', 
  'training_management',
  'expert_management', 
  'prospectus_management', 
  'profile_settings'
)
ON CONFLICT (user_id, menu_feature_id) DO UPDATE SET enabled = true;

-- 3. 验证结果
-- 查看业务员的权限数量
SELECT 
  up.username,
  up.name,
  COUNT(DISTINCT uper.permission_id) as permission_count
FROM public.user_profiles up
LEFT JOIN public.user_permissions uper ON up.id = uper.user_id
WHERE up.role = 'salesperson'
GROUP BY up.id, up.username, up.name
ORDER BY up.username;

-- 查看业务员的功能面板访问数量
SELECT 
  up.username,
  up.name,
  COUNT(DISTINCT uma.menu_feature_id) as menu_access_count
FROM public.user_profiles up
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id AND uma.enabled = true
WHERE up.role = 'salesperson'
GROUP BY up.id, up.username, up.name
ORDER BY up.username;

-- 查看具体的功能面板访问情况
SELECT 
  up.username,
  up.name,
  mf.name as menu_feature_name,
  uma.enabled
FROM public.user_profiles up
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id
LEFT JOIN public.menu_features mf ON uma.menu_feature_id = mf.id
WHERE up.role = 'salesperson'
ORDER BY up.username, mf.display_order;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '业务员权限和功能面板访问已修复！';
  RAISE NOTICE '请查看上方的验证结果确认修复成功';
END $$;
