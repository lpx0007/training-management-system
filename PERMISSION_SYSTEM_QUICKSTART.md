# 权限管理系统快速开始指南

## 🚀 5分钟快速测试

### 1. 验证数据库（1分钟）

在 Supabase Dashboard 的 SQL Editor 中执行：
```sql
-- 快速验证
SELECT 
  (SELECT COUNT(*) FROM menu_features) as menu_features,
  (SELECT COUNT(*) FROM permissions) as permissions,
  (SELECT COUNT(*) FROM user_permissions) as user_permissions,
  (SELECT COUNT(*) FROM user_menu_access) as user_menu_access;
```

**预期结果**：
- menu_features: 12
- permissions: 42
- user_permissions: > 100
- user_menu_access: > 100

### 2. 测试登录（2分钟）

1. 启动开发服务器：`npm run dev`
2. 使用管理员账号登录
3. 打开浏览器控制台（F12）
4. 查看是否有以下日志：
   ```
   ✅ 权限加载成功: 42 个权限
   ✅ 功能面板加载成功: 12 个面板
   ```

### 3. 测试侧边栏（1分钟）

登录后查看侧边栏菜单：

**管理员应该看到**：
- ✅ 仪表盘
- ✅ 培训计划
- ✅ 专家管理
- ✅ 销售追踪
- ✅ 客户管理
- ✅ 海报生成
- ✅ 数据管理
- ✅ 业务员管理
- ✅ 权限管理
- ✅ 审计日志
- ✅ 招商简章
- ✅ 个人设置

**业务员应该看到**：
- ✅ 仪表盘
- ✅ 客户管理
- ✅ 培训计划
- ✅ 专家管理
- ✅ 招商简章
- ✅ 个人设置

**专家应该看到**：
- ✅ 仪表盘
- ✅ 培训计划
- ✅ 专家管理
- ✅ 招商简章
- ✅ 个人设置

**业务员应该看到**：
- ✅ 仪表盘
- ✅ 培训计划
- ✅ 专家管理
- ✅ 客户管理
- ✅ 招商简章
- ✅ 个人设置

### 4. 测试权限守卫（1分钟）

在任意页面添加测试代码：
```typescript
import { PermissionGuard } from '@/components/PermissionGuard';

<PermissionGuard permission="customer_add">
  <button>测试按钮</button>
</PermissionGuard>
```

- 管理员和有权限的业务员应该看到按钮
- 无权限的用户不应该看到按钮

---

## 📖 常见使用场景

### 场景1：在页面中隐藏/显示按钮

```typescript
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

function MyPage() {
  const { hasPermission } = useContext(AuthContext);

  return (
    <div>
      {hasPermission('customer_add') && (
        <button>添加客户</button>
      )}
      
      {hasPermission('customer_delete') && (
        <button>删除客户</button>
      )}
    </div>
  );
}
```

### 场景2：使用权限守卫组件

```typescript
import { PermissionGuard } from '@/components/PermissionGuard';

function MyPage() {
  return (
    <div>
      <PermissionGuard permission="customer_add">
        <button>添加客户</button>
      </PermissionGuard>
      
      <PermissionGuard 
        permission={['customer_edit', 'customer_delete']}
        fallback={<div>您没有权限</div>}
      >
        <CustomerActions />
      </PermissionGuard>
    </div>
  );
}
```

### 场景3：检查功能面板访问权限

```typescript
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

function MyComponent() {
  const { canAccessMenu } = useContext(AuthContext);

  if (!canAccessMenu('poster_generator')) {
    return <div>您没有权限访问海报生成功能</div>;
  }

  return <PosterGenerator />;
}
```

### 场景4：为业务员开放海报生成功能

#### 方法A：通过 SQL（快速测试）

```sql
-- 1. 添加权限
INSERT INTO user_permissions (user_id, permission_id)
SELECT id, 'poster_generate'
FROM user_profiles
WHERE role = 'salesperson'
ON CONFLICT DO NOTHING;

-- 2. 启用功能面板
INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
SELECT id, 'poster_generator', true
FROM user_profiles
WHERE role = 'salesperson'
ON CONFLICT DO NOTHING;
```

#### 方法B：通过代码（推荐）

