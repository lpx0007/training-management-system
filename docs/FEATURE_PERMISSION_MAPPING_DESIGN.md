# 功能面板与权限映射设计

## 设计理念

权限应该按照**实际使用场景**来组织，而不是简单地按照权限ID前缀来分组。

### 核心原则

1. **场景驱动**：权限按用户实际使用场景组织
2. **跨功能支持**：一个权限可以出现在多个功能面板中
3. **用户视角**：从用户的角度思考权限需求

## 典型案例

### 案例1：培训计划中的招商简章下载

**场景描述**：
- 业务员在"培训计划"页面查看培训详情
- 培训详情中有招商简章下载功能
- 业务员需要下载招商简章给客户

**权限设计**：

❌ **错误的设计**：
```
培训计划功能面板：
  - training_view
  - training_add
  - training_edit
  
招商简章功能面板：
  - prospectus_view
  - prospectus_download  ← 业务员需要这个权限
```

问题：业务员不需要访问"招商简章管理"页面（那是管理员用的），但需要在培训详情中下载简章。

✅ **正确的设计**：
```
培训计划功能面板：
  - training_view
  - training_add
  - training_edit
  - prospectus_download  ← 在培训计划中包含此权限
  - expert_view          ← 培训详情中也需要查看专家信息
  
招商简章管理功能面板：
  - prospectus_view
  - prospectus_upload
  - prospectus_edit
  - prospectus_delete
  - prospectus_download  ← 管理页面也包含此权限
  - prospectus_manage_category
```

### 案例2：销售追踪中的客户数据

**场景描述**：
- 管理员在"销售追踪"页面查看销售数据
- 需要查看所有业务员的客户信息
- 需要查看业务员绩效

**权限设计**：

✅ **正确的设计**：
```
销售追踪功能面板：
  - salesperson_view_performance  ← 查看绩效
  - customer_view                 ← 查看客户数据
  - customer_view_all             ← 跨业务员查看
```

## 完整的权限映射

### 1. 仪表盘 (dashboard)
- **权限**：无
- **说明**：所有用户均可访问

### 2. 客户管理 (customer_management)
- **权限**：
  - `customer_view` - 查看客户
  - `customer_view_all` - 查看所有客户
  - `customer_add` - 添加客户
  - `customer_edit` - 编辑客户
  - `customer_delete` - 删除客户
  - `customer_export` - 导出客户
- **说明**：客户管理页面的所有操作权限

### 3. 培训计划 (training_management)
- **权限**：
  - `training_view` - 查看培训
  - `training_add` - 添加培训
  - `training_edit` - 编辑培训
  - `training_delete` - 删除培训
  - `training_add_participant` - 添加培训参与者
  - `training_manage_participant` - 管理培训参与者
  - `training_view_stats` - 查看培训统计
  - `prospectus_download` - 下载招商简章 ⭐ 跨功能
  - `expert_view` - 查看专家信息 ⭐ 跨功能
- **说明**：培训计划页面的所有操作权限，包括培训详情中的招商简章下载和专家信息查看

### 4. 专家管理 (expert_management)
- **权限**：
  - `expert_view` - 查看专家
  - `expert_add` - 添加专家
  - `expert_edit` - 编辑专家
  - `expert_delete` - 删除专家
  - `expert_view_feedback` - 查看专家反馈
  - `expert_profile_edit` - 编辑自己的专家资料
- **说明**：专家管理页面的所有操作权限

### 5. 业务员管理 (salesperson_management)
- **权限**：
  - `salesperson_view` - 查看业务员
  - `salesperson_add` - 添加业务员
  - `salesperson_edit` - 编辑业务员
  - `salesperson_delete` - 删除业务员
  - `salesperson_view_performance` - 查看业务员绩效
- **说明**：业务员管理页面的所有操作权限

### 6. 招商简章管理 (prospectus_management)
- **权限**：
  - `prospectus_view` - 查看简章
  - `prospectus_upload` - 上传简章
  - `prospectus_edit` - 编辑简章
  - `prospectus_delete` - 删除简章
  - `prospectus_download` - 下载简章
  - `prospectus_manage_category` - 管理简章分类
- **说明**：招商简章管理页面的所有操作权限（管理员专用）

### 7. 海报生成 (poster_generator)
- **权限**：
  - `poster_generate` - 生成海报
  - `poster_view_history` - 查看海报历史
  - `poster_config_template` - 配置海报模板
- **说明**：海报生成页面的所有操作权限

