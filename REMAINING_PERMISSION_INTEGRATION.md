# 剩余权限集成任务指南

## ✅ 已完成的页面

1. **客户管理页面** (`src/pages/CustomerManagement.tsx`) ✅
   - ✅ 添加客户按钮 → `customer_add` 权限
   - ✅ 编辑按钮 → `customer_edit` 权限
   - ✅ 删除按钮 → `customer_delete` 权限

2. **培训管理页面** (`src/pages/TrainingPerformance.tsx`) ✅
   - ✅ 添加培训按钮 → `training_add` 权限
   - ✅ 编辑培训按钮 → `training_edit` 权限
   - ✅ 添加培训人按钮 → `training_add_participant` 权限

## ⏳ 待完成的页面

### 3. 专家管理页面 (`src/pages/ExpertManagement.tsx`)

需要包裹的按钮：

```tsx
// 1. 导入 PermissionGuard
import { PermissionGuard } from '@/components/PermissionGuard';

// 2. 包裹"添加专家"按钮
<PermissionGuard permission="expert_add">
  <button onClick={openAddModal}>
    添加专家
  </button>
</PermissionGuard>

// 3. 包裹"编辑"按钮
<PermissionGuard permission="expert_edit">
  <button onClick={() => openEditModal(expert)}>
    编辑
  </button>
</PermissionGuard>

// 4. 包裹"删除"按钮
<PermissionGuard permission="expert_delete">
  <button onClick={() => handleDelete(expert.id)}>
    删除
  </button>
</PermissionGuard>
```

**搜索关键词**：
- `添加专家`
- `openAddModal`
- `openEditModal`
- `handleDelete`

### 4. 招商简章管理页面 (`src/pages/ProspectusManagement.tsx`)

需要包裹的按钮：

```tsx
// 1. 导入 PermissionGuard
import { PermissionGuard } from '@/components/PermissionGuard';

// 2. 包裹"上传简章"按钮
<PermissionGuard permission="prospectus_upload">
  <button onClick={openUploadModal}>
    上传简章
  </button>
</PermissionGuard>

// 3. 包裹"编辑"按钮
<PermissionGuard permission="prospectus_edit">
  <button onClick={() => openEditModal(prospectus)}>
    编辑
  </button>
</PermissionGuard>

// 4. 包裹"删除"按钮
<PermissionGuard permission="prospectus_delete">
  <button onClick={() => handleDelete(prospectus.id)}>
    删除
  </button>
</PermissionGuard>

// 5. 包裹"下载"按钮
<PermissionGuard permission="prospectus_download">
  <button onClick={() => handleDownload(prospectus)}>
    下载
  </button>
</PermissionGuard>
```

**搜索关键词**：
- `上传简章`
- `handleUpload`
- `handleDownload`
- `handleDelete`

### 5. 海报生成页面 (`src/pages/PosterGenerator.tsx`)

这个页面比较特殊，需要在页面级别验证权限：

```tsx
import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

export default function PosterGenerator() {
  const { hasPermission } = useContext(AuthContext);

  // 在页面开始处检查权限
  if (!hasPermission('poster_generate')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            访问受限
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            您没有权限访问海报生成功能
          </p>
        </div>
      </div>
    );
  }

  // 正常的页面内容
  return (
    // ...
  );
}
```

### 6. 数据管理页面 (`src/pages/DataManagement.tsx`)

需要包裹的按钮：

```tsx
// 1. 导入 PermissionGuard
import { PermissionGuard } from '@/components/PermissionGuard';

// 2. 包裹"导入数据"按钮
<PermissionGuard permission="data_import">
  <button onClick={openImportModal}>
    导入数据
  </button>
</PermissionGuard>

// 3. 包裹"导出数据"按钮
<PermissionGuard permission="data_export">
  <button onClick={handleExport}>
    导出数据
  </button>
</PermissionGuard>
```

**搜索关键词**：
- `导入数据`
- `导出数据`
- `handleImport`
- `handleExport`

## 🔍 快速实施步骤

对于每个页面，按以下步骤操作：

### 步骤 1：添加导入
在文件顶部的导入区域添加：
```tsx
import { PermissionGuard } from '@/components/PermissionGuard';
```

