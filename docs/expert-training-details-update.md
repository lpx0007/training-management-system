# 专家培训详情权限优化

## 问题描述
专家登录后点击培训详情时提示没有权限，因为系统尝试加载客户信息，但专家不需要也不应该看到客户的详细信息。

## 解决方案
为专家角色创建简化版的培训详情视图，只显示培训的基本信息，不显示客户相关的敏感信息。

## 修改内容

### 1. 优化 `openDetailModal` 函数
- 检测用户角色，如果是专家，直接使用当前 session 数据
- 不调用 `getTrainingSessionById` 获取参与者列表
- 避免权限问题，提升加载速度

### 2. 专家可见信息
专家在培训详情中可以看到：
- ✅ 培训名称
- ✅ 培训日期和时间
- ✅ 培训地址（含详细地址和地图链接）
- ✅ 培训内容/课程描述
- ✅ 专家信息（自己的信息）
- ✅ 容纳人数
- ✅ 预计参训人数（总数）
- ✅ 培训状态
- ✅ 对应课程

### 3. 专家不可见信息
专家在培训详情中看不到：
- ❌ 参训人员详细列表（姓名、电话、邮箱等）
- ❌ 负责人信息
- ❌ 已报名人数和缺口人数的详细统计
- ❌ 导出签到表功能

## 技术实现

### 条件渲染
```typescript
// 专家角色不显示参训人员详细信息
{user?.role !== 'expert' && selectedSession.participantsList && ...}

// 专家角色只显示预计参训人数
{user?.role === 'expert' ? (
  <div>预计参训人数: {selectedSession.participants}</div>
) : (
  <div>已报名人数和缺口详情</div>
)}

// 专家角色不显示负责人信息
{user?.role !== 'expert' && (
  <div>负责人: {selectedSession.salespersonName}</div>
)}
```

### 权限检查
```typescript
if (user?.role === 'expert') {
  // 使用简化版数据，不加载参与者列表
  setSelectedSession(session);
  setIsDetailModalOpen(true);
  return;
}
```

## 用户体验改进
1. **专家角色**：点击详情后立即显示，无需等待加载参与者数据
2. **信息保护**：专家无法看到客户的个人信息，符合隐私保护要求
3. **界面简洁**：专家只看到与授课相关的必要信息，界面更清爽

## 测试建议
1. 使用专家账号登录（例如：zhangjiao@example.com）
2. 在仪表盘查看培训计划
3. 点击"查看详情"链接
4. 验证可以看到培训时间、地址、内容等基本信息
5. 验证看不到参训人员的详细列表

## 相关文件
- `src/pages/TrainingPerformance.tsx` - 培训详情页面
- `src/pages/Dashboard.tsx` - 专家仪表盘
