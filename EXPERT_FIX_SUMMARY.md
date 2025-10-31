# 专家权限修复总结

## 问题
专家登录后点击"查看详情"提示"您没有权限访问此页面"

## 修复内容

### 1. 路由权限（src/App.tsx）
添加 `expert` 到培训详情页的允许角色列表

### 2. 菜单权限（src/components/Sidebar.tsx）
添加 `expert` 到"培训计划"菜单的允许角色列表

### 3. 数据过滤（src/pages/TrainingPerformance.tsx）
- 专家只能看到自己授课的培训
- 专家点击详情时不加载参与者列表（避免权限问题）
- 专家看不到客户详细信息

### 4. 列表显示（src/pages/TrainingPerformance.tsx）
- 专家在培训列表中看到的"参训人数"显示为容纳人数（capacity），而不是已报名人数

### 5. 详情显示（src/pages/TrainingPerformance.tsx）
专家在详情模态框中：
- ✅ 可以看到：培训名称、日期时间、地址（含地图链接）、培训内容
- ❌ 看不到：专家信息板块、培训统计板块、其他信息板块、参训人员列表

## 测试步骤
1. 使用专家账号登录：zhangjiao@example.com / Expert123!
2. 点击侧边栏"培训计划"菜单
3. 应该能看到自己授课的培训列表
4. 点击某个培训的"详情"按钮
5. 应该能看到培训基本信息，但看不到客户详细数据

## 修改的文件
- src/App.tsx
- src/components/Sidebar.tsx
- src/pages/TrainingPerformance.tsx

## 注意事项
⚠️ 这些修改尚未推送到 GitHub，请先测试确认功能正常后再推送
