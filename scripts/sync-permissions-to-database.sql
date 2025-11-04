-- ============================================
-- 同步权限定义到数据库
-- ============================================
-- 此脚本确保前端定义的所有权限都存在于数据库中

-- 1. 检查当前数据库中的权限
SELECT 
  'Current permissions in database:' as info,
  COUNT(*) as count
FROM public.permissions;

SELECT id, name FROM public.permissions ORDER BY id;

-- 2. 插入所有前端定义的权限（如果不存在）
-- 注意：需要先确保 permission_categories 表中有对应的分类

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
  description = EXCLUDED.description;

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
  description = EXCLUDED.description;

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
  description = EXCLUDED.description;

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
  description = EXCLUDED.description;

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
  description = EXCLUDED.description;

-- 海报生成权限
INSERT INTO public.permissions (id, name, description, category_id)
VALUES 
  ('poster_generate', '生成海报', '生成培训海报', 'poster'),
  ('poster_view_history', '查看海报历史', '查看海报生成历史', 'poster'),
  ('poster_config_template', '配置海报模板', '配置海报生成模板', 'poster')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 数据管理权限
INSERT INTO public.permissions (id, name, description, category_id)
VALUES 
  ('data_import', '导入数据', '批量导入数据', 'data'),
  ('data_export', '导出数据', '导出系统数据', 'data'),
  ('data_download_template', '下载模板', '下载数据导入模板', 'data'),
  ('data_view_history', '查看数据管理历史', '查看数据操作历史', 'data')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 系统管理权限
INSERT INTO public.permissions (id, name, description, category_id)
VALUES 
  ('permission_manage', '管理权限', '管理用户权限', 'system'),
  ('audit_log_view', '查看审计日志', '查看系统审计日志', 'system'),
  ('system_config', '系统配置', '修改系统配置', 'system'),
  ('user_account_manage', '用户账号管理', '管理用户账号状态', 'system')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 3. 验证结果
SELECT 
  '=== Verification Results ===' as info;

SELECT 
  'Total permissions after sync:' as info,
  COUNT(*) as count
FROM public.permissions;

-- 4. 列出所有权限
SELECT 
  pc.name as category,
  p.id,
  p.name,
  p.description
FROM public.permissions p
JOIN public.permission_categories pc ON p.category_id = pc.id
ORDER BY pc.name, p.id;

-- 5. 检查是否有用户权限引用了不存在的权限
SELECT 
  up.user_id,
  up.permission_id,
  '⚠️ Permission does not exist' as warning
FROM public.user_permissions up
LEFT JOIN public.permissions p ON up.permission_id = p.id
WHERE p.id IS NULL;

-- 完成提示
DO $$
BEGIN
  RAISE NOTICE '✅ 权限同步完成！';
  RAISE NOTICE '请检查上方的验证结果';
END $$;
