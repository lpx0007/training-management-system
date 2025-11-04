# 权限管理系统设计文档

## 概述

本设计文档描述了培训管理系统的全面权限管理功能的技术实现方案。该系统将提供细粒度的权限控制，支持对所有用户角色（管理员、业务员、专家）进行统一的权限管理，并实现基于权限的访问控制（PBAC - Permission-Based Access Control）。

## 架构设计

### 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     前端应用层                                │
├─────────────────────────────────────────────────────────────┤
│  权限管理页面  │  权限设置模态框  │  权限验证组件            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     服务层                                    │
├─────────────────────────────────────────────────────────────┤
│  用户服务  │  权限服务  │  审计服务  │  权限验证服务         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Supabase 数据层                             │
├─────────────────────────────────────────────────────────────┤
│  user_profiles  │  permissions  │  user_permissions  │       │
│  audit_logs                                                  │
└─────────────────────────────────────────────────────────────┘
```

### 数据流设计

1. **权限加载流程**: 用户登录 → 加载用户资料 → 加载用户权限 → 存储到认证上下文
2. **权限验证流程**: 用户操作 → 检查权限 → 允许/拒绝操作 → 记录审计日志
3. **权限配置流程**: 管理员操作 → 更新权限 → 刷新缓存 → 记录变更日志

## 组件和接口设计

### 1. 数据模型

#### 权限定义模型

```typescript
interface Permission {
  id: string;                    // 权限唯一标识
  name: string;                  // 权限名称
  description: string | null;    // 权限描述
  category: string | null;       // 权限分类
}

interface PermissionCategory {
  id: string;                    // 分类ID
  name: string;                  // 分类名称
  description: string;           // 分类描述
  permissions: Permission[];     // 该分类下的权限列表
}

interface UserPermission {
  user_id: string;               // 用户ID (UUID)
  permission_id: string;         // 权限ID
}

