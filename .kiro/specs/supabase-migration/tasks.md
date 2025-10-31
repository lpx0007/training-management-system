# Implementation Plan

## Phase 1: Supabase 项目设置和数据库配置

- [ ] 1. 创建和配置 Supabase 项目
  - 在 Supabase 官网创建新项目
  - 记录项目 URL 和 anon key
  - 配置项目区域（选择最近的数据中心）
  - _Requirements: 1.1, 7.1_

- [ ] 1.1 设计和创建数据库表结构
  - 创建 user_profiles 表
  - 创建 customers 表及索引
  - 创建 experts 表
  - 创建 salespersons 表和 salesperson_performance 表
  - 创建 courses 表
  - 创建 training_sessions 表
  - 创建 training_participants 表
  - 创建 customer_training_history 表
  - 创建 permissions 表和 user_permissions 关联表
  - 创建 expert_feedback 表
  - _Requirements: 1.1, 1.2_

- [ ] 1.2 配置数据库索引
  - 为 customers 表添加性能索引
  - 为 training_sessions 表添加性能索引
  - 为 user_profiles 表添加索引
  - _Requirements: 1.4, 9.3_

- [ ] 1.3 配置 Row Level Security (RLS) 策略
  - 启用所有表的 RLS
  - 配置 user_profiles 的访问策略
  - 配置 customers 的访问策略（管理员全部，业务员仅自己）
  - 配置 training_sessions 的访问策略
  - 配置 experts 的访问策略
  - 配置 courses 的访问策略（公开读取，管理员写入）
  - _Requirements: 1.3, 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 1.4 创建测试用户数据
  - 在 Supabase Auth 中创建测试管理员账户
  - 在 Supabase Auth 中创建测试业务员账户
  - 在 Supabase Auth 中创建测试专家账户
  - 在 user_profiles 表中添加对应的用户资料
  - _Requirements: 1.5, 2.1_

- [ ] 1.5 验证数据库连接和权限
  - 使用 Supabase Studio 测试表查询
  - 验证 RLS 策略是否正确工作
  - 测试不同角色的数据访问权限
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

## Phase 2: 前端代码准备和依赖安装

- [x] 2. 安装 Supabase 客户端依赖



  - 安装 @supabase/supabase-js 包
  - 更新 package.json
  - _Requirements: 3.1_

- [x] 2.1 创建环境变量配置


  - 创建 .env.example 文件模板
  - 创建 .env.local 文件（不提交到 Git）
  - 添加 VITE_SUPABASE_URL 变量
  - 添加 VITE_SUPABASE_ANON_KEY 变量
  - 更新 .gitignore 确保 .env.local 不被提交
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2.2 创建 Supabase 类型定义


  - 创建 src/lib/supabase/types.ts
  - 定义 Database 接口
  - 定义所有表的 Row、Insert、Update 类型
  - 导出类型供其他模块使用
  - _Requirements: 3.1_

- [x] 2.3 创建 Supabase 客户端实例


  - 创建 src/lib/supabase/client.ts
  - 初始化 Supabase 客户端
  - 配置认证持久化选项
  - 配置实时订阅选项
  - 添加环境变量验证
  - _Requirements: 3.1, 7.4_

- [x] 2.4 创建错误处理工具


  - 创建 src/lib/supabase/errorHandler.ts
  - 实现 SupabaseError 类
  - 实现 handleSupabaseError 函数
  - 添加常见错误的友好提示
  - _Requirements: 8.1, 8.4_

## Phase 3: 实现 Supabase 服务层

- [ ] 3. 创建 SupabaseService 基础结构



  - 创建 src/lib/supabase/supabaseService.ts
  - 定义 SupabaseService 类
  - 导出单例实例
  - _Requirements: 3.1, 3.2_


- [ ] 3.1 实现认证相关方法
  - 实现 signIn 方法（邮箱密码登录）
  - 实现 signOut 方法
  - 实现 getCurrentUser 方法
  - 实现 getUserProfile 方法
  - 添加认证状态监听
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_


- [ ] 3.2 实现客户管理方法
  - 实现 getCustomers 方法（带权限过滤）
  - 实现 getCustomerById 方法
  - 实现 addCustomer 方法
  - 实现 updateCustomer 方法
  - 实现 deleteCustomer 方法
  - 添加错误处理

  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3.3 实现培训场次管理方法
  - 实现 getTrainingSessions 方法
  - 实现 getTrainingSessionById 方法
  - 实现 addTrainingSession 方法
  - 实现 updateTrainingSession 方法
  - 实现 deleteTrainingSession 方法

  - 实现 getTrainingSessionsBySalesperson 方法
  - _Requirements: 3.1, 3.2, 3.4_

