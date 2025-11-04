-- ============================================
-- 权限管理系统数据库迁移
-- 创建时间: 2025-01-27
-- 说明: 添加功能面板管理和完善权限系统
-- ============================================

-- ============================================
-- 1. 创建功能面板相关表
-- ============================================

-- 功能面板定义表
CREATE TABLE IF NOT EXISTS public.menu_features (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  required_permissions TEXT[],  -- 所需权限列表
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用户功能面板访问权限表
CREATE TABLE IF NOT EXISTS public.user_menu_access (
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  menu_feature_id TEXT REFERENCES public.menu_features(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, menu_feature_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_menu_access_user 
ON public.user_menu_access(user_id);

CREATE INDEX IF NOT EXISTS idx_user_menu_access_feature 
ON public.user_menu_access(menu_feature_id);

-- ============================================
-- 2. 启用 RLS 策略
-- ============================================

ALTER TABLE public.menu_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_menu_access ENABLE ROW LEVEL SECURITY;

-- 所有认证用户可以查看功能面板定义
CREATE POLICY "Anyone authenticated can view menu features" 
ON public.menu_features
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 用户可以查看自己的功能面板访问权限
CREATE POLICY "Users can view their own menu access" 
ON public.user_menu_access
FOR SELECT USING (user_id = auth.uid());

-- 管理员可以管理所有用户的功能面板访问权限
CREATE POLICY "Admins can manage all menu access" 
ON public.user_menu_access
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- 3. 插入功能面板定义数据
-- ============================================

INSERT INTO public.menu_features (id, name, path, icon, description, required_permissions, display_order) VALUES
('dashboard', '仪表盘', '/dashboard', 'chart-line', '查看系统概览和统计数据', '{}', 1),
('customer_management', '客户管理', '/customer-management', 'users', '管理客户信息和跟进记录', '{customer_view}', 2),
('training_management', '培训计划', '/training-management', 'calendar', '管理培训场次和参与者', '{training_view}', 3),
('expert_management', '专家管理', '/expert-management', 'user-tie', '管理专家信息和课程', '{expert_view}', 4),
('salesperson_management', '业务员管理', '/salesperson-management', 'user-friends', '管理业务员信息和绩效', '{salesperson_view}', 5),
('prospectus_management', '招商简章', '/prospectus-management', 'file-alt', '管理招商简章文件', '{prospectus_view}', 6),
('poster_generator', '海报生成', '/poster-generator', 'image', '生成培训宣传海报', '{poster_generate}', 7),
('data_management', '数据管理', '/data-management', 'database', '批量导入导出数据', '{data_import,data_export}', 8),
('sales_tracking', '销售追踪', '/sales-tracking', 'chart-bar', '查看销售数据和绩效', '{salesperson_view_performance}', 9),
('permission_management', '权限管理', '/permission-management', 'shield-alt', '管理用户权限', '{permission_manage}', 10),
('audit_logs', '审计日志', '/audit-logs', 'history', '查看系统操作日志', '{audit_log_view}', 11),
('profile_settings', '个人设置', '/profile-settings', 'cog', '管理个人资料和偏好', '{}', 12)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  required_permissions = EXCLUDED.required_permissions,
  display_order = EXCLUDED.display_order;


-- ============================================
-- 4. 插入新的权限定义数据
-- ============================================

INSERT INTO public.permissions (id, name, description, category) VALUES
-- 客户管理（新增）
('customer_view_all', '查看所有客户', '查看所有业务员的客户（跨业务员）', '客户管理'),
('customer_delete', '删除客户', '删除客户记录', '客户管理'),
('customer_export', '导出客户', '导出客户数据', '客户管理'),

-- 培训管理（新增）
('training_delete', '删除培训', '删除培训场次', '培训管理'),
('training_manage_participant', '管理培训参与者', '管理培训参与者信息', '培训管理'),
('training_view_stats', '查看培训统计', '查看培训统计数据', '培训管理'),

-- 专家管理（新增）
('expert_delete', '删除专家', '删除专家记录', '专家管理'),
('expert_view_feedback', '查看专家反馈', '查看专家的反馈信息', '专家管理'),

-- 业务员管理（新增）
('salesperson_delete', '删除业务员', '删除业务员记录', '业务员管理'),
('salesperson_view_performance', '查看业务员绩效', '查看业务员绩效数据', '业务员管理'),

-- 招商简章管理（新增）
('prospectus_view', '查看简章', '查看招商简章列表', '招商简章管理'),
('prospectus_upload', '上传简章', '上传新的招商简章', '招商简章管理'),
('prospectus_edit', '编辑简章', '编辑简章信息', '招商简章管理'),
('prospectus_delete', '删除简章', '删除简章文件', '招商简章管理'),
('prospectus_download', '下载简章', '下载简章文件', '招商简章管理'),
('prospectus_manage_category', '管理简章分类', '管理简章分类', '招商简章管理'),

-- 海报生成（新增）
('poster_generate', '生成海报', '生成培训海报', '海报生成'),
('poster_view_history', '查看海报历史', '查看海报生成历史', '海报生成'),
('poster_config_template', '配置海报模板', '配置海报生成模板', '海报生成'),

-- 数据管理（新增）
('data_import', '导入数据', '批量导入数据', '数据管理'),
('data_download_template', '下载模板', '下载数据导入模板', '数据管理'),
('data_view_history', '查看数据管理历史', '查看数据操作历史', '数据管理'),

-- 系统管理（新增）
('audit_log_view', '查看审计日志', '查看系统审计日志', '系统管理'),
('system_config', '系统配置', '修改系统配置', '系统管理'),
('user_account_manage', '用户账号管理', '管理用户账号状态', '系统管理')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- ============================================
-- 5. 为现有用户初始化默认权限
-- ============================================

-- 为所有管理员添加所有权限
INSERT INTO public.user_permissions (user_id, permission_id)
SELECT up.id, p.id
FROM public.user_profiles up
CROSS JOIN public.permissions p
WHERE up.role = 'admin'
ON CONFLICT DO NOTHING;

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
ON CONFLICT DO NOTHING;

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
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. 为现有用户初始化默认功能面板访问权限
-- ============================================

-- 为所有管理员启用所有功能面板
INSERT INTO public.user_menu_access (user_id, menu_feature_id, enabled)
SELECT up.id, mf.id, true
FROM public.user_profiles up
CROSS JOIN public.menu_features mf
WHERE up.role = 'admin'
ON CONFLICT DO NOTHING;

-- 为业务员启用默认功能面板
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
ON CONFLICT DO NOTHING;

-- 为专家启用默认功能面板
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
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. 验证迁移结果
-- ============================================

-- 显示功能面板数量
SELECT COUNT(*) as menu_features_count FROM public.menu_features;

-- 显示权限总数
SELECT COUNT(*) as permissions_count FROM public.permissions;

-- 显示各角色的用户权限分配情况
SELECT 
  up.role,
  COUNT(DISTINCT up.id) as user_count,
  COUNT(DISTINCT uper.permission_id) as avg_permissions
FROM public.user_profiles up
LEFT JOIN public.user_permissions uper ON up.id = uper.user_id
GROUP BY up.role
ORDER BY up.role;

-- 显示各角色的功能面板访问情况
SELECT 
  up.role,
  COUNT(DISTINCT up.id) as user_count,
  COUNT(DISTINCT uma.menu_feature_id) as avg_menu_access
FROM public.user_profiles up
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id
GROUP BY up.role
ORDER BY up.role;

-- ============================================
-- 完成提示
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '权限管理系统数据库迁移完成！';
  RAISE NOTICE '- 已创建 menu_features 和 user_menu_access 表';
  RAISE NOTICE '- 已插入 12 个功能面板定义';
  RAISE NOTICE '- 已插入 27 个新权限定义';
  RAISE NOTICE '- 已为现有用户初始化默认权限和功能面板访问权限';
  RAISE NOTICE '请查看上方的验证结果确认迁移成功';
END $$;
