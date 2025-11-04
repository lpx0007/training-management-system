# 在浏览器中调试权限问题

## 问题：登录后侧边栏没有菜单项

如果业务员或专家登录后，侧边栏没有显示任何菜单项，可以按照以下步骤在浏览器中调试。

## 调试步骤

### 1. 打开浏览器控制台

- **Chrome/Edge**: 按 `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- **Firefox**: 按 `F12` 或 `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)

### 2. 查看登录日志

登录后，在控制台中应该看到以下日志：

```
🔐 执行登录: user@example.com
✅ 登录成功，用户: 张三
📋 加载用户权限和功能面板...
✅ 权限加载成功: 8 个权限
✅ 功能面板加载成功: 6 个面板
欢迎，张三！
```

**如果没有看到这些日志**：
- 检查是否有错误信息
- 可能是权限加载失败

### 3. 在控制台中检查权限

在控制台的 "Console" 标签中，输入以下命令：

#### 检查当前用户信息
```javascript
// 获取 React 组件的状态（需要 React DevTools）
// 或者直接从 localStorage 检查
console.log('用户信息:', JSON.parse(localStorage.getItem('sb-' + 'YOUR_PROJECT_ID' + '-auth-token')));
```

#### 使用调试函数（推荐）

在控制台中粘贴并运行以下代码：

```javascript
// 调试权限系统
function debugPermissions() {
  console.log('=== 权限系统调试信息 ===');
  
  // 1. 检查 AuthContext
  try {
    // 注意：这需要在 React 组件树中才能访问
    console.log('提示：请在 React DevTools 中查看 AuthContext 的值');
  } catch (e) {
    console.error('无法访问 AuthContext:', e);
  }
  
  // 2. 检查 localStorage
  console.log('\n--- LocalStorage 检查 ---');
  const keys = Object.keys(localStorage);
  const authKeys = keys.filter(k => k.includes('auth') || k.includes('supabase'));
  authKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      console.log(key + ':', JSON.parse(value));
    } catch (e) {
      console.log(key + ':', value);
    }
  });
  
  // 3. 检查 sessionStorage
  console.log('\n--- SessionStorage 检查 ---');
  const sessionKeys = Object.keys(sessionStorage);
  const authSessionKeys = sessionKeys.filter(k => k.includes('auth') || k.includes('supabase'));
  authSessionKeys.forEach(key => {
    try {
      const value = sessionStorage.getItem(key);
      console.log(key + ':', JSON.parse(value));
    } catch (e) {
      console.log(key + ':', value);
    }
  });
  
  console.log('\n=== 调试信息结束 ===');
}

// 运行调试
debugPermissions();
```

### 4. 使用 React DevTools 检查

1. 安装 [React Developer Tools](https://react.dev/learn/react-developer-tools) 浏览器扩展
2. 打开 React DevTools（在浏览器开发者工具中会有一个新的 "Components" 标签）
3. 在组件树中找到 `App` 组件
4. 在右侧面板中查看 `AuthContext.Provider` 的 `value` 属性
5. 检查以下字段：
   - `user`: 当前用户信息
   - `permissions`: 权限列表（应该是一个数组）
   - `menuAccess`: 功能面板访问列表（应该是一个数组）
   - `isAuthenticated`: 是否已认证（应该是 `true`）

### 5. 检查 Sidebar 组件

在 React DevTools 中找到 `Sidebar` 组件，查看：
- `filteredMenuItems`: 过滤后的菜单项（应该有多个项目）
- 如果 `filteredMenuItems` 是空数组，说明权限过滤有问题

### 6. 手动测试权限函数

在控制台中，可以尝试手动调用权限检查函数（需要先获取 AuthContext）：

```javascript
// 这个需要在 React 组件中执行
// 可以在任何使用了 useContext(AuthContext) 的组件中添加临时代码

import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

function DebugComponent() {
  const { permissions, menuAccess, hasPermission, canAccessMenu } = useContext(AuthContext);
  
  console.log('权限列表:', permissions);
  console.log('功能面板列表:', menuAccess);
  console.log('是否有 customer_view 权限:', hasPermission('customer_view'));
  console.log('是否可访问 dashboard:', canAccessMenu('dashboard'));
  
  return null;
}
```

## 常见问题和解决方案

### 问题1：权限列表为空

**症状**：
```javascript
permissions: []
menuAccess: []
```

**原因**：
- 数据库中没有为该用户分配权限
- 权限加载失败

**解决方案**：
1. 运行数据库修复脚本：`scripts/fix-salesperson-permissions.sql`
2. 重新登录

### 问题2：权限列表有值，但菜单仍然为空

**症状**：
```javascript
permissions: ['customer_view', 'training_view', ...]
menuAccess: []
```

**原因**：
- 功能面板访问权限没有正确加载
- `user_menu_access` 表中没有记录

**解决方案**：
1. 运行数据库修复脚本：`scripts/fix-salesperson-permissions.sql`
2. 重新登录

### 问题3：功能面板列表有值，但菜单仍然为空

**症状**：
```javascript
permissions: ['customer_view', 'training_view', ...]
menuAccess: ['dashboard', 'customer_management', ...]
```

**原因**：
- Sidebar 组件的过滤逻辑有问题
- `canAccessMenu` 或 `hasAnyPermission` 函数返回 false

**解决方案**：
1. 检查浏览器控制台是否有 JavaScript 错误
2. 在 Sidebar 组件中添加调试日志：
   ```typescript
   console.log('MENU_FEATURES:', MENU_FEATURES);
   console.log('filteredMenuItems:', filteredMenuItems);
   ```
3. 检查 `MENU_FEATURES` 常量是否正确导入

### 问题4：登录后没有看到权限加载日志

**症状**：
- 控制台中没有 "权限加载成功" 的日志

**原因**：
- `login` 函数中没有加载权限
- 权限加载失败但没有错误提示

**解决方案**：
1. 检查 `src/App.tsx` 中的 `login` 函数
2. 确认是否调用了 `getUserPermissions` 和 `getUserMenuAccess`
3. 检查网络请求是否成功（在 Network 标签中查看）

## 快速修复命令

如果确认是权限数据问题，可以直接在 Supabase SQL Editor 中运行：

```sql
-- 快速修复：为所有业务员添加默认权限和功能面板
-- 复制并运行 scripts/fix-salesperson-permissions.sql 的内容
```

## 联系支持

如果按照上述步骤仍无法解决问题，请提供以下信息：
1. 浏览器控制台的完整日志（包括错误信息）
2. React DevTools 中 AuthContext 的截图
3. 用户的角色和用户名
4. 数据库验证脚本的输出结果