- [ ] 3.4 实现培训参与者管理方法
  - 实现 addCustomerToTraining 方法

  - 实现 getTrainingParticipants 方法
  - 实现 removeParticipantFromTraining 方法
  - _Requirements: 3.1, 3.2_

- [ ] 3.5 实现专家管理方法
  - 实现 getExperts 方法
  - 实现 getExpertById 方法

  - 实现 addExpert 方法
  - 实现 updateExpert 方法
  - 实现 deleteExpert 方法
  - _Requirements: 3.1, 3.2_

- [ ] 3.6 实现业务员管理方法
  - 实现 getSalespersons 方法
  - 实现 getSalespersonById 方法

  - 实现 addSalesperson 方法
  - 实现 updateSalesperson 方法
  - 实现 deleteSalesperson 方法
  - 实现 updateSalespersonPermissions 方法
  - _Requirements: 3.1, 3.2_

- [x] 3.7 实现课程管理方法

  - 实现 getCourses 方法
  - 实现 getCourseById 方法
  - 实现 addCourse 方法
  - 实现 updateCourse 方法
  - 实现 deleteCourse 方法

  - _Requirements: 3.1, 3.2_

- [ ] 3.8 实现权限管理方法
  - 实现 getPermissions 方法
  - 实现 getUserPermissions 方法
  - 实现 updateUserPermissions 方法
  - _Requirements: 3.1, 3.2_

- [ ] 3.9 实现实时订阅功能
  - 实现 subscribeToCustomers 方法
  - 实现 subscribeToTrainingSessions 方法
  - 实现 unsubscribe 方法
  - 添加重连逻辑




  - _Requirements: 4.1, 4.2, 4.4_

- [ ]* 3.10 添加服务层单元测试
  - 测试认证方法
  - 测试 CRUD 操作
  - 测试错误处理

  - 测试实时订阅
  - _Requirements: 12.1_

## Phase 4: 更新认证系统

- [ ] 4. 重构 AuthContext
  - 更新 src/contexts/authContext.ts
  - 修改 User 接口以匹配 Supabase 用户结构

  - 添加 session 状态管理
  - 添加 loading 状态
  - _Requirements: 2.1, 2.2, 2.3, 11.3_

- [ ] 4.1 更新 App.tsx 中的认证逻辑
  - 替换 login 函数使用 supabaseService.signIn
  - 替换 logout 函数使用 supabaseService.signOut

  - 添加认证状态监听
  - 实现自动登录（session 恢复）
  - 更新 hasPermission 逻辑
  - 更新 canViewCustomer 逻辑
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 11.3_

- [ ] 4.2 更新 Login 组件
  - 修改登录表单使用邮箱而非用户名
  - 更新登录逻辑调用新的认证服务
  - 添加加载状态显示
  - 改进错误提示



  - 更新测试账号说明
  - _Requirements: 2.1, 2.4, 11.1, 11.3_

- [ ] 4.3 添加认证加载状态
  - 创建 LoadingSpinner 组件
  - 在 App.tsx 中添加初始化加载状态
  - 防止未认证时闪现内容



  - _Requirements: 2.3, 11.4_

- [ ]* 4.4 测试认证流程
  - 测试登录功能
  - 测试登出功能
  - 测试 session 持久化
  - 测试权限检查


  - _Requirements: 12.1, 12.2_

## Phase 5: 更新数据管理组件

- [ ] 5. 更新 Dashboard 组件
  - 替换 dataService 为 supabaseService
  - 更新培训场次数据获取


  - 添加加载状态
  - 添加错误处理
  - 保持 UI 不变
  - _Requirements: 3.1, 11.1, 11.4_


- [ ] 5.1 更新 CustomerManagement 组件
  - 替换所有 dataService 调用为 supabaseService
  - 更新客户列表获取逻辑
  - 更新添加客户逻辑
  - 更新编辑客户逻辑
  - 更新删除客户逻辑
  - 添加实时订阅（客户变更自动更新）
  - 添加加载和错误状态

  - _Requirements: 3.1, 3.2, 4.1, 4.2, 11.1, 11.4_

- [ ] 5.2 更新 TrainingPerformance 组件
  - 替换 dataService 为 supabaseService
  - 更新培训场次列表获取

  - 更新添加培训场次逻辑
  - 更新添加客户到培训逻辑
  - 添加实时订阅
  - 添加加载和错误状态
  - _Requirements: 3.1, 3.2, 4.1, 11.1, 11.4_


- [ ] 5.3 更新 ExpertManagement 组件
  - 替换 dataService 为 supabaseService
  - 更新专家列表获取
  - 更新专家信息编辑
  - 添加加载和错误状态

  - _Requirements: 3.1, 3.2, 11.1, 11.4_

