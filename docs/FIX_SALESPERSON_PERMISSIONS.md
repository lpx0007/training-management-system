# 修复业务员权限和功能面板访问

## 问题描述

业务员登录后发现功能面板为空，无法看到仪表盘、培训计划、客户管理等默认应该可以访问的功能。

## 原因分析

可能的原因：
1. 权限管理系统的数据库迁移脚本还没有运行
2. 业务员用户是在迁移脚本运行之后创建的，没有自动获得默认权限
3. 数据库中的权限或功能面板访问记录被意外删除

## 解决方案

### 方案零：同步权限定义到数据库（如果出现外键错误）

如果在权限管理页面看到 `FOREIGN_KEY_VIOLATION` 错误，说明前端定义的权限在数据库中不存在。

```bash
# 在 Supabase SQL Editor 中运行
scripts/sync-permissions-to-database.sql
```

这个脚本会：
1. 检查数据库中现有的权限
2. 插入所有前端定义的权限（如果不存在）
3. 更新已存在权限的名称和描述
4. 验证同步结果
5. 检查是否有无效的用户权限引用

### 方案一：运行检查脚本（推荐）

首先运行检查脚本，了解当前的权限状态：

```bash
# 在 Supabase SQL Editor 中运行
scripts/check-permissions-status.sql
```

这个脚本会显示：
- 权限系统表是否存在
- 功能面板和权限的数量
- 各角色的权限和功能面板访问情况
- 业务员缺失的默认权限和功能面板

### 方案一.五：验证特定用户的权限（详细诊断）

如果需要查看特定用户的详细权限信息：

```bash
# 在 Supabase SQL Editor 中运行
scripts/verify-user-permissions.sql
```

这个脚本会显示：
- 所有用户的基本信息
- 每个用户的权限列表（详细）
- 每个用户的功能面板访问列表（详细）
- 没有权限或功能面板访问的用户警告
- 系统统计信息

### 方案二：运行修复脚本

如果检查脚本显示业务员缺少默认权限或功能面板访问，运行修复脚本：

```bash
# 在 Supabase SQL Editor 中运行
scripts/fix-salesperson-permissions.sql
```

这个脚本会：
1. 为所有业务员添加默认权限（8个权限）
2. 为所有业务员添加默认功能面板访问（6个功能面板）
3. 显示修复后的验证结果

### 方案三：重新运行完整迁移脚本

如果权限系统表不存在或数据不完整，需要运行完整的迁移脚本：

```bash
# 在 Supabase SQL Editor 中运行
supabase-migrations/permission-management-setup.sql
```

## 业务员默认权限

业务员应该拥有以下默认权限：

### 功能权限（8个）
1. `customer_view` - 查看客户
2. `customer_add` - 添加客户
3. `customer_edit` - 编辑客户
4. `training_view` - 查看培训
5. `training_add_participant` - 添加培训参与者
6. `expert_view` - 查看专家
7. `prospectus_view` - 查看简章
8. `prospectus_download` - 下载简章

### 功能面板访问（6个）
1. `dashboard` - 仪表盘
2. `customer_management` - 客户管理
3. `training_management` - 培训计划
4. `expert_management` - 专家管理
5. `prospectus_management` - 招商简章
6. `profile_settings` - 个人设置

## 验证修复结果

修复后，可以通过以下方式验证：

### 1. 在数据库中验证

```sql
-- 查看业务员的权限数量（应该至少有8个）
SELECT 
  up.username,
  up.name,
  COUNT(DISTINCT uper.permission_id) as permission_count
FROM public.user_profiles up
LEFT JOIN public.user_permissions uper ON up.id = uper.user_id
WHERE up.role = 'salesperson'
GROUP BY up.id, up.username, up.name;

-- 查看业务员的功能面板访问数量（应该至少有6个）
SELECT 
  up.username,
  up.name,
  COUNT(DISTINCT uma.menu_feature_id) as menu_access_count
FROM public.user_profiles up
LEFT JOIN public.user_menu_access uma ON up.id = uma.user_id AND uma.enabled = true
WHERE up.role = 'salesperson'
GROUP BY up.id, up.username, up.name;
```

### 2. 在前端验证

1. 以业务员身份登录系统
2. 检查侧边栏是否显示以下菜单项：
   - 仪表盘
   - 客户管理
   - 培训计划
   - 专家管理
   - 招商简章
   - 个人设置
3. 尝试访问这些页面，确认可以正常访问

### 3. 在权限管理页面验证

1. 以管理员身份登录
2. 进入"权限管理"页面
3. 查看业务员用户的权限和功能面板访问情况
4. 确认权限数量和功能面板数量正确

## 预防措施

为了避免将来出现类似问题：

1. **新用户注册时自动分配默认权限**
   - 在用户注册流程中，根据角色自动分配默认权限和功能面板访问
   - 可以在 `supabaseService.ts` 的用户创建方法中添加这个逻辑

2. **定期检查权限完整性**
   - 定期运行检查脚本，确保所有用户都有正确的权限配置
   - 可以创建一个定时任务或管理员工具来执行这个检查

3. **权限变更审计**
   - 记录所有权限变更操作
   - 在权限管理页面显示权限变更历史

## 相关文件

- `scripts/check-permissions-status.sql` - 权限状态检查脚本
- `scripts/fix-salesperson-permissions.sql` - 业务员权限修复脚本
- `supabase-migrations/permission-management-setup.sql` - 完整迁移脚本
- `src/constants/permissions.ts` - 权限常量定义
- `src/constants/menuFeatures.ts` - 功能面板常量定义

## 联系支持

如果按照上述步骤操作后问题仍未解决，请联系技术支持并提供：
1. 检查脚本的输出结果
2. 业务员用户的用户名
3. 浏览器控制台的错误信息（如果有）
