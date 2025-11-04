# 权限管理系统脚本

这个目录包含用于管理和维护权限系统的 SQL 脚本。

## 脚本列表

### 0. sync-permissions-to-database.sql
**用途**：同步前端权限定义到数据库

**功能**：
- 检查数据库中现有的权限
- 插入所有前端定义的权限（如果不存在）
- 更新已存在权限的名称和描述
- 验证同步结果
- 检查无效的用户权限引用

**使用场景**：
- 权限管理页面出现 `FOREIGN_KEY_VIOLATION` 错误
- 前端添加了新的权限定义
- 数据库权限数据不完整或损坏

**如何使用**：
```bash
# 在 Supabase Dashboard 的 SQL Editor 中运行
scripts/sync-permissions-to-database.sql
```

### 1. check-permissions-status.sql
**用途**：检查权限系统的当前状态

**功能**：
- 检查权限系统表是否存在
- 统计功能面板和权限的数量
- 显示各角色的权限和功能面板访问情况
- 列出业务员缺失的默认权限和功能面板

**使用场景**：
- 诊断权限问题
- 验证迁移是否成功
- 定期检查系统健康状态

**如何使用**：
```bash
# 在 Supabase Dashboard 的 SQL Editor 中运行
scripts/check-permissions-status.sql
```

### 2. fix-salesperson-permissions.sql
**用途**：修复业务员的权限和功能面板访问

**功能**：
- 为所有业务员添加默认权限（8个）
- 为所有业务员添加默认功能面板访问（6个）
- 显示修复后的验证结果

**使用场景**：
- 业务员登录后功能面板为空
- 业务员缺少默认权限
- 新创建的业务员需要初始化权限

**如何使用**：
```bash
# 在 Supabase Dashboard 的 SQL Editor 中运行
scripts/fix-salesperson-permissions.sql
```

### 3. test-permission-system.sql
**用途**：测试权限系统的完整性

**功能**：
- 测试权限查询
- 测试功能面板访问查询
- 验证权限系统的各个组件

**使用场景**：
- 开发和测试阶段
- 验证权限系统是否正常工作

**如何使用**：
```bash
# 在 Supabase Dashboard 的 SQL Editor 中运行
scripts/test-permission-system.sql
```

## 常见使用流程

### 场景1：业务员功能面板为空

1. 运行检查脚本诊断问题：
   ```sql
   scripts/check-permissions-status.sql
   ```

2. 如果发现业务员缺少权限或功能面板访问，运行修复脚本：
   ```sql
   scripts/fix-salesperson-permissions.sql
   ```

3. 让业务员重新登录验证

### 场景2：新部署环境初始化

1. 运行完整的迁移脚本：
   ```sql
   supabase-migrations/permission-management-setup.sql
   ```

2. 运行检查脚本验证：
   ```sql
   scripts/check-permissions-status.sql
   ```

3. 如果有问题，运行相应的修复脚本

### 场景3：定期健康检查

定期（如每周）运行检查脚本，确保权限系统正常：
```sql
scripts/check-permissions-status.sql
```

## 注意事项

1. **备份数据**：在运行任何修改数据的脚本之前，建议先备份数据库
2. **测试环境**：建议先在测试环境中运行脚本，确认无误后再在生产环境运行
3. **权限要求**：运行这些脚本需要数据库管理员权限
4. **幂等性**：修复脚本使用 `ON CONFLICT DO NOTHING` 或 `ON CONFLICT DO UPDATE`，可以安全地多次运行

## 相关文档

- [权限管理系统快速开始指南](../PERMISSION_SYSTEM_QUICKSTART.md)
- [修复业务员权限指南](../docs/FIX_SALESPERSON_PERMISSIONS.md)
- [权限管理系统实现总结](../PERMISSION_SYSTEM_IMPLEMENTATION_SUMMARY.md)

## 支持

如果遇到问题，请：
1. 查看相关文档
2. 运行检查脚本获取详细信息
3. 联系技术支持并提供检查脚本的输出结果