### 步骤 2：查找按钮
使用 PowerShell 命令查找按钮位置：
```powershell
Select-String -Path "src/pages/[PageName].tsx" -Pattern "添加|编辑|删除|上传|下载" -Context 2,2
```

### 步骤 3：包裹按钮
使用 `<PermissionGuard permission="xxx">` 包裹按钮：
```tsx
<PermissionGuard permission="permission_id">
  <button>操作</button>
</PermissionGuard>
```

### 步骤 4：测试
1. 刷新浏览器
2. 使用不同角色的账号登录
3. 验证按钮是否根据权限显示/隐藏

## 📋 权限映射参考

| 页面 | 操作 | 权限 ID |
|------|------|---------|
| 客户管理 | 添加客户 | `customer_add` |
| 客户管理 | 编辑客户 | `customer_edit` |
| 客户管理 | 删除客户 | `customer_delete` |
| 培训管理 | 添加培训 | `training_add` |
| 培训管理 | 编辑培训 | `training_edit` |
| 培训管理 | 删除培训 | `training_delete` |
| 培训管理 | 添加参与者 | `training_add_participant` |
| 专家管理 | 添加专家 | `expert_add` |
| 专家管理 | 编辑专家 | `expert_edit` |
| 专家管理 | 删除专家 | `expert_delete` |
| 招商简章 | 上传简章 | `prospectus_upload` |
| 招商简章 | 编辑简章 | `prospectus_edit` |
| 招商简章 | 删除简章 | `prospectus_delete` |
| 招商简章 | 下载简章 | `prospectus_download` |
| 海报生成 | 生成海报 | `poster_generate` |
| 数据管理 | 导入数据 | `data_import` |
| 数据管理 | 导出数据 | `data_export` |

## ✨ 完成后的效果

集成权限验证后：

1. **业务员登录**
   - ✅ 可以看到"添加客户"按钮
   - ✅ 可以看到"编辑客户"按钮
   - ❌ 看不到"删除客户"按钮（没有权限）
   - ✅ 可以看到"添加培训人"按钮
   - ✅ 可以看到"下载简章"按钮

2. **专家登录**
   - ✅ 可以查看培训信息
   - ✅ 可以编辑自己的资料
   - ❌ 看不到"添加专家"按钮
   - ❌ 看不到"删除专家"按钮

3. **管理员登录**
   - ✅ 可以看到所有按钮
   - ✅ 可以执行所有操作

## 🎯 优先级建议

1. **高优先级** - 专家管理页面（常用功能）
2. **高优先级** - 招商简章管理页面（新功能，需要权限控制）
3. **中优先级** - 数据管理页面（管理员功能）
4. **低优先级** - 海报生成页面（特殊功能）

## 📝 注意事项

1. **不要删除现有的角色检查**
   - 有些页面已经有 `user?.role === 'admin'` 的检查
   - 可以保留这些检查，PermissionGuard 是额外的保护层

2. **权限守卫的位置**
   - 尽量包裹最小的元素（只包裹按钮）
   - 不要包裹整个表单或大块内容

3. **Fallback 选项**
   - 对于重要操作，可以添加 fallback 提示
   ```tsx
   <PermissionGuard 
     permission="customer_delete"
     fallback={<span className="text-gray-400">无权限</span>}
   >
     <button>删除</button>
   </PermissionGuard>
   ```

4. **多权限验证**
   - 如果一个操作需要多个权限，可以使用数组
   ```tsx
   <PermissionGuard permission={['permission1', 'permission2']}>
     <button>操作</button>
   </PermissionGuard>
   ```

## 🚀 快速完成命令

```powershell
# 查找专家管理页面的按钮
Select-String -Path "src/pages/ExpertManagement.tsx" -Pattern "添加专家|编辑|删除" -Context 2,2

# 查找招商简章页面的按钮
Select-String -Path "src/pages/ProspectusManagement.tsx" -Pattern "上传|下载|编辑|删除" -Context 2,2

# 查找数据管理页面的按钮
Select-String -Path "src/pages/DataManagement.tsx" -Pattern "导入|导出" -Context 2,2
```

完成这些集成后，权限管理系统就完全生效了！🎉