- [ ] 5.4 更新 SalesPersonManagement 组件
  - 替换 dataService 为 supabaseService
  - 更新业务员列表获取
  - 更新业务员添加逻辑
  - 更新业务员删除逻辑
  - 更新权限管理逻辑
  - 添加加载和错误状态
  - _Requirements: 3.1, 3.2, 11.1, 11.4_

- [ ] 5.5 更新 SalesTracking 组件
  - 替换 dataService 为 supabaseService
  - 更新销售数据获取
  - 添加加载和错误状态
  - _Requirements: 3.1, 11.1, 11.4_

- [ ] 5.6 更新 DataExport 组件
  - 保持前端导出逻辑
  - 更新数据源为 supabaseService
  - 添加加载状态
  - _Requirements: 3.1, 11.1, 11.4_

- [ ] 5.7 更新 PermissionManagement 组件
  - 替换 dataService 为 supabaseService
  - 更新权限列表获取
  - 更新用户权限管理
  - 添加加载和错误状态
  - _Requirements: 3.1, 3.2, 11.1, 11.4_

- [ ] 5.8 更新 Sidebar 组件
  - 确保权限检查使用新的认证系统
  - 验证导航菜单根据角色正确显示
  - _Requirements: 11.1, 11.4_

- [ ]* 5.9 组件集成测试
  - 测试所有页面的数据加载
  - 测试 CRUD 操作
  - 测试权限控制
  - 测试实时更新
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

## Phase 6: 性能优化

- [ ] 6. 实现数据缓存机制
  - 创建 src/lib/cache/cacheManager.ts
  - 实现缓存 get/set/invalidate 方法
  - 在 supabaseService 中集成缓存
  - 配置合理的 TTL
  - _Requirements: 9.2_

- [ ] 6.1 实现分页加载
  - 在客户列表中添加分页
  - 在培训场次列表中添加分页
  - 优化每页显示数量
  - _Requirements: 9.1_

- [ ] 6.2 优化查询性能
  - 使用 select 指定需要的字段
  - 使用 join 减少查询次数
  - 添加查询结果缓存
  - _Requirements: 9.3, 9.5_

- [ ] 6.3 实现虚拟滚动（可选）
  - 在大列表中实现虚拟滚动
  - 减少 DOM 节点数量
  - _Requirements: 9.4_

- [ ]* 6.4 性能测试
  - 测试页面加载时间
  - 测试大数据量场景
  - 测试并发用户场景
  - _Requirements: 12.4_

## Phase 7: 数据迁移

- [ ] 7. 准备数据迁移脚本
  - 创建 scripts/migrate-data.ts
  - 实现从 LocalStorage 导出数据的函数
  - 实现数据格式转换函数
  - 实现数据验证函数
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 7.1 导出现有 LocalStorage 数据
  - 导出用户数据
  - 导出客户数据
  - 导出专家数据
  - 导出业务员数据
  - 导出培训场次数据
  - 导出课程数据
  - 保存为 JSON 文件
  - _Requirements: 6.1_

- [ ] 7.2 转换数据格式
  - 转换用户数据格式（匹配 Supabase Auth）
  - 转换客户数据格式
  - 转换关联关系（ID 映射）
  - 处理日期格式
  - 处理数组字段
  - _Requirements: 6.2, 6.5_

- [ ] 7.3 验证数据完整性
  - 检查必填字段
  - 验证数据类型
  - 验证关联关系
  - 生成验证报告
  - _Requirements: 6.2, 6.4_

- [ ] 7.4 执行数据导入
  - 导入用户数据到 Supabase Auth
  - 导入用户资料到 user_profiles
  - 导入客户数据
  - 导入专家数据
  - 导入业务员数据
  - 导入培训场次数据
  - 导入课程数据
  - 导入权限数据
  - _Requirements: 6.3_

- [ ] 7.5 验证迁移结果
  - 对比源数据和目标数据记录数
  - 抽样检查数据准确性
  - 验证关联关系完整性
  - 生成迁移报告
  - _Requirements: 6.4, 12.5_

- [ ] 7.6 创建回滚脚本
  - 编写数据备份脚本
  - 编写数据恢复脚本
  - 测试回滚流程
  - _Requirements: 8.3_

## Phase 8: 测试和验证

- [ ] 8. 功能测试
  - 测试用户登录登出
  - 测试客户管理所有功能
  - 测试培训管理所有功能
  - 测试专家管理所有功能
  - 测试业务员管理所有功能
  - 测试权限管理所有功能
  - 测试数据导出功能
  - _Requirements: 12.1_

- [ ] 8.1 权限测试
  - 测试管理员权限
  - 测试业务员权限（只能看自己的客户）
  - 测试专家权限（只能看自己的培训）
  - 测试未授权访问被拒绝
  - _Requirements: 12.2_

