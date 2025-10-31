# 数据管理功能需求文档

## 简介

数据管理功能是培训管理系统的核心管理模块，专为管理员设计。该功能将现有的"数据导出"升级为完整的"数据管理"模块，支持培训课程、专家、客户、业务员等核心业务数据的批量导入和导出，提升数据管理效率，降低人工录入成本。

## 术语表

- **System**: 培训管理系统（Training Management System）
- **Admin**: 管理员用户，拥有系统最高权限
- **Data_Import**: 数据导入功能，支持从 Excel/CSV 文件批量导入数据
- **Data_Export**: 数据导出功能，支持将系统数据导出为 Excel/CSV/PDF 格式
- **Training_Course**: 培训课程，包含课程名称、描述、时长、价格等信息
- **Expert**: 专家，包含姓名、职称、专业领域、经验等信息
- **Customer**: 客户，包含姓名、公司、职位、联系方式等信息
- **Salesperson**: 业务员，包含姓名、部门、职位、联系方式等信息
- **Template_File**: 模板文件，预定义的 Excel 模板，用于指导用户正确填写导入数据
- **Validation_Error**: 验证错误，数据导入时发现的格式或内容错误
- **Import_Preview**: 导入预览，在正式导入前展示待导入数据的预览界面

## 需求

### 需求 1：导航菜单更新

**用户故事：** 作为管理员，我希望在左侧导航栏看到"数据管理"菜单项，以便快速访问数据导入导出功能。

#### 验收标准

1. THE System SHALL 将左侧导航栏中的"数据导出"菜单项更名为"数据管理"
2. THE System SHALL 为"数据管理"菜单项使用 Database 图标（lucide-react 的 Database 组件）
3. THE System SHALL 确保只有 Admin 角色可以看到"数据管理"菜单项
4. WHEN Admin 点击"数据管理"菜单项，THE System SHALL 导航到 /data-management 路由

### 需求 2：数据管理页面布局

**用户故事：** 作为管理员，我希望看到清晰的页面布局，包含导入和导出两个主要功能区域，以便快速理解和使用功能。

#### 验收标准

1. THE System SHALL 在数据管理页面顶部显示页面标题"数据管理"
2. THE System SHALL 在页面中显示两个主要标签页：导入数据、导出数据
3. THE System SHALL 默认显示"导入数据"标签页
4. WHEN Admin 切换标签页，THE System SHALL 在 300 毫秒内完成切换动画
5. THE System SHALL 在页面顶部显示功能说明文字，解释数据管理的用途

### 需求 3：数据类型选择

**用户故事：** 作为管理员，我希望能够选择要操作的数据类型（培训课程、专家、客户、业务员、培训场次），以便针对不同业务数据进行管理。

#### 验收标准

1. THE System SHALL 在导入和导出标签页中提供数据类型选择器
2. THE System SHALL 支持以下数据类型：培训课程、专家信息、客户信息、业务员信息、培训场次
3. THE System SHALL 默认选中"培训课程"数据类型
4. WHEN Admin 选择数据类型，THE System SHALL 在 200 毫秒内更新界面显示相应的操作选项
5. THE System SHALL 为每种数据类型显示对应的图标和描述文字

### 需求 4：模板文件下载

**用户故事：** 作为管理员，我希望能够下载标准的 Excel 导入模板，以便按照正确的格式准备导入数据。

#### 验收标准

1. THE System SHALL 在导入数据标签页中为每种数据类型提供"下载模板"按钮
2. WHEN Admin 点击"下载模板"按钮，THE System SHALL 在 1 秒内生成并下载对应的 Excel Template_File
3. THE Template_File SHALL 包含预定义的列标题和示例数据行
4. THE Template_File SHALL 包含数据验证规则（如必填字段、数据格式要求）
5. THE Template_File SHALL 在第一个工作表中包含填写说明

### 需求 5：培训课程模板结构

**用户故事：** 作为管理员，我希望培训课程模板包含所有必要字段，以便完整导入课程信息。

#### 验收标准