interface UserWithPermissions {
  id: string;
  username: string;
  role: 'admin' | 'salesperson' | 'expert';
  name: string;
  department: string | null;
  status: 'enabled' | 'disabled';
  permissions: string[];         // 用户拥有的权限ID列表
}
```

#### 权限变更记录模型

```typescript
interface PermissionChangeLog {
  id: string;
  timestamp: string;
  operator_id: string;           // 操作者ID
  operator_name: string;         // 操作者姓名
  target_user_id: string;        // 被操作用户ID
  target_user_name: string;      // 被操作用户姓名
  action: 'grant' | 'revoke';    // 操作类型
  permissions: string[];         // 变更的权限列表
}
```

### 2. 权限分类定义

系统将权限划分为8个主要分类：


```typescript
const PERMISSION_CATEGORIES = {
  CUSTOMER: {
    id: 'customer',
    name: '客户管理',
    description: '客户信息的查看、编辑和管理权限',
    permissions: [
      { id: 'customer_view', name: '查看客户', description: '查看客户基本信息' },
      { id: 'customer_view_all', name: '查看所有客户', description: '查看所有业务员的客户（跨业务员）' },
      { id: 'customer_add', name: '添加客户', description: '添加新客户到系统' },
      { id: 'customer_edit', name: '编辑客户', description: '编辑客户信息' },
      { id: 'customer_delete', name: '删除客户', description: '删除客户记录' },
      { id: 'customer_export', name: '导出客户', description: '导出客户数据' },
    ]
  },
  TRAINING: {
    id: 'training',
    name: '培训管理',
    description: '培训场次的创建、编辑和参与者管理权限',
    permissions: [
      { id: 'training_view', name: '查看培训', description: '查看培训场次信息' },
      { id: 'training_add', name: '添加培训', description: '创建新的培训场次' },
      { id: 'training_edit', name: '编辑培训', description: '编辑培训场次信息' },
      { id: 'training_delete', name: '删除培训', description: '删除培训场次' },
      { id: 'training_add_participant', name: '添加培训参与者', description: '向培训中添加参与者' },
      { id: 'training_manage_participant', name: '管理培训参与者', description: '管理培训参与者信息' },
      { id: 'training_view_stats', name: '查看培训统计', description: '查看培训统计数据' },
    ]
  },
  EXPERT: {
    id: 'expert',
    name: '专家管理',
    description: '专家信息的查看、编辑和管理权限',
    permissions: [
      { id: 'expert_view', name: '查看专家', description: '查看专家信息' },
      { id: 'expert_add', name: '添加专家', description: '添加新专家' },
      { id: 'expert_edit', name: '编辑专家', description: '编辑专家信息' },
      { id: 'expert_delete', name: '删除专家', description: '删除专家记录' },
      { id: 'expert_view_feedback', name: '查看专家反馈', description: '查看专家的反馈信息' },
      { id: 'expert_profile_edit', name: '编辑自己的专家资料', description: '专家编辑自己的资料' },
    ]
  },
  SALESPERSON: {
    id: 'salesperson',
    name: '业务员管理',
    description: '业务员信息的查看、编辑和绩效管理权限',
    permissions: [
      { id: 'salesperson_view', name: '查看业务员', description: '查看业务员信息' },
      { id: 'salesperson_add', name: '添加业务员', description: '添加新业务员' },
      { id: 'salesperson_edit', name: '编辑业务员', description: '编辑业务员信息' },
      { id: 'salesperson_delete', name: '删除业务员', description: '删除业务员记录' },
      { id: 'salesperson_view_performance', name: '查看业务员绩效', description: '查看业务员绩效数据' },
    ]
  },
  PROSPECTUS: {
    id: 'prospectus',
    name: '招商简章管理',
    description: '招商简章的上传、下载和管理权限',
    permissions: [
      { id: 'prospectus_view', name: '查看简章', description: '查看招商简章列表' },
      { id: 'prospectus_upload', name: '上传简章', description: '上传新的招商简章' },
      { id: 'prospectus_edit', name: '编辑简章', description: '编辑简章信息' },
      { id: 'prospectus_delete', name: '删除简章', description: '删除简章文件' },
      { id: 'prospectus_download', name: '下载简章', description: '下载简章文件' },
      { id: 'prospectus_manage_category', name: '管理简章分类', description: '管理简章分类' },
    ]
  },
  POSTER: {
    id: 'poster',
    name: '海报生成',
    description: '海报生成和管理权限',
    permissions: [
      { id: 'poster_generate', name: '生成海报', description: '生成培训海报' },
      { id: 'poster_view_history', name: '查看海报历史', description: '查看海报生成历史' },
      { id: 'poster_config_template', name: '配置海报模板', description: '配置海报生成模板' },
    ]
  },
  DATA: {
    id: 'data',
    name: '数据管理',
    description: '数据导入导出和管理权限',
    permissions: [
      { id: 'data_import', name: '导入数据', description: '批量导入数据' },
      { id: 'data_export', name: '导出数据', description: '导出系统数据' },
      { id: 'data_download_template', name: '下载模板', description: '下载数据导入模板' },
      { id: 'data_view_history', name: '查看数据管理历史', description: '查看数据操作历史' },
    ]
  },
  SYSTEM: {
    id: 'system',
    name: '系统管理',
    description: '系统级管理权限',
    permissions: [
      { id: 'permission_manage', name: '管理权限', description: '管理用户权限' },
      { id: 'audit_log_view', name: '查看审计日志', description: '查看系统审计日志' },
      { id: 'system_config', name: '系统配置', description: '修改系统配置' },
      { id: 'user_account_manage', name: '用户账号管理', description: '管理用户账号状态' },
    ]
  }
};
```

### 3. 功能面板（导航菜单）访问控制

系统将导航菜单的访问权限与功能权限分离，实现两级控制：

```typescript
// 功能面板定义
interface MenuFeature {
  id: string;                    // 功能ID
  name: string;                  // 功能名称
  path: string;                  // 路由路径
  icon: string;                  // 图标
  requiredPermissions: string[]; // 该功能面板需要的基础权限
  description: string;           // 功能描述
}

const MENU_FEATURES: MenuFeature[] = [
  {
    id: 'dashboard',
    name: '仪表盘',
    path: '/dashboard',
    icon: 'chart-line',
    requiredPermissions: [],  // 所有角色都可访问
    description: '查看系统概览和统计数据'
  },
  {
    id: 'customer_management',
    name: '客户管理',
    path: '/customer-management',
    icon: 'users',
    requiredPermissions: ['customer_view'],
    description: '管理客户信息和跟进记录'
  },
  {
    id: 'training_management',
    name: '培训计划',
    path: '/training-management',
    icon: 'calendar',
    requiredPermissions: ['training_view'],
    description: '管理培训场次和参与者'
  },
  {
    id: 'expert_management',
    name: '专家管理',
    path: '/expert-management',
    icon: 'user-tie',
    requiredPermissions: ['expert_view'],
    description: '管理专家信息和课程'
  },
  {
    id: 'salesperson_management',
    name: '业务员管理',
    path: '/salesperson-management',
    icon: 'user-friends',
    requiredPermissions: ['salesperson_view'],
    description: '管理业务员信息和绩效'
  },
  {
    id: 'prospectus_management',
    name: '招商简章',
    path: '/prospectus-management',
    icon: 'file-alt',
    requiredPermissions: ['prospectus_view'],
    description: '管理招商简章文件'
  },
  {
    id: 'poster_generator',
    name: '海报生成',
    path: '/poster-generator',
    icon: 'image',
    requiredPermissions: ['poster_generate'],
    description: '生成培训宣传海报'
  },
  {
    id: 'data_management',
    name: '数据管理',
    path: '/data-management',
    icon: 'database',
    requiredPermissions: ['data_import', 'data_export'],  // 需要任一权限
    description: '批量导入导出数据'
  },
  {
    id: 'sales_tracking',
    name: '销售追踪',
    path: '/sales-tracking',
    icon: 'chart-bar',
    requiredPermissions: ['salesperson_view_performance'],
    description: '查看销售数据和绩效'
  },
  {
    id: 'permission_management',
    name: '权限管理',
    path: '/permission-management',
    icon: 'shield-alt',
    requiredPermissions: ['permission_manage'],
    description: '管理用户权限'
  },
  {
    id: 'audit_logs',
    name: '审计日志',
    path: '/audit-logs',
    icon: 'history',
    requiredPermissions: ['audit_log_view'],
    description: '查看系统操作日志'
  },
  {
    id: 'profile_settings',
    name: '个人设置',
    path: '/profile-settings',
    icon: 'cog',
    requiredPermissions: [],  // 所有角色都可访问
    description: '管理个人资料和偏好'
  }
];

