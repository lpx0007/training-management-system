# 业务员注册功能需求文档

## Introduction

本文档定义了培训管理系统的业务员自助注册功能，允许业务员自行注册账号，并通过管理员审核后获得系统访问权限。

## Glossary

- **System**: 培训管理系统
- **Salesperson**: 业务员用户
- **Admin**: 管理员用户
- **Registration**: 用户注册流程
- **Approval**: 管理员审核流程
- **Supabase Auth**: Supabase 身份认证服务
- **User Profile**: 用户配置文件表
- **Salesperson Record**: 业务员记录表

## Requirements

### Requirement 1: 用户注册入口

**User Story:** 作为一个潜在业务员，我想要在登录页面看到注册选项，以便我可以创建自己的账号。

#### Acceptance Criteria

1. WHEN 用户访问登录页面，THE System SHALL 显示"注册账号"链接或按钮
2. WHEN 用户点击注册链接，THE System SHALL 导航到注册页面
3. THE System SHALL 在注册页面显示返回登录的链接

### Requirement 2: 注册表单

**User Story:** 作为一个潜在业务员，我想要填写注册表单，以便提供我的基本信息创建账号。

#### Acceptance Criteria

1. THE System SHALL 提供包含以下字段的注册表单：姓名、邮箱、密码、确认密码、手机号、部门
2. WHEN 用户提交表单，THE System SHALL 验证所有必填字段已填写
3. WHEN 用户输入邮箱，THE System SHALL 验证邮箱格式正确
4. WHEN 用户输入密码，THE System SHALL 验证密码长度至少6个字符
5. WHEN 用户输入确认密码，THE System SHALL 验证两次密码输入一致
6. IF 表单验证失败，THEN THE System SHALL 显示具体的错误提示信息

### Requirement 3: 账号创建

**User Story:** 作为一个潜在业务员，我想要系统自动创建我的账号，以便我可以在审核通过后登录。

#### Acceptance Criteria

1. WHEN 用户提交有效的注册表单，THE System SHALL 在 Supabase Auth 中创建用户账号
2. WHEN Supabase Auth 创建用户成功，THE System SHALL 自动创建 user_profiles 记录，role 设置为 'salesperson'，status 设置为 'pending'
3. WHEN user_profiles 创建成功，THE System SHALL 自动创建 salespersons 记录，status 设置为 'pending'
4. WHEN 账号创建成功，THE System SHALL 显示"注册成功，等待管理员审核"的提示信息
5. IF 邮箱已被注册，THEN THE System SHALL 显示"该邮箱已被注册"的错误提示

### Requirement 4: 数据库触发器

**User Story:** 作为系统管理员，我想要在用户注册时自动创建关联记录，以便确保数据一致性。

#### Acceptance Criteria

1. WHEN 新用户在 auth.users 表中创建，THE System SHALL 自动触发 handle_new_user 函数
2. THE handle_new_user 函数 SHALL 在 user_profiles 表中创建记录，使用 auth.users.id 作为主键
3. THE handle_new_user 函数 SHALL 从 auth.users.raw_user_meta_data 中提取用户姓名
4. THE handle_new_user 函数 SHALL 设置默认 role 为 'salesperson'

### Requirement 5: 管理员审核界面

**User Story:** 作为管理员，我想要查看待审核的业务员列表，以便我可以审核新注册的账号。

#### Acceptance Criteria

1. THE System SHALL 在业务员管理页面显示"待审核"筛选选项
2. WHEN 管理员选择"待审核"筛选，THE System SHALL 显示所有 status 为 'pending' 的业务员
3. THE System SHALL 为每个待审核业务员显示"通过"和"拒绝"按钮
4. WHEN 管理员点击"通过"按钮，THE System SHALL 更新 salespersons.status 为 'active' 和 user_profiles.status 为 'active'
5. WHEN 管理员点击"拒绝"按钮，THE System SHALL 更新 salespersons.status 为 'rejected' 和 user_profiles.status 为 'rejected'
6. WHEN 审核操作完成，THE System SHALL 显示操作成功的提示信息

### Requirement 6: 登录限制

**User Story:** 作为系统管理员，我想要限制未审核通过的业务员登录，以便确保只有授权用户可以访问系统。

#### Acceptance Criteria

1. WHEN 用户尝试登录，THE System SHALL 检查 user_profiles.status
2. IF user_profiles.status 为 'pending'，THEN THE System SHALL 拒绝登录并显示"账号审核中，请等待管理员审核"
3. IF user_profiles.status 为 'rejected'，THEN THE System SHALL 拒绝登录并显示"账号审核未通过，请联系管理员"
4. IF user_profiles.status 为 'active'，THEN THE System SHALL 允许登录

### Requirement 7: 管理员直接创建功能保留

**User Story:** 作为管理员，我想要保留直接创建业务员账号的功能，以便在特殊情况下快速添加用户。

#### Acceptance Criteria

1. THE System SHALL 保留现有的"添加业务员"功能
2. WHEN 管理员通过"添加业务员"创建账号，THE System SHALL 直接设置 status 为 'active'
3. WHEN 管理员创建的账号 SHALL 无需审核即可登录