1. THE Training_Course Template_File SHALL 包含以下列：课程 ID、课程名称、课程描述、时长（小时）、价格（元）、课程分类、授课专家 ID
2. THE Training_Course Template_File SHALL 标记"课程 ID"、"课程名称"为必填字段
3. THE Training_Course Template_File SHALL 在"课程分类"列提供下拉选项：技术培训、管理培训、销售培训、其他
4. THE Training_Course Template_File SHALL 包含至少 3 行示例数据
5. THE Training_Course Template_File SHALL 在说明工作表中解释每个字段的含义和填写要求
6. THE Training_Course Template_File SHALL 标注"价格（元）"、"课程描述"、"时长（小时）"、"授课专家 ID"为可选字段

### 需求 6：专家信息模板结构

**用户故事：** 作为管理员，我希望专家信息模板包含所有必要字段，以便完整导入专家资料。

#### 验收标准

1. THE Expert Template_File SHALL 包含以下列：专家姓名、职称、专业领域、工作经验、评分、授课课程、所在地区、是否可用、个人简介、历史授课场次、累计参训人数
2. THE Expert Template_File SHALL 标记"专家姓名"为必填字段
3. THE Expert Template_File SHALL 在"是否可用"列提供下拉选项：是、否，默认值为"是"
4. THE Expert Template_File SHALL 在"评分"列设置数据验证范围为 0.00 到 5.00
5. THE Expert Template_File SHALL 包含至少 3 行示例数据
6. THE Expert Template_File SHALL 标注"职称"、"专业领域"、"工作经验"、"评分"、"授课课程"、"所在地区"、"个人简介"、"历史授课场次"、"累计参训人数"为可选字段
7. THE Expert Template_File SHALL 说明如果提供了邮箱或手机号，系统将自动创建登录账号，初始密码为"123456"
8. THE Expert Template_File SHALL 建议至少提供邮箱或手机号中的一个，以便专家可以登录系统

### 需求 7：客户信息模板结构

**用户故事：** 作为管理员，我希望客户信息模板包含所有必要字段，以便完整导入客户资料。

#### 验收标准

1. THE Customer Template_File SHALL 包含以下列：客户姓名、手机号、邮箱、公司名称、职位、所在地区、客户状态、负责业务员 ID、负责业务员姓名、跟进状态、最后联系时间、标签（多个标签用逗号分隔）
2. THE Customer Template_File SHALL 标记"客户姓名"、"手机号"为必填字段
3. THE Customer Template_File SHALL 在"客户状态"列提供下拉选项：潜在客户、意向客户、成交客户、流失客户
4. THE Customer Template_File SHALL 在"跟进状态"列提供下拉选项：待跟进、跟进中、已成交、已放弃
5. THE Customer Template_File SHALL 包含至少 3 行示例数据
6. THE Customer Template_File SHALL 标注"邮箱"、"公司名称"、"职位"、"所在地区"、"客户状态"、"负责业务员 ID"、"负责业务员姓名"、"跟进状态"、"最后联系时间"、"标签"为可选字段
7. THE Customer Template_File SHALL 说明"负责业务员 ID"和"负责业务员姓名"至少需要填写一个，系统将根据提供的信息自动关联
8. THE Customer Template_File SHALL 验证手机号格式为 11 位数字或带国际区号的格式

### 需求 8：业务员信息模板结构

**用户故事：** 作为管理员，我希望业务员信息模板包含所有必要字段，以便完整导入业务员资料。

#### 验收标准