// 角色默认可访问的功能面板
const ROLE_DEFAULT_MENU_FEATURES = {
  admin: [
    // 管理员可访问所有功能
    ...MENU_FEATURES.map(f => f.id)
  ],
  salesperson: [
    // 业务员默认功能面板
    'dashboard',
    'customer_management',
    'training_management',
    'expert_management',
    'prospectus_management',
    'profile_settings',
  ],
  expert: [
    // 专家默认功能面板
    'dashboard',
    'training_management',
    'expert_management',
    'prospectus_management',
    'profile_settings',
  ]
};
```

#### 功能面板与权限的关联关系

```typescript
// 用户可访问的功能面板
interface UserMenuAccess {
  user_id: string;
  menu_feature_id: string;
  enabled: boolean;  // 是否启用该功能面板
}

// 功能面板访问验证逻辑
function canAccessMenuFeature(
  user: UserWithPermissions, 
  featureId: string
): boolean {
  const feature = MENU_FEATURES.find(f => f.id === featureId);
  if (!feature) return false;
  
  // 1. 检查功能面板是否对该用户启用
  const menuAccess = getUserMenuAccess(user.id, featureId);
  if (!menuAccess || !menuAccess.enabled) return false;
  
  // 2. 检查用户是否拥有该功能面板所需的任一权限
  if (feature.requiredPermissions.length === 0) return true;
  
  return feature.requiredPermissions.some(permission => 
    user.permissions.includes(permission)
  );
}
```

### 4. 角色默认权限模板

```typescript
const ROLE_DEFAULT_PERMISSIONS = {
  admin: [
    // 管理员拥有所有权限
    ...Object.values(PERMISSION_CATEGORIES).flatMap(cat => 
      cat.permissions.map(p => p.id)
    )
  ],
  salesperson: [
    // 业务员基础权限
    'customer_view',
    'customer_add',
    'customer_edit',
    'training_view',
    'training_add_participant',
    'expert_view',
    'prospectus_view',
    'prospectus_download',
  ],
  expert: [
    // 专家基础权限
    'training_view',
    'expert_view',
    'expert_profile_edit',
    'prospectus_view',
  ]
};
```

### 5. 服务接口设计

#### PermissionService

```typescript
class PermissionService {
  // 获取所有权限定义
  async getAllPermissions(): Promise<Permission[]>
  
  // 获取权限分类
  async getPermissionCategories(): Promise<PermissionCategory[]>
  
  // 获取用户权限
  async getUserPermissions(userId: string): Promise<string[]>
  
  // 更新用户权限
  async updateUserPermissions(
    userId: string, 
    permissionIds: string[]
  ): Promise<void>
  
  // 批量更新用户权限（针对选中的用户）
  async batchUpdateUserPermissions(
    userIds: string[], 
    permissionIds: string[], 
    action: 'grant' | 'revoke'
  ): Promise<BatchUpdateResult>
  
  // 批量更新角色权限（针对指定角色的所有用户）
  async batchUpdateRolePermissions(
    role: UserRole,
    permissionIds: string[],
    strategy: 'override' | 'merge' | 'reset'
  ): Promise<BatchUpdateResult>
  
  // 获取角色默认权限
  async getRoleDefaultPermissions(role: UserRole): Promise<string[]>
  
  // 应用角色默认权限
  async applyRoleDefaultPermissions(
    userId: string, 
    role: UserRole
  ): Promise<void>
}
```

#### MenuAccessService (新增)

```typescript
class MenuAccessService {
  // 获取所有功能面板定义
  async getAllMenuFeatures(): Promise<MenuFeature[]>
  
