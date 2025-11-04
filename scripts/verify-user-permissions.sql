-- ============================================
-- 验证用户权限和功能面板访问
-- ============================================
-- 此脚本用于验证特定用户的权限和功能面板访问是否正确

-- 1. 查看所有用户的基本信息
SELECT 
  id,
  username,
  name,
  role,
  department,
  status,
  created_at
FROM public.user_profiles
ORDER BY role, username;

-- 2. 查看每个用户的权限数量
SELECT 
  up.username,
  up.name,
  up.role,
  COUNT(DISTINCT uper.permission_id) as permission_count,
  STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) as permissions
FROM public.user_profiles up
LEFT JOIN public.user_permissions uper ON up.id = uper.user_id
LEFT JOIN public.permissions p ON uper.permission_id = p.id
GROUP BY up.id, up.username, up.name, up.role
ORDER BY up.role, up.username;

-- 3. 查看每个用户的功能面板访问数量
SELECT 
  up.username,
  up.name,
  up.role,
  COUNT(DISTINCT uma.menu_feature_id) FILTER (WHERE uma.enabled = true) as menu_access_count,
  STRING_AGG(DISTINCT mf.name, ', ' ORDER BY mf.name) FILTER (WHERE uma.enabled = true) as menu_features
FROM public.user_profiles up
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id
LEFT JOIN public.menu_features mf ON uma.menu_feature_id = mf.id
GROUP BY up.id, up.username, up.name, up.role
ORDER BY up.role, up.username;

-- 4. 详细查看业务员的权限
SELECT 
  up.username,
  up.name,
  p.id as permission_id,
  p.name as permission_name,
  pc.name as category_name
FROM public.user_profiles up
JOIN public.user_permissions uper ON up.id = uper.user_id
JOIN public.permissions p ON uper.permission_id = p.id
JOIN public.permission_categories pc ON p.category_id = pc.id
WHERE up.role = 'salesperson'
ORDER BY up.username, pc.name, p.name;

-- 5. 详细查看业务员的功能面板访问
SELECT 
  up.username,
  up.name,
  mf.id as feature_id,
  mf.name as feature_name,
  mf.path,
  uma.enabled
FROM public.user_profiles up
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id
LEFT JOIN public.menu_features mf ON uma.menu_feature_id = mf.id
WHERE up.role = 'salesperson'
ORDER BY up.username, mf.display_order;

-- 6. 详细查看专家的权限
SELECT 
  up.username,
  up.name,
  p.id as permission_id,
  p.name as permission_name,
  pc.name as category_name
FROM public.user_profiles up
JOIN public.user_permissions uper ON up.id = uper.user_id
JOIN public.permissions p ON uper.permission_id = p.id
JOIN public.permission_categories pc ON p.category_id = pc.id
WHERE up.role = 'expert'
ORDER BY up.username, pc.name, p.name;

-- 7. 详细查看专家的功能面板访问
SELECT 
  up.username,
  up.name,
  mf.id as feature_id,
  mf.name as feature_name,
  mf.path,
  uma.enabled
FROM public.user_profiles up
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id
LEFT JOIN public.menu_features mf ON uma.menu_feature_id = mf.id
WHERE up.role = 'expert'
ORDER BY up.username, mf.display_order;

-- 8. 检查是否有用户没有任何权限
SELECT 
  up.username,
  up.name,
  up.role,
  '⚠️ 没有任何权限' as warning
FROM public.user_profiles up
LEFT JOIN public.user_permissions uper ON up.id = uper.user_id
WHERE uper.permission_id IS NULL
ORDER BY up.role, up.username;

-- 9. 检查是否有用户没有任何功能面板访问
SELECT 
  up.username,
  up.name,
  up.role,
  '⚠️ 没有任何功能面板访问' as warning
FROM public.user_profiles up
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id AND uma.enabled = true
WHERE uma.menu_feature_id IS NULL
ORDER BY up.role, up.username;

-- 10. 统计信息
SELECT 
  '总用户数' as metric,
  COUNT(*) as value
FROM public.user_profiles
UNION ALL
SELECT 
  '管理员数量',
  COUNT(*)
FROM public.user_profiles
WHERE role = 'admin'
UNION ALL
SELECT 
  '业务员数量',
  COUNT(*)
FROM public.user_profiles
WHERE role = 'salesperson'
UNION ALL
SELECT 
  '专家数量',
  COUNT(*)
FROM public.user_profiles
WHERE role = 'expert'
UNION ALL
SELECT 
  '总权限数',
  COUNT(*)
FROM public.permissions
UNION ALL
SELECT 
  '总功能面板数',
  COUNT(*)
FROM public.menu_features
UNION ALL
SELECT 
  '用户权限分配总数',
  COUNT(*)
FROM public.user_permissions
UNION ALL
SELECT 
  '功能面板访问分配总数',
  COUNT(*)
FROM public.user_menu_access
WHERE enabled = true;
