# 数据管理功能实现任务列表

## 任务概述

本任务列表将数据管理功能的实现分解为一系列可执行的编码任务。每个任务都是独立的、可测试的，并且按照依赖关系有序排列。

## 任务列表

- [x] 1. 安装依赖包和配置


  - 安装 xlsx、papaparse、jspdf、jspdf-autotable、file-saver 等依赖包
  - 配置 vite.config.ts 的代码分割策略
  - 添加必要的 TypeScript 类型定义
  - _需求: 需求 1, 2, 3_



- [ ] 2. 创建数据库表和 RLS 策略
  - 创建 data_management_history 表用于记录操作历史
  - 创建 audit_logs 表用于审计日志
  - 为新表添加索引和 RLS 策略



  - 执行数据库迁移脚本
  - _需求: 需求 17, 19_

- [ ] 3. 创建数据类型定义和常量
  - 创建 src/types/dataManagement.ts 定义所有接口和类型
  - 定义 DataType、ValidationResult、ImportState、ExportState 等类型
  - 创建 src/constants/dataManagement.ts 定义常量和配置
  - 定义字段映射、验证规则、模板配置等常量
  - _需求: 需求 3, 5, 6, 7, 8, 8.1_

- [x] 4. 实现数据验证器


  - 创建 src/lib/validators/dataValidator.ts
  - 实现通用验证函数（手机号、邮箱、日期、数字范围等）
  - 实现数据类型特定验证规则
  - 实现外键验证和重复检测逻辑
  - _需求: 需求 10, 13_

- [x] 5. 实现模板生成器



  - 创建 src/lib/generators/templateGenerator.ts
  - 实现五种数据类型的模板生成函数
  - 添加数据验证规则（下拉列表、数据范围）
  - 生成说明工作表和示例数据
  - _需求: 需求 4, 5, 6, 7, 8, 8.1_

- [x] 6. 实现文件解析器


  - 创建 src/lib/parsers/fileParser.ts
  - 实现 Excel 文件解析（使用 xlsx）
  - 实现 CSV 文件解析（使用 papaparse）
  - 处理文件编码和格式问题
  - _需求: 需求 9_


- [x] 7. 实现文件导出器



  - 创建 src/lib/exporters/fileExporter.ts
  - 实现 Excel 导出功能（使用 xlsx）
  - 实现 CSV 导出功能（使用 papaparse）
  - 实现 PDF 导出功能（使用 jspdf）
  - 处理中文编码和格式化
  - _需求: 需求 14, 15, 16_

- [x] 8. 实现数据管理服务层


  - 创建 src/lib/services/dataManagementService.ts
  - 实现数据导入逻辑（批量插入、重复处理）
  - 实现数据导出逻辑（查询、筛选、排序）
  - 实现外键关联解析（通过姓名查找 ID）
  - 实现操作历史记录功能
  - _需求: 需求 10, 11, 12, 13, 14, 15, 17_

- [x] 9. 实现账号创建服务



  - 创建 src/lib/services/accountCreationService.ts
  - 实现单个账号创建逻辑
  - 实现批量账号创建逻辑
  - 处理账号已存在的情况
  - 创建 user_profile 记录
  - 添加 API 限流保护
  - _需求: 需求 20_

- [x] 10. 创建文件上传组件


  - 创建 src/components/DataManagement/FileUpload.tsx
  - 实现拖拽上传功能
  - 实现点击选择文件功能
  - 添加文件类型和大小验证
  - 显示上传进度和状态
  - _需求: 需求 9_

- [x] 11. 创建导入预览组件

  - 创建 src/components/DataManagement/ImportPreview.tsx
  - 以表格形式展示待导入数据
  - 高亮显示验证错误和警告
  - 标注重复数据和新建账号
  - 支持虚拟滚动（大数据量）
  - _需求: 需求 11_

- [x] 12. 创建验证结果组件

  - 创建 src/components/DataManagement/ValidationResults.tsx
  - 显示验证通过、警告、错误的统计
  - 展示详细的错误列表
  - 提供下载错误报告功能
  - _需求: 需求 10, 12_

- [x] 13. 创建导入模块组件

  - 创建 src/components/DataManagement/ImportModule.tsx
  - 集成文件上传、验证、预览组件
  - 实现重复数据处理策略选择
  - 实现导入进度显示
  - 处理导入结果和错误
  - _需求: 需求 9, 10, 11, 12, 13_

- [x] 14. 创建导出配置组件

  - 创建 src/components/DataManagement/ExportConfig.tsx
  - 实现格式选择（Excel/CSV/PDF）
  - 实现范围选择（全部/筛选/自定义）
  - 实现字段选择（多选框）
  - 实现筛选条件配置
  - _需求: 需求 14_

- [x] 15. 创建导出模块组件

  - 创建 src/components/DataManagement/ExportModule.tsx
  - 集成导出配置组件
  - 实现导出进度显示
  - 触发文件下载
  - 处理导出错误
  - _需求: 需求 14, 15, 16_

- [x] 16. 创建操作历史组件

  - 创建 src/components/DataManagement/OperationHistory.tsx
  - 显示最近 20 条操作记录
  - 实现查看详情功能
  - 显示操作状态和统计信息
  - _需求: 需求 17_

- [x] 17. 创建数据管理主页面


  - 创建 src/pages/DataManagement.tsx
  - 实现标签页切换（导入/导出）
  - 实现数据类型选择
  - 集成导入和导出模块
  - 集成操作历史组件
  - 添加权限验证
  - _需求: 需求 1, 2, 3, 18_

- [x] 18. 更新路由配置


  - 修改 src/App.tsx 添加 /data-management 路由
  - 配置 ProtectedRoute 限制只有 admin 可访问
  - 处理非授权访问的重定向
  - _需求: 需求 1, 18_

- [x] 19. 更新侧边栏导航


  - 修改 src/components/Sidebar.tsx
  - 将"数据导出"改为"数据管理"
  - 更新图标为 Database
  - 更新路由路径为 /data-management
  - _需求: 需求 1_

- [x] 20. 实现错误处理和日志记录

  - 创建 src/lib/utils/errorHandler.ts
  - 实现统一的错误处理逻辑
  - 实现审计日志记录
  - 添加错误报告生成功能
  - _需求: 需求 19_

- [x] 21. 添加性能优化

  - 实现 Web Worker 处理文件解析
  - 实现虚拟滚动优化大数据量渲染
  - 实现批量操作和并发控制
  - 添加懒加载和代码分割
  - _需求: 需求 21_

- [ ]* 22. 编写单元测试
  - 为验证器编写单元测试
  - 为文件解析器编写单元测试
  - 为数据处理逻辑编写单元测试
  - 确保测试覆盖率达到 80% 以上

- [ ]* 23. 编写集成测试
  - 测试完整的导入流程
  - 测试完整的导出流程
  - 测试账号创建流程
  - 测试错误处理和恢复

- [x] 24. 用户验收测试和优化



  - 测试五种数据类型的导入导出
  - 测试各种边界情况和错误场景
  - 优化用户体验和性能
  - 修复发现的 bug
  - _需求: 所有需求_
