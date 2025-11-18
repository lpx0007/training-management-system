-- ============================================
-- 添加缺失的菜单功能
-- 创建时间: 2025-11-16
-- 说明: 添加 schedule_management 和 announcement_management 菜单功能
-- ============================================

-- 1. 插入课表管理菜单功能
INSERT INTO public.menu_features (id, name, path, icon, description, required_permissions, display_order) VALUES
('schedule_management', '课表管理', '/schedule-management', 'calendar', '管理课表文件', '{schedule_view}', 9)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  required_permissions = EXCLUDED.required_permissions,
  display_order = EXCLUDED.display_order;

-- 2. 插入公告管理菜单功能（仅管理员）
INSERT INTO public.menu_features (id, name, path, icon, description, required_permissions, display_order) VALUES
('announcement_management', '公告管理', '/announcement-management', 'bullhorn', '发布和管理系统公告', '{}', 10)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  required_permissions = EXCLUDED.required_permissions,
  display_order = EXCLUDED.display_order;

-- 3. 为会务客服添加课表管理菜单权限
INSERT INTO public.user_menu_access (user_id, menu_feature_id, enabled)
SELECT 
  up.id as user_id,
  'schedule_management' as menu_feature_id,
  true as enabled
FROM public.user_profiles up
WHERE up.role = 'conference_service'
AND NOT EXISTS (
  SELECT 1 FROM public.user_menu_access uma
  WHERE uma.user_id = up.id 
  AND uma.menu_feature_id = 'schedule_management'
)
ON CONFLICT (user_id, menu_feature_id) DO NOTHING;

-- 4. 为业务员添加课表管理菜单权限（如果需要）
INSERT INTO public.user_menu_access (user_id, menu_feature_id, enabled)
SELECT 
  up.id as user_id,
  'schedule_management' as menu_feature_id,
  true as enabled
FROM public.user_profiles up
WHERE up.role = 'salesperson'
AND NOT EXISTS (
  SELECT 1 FROM public.user_menu_access uma
  WHERE uma.user_id = up.id 
  AND uma.menu_feature_id = 'schedule_management'
)
ON CONFLICT (user_id, menu_feature_id) DO NOTHING;

-- 5. 为专家添加课表管理菜单权限（如果需要）
INSERT INTO public.user_menu_access (user_id, menu_feature_id, enabled)
SELECT 
  up.id as user_id,
  'schedule_management' as menu_feature_id,
  true as enabled
FROM public.user_profiles up
WHERE up.role = 'expert'
AND NOT EXISTS (
  SELECT 1 FROM public.user_menu_access uma
  WHERE uma.user_id = up.id 
  AND uma.menu_feature_id = 'schedule_management'
)
ON CONFLICT (user_id, menu_feature_id) DO NOTHING;

-- 6. 验证插入结果
SELECT 
  '新增菜单功能' as type,
  id,
  name,
  path,
  required_permissions 
FROM public.menu_features 
WHERE id IN ('schedule_management', 'announcement_management');

-- 7. 查看每个角色有多少用户获得了课表管理权限
SELECT 
  '课表管理权限分配情况' as type,
  up.role,
  COUNT(*) as user_count
FROM public.user_profiles up
INNER JOIN public.user_menu_access uma ON up.id = uma.user_id
WHERE uma.menu_feature_id = 'schedule_management'
  AND uma.enabled = true
GROUP BY up.role
ORDER BY up.role;
