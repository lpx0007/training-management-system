# 专家培训详情权限修复

## 问题
专家点击"查看详情"时提示"您没有权限访问此页面"

## 根本原因
有两个地方限制了专家访问培训详情页：

1. **路由权限**：`src/App.tsx` 中的路由配置只允许 `admin` 和 `salesperson` 访问
2. **菜单权限**：`src/components/Sidebar.tsx` 中的菜单配置也只允许 `admin` 和 `salesperson` 看到"培训计划"菜单

## 解决方案

### 1. 修复路由权限（src/App.tsx）

```typescript
// 修复前
<Route path="/training-performance" element={
  <ProtectedRoute requiredRole={['admin', 'salesperson']}>
    <TrainingPerformance />
  </ProtectedRoute>
} />

// 修复后
<Route path="/training-performance" element={
  <ProtectedRoute requiredRole={['admin', 'salesperson', 'expert']}>
    <TrainingPerformance />
  </ProtectedRoute>
} />
```

### 2. 修复菜单权限（src/components/Sidebar.tsx）

```typescript
// 修复前
{ icon: <Calendar size={20} />, label: '培训计划', path: '/training-performance', permission: ['admin', 'salesperson'] },

// 修复后
{ icon: <Calendar size={20} />, label: '培训计划', path: '/training-performance', permission: ['admin', 'salesperson', 'expert'] },
```

## 测试步骤
1. 使用专家账号登录（例如：zhangjiao@example.com / Expert123!）
2. 在仪表盘点击"查看详情"链接
3. 应该能够成功进入培训详情页面
4. 在培训列表中点击某个培训的"详情"按钮
5. 应该能够看到培训的基本信息（时间、地址、内容等）
6. 确认看不到参训人员的详细列表

## 后续优化建议
考虑改进专家仪表盘的"查看详情"链接，使其能够直接打开对应培训的详情模态框，而不是跳转到培训列表页面。

可能的实现方式：
1. 使用 URL 参数传递培训 ID：`/training-performance?id=123`
2. 在 TrainingPerformance 页面检测 URL 参数，自动打开对应的详情模态框
3. 或者在 Dashboard 中直接实现详情模态框，不跳转页面

### 3. 修复数据过滤逻辑（src/pages/TrainingPerformance.tsx）

```typescript
// 修复前
const isAdmin = user?.role === 'admin';
const salespersonName = isAdmin ? undefined : user?.name;
const trainingSessions = await supabaseService.getTrainingSessions(salespersonName);

// 修复后
const isAdmin = user?.role === 'admin';
const isExpert = user?.role === 'expert';
const salespersonName = (isAdmin || isExpert) ? undefined : user?.name;
let trainingSessions = await supabaseService.getTrainingSessions(salespersonName);

// 如果是专家，过滤出自己授课的培训
if (isExpert && user?.name) {
  trainingSessions = trainingSessions.filter(session => 
    session.expert === user.name || session.expert.includes(user.name)
  );
}
```

## 修改总结
1. **路由权限**：允许专家访问 `/training-performance` 路由
2. **菜单权限**：允许专家在侧边栏看到"培训计划"菜单
3. **数据过滤**：专家只能看到自己授课的培训列表

## 相关文件
- `src/App.tsx` - 路由配置
- `src/components/Sidebar.tsx` - 侧边栏菜单配置
- `src/pages/Dashboard.tsx` - 专家仪表盘
- `src/pages/TrainingPerformance.tsx` - 培训详情页和数据过滤逻辑
