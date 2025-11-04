-- ============================================
-- 紧急修复脚本 - 解决权限外键错误
-- ============================================
-- 运行此脚本前请先备份数据库！

-- 步骤 1: 检查当前状态
SELECT '=== 步骤 1: 检查当前状态 ===' as step;

-- 检查权限分类表
SELECT 
  'permission_categories' as table_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) >= 8 THEN '✅ OK' ELSE '❌ 缺失' END as status
FROM public.permission_categories;

-- 检查权限表
SELECT 
  'permissions' as table_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) >= 35 THEN '✅ OK' ELSE '❌ 缺失' END as status
FROM public.permissions;

-- 检查功能面板表
SELECT 
  'menu_features' as table_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) >= 12 THEN '✅ OK' ELSE '❌ 缺失' END as status
FROM public.menu_features;

-- 步骤 2: 确保权限分类存在
SELECT '=== 步骤 2: 确保权限分类存在 ===' as step;

INSERT INTO public.permission_categories (id, name, description)
VALUES 
  ('customer', '客户管理', '客户信息的查看、编辑和管理权限'),
  ('training', '培训管理', '培训场次的创建、编辑和参与者管理权限'),
  ('expert', '专家管理', '专家信息的查看、编辑和管理权限'),
  ('salesperson', '业务员管理', '业务员信息的查看、编辑和绩效管理权限'),
  ('prospectus', '招商简章管理', '招商简章的上传、下载和管理权限'),
  ('poster', '海报生成', '海报生成和管理权限'),
  ('data', '数据管理', '数据导入导出和管理权限'),
  ('system', '系统管理', '系统级管理权限')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

SELECT '✅ 权限分类已同步' as result;

-- 步骤 3: 同步所有权限
SELECT '=== 步骤 3: 同步所有权限 ===' as step;

-- 客户管理权限
INSERT INTO public.permissions (id, name, description, category_id)
VALUES 
  ('customer_view', '查看客户', '查看客户基本信息', 'customer'),
  ('customer_view_all', '查看所有客户', '查看所有业务员的客户（跨业务员）', 'customer'),
  ('customer_add', '添加客户', '添加新客户到系统', 'customer'),
  ('customer_edit', '编辑客户', '编辑客户信息', 'customer'),
  ('customer_delete', '删除客户', '删除客户记录', 'customer'),
  ('customer_export', '导出客户', '导出客户数据', 'customer')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id;

-- 培训管理权限
INSERT INTO public.permissions (id, name, description, category_id)
VALUES 
  ('training_view', '查看培训', '查看培训场次信息', 'training'),
  ('training_add', '添加培训', '创建新的培训场次', 'training'),
  ('training_edit', '编辑培训', '编辑培训场次信息', 'training'),
  ('training_delete', '删除培训', '删除培训场次', 'training'),
  ('training_add_participant', '添加培训参与者', '向培训中添加参与者', 'training'),
  ('training_manage_participant', '管理培训参与者', '管理培训参与者信息', 'training'),
  ('training_view_stats', '查看培训统计', '查看培训统计数据', 'training')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id;

-- 专家管理权限
INSERT INTO public.permissions (id, name, description, category_id)
VALUES 
  ('expert_view', '查看专家', '查看专家信息', 'expert'),
  ('expert_add', '添加专家', '添加新专家', 'expert'),
  ('expert_edit', '编辑专家', '编辑专家信息', 'expert'),
  ('expert_delete', '删除专家', '删除专家记录', 'expert'),
  ('expert_view_feedback', '查看专家反馈', '查看专家的反馈信息', 'expert'),
  ('expert_profile_edit', '编辑自己的专家资料', '专家编辑自己的资料', 'expert')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id;

-- 业务员管理权限
INSERT INTO public.permissions (id, name, description, category_id)
VALUES 
  ('salesperson_view', '查看业务员', '查看业务员信息', 'salesperson'),
  ('salesperson_add', '添加业务员', '添加新业务员', 'salesperson'),
  ('salesperson_edit', '编辑业务员', '编辑业务员信息', 'salesperson'),
  ('salesperson_delete', '删除业务员', '删除业务员记录', 'salesperson'),
  ('salesperson_view_performance', '查看业务员绩效', '查看业务员绩效数据', 'salesperson')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id;

-- 招商简章管理权限
INSERT INTO public.permissions (id, name, description, category_id)
VALUES 
  ('prospectus_view', '查看简章', '查看招商简章列表', 'prospectus'),
  ('prospectus_upload', '上传简章', '上传新的招商简章', 'prospectus'),
  ('prospectus_edit', '编辑简章', '编辑简章信息', 'prospectus'),
  ('prospectus_delete', '删除简章', '删除简章文件', 'prospectus'),
  ('prospectus_download', '下载简章', '下载简章文件', 'prospectus'),
  ('prospectus_manage_category', '管理简章分类', '管理简章分类', 'prospectus')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id;

-- 海报生成权限
INSERT INTO public.permissions (id, name, description, category_id)
VALUES 
  ('poster_generate', '生成海报', '生成培训海报', 'poster'),
  ('poster_view_history', '查看海报历史', '查看海报生成历史', 'poster'),
  ('poster_config_template', '配置海报模板', '配置海报生成模板', 'poster')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id;

-- 数据管理权限
INSERT INTO public.permissions (id, name, description, category_id)
VALUES 
  ('data_import', '导入数据', '批量导入数据', 'data'),
  ('data_export', '导出数据', '导出系统数据', 'data'),
  ('data_download_template', '下载模板', '下载数据导入模板', 'data'),
  ('data_view_history', '查看数据管理历史', '查看数据操作历史', 'data')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id;