1. THE Salesperson Template_File SHALL 包含以下列：业务员姓名、部门、职位、手机号、邮箱、入职日期、状态、所属团队
2. THE Salesperson Template_File SHALL 标记"业务员姓名"、"手机号"为必填字段
3. THE Salesperson Template_File SHALL 在"状态"列提供下拉选项：pending（待审核）、active（已激活）、rejected（已拒绝），默认值为"pending"
4. THE Salesperson Template_File SHALL 在"入职日期"列设置日期格式为 YYYY-MM-DD
5. THE Salesperson Template_File SHALL 包含至少 3 行示例数据
6. THE Salesperson Template_File SHALL 标注"部门"、"职位"、"邮箱"、"入职日期"、"状态"、"所属团队"为可选字段
7. THE Salesperson Template_File SHALL 说明如果提供了邮箱或手机号，系统将自动创建登录账号，初始密码为"123456"
8. THE Salesperson Template_File SHALL 验证手机号格式为 11 位数字或带国际区号的格式
9. THE Salesperson Template_File SHALL 建议至少提供邮箱或手机号中的一个，以便业务员可以登录系统

### 需求 8.1：培训场次模板结构

**用户故事：** 作为管理员，我希望培训场次模板包含所有必要字段，以便完整导入培训场次信息。

#### 验收标准

1. THE Training_Session Template_File SHALL 包含以下列：培训名称、开始日期、结束日期、开始时间、结束时间、参训人数、专家 ID、专家姓名、举办地区、销售额、状态、评分、负责业务员 ID、负责业务员姓名、关联课程 ID、课程描述、容纳人数
2. THE Training_Session Template_File SHALL 标记"培训名称"、"开始日期"、"结束时间"为必填字段
3. THE Training_Session Template_File SHALL 在"状态"列提供下拉选项：计划中、进行中、已完成、已取消
4. THE Training_Session Template_File SHALL 在"评分"列设置数据验证范围为 0.00 到 5.00
5. THE Training_Session Template_File SHALL 在"开始日期"和"结束日期"列设置日期格式为 YYYY-MM-DD
6. THE Training_Session Template_File SHALL 在"开始时间"和"结束时间"列设置时间格式为 HH:MM
7. THE Training_Session Template_File SHALL 包含至少 3 行示例数据
8. THE Training_Session Template_File SHALL 标注除"培训名称"、"开始日期"、"结束时间"外的所有字段为可选字段
9. THE Training_Session Template_File SHALL 说明"专家 ID"和"专家姓名"至少需要填写一个，"负责业务员 ID"和"负责业务员姓名"至少需要填写一个
10. THE Training_Session Template_File SHALL 设置"容纳人数"默认值为 30
11. WHEN "结束日期"未填写，THE System SHALL 默认使用"开始日期"作为结束日期

### 需求 9：文件上传功能

**用户故事：** 作为管理员，我希望能够上传填写好的 Excel 文件，以便批量导入数据。

#### 验收标准

1. THE System SHALL 在导入数据标签页中提供文件上传区域
2. THE System SHALL 支持拖拽上传和点击选择文件两种方式
3. THE System SHALL 只接受 .xlsx 和 .csv 格式的文件
4. WHEN Admin 上传非支持格式的文件，THE System SHALL 显示错误提示"仅支持 Excel (.xlsx) 和 CSV (.csv) 格式"
5. THE System SHALL 限制上传文件大小不超过 10MB
6. WHEN Admin 上传超过 10MB 的文件，THE System SHALL 显示错误提示"文件大小不能超过 10MB"

### 需求 10：数据验证

**用户故事：** 作为管理员，我希望系统能够自动验证上传的数据，以便在导入前发现并修正错误。

#### 验收标准

1. WHEN Admin 上传文件，THE System SHALL 在 3 秒内完成数据验证
2. THE System SHALL 验证所有必填字段是否已填写
3. THE System SHALL 验证数据格式是否符合要求（如手机号格式、邮箱格式、日期格式）
4. THE System SHALL 验证数据范围是否合法（如评分范围、价格为正数）
5. THE System SHALL 验证外键关联是否存在（如授课专家 ID、负责业务员是否存在于系统中）
6. WHEN 发现 Validation_Error，THE System SHALL 生成错误报告，标注错误所在的行号和列名
7. THE System SHALL 显示验证通过的数据条数和验证失败的数据条数

### 需求 11：导入预览

**用户故事：** 作为管理员，我希望在正式导入前能够预览待导入的数据，以便确认数据正确性。

#### 验收标准