  // 获取用户可访问的功能面板
  async getUserMenuAccess(userId: string): Promise<string[]>
  
  // 更新用户功能面板访问权限
  async updateUserMenuAccess(
    userId: string, 
    featureIds: string[]
  ): Promise<void>
  
  // 获取角色默认功能面板
  async getRoleDefaultMenuFeatures(role: UserRole): Promise<string[]>
  
  // 批量更新功能面板访问权限（针对选中的用户）
  async batchUpdateMenuAccess(
    userIds: string[], 
    featureIds: string[], 
    action: 'enable' | 'disable'
  ): Promise<BatchUpdateResult>
  
  // 批量更新角色功能面板访问权限（针对指定角色的所有用户）
  async batchUpdateRoleMenuAccess(
    role: UserRole,
    featureIds: string[],
    strategy: 'override' | 'merge' | 'reset'
  ): Promise<BatchUpdateResult>
  
  // 验证用户是否可访问功能面板
  async canAccessMenuFeature(
    userId: string, 
    featureId: string
  ): Promise<boolean>
}
```


#### UserService (扩展)

```typescript
interface UserWithPermissionsAndMenu extends UserWithPermissions {
  menuAccess: string[];  // 可访问的功能面板ID列表
}

class UserService {
  // 获取所有用户（包含权限和功能面板信息）
  async getAllUsersWithPermissions(): Promise<UserWithPermissionsAndMenu[]>
  
  // 获取指定角色的用户
  async getUsersByRole(role: UserRole): Promise<UserWithPermissionsAndMenu[]>
  
  // 搜索用户
  async searchUsers(
    searchTerm: string, 
    filters?: UserFilters
  ): Promise<UserWithPermissionsAndMenu[]>
}
```

#### AuditService

```typescript
class AuditService {
  // 记录权限变更
  async logPermissionChange(
    operatorId: string,
    targetUserId: string,
    action: 'grant' | 'revoke',
    permissions: string[]
  ): Promise<void>
  
