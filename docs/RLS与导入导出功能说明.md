# RLS策略对导入导出功能的影响说明

## 一、当前RLS策略总结

### 1. 客户数据（customers表）

#### 现有策略：
- **管理员**：可以查看、添加、编辑、删除所有客户 ✅
- **业务员**：只能查看和编辑自己的客户（salesperson_id = auth.uid()） ✅
- **部门经理**：需要新增策略（已创建脚本） 🆕

#### 新增部门经理策略：
```sql
-- 部门经理可以：
1. 查看本部门所有业务员的客户
2. 添加客户并分配给本部门业务员
3. 编辑本部门客户信息
4. 删除本部门客户（需谨慎）
```

### 2. 培训参与者（training_participants表）

#### 现有策略：
- **管理员**：完全控制 ✅
- **业务员**：只能管理自己客户的参与记录 ✅
- **部门经理**：需要新增策略（已创建脚本） 🆕

## 二、RLS对导入导出的影响

### 导出功能 📤

**工作原理**：
```typescript
// CustomerManagement.tsx
const customers = await supabaseService.getCustomers();
// RLS自动过滤，只返回有权限的数据

const exportData = filteredCustomers.map(customer => ({...}));
// 导出的是已经过滤后的数据
```

**实际效果**：
- ✅ **管理员**：导出所有客户数据
- ✅ **业务员**：只能导出自己的客户
- ✅ **部门经理**：只能导出本部门的客户（需应用新策略）

**结论**：RLS策略**自动限制**导出范围，安全性有保障！

### 导入功能 📥

**工作原理**：
```typescript
// 导入时会逐条插入数据
for (const customer of importData) {
  await supabase.from('customers').insert({
    ...customer,
    salesperson_id: // 根据角色决定
  });
}
```

**实际效果**：

#### 管理员导入：
- ✅ 可以导入任何客户
- ✅ 可以指定任意业务员
- ✅ 可以批量分配客户

#### 业务员导入：
- ✅ 只能导入分配给自己的客户
- ⚠️ 如果Excel中指定了其他业务员，插入会**失败**
- 💡 系统会自动将salesperson_id设置为当前用户ID

#### 部门经理导入（应用新策略后）：
- ✅ 可以导入并分配给本部门业务员
- ❌ 不能分配给其他部门业务员
- ✅ 可以导入未分配的客户

## 三、代码实现细节

### 1. 客户管理页面导入逻辑
```typescript
// CustomerManagement.tsx - handleImportComplete
if (user?.role === 'admin') {
  // 管理员：使用Excel中指定的业务员
  salesperson_id = getSalespersonId(row['负责业务员']);
} else if (user?.role === 'manager') {
  // 经理：验证业务员是否属于本部门
  if (isInMyDepartment(salesperson_id)) {
    // 允许
  } else {
    // 拒绝或改为自己
  }
} else {
  // 业务员：强制设为自己
  salesperson_id = user.id;
  salesperson_name = user.name;
}
```

### 2. RLS策略验证
```sql
-- INSERT时的验证
WITH CHECK (
  salesperson_id = auth.uid()  -- 业务员只能插入自己的
  OR
  role = 'admin'  -- 管理员可以插入任何
  OR
  (role = 'manager' AND salesperson_id IN 本部门)  -- 经理只能插入本部门的
)
```

## 四、特殊场景处理

### 场景1：批量转移客户
- **需求**：将业务员A的客户转给业务员B
- **权限要求**：
  - ✅ 管理员：可以任意转移
  - ✅ 部门经理：只能在本部门内转移
  - ❌ 业务员：不能转移给他人

### 场景2：导入冲突处理
- **问题**：导入的客户手机号已存在
- **处理**：
  - 管理员：可以选择更新或跳过
  - 业务员：只能更新自己的客户
  - 部门经理：只能更新本部门客户

### 场景3：离职业务员的客户
- **问题**：业务员离职，客户需要重新分配
- **解决**：
  1. 管理员可以批量重新分配
  2. 部门经理可以分配给本部门其他业务员
  3. 可以暂时设为"未分配"状态

## 五、最佳实践建议

### 1. 导入模板设计
```excel
| 客户姓名 | 手机号 | 公司名称 | 负责业务员 |
|---------|--------|---------|-----------|
| 张三    | 138xxx | A公司   | 李业务员   |

注意事项：
- 业务员：填写姓名，系统自动匹配
- 管理员：可以留空或指定
- 部门经理：只能填本部门业务员
```

### 2. 错误提示优化
```typescript
// 导入失败时的提示
if (error.code === '42501') {  // RLS violation
  if (user.role === 'salesperson') {
    toast.error('只能导入分配给您的客户');
  } else if (user.role === 'manager') {
    toast.error('只能导入本部门的客户');
  }
}
```

### 3. 权限检查
```typescript
// 导入前预检查
const preCheckImport = async (data) => {
  const invalid = [];
  for (const row of data) {
    if (!canImport(row, user)) {
      invalid.push(row);
    }
  }
  return invalid;
};
```

## 六、总结

1. **RLS策略是底层保护**：即使前端有漏洞，数据库层也能保证安全
2. **导出自动受限**：用户只能导出有权查看的数据
3. **导入需要验证**：插入时会检查权限，不符合会失败
4. **部门经理需要额外策略**：默认没有，需要手动添加
5. **错误处理很重要**：友好提示权限不足的原因

## 七、待办事项

- [ ] 应用部门经理RLS策略到生产环境
- [ ] 优化导入错误提示
- [ ] 添加导入前的权限预检查
- [ ] 实现批量转移客户功能
- [ ] 添加导入日志记录
