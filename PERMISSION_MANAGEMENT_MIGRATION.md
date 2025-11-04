# 权限管理系统数据库迁移指南

## 概述

本文档说明如何执行权限管理系统的数据库迁移，包括创建功能面板表、插入权限数据和初始化用户权限。

## 迁移内容

### 1. 新增数据表
- `menu_features`: 功能面板定义表（12个功能面板）
- `user_menu_access`: 用户功能面板访问权限表

### 2. 新增权限数据
- 客户管理：3个新权限
- 培训管理：3个新权限
- 专家管理：2个新权限
- 业务员管理：2个新权限
- 招商简章管理：6个新权限
- 海报生成：3个新权限
- 数据管理：3个新权限
- 系统管理：3个新权限

**总计：27个新权限**

### 3. 功能面板定义
1. 仪表盘 (dashboard)
2. 客户管理 (customer_management)
3. 培训计划 (training_management)
4. 专家管理 (expert_management)
5. 业务员管理 (salesperson_management)
6. 招商简章 (prospectus_management)
7. 海报生成 (poster_generator)
8. 数据管理 (data_management)
9. 销售追踪 (sales_tracking)
10. 权限管理 (permission_management)
11. 审计日志 (audit_logs)
12. 个人设置 (profile_settings)

## 执行步骤

### 方式一：通过 Supabase Dashboard（推荐）

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单的 "SQL Editor"
4. 点击 "New query"
5. 复制 `supabase-migrations/permission-management-setup.sql` 的全部内容
6. 粘贴到 SQL 编辑器
7. 点击 "Run" 执行

### 方式二：通过 Supabase CLI

```bash
# 确保已安装 Supabase CLI
# npm install -g supabase

# 登录 Supabase
supabase login

# 链接到你的项目
supabase link --project-ref your-project-ref

# 执行迁移
supabase db push
```

### 方式三：通过 psql 命令行

```bash
# 连接到数据库
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 执行迁移文件
\i supabase-migrations/permission-management-setup.sql
```

## 验证迁移结果

执行迁移后，SQL 脚本会自动显示验证结果，包括：

1. 功能面板数量（应为 12）
2. 权限总数（应为原有数量 + 27）
3. 各角色的用户权限分配情况
4. 各角色的功能面板访问情况

### 手动验证查询

```sql
-- 检查功能面板表
SELECT * FROM public.menu_features ORDER BY display_order;

-- 检查新增的权限
SELECT * FROM public.permissions WHERE category IN (
  '招商简章管理', '海报生成', '数据管理'
) ORDER BY category, id;

-- 检查管理员的权限数量
SELECT 
  up.name,
  COUNT(uper.permission_id) as permission_count
FROM public.user_profiles up
LEFT JOIN public.user_permissions uper ON up.id = uper.user_id
WHERE up.role = 'admin'
GROUP BY up.id, up.name;

-- 检查业务员的功能面板访问
SELECT 
  up.name,
  COUNT(uma.menu_feature_id) as menu_access_count
FROM public.user_profiles up
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id
WHERE up.role = 'salesperson'
GROUP BY up.id, up.name;
```

## 默认权限配置

### 管理员 (admin)
- **权限**：所有权限
- **功能面板**：所有功能面板

### 业务员 (salesperson)
- **权限**：
  - customer_view, customer_add, customer_edit
  - training_view, training_add_participant
  - expert_view
  - prospectus_view, prospectus_download
- **功能面板**：
  - dashboard, customer_management, training_management
  - expert_management, prospectus_management, profile_settings

### 专家 (expert)
- **权限**：
  - training_view
  - expert_view, expert_profile_edit
  - prospectus_view
- **功能面板**：
  - dashboard, training_management, expert_management
  - prospectus_management, profile_settings

## 回滚方案

如果需要回滚迁移，执行以下 SQL：

```sql
-- 删除用户功能面板访问记录
DELETE FROM public.user_menu_access;

-- 删除功能面板定义
DELETE FROM public.menu_features;

-- 删除新增的权限（可选，如果需要完全回滚）
DELETE FROM public.permissions WHERE id IN (
  'customer_view_all', 'customer_delete', 'customer_export',
  'training_delete', 'training_manage_participant', 'training_view_stats',
  'expert_delete', 'expert_view_feedback',
  'salesperson_delete', 'salesperson_view_performance',
  'prospectus_view', 'prospectus_upload', 'prospectus_edit', 
  'prospectus_delete', 'prospectus_download', 'prospectus_manage_category',
  'poster_generate', 'poster_view_history', 'poster_config_template',
  'data_import', 'data_download_template', 'data_view_history',
  'audit_log_view', 'system_config', 'user_account_manage'
);

-- 删除表
DROP TABLE IF EXISTS public.user_menu_access;
DROP TABLE IF EXISTS public.menu_features;
```

## 注意事项

1. **备份数据库**：执行迁移前建议备份数据库
2. **测试环境**：建议先在测试环境执行，验证无误后再在生产环境执行
3. **用户影响**：迁移会为所有现有用户分配默认权限，不会影响用户的正常使用
4. **权限冲突**：使用 `ON CONFLICT DO NOTHING` 避免重复插入
5. **RLS 策略**：迁移会自动创建必要的 RLS 策略，确保数据安全

## 常见问题

### Q: 迁移后用户看不到新功能？
A: 检查用户的功能面板访问权限和具体功能权限是否都已分配。

### Q: 如何为特定用户添加海报生成功能？
A: 需要同时：
1. 在 `user_menu_access` 表中启用 `poster_generator` 功能面板
2. 在 `user_permissions` 表中分配 `poster_generate` 权限

### Q: 迁移执行失败怎么办？
A: 
1. 检查错误信息
2. 确认数据库连接正常
3. 确认有足够的权限执行 DDL 操作
4. 如果是部分失败，可以单独执行失败的部分

## 下一步

迁移完成后，可以继续执行任务2：创建前端权限和功能面板常量定义。

---

**迁移文件位置**: `supabase-migrations/permission-management-setup.sql`  
**创建时间**: 2025-01-27  
**版本**: 1.0