  // 获取用户权限变更历史
  async getUserPermissionHistory(
    userId: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<PermissionChangeLog[]>
  
  // 获取权限变更统计
  async getPermissionChangeStats(
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<PermissionChangeStats>
}
```

### 6. 前端组件设计

#### PermissionManagement 页面组件

```typescript
interface PermissionManagementProps {}

interface PermissionManagementState {
  users: UserWithPermissionsAndMenu[];
  filteredUsers: UserWithPermissionsAndMenu[];
  permissionCategories: PermissionCategory[];
  menuFeatures: MenuFeature[];
  searchTerm: string;
  selectedRole: UserRole | 'all';
  selectedUser: UserWithPermissionsAndMenu | null;
  isPermissionModalOpen: boolean;
  isRolePermissionModalOpen: boolean;  // 角色权限设置模态框
  selectedPermissions: string[];
  selectedMenuFeatures: string[];
  isLoading: boolean;
  selectedUsers: string[];  // 批量操作
  activeTab: 'permissions' | 'menu';  // 当前标签页
  selectedRoleForBatch: UserRole | null;  // 批量设置的目标角色
}

// 主要功能方法
- loadUsers(): 加载所有用户
- loadPermissions(): 加载权限定义
- loadMenuFeatures(): 加载功能面板定义
- filterUsers(): 筛选用户列表

// 单个用户权限管理
- openPermissionModal(user): 打开单个用户权限设置模态框
- savePermissions(): 保存单个用户权限配置
- saveMenuAccess(): 保存单个用户功能面板访问配置

// 角色批量权限管理
- openRolePermissionModal(role): 打开角色权限设置模态框
- saveRolePermissions(role): 为指定角色的所有用户批量设置权限
- saveRoleMenuAccess(role): 为指定角色的所有用户批量设置功能面板

// 选中用户批量操作
- batchGrantPermissions(): 批量授予权限（针对选中的用户）
- batchRevokePermissions(): 批量撤销权限（针对选中的用户）
- batchEnableMenuFeatures(): 批量启用功能面板（针对选中的用户）
- batchDisableMenuFeatures(): 批量禁用功能面板（针对选中的用户）
```

#### 页面布局设计

```
┌─────────────────────────────────────────────────────────────┐
│  权限管理                                          [通知]    │
├─────────────────────────────────────────────────────────────┤
│  [统计卡片: 用户总数] [统计卡片: 权限总数]                  │
├─────────────────────────────────────────────────────────────┤
│  [搜索框]  [角色筛选]  [批量操作▼]                          │
│                                                              │
│  [按角色批量设置权限]                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 管理员 [设置权限] │ 业务员 [设置权限] │ 专家 [设置权限] │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  用户列表                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [☐] 张三  │ 业务员 │ 销售一部 │ 在职 │ 6个权限 │ [管理] │  │
│  │ [☐] 李四  │ 业务员 │ 销售二部 │ 在职 │ 8个权限 │ [管理] │  │
│  │ [☐] 王五  │ 专家   │ 培训部   │ 在职 │ 4个权限 │ [管理] │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [选中 3 个用户] [批量授予权限] [批量撤销权限]              │
└─────────────────────────────────────────────────────────────┘
```

#### PermissionModal 模态框组件（单个用户）

```typescript
interface PermissionModalProps {
  user: UserWithPermissionsAndMenu;
  permissionCategories: PermissionCategory[];
  menuFeatures: MenuFeature[];
  selectedPermissions: string[];
  selectedMenuFeatures: string[];
  onPermissionsChange: (permissions: string[]) => void;
  onMenuFeaturesChange: (features: string[]) => void;
  onSave: () => void;
  onClose: () => void;
}

// 功能特性
- 双标签页设计：权限配置 / 功能面板配置
- 按分类展示权限
- 显示功能面板与权限的关联关系
- 支持全选/清空分类
- 显示权限依赖关系
- 权限冲突检测
- 快速应用角色模板
- 功能面板启用时自动检查所需权限
```

#### RolePermissionModal 模态框组件（角色批量设置）

```typescript
interface RolePermissionModalProps {
  role: UserRole;
  permissionCategories: PermissionCategory[];
  menuFeatures: MenuFeature[];
  defaultPermissions: string[];  // 该角色的默认权限
  defaultMenuFeatures: string[];  // 该角色的默认功能面板
  selectedPermissions: string[];
  selectedMenuFeatures: string[];
  onPermissionsChange: (permissions: string[]) => void;
  onMenuFeaturesChange: (features: string[]) => void;
  onSave: () => void;
  onClose: () => void;
  affectedUserCount: number;  // 将受影响的用户数量
}

// 功能特性
- 显示将受影响的用户数量
- 双标签页设计：权限配置 / 功能面板配置
- 按分类展示权限
- 显示角色默认权限模板
- 支持全选/清空分类
- 批量应用确认提示
- 显示操作影响范围
- 可选择是否覆盖用户的个性化权限设置

// 批量设置策略选项
enum BatchUpdateStrategy {
  OVERRIDE = 'override',      // 完全覆盖：清除用户现有权限，应用新权限
  MERGE = 'merge',            // 合并模式：保留用户现有权限，添加新权限
  RESET_TO_ROLE = 'reset'     // 重置为角色默认：应用角色默认权限模板
}
```

#### PermissionGuard 权限守卫组件

```typescript
interface PermissionGuardProps {
  permission: string | string[];  // 需要的权限
  requireAll?: boolean;            // 是否需要所有权限
  fallback?: React.ReactNode;      // 无权限时显示的内容
  children: React.ReactNode;
}

// 使用示例
<PermissionGuard permission="customer_add">
  <Button>添加客户</Button>
</PermissionGuard>

<PermissionGuard 
  permission={['customer_edit', 'customer_delete']} 
  requireAll={false}
>
  <CustomerActions />
</PermissionGuard>
```

### 7. 权限验证机制

#### 前端权限验证

```typescript
// AuthContext 扩展
interface AuthContextType {
  user: User | null;
  permissions: string[];
  menuAccess: string[];  // 可访问的功能面板
  
  // 检查单个权限
  hasPermission(permission: string): boolean;
  
  // 检查多个权限（任一）
  hasAnyPermission(permissions: string[]): boolean;
  
  // 检查多个权限（全部）
  hasAllPermissions(permissions: string[]): boolean;
  
  // 检查是否可访问功能面板
  canAccessMenu(featureId: string): boolean;
  
  // 检查是否为管理员
  isAdmin(): boolean;
}

// 使用示例
const { hasPermission, canAccessMenu } = useContext(AuthContext);

// 检查功能权限
if (hasPermission('customer_add')) {
  // 显示添加客户按钮
}

// 检查功能面板访问权限
if (canAccessMenu('poster_generator')) {
  // 在侧边栏显示海报生成菜单项
}
```

#### Sidebar 组件集成

```typescript
// Sidebar 组件中的菜单项渲染逻辑
function Sidebar() {
  const { canAccessMenu, hasAnyPermission } = useContext(AuthContext);
  
  const menuItems = MENU_FEATURES.filter(feature => {
    // 1. 检查功能面板是否启用
    if (!canAccessMenu(feature.id)) return false;
    
    // 2. 检查是否有所需权限
    if (feature.requiredPermissions.length === 0) return true;
    return hasAnyPermission(feature.requiredPermissions);
  });
  
  return (
    <nav>
      {menuItems.map(item => (
        <MenuItem key={item.id} {...item} />
      ))}
    </nav>
  );
}
```

#### 后端权限验证（Supabase RLS）

```sql
-- 示例：客户表的权限策略
CREATE POLICY "Users with customer_view can view customers"
ON public.customers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid()
    AND permission_id = 'customer_view'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_permissions
    WHERE user_id = auth.uid()
    AND permission_id = 'customer_view_all'
  )
  OR
  (
    salesperson_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_id = auth.uid()
      AND permission_id = 'customer_view'
    )
  )
);
```

## 数据库设计

### 权限表结构（已存在）

```sql
-- permissions 表
CREATE TABLE public.permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT
);