### 8. 数据管理 (data_management)
- **权限**：
  - `data_import` - 导入数据
  - `data_export` - 导出数据
  - `data_download_template` - 下载模板
  - `data_view_history` - 查看数据管理历史
- **说明**：数据管理页面的所有操作权限

### 9. 销售追踪 (sales_tracking)
- **权限**：
  - `salesperson_view_performance` - 查看业务员绩效
  - `customer_view` - 查看客户 ⭐ 跨功能
  - `customer_view_all` - 查看所有客户 ⭐ 跨功能
- **说明**：销售追踪页面的所有操作权限，需要查看客户数据

### 10. 权限管理 (permission_management)
- **权限**：
  - `permission_manage` - 管理权限
  - `salesperson_view` - 查看业务员 ⭐ 跨功能
- **说明**：权限管理页面的所有操作权限，需要查看用户信息

### 11. 审计日志 (audit_logs)
- **权限**：
  - `audit_log_view` - 查看审计日志
- **说明**：审计日志页面的所有操作权限

### 12. 个人设置 (profile_settings)
- **权限**：无
- **说明**：所有用户均可访问

## 跨功能权限总结

| 权限 | 出现在的功能面板 | 原因 |
|------|----------------|------|
| `prospectus_download` | 培训计划、招商简章管理 | 培训详情中需要下载简章 |
| `expert_view` | 培训计划、专家管理 | 培训详情中需要查看专家信息 |
| `customer_view` | 客户管理、销售追踪 | 销售追踪需要查看客户数据 |
| `customer_view_all` | 客户管理、销售追踪 | 销售追踪需要跨业务员查看 |
| `salesperson_view` | 业务员管理、权限管理 | 权限管理需要查看用户信息 |

## 角色默认权限

### 业务员 (salesperson)
```
功能面板：
  - 仪表盘
  - 客户管理
  - 培训计划
  - 专家管理
  - 招商简章（不显示，但有下载权限）
  - 个人设置

权限：
  - customer_view
  - customer_add
  - customer_edit
  - training_view
  - training_add_participant
  - expert_view
  - prospectus_download  ← 在培训计划中使用
```

### 专家 (expert)
```
功能面板：
  - 仪表盘
  - 培训计划
  - 专家管理
  - 招商简章（不显示，但有下载权限）
  - 个人设置

权限：
  - training_view
  - expert_view
  - expert_profile_edit
  - prospectus_download  ← 在培训计划中使用
```

## 实现细节

### 映射文件
`src/constants/featurePermissionMapping.ts`

### 核心函数

```typescript
// 获取功能面板的权限列表
getFeaturePermissions(featureId: string): string[]

// 获取功能面板的权限说明
getFeaturePermissionDescription(featureId: string): string

// 获取某个权限被哪些功能面板使用
getPermissionUsedByFeatures(permissionId: string): string[]
```

### 使用示例

```typescript
// 在权限管理页面中
const featurePermissions = getFeaturePermissions('training_management');
// 返回: ['training_view', 'training_add', ..., 'prospectus_download', 'expert_view']

// 检查权限被哪些功能使用
const features = getPermissionUsedByFeatures('prospectus_download');
// 返回: ['training_management', 'prospectus_management']
```

## 优势

### 1. 符合用户心智模型
- 用户在哪个页面使用功能，就在哪个功能面板设置权限
- 不需要在多个功能面板之间跳转

### 2. 减少配置复杂度
- 业务员不需要访问"招商简章管理"页面
- 但可以在培训详情中下载简章
- 权限配置更加直观

### 3. 灵活的权限组合
- 同一个权限可以出现在多个功能面板
- 支持复杂的业务场景

### 4. 易于维护
- 权限映射集中管理
- 修改映射关系不影响其他代码

## 未来扩展

### 1. 权限依赖关系
```typescript
{
  featureId: 'training_management',
  permissions: ['training_view', 'training_add'],
  dependencies: {
    'training_add': ['training_view']  // 添加培训需要先有查看权限
  }
}
```

### 2. 条件权限
```typescript
{
  featureId: 'customer_management',
  permissions: ['customer_view', 'customer_view_all'],
  conditionalPermissions: {
    'customer_view_all': {
      condition: 'role === "admin"',
      description: '只有管理员可以查看所有客户'
    }
  }
}
```

## 相关文件

- `src/constants/featurePermissionMapping.ts` - 权限映射定义
- `src/constants/permissions.ts` - 权限定义
- `src/constants/menuFeatures.ts` - 功能面板定义
- `src/pages/PermissionManagement.tsx` - 权限管理页面

## 反馈和建议

如有任何问题或建议，请联系开发团队。
