# 权限错误故障排除指南

## 常见错误及解决方案

### 错误 1: FOREIGN_KEY_VIOLATION

**错误信息**:
```
Supabase Error [updateUserPermissions]
Message: 无法找到不存在
Code: FOREIGN_KEY_VIOLATION
Hint: 添加或修改的数据违反外键约束
```

**原因**:
尝试为用户分配的权限ID在数据库的 `permissions` 表中不存在。

**解决方案**:

#### 步骤 1: 同步权限定义
在 Supabase SQL Editor 中运行：
```sql
-- 运行此脚本同步所有权限
scripts/sync-permissions-to-database.sql
```

#### 步骤 2: 验证权限已同步
检查脚本输出，确认：
- 权限总数应该是 42 个
- 没有 "Permission does not exist" 的警告

#### 步骤 3: 重试权限设置
- 刷新权限管理页面
- 重新尝试为用户设置权限

### 错误 2: 用户权限为空

**症状**:
- 用户登录后侧边栏没有菜单
- 权限管理页面显示用户权限数量为 0

**解决方案**:

#### 步骤 1: 检查权限状态
```sql
scripts/check-permissions-status.sql
```

#### 步骤 2: 修复业务员权限
```sql
scripts/fix-salesperson-permissions.sql
```

#### 步骤 3: 用户重新登录

### 错误 3: 权限设置后无法访问页面

**症状**:
- 权限管理页面显示用户有权限
- 但点击菜单后显示"您没有权限访问此页面"

**原因**:
路由的 `requiredRole` 配置与权限不匹配

**解决方案**:

查看路由审计报告：
```
scripts/ROUTE_AUDIT_REPORT.md
```

确认所有路由配置正确。

### 错误 4: 功能面板不显示

**症状**:
- 用户有权限
- 但侧边栏不显示对应的菜单项

**原因**:
用户没有功能面板访问权限（`user_menu_access` 表）

**解决方案**:

#### 步骤 1: 检查功能面板访问
```sql
SELECT 
  up.username,
  up.name,
  COUNT(uma.menu_feature_id) as menu_count
FROM user_profiles up
LEFT JOIN user_menu_access uma ON up.id = uma.user_id AND uma.enabled = true
WHERE up.username = 'YOUR_USERNAME'
GROUP BY up.id, up.username, up.name;
```

#### 步骤 2: 修复功能面板访问
```sql
scripts/fix-salesperson-permissions.sql
```

## 完整诊断流程

### 1. 检查数据库权限完整性

```sql
-- 检查权限表
SELECT COUNT(*) FROM permissions;
-- 应该返回 42

-- 检查功能面板表
SELECT COUNT(*) FROM menu_features;
-- 应该返回 12

-- 检查权限分类表
SELECT COUNT(*) FROM permission_categories;
-- 应该返回 8
```

### 2. 检查用户权限分配

```sql
-- 检查特定用户的权限
SELECT 
  up.username,
  up.name,
  up.role,
  COUNT(DISTINCT uper.permission_id) as permission_count,
  COUNT(DISTINCT uma.menu_feature_id) FILTER (WHERE uma.enabled = true) as menu_count
FROM user_profiles up
LEFT JOIN user_permissions uper ON up.id = uper.user_id
LEFT JOIN user_menu_access uma ON up.id = uma.user_id
WHERE up.username = 'YOUR_USERNAME'
GROUP BY up.id, up.username, up.name, up.role;
```

### 3. 检查前端权限加载

打开浏览器控制台（F12），查看登录日志：
```
✅ 权限加载成功: X 个权限
✅ 功能面板加载成功: X 个面板
```

如果没有看到这些日志，说明权限加载失败。

### 4. 检查路由配置

查看 `scripts/ROUTE_AUDIT_REPORT.md` 确认所有路由配置正确。

## 预防措施

### 1. 定期同步权限

每次前端添加新权限后，运行：
```sql
scripts/sync-permissions-to-database.sql
```

### 2. 新用户自动初始化

确保用户注册时自动分配默认权限和功能面板访问。

### 3. 权限变更审计

记录所有权限变更操作，便于追踪问题。

## 快速修复命令

如果不确定问题原因，按顺序运行以下脚本：

```sql
-- 1. 同步权限定义
scripts/sync-permissions-to-database.sql

-- 2. 检查权限状态
scripts/check-permissions-status.sql

-- 3. 修复业务员权限
scripts/fix-salesperson-permissions.sql

-- 4. 验证用户权限
scripts/verify-user-permissions.sql
```

## 联系支持

如果按照上述步骤仍无法解决问题，请提供：

1. 错误的完整截图（包括错误代码）
2. 浏览器控制台的日志
3. 用户的用户名和角色
4. 运行 `check-permissions-status.sql` 的输出结果

## 相关文档

- [修复业务员权限指南](FIX_SALESPERSON_PERMISSIONS.md)
- [浏览器调试指南](DEBUG_PERMISSIONS_IN_BROWSER.md)
- [路由审计报告](../scripts/ROUTE_AUDIT_REPORT.md)
- [脚本使用说明](../scripts/README.md)