1. WHEN 数据验证通过，THE System SHALL 显示 Import_Preview 界面
2. THE Import_Preview SHALL 以表格形式展示前 50 条待导入数据
3. THE Import_Preview SHALL 显示每条数据的所有字段
4. THE Import_Preview SHALL 在表格上方显示总数据条数
5. THE Import_Preview SHALL 提供"确认导入"和"取消"两个操作按钮
6. WHEN 存在 Validation_Error，THE Import_Preview SHALL 高亮显示错误数据行，并在旁边显示错误原因

### 需求 12：数据导入执行

**用户故事：** 作为管理员，我希望能够执行数据导入操作，并实时查看导入进度，以便了解导入状态。

#### 验收标准

1. WHEN Admin 点击"确认导入"按钮，THE System SHALL 开始执行数据导入
2. THE System SHALL 显示导入进度条，实时更新已导入的数据条数和百分比
3. THE System SHALL 在 100 毫秒内处理每条数据记录
4. WHEN 导入过程中发生错误，THE System SHALL 记录错误信息但继续处理后续数据
5. WHEN 导入完成，THE System SHALL 显示导入结果摘要：成功导入条数、失败条数、总耗时
6. WHEN 存在导入失败的数据，THE System SHALL 提供"下载错误报告"按钮，导出包含失败数据和错误原因的 Excel 文件

### 需求 13：重复数据处理

**用户故事：** 作为管理员，我希望系统能够智能处理重复数据，以便避免数据冗余。

#### 验收标准

1. WHEN 导入的数据与系统中现有数据存在重复（基于唯一标识字段），THE System SHALL 检测到重复
2. THE System SHALL 在 Import_Preview 中标记重复数据行
3. THE System SHALL 为重复数据提供处理策略选择：跳过、覆盖、保留两者
4. THE System SHALL 默认选择"跳过"策略
5. WHEN Admin 选择"覆盖"策略，THE System SHALL 用导入数据更新现有数据
6. WHEN Admin 选择"保留两者"策略，THE System SHALL 为导入数据生成新的唯一标识

### 需求 14：数据导出功能

**用户故事：** 作为管理员，我希望能够导出系统中的数据，以便进行数据备份或外部分析。

#### 验收标准

1. THE System SHALL 在导出数据标签页中提供数据类型选择器
2. THE System SHALL 提供导出格式选择：Excel (.xlsx)、CSV (.csv)、PDF (.pdf)
3. THE System SHALL 提供导出范围选择：全部数据、筛选后数据、自定义日期范围
4. WHEN Admin 选择"自定义日期范围"，THE System SHALL 显示日期选择器
5. THE System SHALL 提供字段选择功能，允许 Admin 选择要导出的字段
6. THE System SHALL 默认选中所有字段

### 需求 15：导出执行

**用户故事：** 作为管理员，我希望能够快速导出数据，并下载到本地，以便后续使用。

#### 验收标准

1. WHEN Admin 点击"导出数据"按钮，THE System SHALL 在 5 秒内生成导出文件（对于少于 1000 条数据）
2. THE System SHALL 显示导出进度提示
3. WHEN 导出完成，THE System SHALL 自动触发文件下载
4. THE System SHALL 为导出文件命名格式为：数据类型_导出日期时间.扩展名（如：培训课程_20251026_143025.xlsx）
5. WHEN 导出数据量超过 10000 条，THE System SHALL 显示警告提示"数据量较大，导出可能需要较长时间"

### 需求 16：导出数据格式

**用户故事：** 作为管理员，我希望导出的数据格式清晰规范，以便后续处理和分析。

#### 验收标准

1. THE Excel 导出文件 SHALL 包含表头行，使用加粗字体
2. THE Excel 导出文件 SHALL 为数值列设置数字格式，为日期列设置日期格式
3. THE Excel 导出文件 SHALL 自动调整列宽以适应内容
4. THE CSV 导出文件 SHALL 使用 UTF-8 编码，避免中文乱码
5. THE PDF 导出文件 SHALL 包含页眉（显示导出日期和数据类型）和页脚（显示页码）
6. THE PDF 导出文件 SHALL 使用合适的字体大小，确保内容清晰可读