-- 系统管理权限
INSERT INTO public.permissions (id, name, description, category_id)
VALUES 
  ('permission_manage', '管理权限', '管理用户权限', 'system'),
  ('audit_log_view', '查看审计日志', '查看系统审计日志', 'system'),
  ('system_config', '系统配置', '修改系统配置', 'system'),
  ('user_account_manage', '用户账号管理', '管理用户账号状态', 'system')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category_id = EXCLUDED.category_id;

SELECT '✅ 所有权限已同步' as result;

-- 步骤 4: 清理无效的用户权限引用
SELECT '=== 步骤 4: 清理无效的用户权限引用 ===' as step;

-- 查找无效的权限引用
SELECT 
  up.user_id,
  up.permission_id,
  '⚠️ 无效权限' as warning
FROM public.user_permissions up
LEFT JOIN public.permissions p ON up.permission_id = p.id
WHERE p.id IS NULL;

-- 删除无效的权限引用
DELETE FROM public.user_permissions
WHERE permission_id NOT IN (SELECT id FROM public.permissions);

SELECT '✅ 无效权限引用已清理' as result;

-- 步骤 5: 验证结果
SELECT '=== 步骤 5: 验证结果 ===' as step;

-- 统计权限数量
SELECT 
  pc.name as category,
  COUNT(p.id) as permission_count
FROM public.permission_categories pc
LEFT JOIN public.permissions p ON pc.id = p.category_id
GROUP BY pc.id, pc.name
ORDER BY pc.name;

-- 总计
SELECT 
  '总权限数' as metric,
  COUNT(*) as count
FROM public.permissions;

-- 步骤 6: 重新初始化用户默认权限
SELECT '=== 步骤 6: 重新初始化用户默认权限 ===' as step;

-- 为业务员添加默认权限
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

-- 为专家添加默认权限
INSERT INTO public.user_permissions (user_id, permission_id)
SELECT up.id, p.id
FROM public.user_profiles up
CROSS JOIN public.permissions p
WHERE up.role = 'expert'
AND p.id IN (
  'training_view',
  'expert_view',
  'expert_profile_edit',
  'prospectus_view'
)
ON CONFLICT (user_id, permission_id) DO NOTHING;

SELECT '✅ 用户默认权限已初始化' as result;

-- 步骤 7: 同步功能面板
SELECT '=== 步骤 7: 同步功能面板 ===' as step;

INSERT INTO public.menu_features (id, name, path, icon, description, display_order)
VALUES 
  ('dashboard', '仪表盘', '/dashboard', 'chart-line', '查看系统概览和统计数据', 1),
  ('customer_management', '客户管理', '/customer-management', 'users', '管理客户信息和跟进记录', 2),
  ('training_management', '培训计划', '/training-management', 'calendar', '管理培训场次和参与者', 3),
  ('expert_management', '专家管理', '/expert-management', 'user-tie', '管理专家信息和课程', 4),
  ('salesperson_management', '业务员管理', '/salesperson-management', 'user-friends', '管理业务员信息和绩效', 5),
  ('prospectus_management', '招商简章', '/prospectus-management', 'file-alt', '管理招商简章文件', 6),
  ('poster_generator', '海报生成', '/poster-generator', 'image', '生成培训宣传海报', 7),
  ('data_management', '数据管理', '/data-management', 'database', '批量导入导出数据', 8),
  ('sales_tracking', '销售追踪', '/sales-tracking', 'chart-bar', '查看销售数据和绩效', 9),
  ('permission_management', '权限管理', '/permission-management', 'shield-alt', '管理用户权限', 10),
  ('audit_logs', '审计日志', '/audit-logs', 'history', '查看系统操作日志', 11),
  ('profile_settings', '个人设置', '/profile-settings', 'cog', '管理个人资料和偏好', 12)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

SELECT '✅ 功能面板已同步' as result;

-- 步骤 8: 初始化用户功能面板访问
SELECT '=== 步骤 8: 初始化用户功能面板访问 ===' as step;

-- 为业务员添加默认功能面板
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

-- 为专家添加默认功能面板
INSERT INTO public.user_menu_access (user_id, menu_feature_id, enabled)
SELECT up.id, mf.id, true
FROM public.user_profiles up
CROSS JOIN public.menu_features mf
WHERE up.role = 'expert'
AND mf.id IN (
  'dashboard',
  'training_management',
  'expert_management',
  'prospectus_management',
  'profile_settings'
)
ON CONFLICT (user_id, menu_feature_id) DO UPDATE SET enabled = true;

SELECT '✅ 用户功能面板访问已初始化' as result;

-- 最终验证
SELECT '=== 最终验证 ===' as step;

SELECT 
  up.username,
  up.name,
  up.role,
  COUNT(DISTINCT uper.permission_id) as permission_count,
  COUNT(DISTINCT uma.menu_feature_id) FILTER (WHERE uma.enabled = true) as menu_count
FROM public.user_profiles up
LEFT JOIN public.user_permissions uper ON up.id = uper.user_id
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id
GROUP BY up.id, up.username, up.name, up.role
ORDER BY up.role, up.username;

-- 完成
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 紧急修复完成！';
  RAISE NOTICE '========================================';
  RAISE NOTICE '请刷新权限管理页面并重试';
END $$;
