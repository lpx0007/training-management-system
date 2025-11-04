# 路由和功能面板映射检查

## 功能面板路径 vs 实际路由

| 功能面板 ID | 功能面板路径 | 实际路由 | 状态 |
|------------|------------|---------|------|
| dashboard | /dashboard | /dashboard | ✅ 匹配 |
| customer_management | /customer-management | /customer-management | ✅ 匹配 |
| training_management | /training-management | /training-management | ✅ 已修复 |
| expert_management | /expert-management | /expert-management | ✅ 匹配 |
| salesperson_management | /salesperson-management | /salesperson-management | ✅ 匹配 |
| prospectus_management | /prospectus-management | /prospectus-management | ✅ 匹配 |
| poster_generator | /poster-generator | /poster-generator | ✅ 匹配 |
| data_management | /data-management | /data-management | ✅ 匹配 |
| sales_tracking | /sales-tracking | /sales-tracking | ✅ 匹配 |
| permission_management | /permission-management | /permission-management | ✅ 匹配 |
| audit_logs | /audit-logs | ❌ 未实现 | ⚠️ 待实现 |
| profile_settings | /profile-settings | /profile-settings | ✅ 匹配 |

## 修复记录

### 2025-01-XX: 修复 training_management 路径不匹配

**问题**：
- 功能面板定义的路径：`/training-management`
- 实际路由：`/training-performance`
- 导致业务员点击"培训计划"菜单时无法打开页面

**解决方案**：
在 `src/App.tsx` 中添加了 `/training-management` 路由，指向 `TrainingPerformance` 组件：

```typescript
<Route path="/training-management" element={
  <ProtectedRoute requiredRole={['admin', 'salesperson', 'expert']}>
    <TrainingPerformance />
  </ProtectedRoute>
} />
```

**保留兼容性**：
- 保留了原有的 `/training-performance` 路由
- 两个路径都指向同一个组件

## 待实现的功能

### audit_logs (审计日志)

**功能面板定义**：
- ID: `audit_logs`
- 路径: `/audit-logs`
- 权限要求: `audit_log_view`

**状态**: 未实现

**建议**：
1. 创建 `src/pages/AuditLogs.tsx` 组件
2. 在 `src/App.tsx` 中添加路由：
   ```typescript
   <Route path="/audit-logs" element={
     <ProtectedRoute requiredRole={['admin']}>
       <AuditLogs />
     </ProtectedRoute>
   } />
   ```

## 验证步骤

### 1. 检查功能面板定义

查看 `src/constants/menuFeatures.ts` 中的所有功能面板定义。

### 2. 检查路由配置

查看 `src/App.tsx` 中的所有路由配置。

### 3. 测试每个功能面板

以不同角色登录，点击侧边栏的每个菜单项，确认：
- 页面能够正常打开
- URL 与功能面板定义的路径一致
- 没有 404 错误

### 4. 检查权限要求

确认每个路由的 `requiredRole` 与功能面板的 `requiredPermissions` 一致。

## 常见问题

### Q: 点击菜单项后页面显示 404

**原因**：
- 功能面板定义的路径与实际路由不匹配
- 路由未在 `App.tsx` 中配置

**解决方案**：
1. 检查功能面板定义的路径
2. 在 `App.tsx` 中添加对应的路由
3. 确保路径完全匹配（包括大小写和连字符）

### Q: 点击菜单项后显示"您没有权限访问此页面"

**原因**：
- 路由的 `requiredRole` 限制了访问
- 用户的角色不在允许列表中

**解决方案**：
1. 检查路由的 `requiredRole` 配置
2. 确认用户的角色是否在允许列表中
3. 如果需要，修改路由配置以允许该角色访问

### Q: 菜单项根本不显示

**原因**：
- 用户没有功能面板访问权限
- 用户没有所需的权限

**解决方案**：
1. 运行 `scripts/check-permissions-status.sql` 检查用户权限
2. 运行 `scripts/fix-salesperson-permissions.sql` 修复权限
3. 重新登录

## 相关文件

- `src/constants/menuFeatures.ts` - 功能面板定义
- `src/App.tsx` - 路由配置
- `src/components/Sidebar.tsx` - 侧边栏组件
- `docs/FIX_SALESPERSON_PERMISSIONS.md` - 权限修复指南