```typescript
import supabaseService from '@/lib/supabase/supabaseService';

// 为所有业务员开放海报生成
await supabaseService.batchUpdateRolePermissions(
  'salesperson',
  ['poster_generate'],
  'merge'
);

await supabaseService.batchUpdateRoleMenuAccess(
  'salesperson',
  ['poster_generator'],
  'merge'
);
```

---

## 🔧 常见问题

### Q1: 登录后看不到权限加载日志？

**解决方案**：
1. 检查浏览器控制台是否有错误
2. 确认数据库迁移是否成功执行
3. 检查用户是否有权限记录

### Q2: 侧边栏菜单显示不正确？

**解决方案**：
1. 清除浏览器缓存并刷新
2. 检查用户的 `user_menu_access` 表记录
3. 确认 `MENU_FEATURES` 常量是否正确导入

### Q2.1: 业务员登录后功能面板为空？

这是一个常见问题，通常是因为业务员用户没有被正确初始化默认权限和功能面板访问。

**快速修复**：
1. 运行检查脚本查看问题：
   ```bash
   # 在 Supabase SQL Editor 中运行
   scripts/check-permissions-status.sql
   ```

2. 运行修复脚本：
   ```bash
   # 在 Supabase SQL Editor 中运行
   scripts/fix-salesperson-permissions.sql
   ```

3. 让业务员重新登录

**详细说明**：参考 `docs/FIX_SALESPERSON_PERMISSIONS.md`

**业务员应该拥有的默认权限**：
- customer_view（查看客户）
- customer_add（添加客户）
- customer_edit（编辑客户）
- training_view（查看培训）
- training_add_participant（添加培训参与者）
- expert_view（查看专家）
- prospectus_view（查看简章）
- prospectus_download（下载简章）

**业务员应该看到的功能面板**：
- 仪表盘
- 客户管理
- 培训计划
- 专家管理
- 招商简章
- 个人设置

### Q3: 权限守卫不工作？

**解决方案**：
1. 确认 `AuthContext` 是否正确提供
2. 检查权限ID是否正确
3. 查看控制台是否有错误

### Q4: 如何查看用户的权限？

在浏览器控制台执行：
```javascript
// 查看当前用户的权限
console.log('权限列表:', window.localStorage.getItem('permissions'));

// 或者在组件中
const { permissions, menuAccess } = useContext(AuthContext);
console.log('权限:', permissions);
console.log('功能面板:', menuAccess);
```

### Q5: 如何重置用户权限？

```sql
-- 重置为角色默认权限
-- 1. 删除现有权限
DELETE FROM user_permissions WHERE user_id = 'USER_ID';
DELETE FROM user_menu_access WHERE user_id = 'USER_ID';

-- 2. 重新初始化（根据角色）
-- 对于业务员
INSERT INTO user_permissions (user_id, permission_id)
SELECT 'USER_ID', id
FROM permissions
WHERE id IN (
  'customer_view', 'customer_add', 'customer_edit',
  'training_view', 'training_add_participant',
  'expert_view', 'prospectus_view', 'prospectus_download'
);

INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
SELECT 'USER_ID', id, true
FROM menu_features
WHERE id IN (
  'dashboard', 'customer_management', 'training_management',
  'expert_management', 'prospectus_management', 'profile_settings'
);
```

---

## 📚 更多资源

- **完整实施总结**: `PERMISSION_SYSTEM_IMPLEMENTATION_SUMMARY.md`
- **测试脚本**: `scripts/test-permission-system.sql`
- **需求文档**: `.kiro/specs/permission-management/requirements.md`
- **设计文档**: `.kiro/specs/permission-management/design.md`
- **任务列表**: `.kiro/specs/permission-management/tasks.md`

---

## ✅ 验收清单

在部署到生产环境前，请确认：

- [ ] 数据库迁移已成功执行
- [ ] 所有用户都有默认权限
- [ ] 管理员有所有权限（42个）
- [ ] 侧边栏菜单根据权限正确显示
- [ ] 权限守卫组件工作正常
- [ ] 登录时自动加载权限
- [ ] 无控制台错误
- [ ] 已在测试环境验证

---

**需要帮助？** 查看完整文档或联系开发团队。

**版本**: 1.0  
**更新日期**: 2025-11-03