-- user_permissions 表
CREATE TABLE public.user_permissions (
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  permission_id TEXT REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, permission_id)
);
```

### 功能面板访问表（新增）

```sql
-- menu_features 表 - 功能面板定义
CREATE TABLE IF NOT EXISTS public.menu_features (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  required_permissions TEXT[],  -- 所需权限列表
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_menu_access 表 - 用户功能面板访问权限
CREATE TABLE IF NOT EXISTS public.user_menu_access (
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  menu_feature_id TEXT REFERENCES public.menu_features(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, menu_feature_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_menu_access_user 
ON public.user_menu_access(user_id);

CREATE INDEX IF NOT EXISTS idx_user_menu_access_feature 
ON public.user_menu_access(menu_feature_id);

-- RLS 策略
ALTER TABLE public.menu_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_menu_access ENABLE ROW LEVEL SECURITY;

-- 所有认证用户可以查看功能面板定义
CREATE POLICY "Anyone authenticated can view menu features" 
ON public.menu_features
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 用户可以查看自己的功能面板访问权限
CREATE POLICY "Users can view their own menu access" 
ON public.user_menu_access
FOR SELECT USING (user_id = auth.uid());

-- 管理员可以管理所有用户的功能面板访问权限
CREATE POLICY "Admins can manage all menu access" 
ON public.user_menu_access
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 需要添加的功能面板数据

```sql
-- 插入功能面板定义
INSERT INTO public.menu_features (id, name, path, icon, description, required_permissions, display_order) VALUES
('dashboard', '仪表盘', '/dashboard', 'chart-line', '查看系统概览和统计数据', '{}', 1),
('customer_management', '客户管理', '/customer-management', 'users', '管理客户信息和跟进记录', '{customer_view}', 2),
('training_management', '培训计划', '/training-management', 'calendar', '管理培训场次和参与者', '{training_view}', 3),
('expert_management', '专家管理', '/expert-management', 'user-tie', '管理专家信息和课程', '{expert_view}', 4),
('salesperson_management', '业务员管理', '/salesperson-management', 'user-friends', '管理业务员信息和绩效', '{salesperson_view}', 5),
('prospectus_management', '招商简章', '/prospectus-management', 'file-alt', '管理招商简章文件', '{prospectus_view}', 6),
('poster_generator', '海报生成', '/poster-generator', 'image', '生成培训宣传海报', '{poster_generate}', 7),
('data_management', '数据管理', '/data-management', 'database', '批量导入导出数据', '{data_import,data_export}', 8),
('sales_tracking', '销售追踪', '/sales-tracking', 'chart-bar', '查看销售数据和绩效', '{salesperson_view_performance}', 9),
('permission_management', '权限管理', '/permission-management', 'shield-alt', '管理用户权限', '{permission_manage}', 10),
('audit_logs', '审计日志', '/audit-logs', 'history', '查看系统操作日志', '{audit_log_view}', 11),
('profile_settings', '个人设置', '/profile-settings', 'cog', '管理个人资料和偏好', '{}', 12)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  path = EXCLUDED.path,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  required_permissions = EXCLUDED.required_permissions,
  display_order = EXCLUDED.display_order;
```

### 需要添加的权限数据

```sql
-- 插入新的权限定义
INSERT INTO public.permissions (id, name, description, category) VALUES
-- 客户管理
('customer_view_all', '查看所有客户', '查看所有业务员的客户（跨业务员）', '客户管理'),
('customer_delete', '删除客户', '删除客户记录', '客户管理'),
('customer_export', '导出客户', '导出客户数据', '客户管理'),

-- 培训管理
('training_delete', '删除培训', '删除培训场次', '培训管理'),
('training_manage_participant', '管理培训参与者', '管理培训参与者信息', '培训管理'),
('training_view_stats', '查看培训统计', '查看培训统计数据', '培训管理'),

-- 专家管理
('expert_delete', '删除专家', '删除专家记录', '专家管理'),
('expert_view_feedback', '查看专家反馈', '查看专家的反馈信息', '专家管理'),

-- 业务员管理
('salesperson_delete', '删除业务员', '删除业务员记录', '业务员管理'),
('salesperson_view_performance', '查看业务员绩效', '查看业务员绩效数据', '业务员管理'),

-- 招商简章管理
('prospectus_view', '查看简章', '查看招商简章列表', '招商简章管理'),
('prospectus_upload', '上传简章', '上传新的招商简章', '招商简章管理'),
('prospectus_edit', '编辑简章', '编辑简章信息', '招商简章管理'),
('prospectus_delete', '删除简章', '删除简章文件', '招商简章管理'),
('prospectus_download', '下载简章', '下载简章文件', '招商简章管理'),
('prospectus_manage_category', '管理简章分类', '管理简章分类', '招商简章管理'),

-- 海报生成
('poster_generate', '生成海报', '生成培训海报', '海报生成'),
('poster_view_history', '查看海报历史', '查看海报生成历史', '海报生成'),
('poster_config_template', '配置海报模板', '配置海报生成模板', '海报生成'),

-- 数据管理
('data_import', '导入数据', '批量导入数据', '数据管理'),
('data_download_template', '下载模板', '下载数据导入模板', '数据管理'),
('data_view_history', '查看数据管理历史', '查看数据操作历史', '数据管理'),

-- 系统管理
('audit_log_view', '查看审计日志', '查看系统审计日志', '系统管理'),
('system_config', '系统配置', '修改系统配置', '系统管理'),
('user_account_manage', '用户账号管理', '管理用户账号状态', '系统管理')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;
```


## 错误处理

### 错误类型定义

```typescript
enum PermissionErrorCode {
  PERMISSION_NOT_FOUND = 'PERMISSION_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INSUFFICIENT_PERMISSION = 'INSUFFICIENT_PERMISSION',
  PERMISSION_CONFLICT = 'PERMISSION_CONFLICT',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

interface PermissionError {
  code: PermissionErrorCode;
  message: string;
  details?: any;
}
```

### 错误处理策略

1. **权限不存在**: 显示友好提示，记录错误日志
2. **用户不存在**: 刷新用户列表，提示用户已被删除
3. **权限不足**: 显示无权限提示，引导联系管理员
4. **权限冲突**: 显示冲突详情，提供解决建议
5. **数据库错误**: 显示通用错误提示，记录详细错误日志

## 测试策略

### 单元测试

1. **权限验证逻辑测试**
   - 测试 hasPermission 方法
   - 测试 hasAnyPermission 方法
   - 测试 hasAllPermissions 方法

2. **权限服务测试**
   - 测试获取权限列表
   - 测试更新用户权限
   - 测试批量权限操作

3. **权限守卫组件测试**
   - 测试有权限时显示内容
   - 测试无权限时显示 fallback
   - 测试多权限组合逻辑

### 集成测试

1. **权限配置流程测试**
   - 测试打开权限模态框
   - 测试选择权限
   - 测试保存权限
   - 测试权限立即生效

2. **权限验证流程测试**
   - 测试页面访问控制
   - 测试功能按钮显示/隐藏
   - 测试 API 调用权限验证

3. **批量操作测试**
   - 测试批量授予权限
   - 测试批量撤销权限
   - 测试操作结果反馈

### 端到端测试

1. **完整权限管理流程**
   - 管理员登录
   - 查看用户列表
   - 为用户配置权限
   - 切换到该用户验证权限生效

2. **权限变更审计**
   - 修改用户权限
   - 查看审计日志
   - 验证日志记录完整性

## 性能优化

### 前端优化

1. **权限缓存**: 将用户权限缓存到 AuthContext，避免重复查询
2. **虚拟滚动**: 用户列表使用虚拟滚动，支持大量用户
3. **懒加载**: 权限模态框按需加载权限详情
4. **防抖搜索**: 搜索输入使用防抖，减少查询次数

### 后端优化

1. **索引优化**: 为 user_permissions 表添加复合索引
2. **批量查询**: 使用 JOIN 一次性获取用户和权限信息
3. **RLS 优化**: 优化 RLS 策略查询性能
4. **缓存策略**: 权限定义使用缓存，减少数据库查询

```sql
-- 添加复合索引
CREATE INDEX IF NOT EXISTS idx_user_permissions_composite 
ON public.user_permissions(user_id, permission_id);

-- 优化权限查询
CREATE INDEX IF NOT EXISTS idx_permissions_category 
ON public.permissions(category);
```

## 安全考虑

### 1. 权限验证双重保障

- 前端验证：提升用户体验，快速反馈
- 后端验证（RLS）：确保数据安全，防止绕过

### 2. 审计日志

- 记录所有权限变更操作
- 记录权限验证失败尝试
- 定期审查异常权限操作

### 3. 最小权限原则

- 默认权限模板遵循最小权限原则
- 定期审查用户权限，撤销不必要的权限
- 离职用户自动禁用账号和权限

### 4. 权限隔离

- 管理员权限与普通用户严格隔离
- 敏感操作（如删除）需要额外权限
- 跨业务员数据访问需要特殊权限

## 部署和迁移

### 数据库迁移步骤

1. **备份现有数据**
   ```bash
   # 备份 permissions 和 user_permissions 表
   pg_dump -t permissions -t user_permissions > permissions_backup.sql
   ```

2. **插入新权限定义**
   ```sql
   -- 执行权限插入 SQL
   ```

3. **插入功能面板定义**
   ```sql
   -- 执行功能面板插入 SQL
   ```

4. **为现有用户应用默认权限**
   ```sql
   -- 为所有管理员添加所有权限
   INSERT INTO user_permissions (user_id, permission_id)
   SELECT up.id, p.id
   FROM user_profiles up
   CROSS JOIN permissions p
   WHERE up.role = 'admin'
   ON CONFLICT DO NOTHING;
   
   -- 为业务员添加默认权限
   INSERT INTO user_permissions (user_id, permission_id)
   SELECT up.id, p.id
   FROM user_profiles up
   CROSS JOIN permissions p
   WHERE up.role = 'salesperson'
   AND p.id IN (
     'customer_view', 'customer_add', 'customer_edit',
     'training_view', 'training_add_participant',
     'expert_view', 'prospectus_view', 'prospectus_download'
   )
   ON CONFLICT DO NOTHING;
   ```

5. **为现有用户应用默认功能面板访问权限**
   ```sql
   -- 为所有管理员启用所有功能面板
   INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
   SELECT up.id, mf.id, true
   FROM user_profiles up
   CROSS JOIN menu_features mf
   WHERE up.role = 'admin'
   ON CONFLICT DO NOTHING;
   
   -- 为业务员启用默认功能面板
   INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
   SELECT up.id, mf.id, true
   FROM user_profiles up
   CROSS JOIN menu_features mf
   WHERE up.role = 'salesperson'
   AND mf.id IN (
     'dashboard', 'customer_management', 'training_management',
     'expert_management', 'prospectus_management', 'profile_settings'
   )
   ON CONFLICT DO NOTHING;
   
   -- 为专家启用默认功能面板
   INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
   SELECT up.id, mf.id, true
   FROM user_profiles up
   CROSS JOIN menu_features mf
   WHERE up.role = 'expert'
   AND mf.id IN (
     'dashboard', 'training_management', 'expert_management',
     'prospectus_management', 'profile_settings'
   )
   ON CONFLICT DO NOTHING;
   ```

6. **更新 RLS 策略**
   ```sql
   -- 更新相关表的 RLS 策略以使用新权限
   ```

7. **验证迁移结果**
   ```sql
   -- 检查权限数量
   SELECT COUNT(*) FROM permissions;
   
   -- 检查用户权限分配
   SELECT role, COUNT(DISTINCT user_id) as user_count
   FROM user_profiles up
   JOIN user_permissions uper ON up.id = uper.user_id
   GROUP BY role;
   ```

### 前端部署

1. 更新权限常量定义
2. 部署新的权限管理页面
3. 更新 AuthContext 权限验证逻辑
4. 在各功能页面添加权限守卫

## 监控和维护

### 监控指标

1. **权限使用统计**: 各权限的分配数量和使用频率
2. **权限验证失败率**: 监控权限验证失败的频率和原因
3. **权限变更频率**: 监控权限配置变更的频率
4. **异常权限操作**: 监控可疑的权限操作行为

### 维护任务

1. **定期权限审查**: 每季度审查用户权限配置
2. **清理无效权限**: 删除不再使用的权限定义
3. **优化权限结构**: 根据使用情况优化权限分类
4. **更新文档**: 保持权限文档与系统同步

## 未来扩展

### 1. 权限组/角色模板

- 创建预定义的权限组（如"高级业务员"、"培训主管"）
- 支持快速应用权限组到用户
- 权限组可以继承和组合

### 2. 时间限制权限

- 支持设置权限的有效期
- 临时权限自动过期
- 定期权限（如每月第一周有效）

### 3. 条件权限

- 基于条件的动态权限（如只能编辑自己创建的记录）
- 基于数据属性的权限（如只能查看本部门数据）

### 4. 权限申请流程

- 用户可以申请额外权限
- 管理员审批权限申请
- 权限申请历史记录

### 5. 权限分析报告

- 生成权限使用分析报告
- 识别权限配置异常
- 提供权限优化建议
