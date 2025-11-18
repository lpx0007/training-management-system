-- ============================================
-- 紧急修复：恢复会务客服的菜单访问权限
-- 创建时间: 2025-11-16
-- 说明: 会务客服登录后导航栏为空，需要恢复菜单访问权限
-- ============================================

-- 步骤1：检查当前状态
SELECT 
  '当前会务客服用户数' as info,
  COUNT(*) as count
FROM public.user_profiles
WHERE role = 'conference_service';

-- 步骤2：检查会务客服的菜单访问记录
SELECT 
  '当前会务客服菜单访问记录' as info,
  COUNT(*) as count
FROM public.user_menu_access uma
INNER JOIN public.user_profiles up ON uma.user_id = up.id
WHERE up.role = 'conference_service';

-- 步骤3：先确保菜单功能记录存在
INSERT INTO public.menu_features (id, name, path, icon, description, required_permissions, display_order) VALUES
('dashboard', '仪表盘', '/dashboard', 'chart-line', '查看系统概览和统计数据', '{}', 1),
('training_management', '培训计划', '/training-management', 'calendar', '管理培训场次和参与者', '{training_view}', 3),
('prospectus_management', '招商简章', '/prospectus-management', 'file-alt', '管理招商简章文件', '{prospectus_view}', 6),
('schedule_management', '课表管理', '/schedule-management', 'calendar', '管理课表文件', '{schedule_view}', 9),
('profile_settings', '个人设置', '/profile-settings', 'cog', '管理个人资料和偏好', '{}', 13)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  required_permissions = EXCLUDED.required_permissions,
  display_order = EXCLUDED.display_order;

-- 步骤4：为所有会务客服用户恢复默认菜单访问权限
-- 注意：使用 ON CONFLICT DO NOTHING 避免重复插入
INSERT INTO public.user_menu_access (user_id, menu_feature_id, enabled)
SELECT 
  up.id as user_id,
  mf.id as menu_feature_id,
  true as enabled
FROM public.user_profiles up
CROSS JOIN (
  SELECT unnest(ARRAY[
    'dashboard',
    'training_management',
    'prospectus_management',
    'schedule_management',
    'profile_settings'
  ]) as id
) mf
WHERE up.role = 'conference_service'
ON CONFLICT (user_id, menu_feature_id) DO UPDATE SET
  enabled = true;

-- 步骤5：验证修复结果
SELECT 
  '修复后：会务客服菜单访问记录' as info,
  up.name as user_name,
  up.username,
  COUNT(uma.menu_feature_id) as menu_count,
  array_agg(uma.menu_feature_id ORDER BY mf.display_order) as menu_features
FROM public.user_profiles up
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id AND uma.enabled = true
LEFT JOIN public.menu_features mf ON uma.menu_feature_id = mf.id
WHERE up.role = 'conference_service'
GROUP BY up.id, up.name, up.username
ORDER BY up.name;

-- 步骤6：检查所有菜单功能是否都存在
SELECT 
  '所有菜单功能' as info,
  id,
  name,
  path
FROM public.menu_features
ORDER BY display_order;