### 需求 17：导入导出历史记录

**用户故事：** 作为管理员，我希望能够查看历史的导入导出操作记录，以便追溯数据变更。

#### 验收标准

1. THE System SHALL 在数据管理页面底部显示"操作历史"区域
2. THE System SHALL 记录每次导入导出操作的以下信息：操作类型、数据类型、操作时间、操作人、数据条数、操作状态
3. THE System SHALL 按时间倒序显示最近 20 条操作记录
4. THE System SHALL 为每条记录提供"查看详情"链接
5. WHEN Admin 点击"查看详情"，THE System SHALL 显示该次操作的完整信息，包括成功条数、失败条数、错误详情
6. THE System SHALL 保留操作记录至少 90 天

### 需求 18：权限控制

**用户故事：** 作为系统，我需要确保只有管理员可以访问数据管理功能，以便保护数据安全。

#### 验收标准

1. THE System SHALL 验证访问数据管理页面的用户角色为 Admin
2. WHEN 非 Admin 用户尝试访问 /data-management 路由，THE System SHALL 重定向到 /dashboard 页面
3. WHEN 非 Admin 用户尝试访问 /data-management 路由，THE System SHALL 显示错误提示"您没有权限访问此页面"
4. THE System SHALL 在服务端验证所有导入导出 API 请求的用户权限
5. WHEN 非 Admin 用户调用导入导出 API，THE System SHALL 返回 403 Forbidden 错误

### 需求 19：错误处理

**用户故事：** 作为管理员，我希望在操作失败时能够看到清晰的错误提示，以便快速定位和解决问题。

#### 验收标准

1. WHEN 文件上传失败，THE System SHALL 显示错误提示，说明失败原因
2. WHEN 数据验证失败，THE System SHALL 显示详细的 Validation_Error 列表
3. WHEN 导入过程中发生数据库错误，THE System SHALL 显示错误提示"数据导入失败，请稍后重试"
4. WHEN 导出过程中发生错误，THE System SHALL 显示错误提示"数据导出失败，请稍后重试"
5. THE System SHALL 将所有错误信息记录到系统日志中，包含时间戳、用户 ID、错误类型、错误详情

### 需求 20：账号创建和初始密码

**用户故事：** 作为管理员，我希望在导入专家和业务员时能够自动创建登录账号，并设置初始密码，以便他们可以直接登录系统。

#### 验收标准

1. WHEN Admin 导入专家信息且提供了邮箱或手机号，THE System SHALL 自动创建对应的登录账号
2. WHEN Admin 导入业务员信息且提供了邮箱或手机号，THE System SHALL 自动创建对应的登录账号
3. THE System SHALL 优先使用邮箱作为登录用户名，WHEN 邮箱未提供，THE System SHALL 使用手机号作为登录用户名
4. THE System SHALL 为新创建的账号设置初始密码为"123456"
5. THE System SHALL 在导入完成后显示提示信息："已为 X 个用户创建登录账号，初始密码为 123456，请提醒用户首次登录后修改密码"
6. WHEN 导入的邮箱或手机号已存在于系统中，THE System SHALL 跳过账号创建，仅更新用户资料信息
7. THE System SHALL 在导入预览界面标注哪些记录将创建新账号，哪些记录将更新现有账号
8. THE System SHALL 记录账号创建日志，包含创建时间、用户名、角色信息

### 需求 21：性能要求

**用户故事：** 作为管理员，我希望数据导入导出操作能够快速完成，以便提高工作效率。

#### 验收标准

1. THE System SHALL 在 3 秒内完成 1000 条数据的验证
2. THE System SHALL 在 10 秒内完成 1000 条数据的导入
3. THE System SHALL 在 5 秒内完成 1000 条数据的导出（Excel 格式）
4. THE System SHALL 支持最多 50000 条数据的单次导入
5. WHEN 数据量超过 10000 条，THE System SHALL 使用分批处理，每批处理 1000 条数据