- [ ] 8.2 实时同步测试
  - 打开两个浏览器窗口
  - 在一个窗口修改数据
  - 验证另一个窗口实时更新
  - 测试断线重连
  - _Requirements: 12.3_

- [ ] 8.3 性能测试
  - 测试页面加载速度
  - 测试大数据量查询
  - 测试并发操作
  - _Requirements: 12.4_

- [ ] 8.4 数据完整性测试
  - 验证所有数据正确迁移
  - 验证关联关系正确
  - 验证数据无丢失
  - _Requirements: 12.5_

- [ ]* 8.5 编写测试文档
  - 记录测试用例
  - 记录测试结果
  - 记录发现的问题
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

## Phase 9: Netlify 部署配置

- [ ] 9. 创建 Netlify 配置文件
  - 创建 netlify.toml
  - 配置构建命令
  - 配置发布目录
  - 配置重定向规则
  - 配置安全头
  - _Requirements: 10.1, 10.2_

- [ ] 9.1 配置环境变量
  - 在 Netlify 中添加 VITE_SUPABASE_URL
  - 在 Netlify 中添加 VITE_SUPABASE_ANON_KEY
  - 验证环境变量正确注入
  - _Requirements: 7.1, 7.2, 7.3, 10.2_

- [ ] 9.2 连接 Git 仓库
  - 在 Netlify 中连接 GitHub/GitLab 仓库
  - 配置自动部署分支
  - 配置部署通知
  - _Requirements: 10.1_

- [ ] 9.3 执行首次部署
  - 触发构建
  - 监控构建日志
  - 验证部署成功
  - _Requirements: 10.1, 10.4_

- [ ] 9.4 配置自定义域名（可选）
  - 添加自定义域名
  - 配置 DNS 记录
  - 启用 HTTPS
  - _Requirements: 10.1_

- [ ] 9.5 设置部署钩子
  - 配置构建失败通知
  - 配置部署成功通知
  - _Requirements: 10.4_

- [ ]* 9.6 部署后测试
  - 测试生产环境功能
  - 测试性能
  - 测试安全性
  - _Requirements: 10.5_

## Phase 10: 文档和培训

- [ ] 10. 更新 README 文档
  - 更新技术栈说明
  - 更新部署说明
  - 添加 Supabase 配置说明
  - 添加环境变量说明
  - 更新开发指南
  - _Requirements: 11.5_

- [ ] 10.1 创建迁移文档
  - 记录迁移步骤
  - 记录遇到的问题和解决方案
  - 创建故障排除指南
  - _Requirements: 11.5_

- [ ] 10.2 创建 API 文档
  - 文档化 supabaseService 的所有方法
  - 添加使用示例
  - 说明错误处理
  - _Requirements: 11.5_

- [ ] 10.3 创建用户指南
  - 说明新的登录流程
  - 说明功能变化（如有）
  - 创建常见问题解答
  - _Requirements: 11.1, 11.3_

- [ ]* 10.4 准备演示材料
  - 创建功能演示视频
  - 准备演示数据
  - 准备演示脚本
  - _Requirements: 11.1_

## Phase 11: 监控和优化

- [ ] 11. 设置错误监控
  - 集成错误追踪服务（如 Sentry）
  - 配置错误报告
  - 设置告警规则
  - _Requirements: 8.4_

- [ ] 11.1 设置性能监控
  - 监控页面加载时间
  - 监控 API 响应时间
  - 监控数据库查询性能
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 11.2 设置使用分析
  - 集成分析工具（如 Google Analytics）
  - 追踪用户行为
  - 分析功能使用情况
  - _Requirements: 11.1_

- [ ] 11.3 优化建议收集
  - 收集用户反馈
  - 分析性能瓶颈
  - 制定优化计划
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

## Phase 12: 最终验收

- [ ] 12. 最终功能验收
  - 验证所有需求已实现
  - 验证所有测试通过
  - 验证文档完整
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 12.1 性能验收
  - 验证页面加载时间 < 3秒
  - 验证 API 响应时间 < 500ms
  - 验证支持 100+ 并发用户
  - _Requirements: 9.1, 9.2, 9.3, 12.4_

- [ ] 12.2 安全验收
  - 验证 RLS 策略正确
  - 验证认证流程安全
  - 验证敏感数据保护
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 12.2_

- [ ] 12.3 用户体验验收
  - 验证 UI 保持一致
  - 验证操作流程顺畅
  - 验证错误提示友好
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 12.4 项目交付
  - 交付源代码
  - 交付文档
  - 交付部署配置
  - 提供技术支持
  - _Requirements: 所有需求_
