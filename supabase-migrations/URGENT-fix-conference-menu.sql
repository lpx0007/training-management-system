-- ============================================
-- 🚑 紧急修复：恢复会务客服菜单访问权限
-- 创建时间: 2025-11-16 23:18
-- 问题：会务客服登录后导航栏为空
-- 原因：updateUserMenuAccess 先删除记录再插入，但插入失败导致记录被清空
-- ============================================

-- ============================================
-- 第一步：确保所有菜单功能记录存在
-- ============================================
INSERT INTO public.menu_features (id, name, path, icon, description, required_permissions, display_order) VALUES
('dashboard', '仪表盘', '/dashboard', 'chart-line', '查看系统概览和统计数据', '{}', 1),
('course_management', '课程管理', '/course-management', 'calendar', '管理培训课程信息', '{training_view}', 2),
('training_management', '培训计划', '/training-management', 'calendar', '管理培训场次和参与者', '{training_view}', 3),
('customer_management', '客户管理', '/customer-management', 'users', '管理客户信息和跟进记录', '{customer_view}', 6),
('expert_management', '专家管理', '/expert-management', 'user-tie', '管理专家信息和课程', '{expert_view}', 7),
('prospectus_management', '招商简章', '/prospectus-management', 'file-alt', '管理招商简章文件', '{prospectus_view}', 8),
('schedule_management', '课表管理', '/schedule-management', 'calendar', '管理课表文件', '{schedule_view}', 9),
('announcement_management', '公告管理', '/announcement-management', 'bullhorn', '发布和管理系统公告', '{}', 10),
('profile_settings', '个人设置', '/profile-settings', 'cog', '管理个人资料和偏好', '{}', 13)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  required_permissions = EXCLUDED.required_permissions,
  display_order = EXCLUDED.display_order;

-- ============================================
-- 第二步：恢复所有会务客服的菜单访问权限
-- ============================================
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

-- ============================================
-- 第三步：验证修复结果
-- ============================================

-- 3.1 检查菜单功能记录
SELECT 
  '✅ 菜单功能记录' as 检查项,
  id as 菜单ID,
  name as 名称,
  path as 路径
FROM public.menu_features
WHERE id IN ('dashboard', 'training_management', 'prospectus_management', 'schedule_management', 'profile_settings')
ORDER BY display_order;

-- 3.2 检查会务客服用户数量
SELECT 
  '✅ 会务客服用户' as 检查项,
  COUNT(*) as 用户数量
FROM public.user_profiles
WHERE role = 'conference_service';

-- 3.3 检查每个会务客服的菜单访问权限
SELECT 
  '✅ 会务客服菜单权限' as 检查项,
  up.name as 用户名,
  up.username as 账号,
  COUNT(uma.menu_feature_id) as 菜单数量,
  array_agg(mf.name ORDER BY mf.display_order) as 菜单列表
FROM public.user_profiles up
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id AND uma.enabled = true
LEFT JOIN public.menu_features mf ON uma.menu_feature_id = mf.id
WHERE up.role = 'conference_service'
GROUP BY up.id, up.name, up.username
ORDER BY up.name;

-- ============================================
-- 预期结果
-- ============================================
-- 第一个查询应该显示5条菜单功能记录
-- 第二个查询显示会务客服用户数量
-- 第三个查询中每个会务客服应该有5个菜单：
--   1. 仪表盘
--   2. 培训计划
--   3. 招商简章
--   4. 课表管理
--   5. 个人设置
-- ============================================
