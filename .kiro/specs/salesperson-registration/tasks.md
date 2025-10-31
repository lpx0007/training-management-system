# Implementation Plan

- [x] 1. 数据库准备工作


  - [x] 1.1 检查并更新 user_profiles 表


    - 检查 status 字段是否存在
    - 如不存在则添加 status 字段，默认值为 'active'
    - 为现有记录设置状态为 'active'
    - _Requirements: 4.1, 4.4_
  
  - [x] 1.2 检查并更新 salespersons 表


    - 验证 user_id 和 status 字段已存在
    - 为现有记录设置默认状态为 'active'
    - 确保 user_id 外键约束正确
    - _Requirements: 4.1, 4.4_
  
  - [x] 1.3 创建数据库触发器


    - 创建 handle_new_user() 函数
    - 创建 on_auth_user_created 触发器
    - 测试触发器功能
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 1.4 添加数据库索引


    - 为 salespersons.status 添加索引（如不存在）
    - 为 user_profiles.status 添加索引（如不存在）
    - _Requirements: 4.1_

- [x] 2. 创建注册页面组件

  - [x] 2.1 创建 Register.tsx 页面组件


    - 创建基础页面结构
    - 添加表单布局
    - 实现响应式设计
    - _Requirements: 2.1_
  
  - [x] 2.2 实现注册表单字段

    - 添加姓名输入框
    - 添加邮箱输入框
    - 添加密码输入框
    - 添加确认密码输入框
    - 添加手机号输入框（可选）
    - 添加部门选择框（可选）
    - _Requirements: 2.1_
  
  - [x] 2.3 实现表单验证逻辑

    - 验证必填字段
    - 验证邮箱格式
    - 验证密码长度
    - 验证密码确认匹配
    - 显示实时验证错误
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 2.4 实现注册提交逻辑

    - 调用注册 API
    - 处理加载状态
    - 处理成功响应
    - 处理错误响应
    - 显示成功/错误提示
    - _Requirements: 3.1, 3.4, 3.5_

- [x] 3. 更新登录页面

  - [x] 3.1 添加注册入口链接


    - 在登录表单下方添加"注册账号"链接
    - 链接导航到注册页面
    - _Requirements: 1.1, 1.2_
  
  - [x] 3.2 实现用户状态检查逻辑


    - 登录成功后检查 user_profiles.status
    - 实现 timeout 机制（5秒超时）
    - 处理待审核状态
    - 处理已拒绝状态
    - 状态异常时自动登出
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 3.3 添加返回登录链接到注册页面

    - 在注册页面添加"已有账号？立即登录"链接
    - _Requirements: 1.3_

- [x] 4. 扩展 Supabase Service

  - [x] 4.1 实现 registerSalesperson 方法


    - 调用 Supabase Auth signUp
    - 传递用户元数据
    - 创建 salespersons 记录
    - 处理注册错误
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 4.2 实现 approveSalesperson 方法

    - 更新 salespersons.status 为 'active'
    - 更新 user_profiles.status 为 'active'
    - 使用事务确保一致性
    - _Requirements: 5.4_
  
  - [x] 4.3 实现 rejectSalesperson 方法

    - 更新 salespersons.status 为 'rejected'
    - 更新 user_profiles.status 为 'rejected'
    - 使用事务确保一致性
    - _Requirements: 5.5_
  
  - [x] 4.4 更新 getSalespersons 方法

    - 支持按 status 筛选
    - 返回 user_id 字段
    - _Requirements: 5.2_

- [x] 5. 更新业务员管理页面

  - [x] 5.1 添加状态筛选选项


    - 在筛选栏添加"待审核"选项
    - 实现状态筛选逻辑
    - _Requirements: 5.1, 5.2_
  
  - [x] 5.2 显示待审核业务员列表

    - 筛选 status 为 'pending' 的记录
    - 显示注册时间
    - 显示基本信息
    - _Requirements: 5.2_
  
  - [x] 5.3 添加审核操作按钮


    - 为每个待审核记录添加"通过"按钮
    - 为每个待审核记录添加"拒绝"按钮
    - 实现按钮点击处理
    - _Requirements: 5.3, 5.4, 5.5_
  
  - [x] 5.4 实现审核操作逻辑


    - 调用 approveSalesperson API
    - 调用 rejectSalesperson API
    - 刷新列表数据
    - 显示操作结果提示
    - _Requirements: 5.4, 5.5, 5.6_
  
  - [x] 5.5 保留现有添加业务员功能

    - 确保管理员创建的账号直接设置为 'active'
    - 无需审核即可使用
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 6. 更新路由配置


  - [x] 6.1 添加注册页面路由


    - 在 App.tsx 中添加 /register 路由
    - 配置为公开路由（无需登录）
    - _Requirements: 1.2_

- [x] 7. 类型定义更新


  - [x] 7.1 更新 Salesperson 类型

    - 添加 status 字段类型
    - 添加 user_id 字段类型
    - _Requirements: 4.1_
  
  - [x] 7.2 创建 RegisterFormData 类型

    - 定义注册表单数据结构
    - _Requirements: 2.1_

- [x] 8. 测试和验证


  - [x] 8.1 测试注册流程

    - 测试成功注册
    - 测试重复邮箱注册
    - 测试表单验证
    - 测试触发器执行
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  

  - [x] 8.2 测试登录限制

    - 测试待审核用户登录
    - 测试已拒绝用户登录
    - 测试已通过用户登录
    - 测试 timeout 机制
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  

  - [ ] 8.3 测试审核流程
    - 测试查看待审核列表
    - 测试通过审核
    - 测试拒绝审核
    - 测试审核后登录
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [x] 8.4 测试管理员创建功能


    - 测试直接创建账号
    - 验证状态为 'active'
    - 验证无需审核即可登录
    - _Requirements: 7.1, 7.2, 7.3_
