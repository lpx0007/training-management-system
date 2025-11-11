import type { DataType, ColumnDefinition } from '@/types/dataManagement';

// 数据类型配置
export const DATA_TYPE_CONFIG = {
  courses: {
    label: '课程信息',
    icon: 'BookOpen',
    description: '批量导入或导出课程资料'
  },
  experts: {
    label: '专家信息',
    icon: 'UserCheck',
    description: '批量导入或导出专家资料'
  },
  customers: {
    label: '客户信息',
    icon: 'Users',
    description: '批量导入或导出客户资料'
  },
  salespersons: {
    label: '业务员信息',
    icon: 'Briefcase',
    description: '批量导入或导出业务员资料'
  },
  training_sessions: {
    label: '培训场次',
    icon: 'Calendar',
    description: '批量导入或导出培训场次信息'
  },
  salesperson_performance: {
    label: '业务员业绩',
    icon: 'TrendingUp',
    description: '导出业务员业绩统计数据（仅导出）'
  },
  course_sales_performance: {
    label: '课程销售业绩',
    icon: 'BarChart3',
    description: '导出课程销售业绩明细（仅导出）'
  }
} as const;

// 字段映射（数据库字段 -> 显示名称）
export const FIELD_MAPPINGS: Record<DataType, Record<string, string>> = {
  courses: {
    id: '课程ID',
    module: '模块',
    name: '课程名称',
    code: '课程编号',
    duration_days: '每期天数',
    sessions_per_year: '全年期数',
    standard_fee: '标准培训费',
    online_price: '线上价格',
    offline_price: '线下价格',
    average_price: '均价',
    description: '课程描述',
    notes: '备注',
    status: '状态',
    created_at: '创建时间'
  },
  experts: {
    id: '专家ID',
    name: '专家姓名',
    title: '职称',
    field: '专业领域',
    experience: '工作经验',
    rating: '评分',
    courses: '授课课程',
    location: '所在地区',
    available: '是否可用',
    bio: '个人简介',
    past_sessions: '历史授课场次',
    total_participants: '累计参训人数',
    created_at: '创建时间'
  },
  customers: {
    id: '客户ID',
    name: '客户姓名',
    phone: '手机号',
    email: '邮箱',
    company: '公司名称',
    position: '职位',
    location: '所在地区',
    status: '客户状态',
    salesperson_id: '负责业务员ID',
    salesperson_name: '负责业务员',
    follow_up_status: '跟进状态',
    last_contact: '最后联系时间',
    tags: '标签',
    created_at: '创建时间'
  },
  salespersons: {
    id: '业务员ID',
    name: '业务员姓名',
    phone: '手机号',
    email: '邮箱',
    department: '部门',
    position: '职位',
    join_date: '入职日期',
    status: '状态',
    team: '所属团队',
    created_at: '创建时间'
  },
  training_sessions: {
    id: '培训场次ID',
    name: '培训名称',
    date: '开始日期',
    end_date: '结束日期',
    participants: '参训人数',
    expert_name: '专家名称',
    area: '培训地点',
    revenue: '收入',
    status: '状态',
    rating: '评分',
    salesperson_name: '负责人',
    course_id: '关联课程ID',
    course_name: '课程名称',
    session_number: '第几期',
    capacity: '容纳人数',
    created_at: '创建时间'
  },
  salesperson_performance: {
    id: '业务员ID',
    name: '业务员姓名',
    department: '部门',
    completedSessions: '完成场次',
    completedCustomers: '成交客户数',
    revenue: '销售额',
    conversionRate: '转化率',
    latestDate: '最近成交日期',
    completedCustomerList: '成交客户列表'
  },
  course_sales_performance: {
    id: '课程ID',
    courseName: '课程名称',
    sessionDate: '开课日期',
    endDate: '结束日期',
    area: '培训地点',
    onlinePrice: '线上价格',
    offlinePrice: '线下价格',
    trainingMode: '培训模式',
    totalParticipants: '参训人数',
    onlineParticipants: '线上人数',
    offlineParticipants: '线下人数',
    revenue: '销售额',
    status: '状态',
    salespersonList: '业务员明细'
  }
};

// 模板列定义
export const TEMPLATE_COLUMNS: Record<DataType, ColumnDefinition[]> = {
  courses: [
    { key: 'module', label: '模块', required: true, width: 15 },
    { key: 'name', label: '课程名称', required: true, width: 30 },
    { key: 'code', label: '课程编号', required: false, width: 15 },
    { key: 'duration_days', label: '每期天数', required: true, width: 12 },
    { key: 'sessions_per_year', label: '全年期数', required: true, width: 12 },
    { key: 'standard_fee', label: '标准培训费', required: false, width: 15 },
    { key: 'online_price', label: '线上价格', required: false, width: 15 },
    { key: 'offline_price', label: '线下价格', required: false, width: 15 },
    { key: 'description', label: '课程描述', required: false, width: 40 },
    { key: 'notes', label: '备注', required: false, width: 30 },
    { key: 'status', label: '状态', required: false, width: 12, options: ['active', 'inactive', 'archived'] }
  ],
  experts: [
    { key: 'name', label: '专家姓名', required: true, width: 15 },
    { key: 'email', label: '邮箱', required: true, width: 20 },  // 
    { key: 'phone', label: '手机号', required: true, width: 15 },  // 
    { key: 'title', label: '职称', required: false, width: 15 },
    { key: 'field', label: '专业领域', required: false, width: 15 },
    { key: 'experience', label: '工作经验', required: false, width: 20 },
    { key: 'rating', label: '评分', required: false, width: 10 },
    { key: 'courses', label: '授课课程（逗号分隔）', required: false, width: 25 },
    { key: 'location', label: '所在地区', required: false, width: 15 },
    { key: 'available', label: '是否可用', required: false, width: 10, options: ['是', '否'] },
    { key: 'bio', label: '个人简介', required: false, width: 30 }
  ],
  customers: [
    { key: 'name', label: '客户姓名', required: true, width: 15 },
    { key: 'phone', label: '手机号', required: true, width: 15 },
    { key: 'email', label: '邮箱', required: false, width: 20 },
    { key: 'company', label: '公司名称', required: false, width: 20 },
    { key: 'position', label: '职位', required: false, width: 15 },
    { key: 'location', label: '所在地区', required: false, width: 15 },
    { key: 'status', label: '客户状态', required: false, width: 12, options: ['潜在客户', '意向客户', '成交客户', '流失客户'] },
    { key: 'salesperson_name', label: '负责业务员', required: false, width: 15 },
    { key: 'follow_up_status', label: '跟进状态', required: false, width: 12, options: ['待跟进', '跟进中', '已成交', '已放弃'] },
    { key: 'last_contact', label: '最后联系时间', required: false, width: 15 },
    { key: 'tags', label: '标签（逗号分隔）', required: false, width: 20 }
  ],
  salespersons: [
    { key: 'name', label: '业务员姓名', required: true, width: 15 },
    { key: 'phone', label: '手机号', required: true, width: 15 },
    { key: 'email', label: '邮箱', required: true, width: 20 },  // ✅ 改为必填
    { key: 'department', label: '部门', required: false, width: 15 },
    { key: 'position', label: '职位', required: false, width: 15 },
    { key: 'join_date', label: '入职日期', required: false, width: 15 },
    { key: 'status', label: '状态', required: false, width: 12, options: ['pending', 'active', 'rejected'] },
    { key: 'team', label: '所属团队', required: false, width: 15 }
  ],
  training_sessions: [
    { key: 'name', label: '培训名称', required: true, width: 20 },
    { key: 'date', label: '开始日期', required: true, width: 15 },
    { key: 'end_date', label: '结束日期', required: false, width: 15 },
    { key: 'participants', label: '参训人数', required: false, width: 12 },
    { key: 'expert_name', label: '专家姓名', required: false, width: 15 },
    { key: 'area', label: '举办地区', required: false, width: 15 },
    { key: 'revenue', label: '销售额', required: false, width: 12 },
    { key: 'status', label: '状态', required: false, width: 12, options: ['计划中', '进行中', '已完成', '已取消'] },
    { key: 'rating', label: '评分', required: false, width: 10 },
    { key: 'salesperson_name', label: '负责业务员', required: false, width: 15 },
    { key: 'course_id', label: '关联课程ID', required: false, width: 15 },
    { key: 'course_description', label: '课程描述', required: false, width: 30 },
    { key: 'capacity', label: '容纳人数', required: false, width: 12 }
  ],
  salesperson_performance: [],
  course_sales_performance: []
};

// 示例数据
export const EXAMPLE_DATA: Record<DataType, any[]> = {
  courses: [
    { module: '综合管理', name: '首席财务官高级研修班', code: 'CFO-001', duration_days: 15, sessions_per_year: 1, standard_fee: 44800, online_price: 44800, offline_price: 44800, description: '高级财务管理培训', notes: '针对高管', status: 'active' },
    { module: '非财高管', name: '非财高管的财报分析与管理决策', code: 'NFM-001', duration_days: 2, sessions_per_year: 2, standard_fee: 9800, online_price: 8800, offline_price: 9800, description: '非财务高管培训', notes: '', status: 'active' },
    { module: '管理会计', name: '业财融合实务与财务BP核心能力建设', code: 'MA-001', duration_days: 3, sessions_per_year: 2, standard_fee: 6000, online_price: 5100, offline_price: 6000, description: '业财融合培训', notes: '', status: 'active' }
  ],
  experts: [
    { name: '张教授', title: '高级工程师', field: '前端开发', experience: '10年', rating: 4.8, courses: 'React,Vue,Angular', location: '北京', available: '是', bio: '资深前端专家', email: 'zhang@example.com', phone: '13800138000' },
    { name: '李博士', title: '项目管理专家', field: '项目管理', experience: '15年', rating: 4.9, courses: 'PMP,敏捷开发', location: '上海', available: '是', bio: 'PMP认证讲师', email: 'li@example.com', phone: '13900139000' },
    { name: '王设计师', title: '资深设计师', field: 'UI设计', experience: '8年', rating: 4.7, courses: 'Figma,Sketch', location: '广州', available: '是', bio: 'UI/UX设计专家', email: 'wang@example.com', phone: '13700137000' }
  ],
  customers: [
    { name: '李明', phone: '13812345678', email: 'liming@company.com', company: '科技公司A', position: '技术总监', location: '北京', status: '意向客户', salesperson_name: '张三', follow_up_status: '跟进中', last_contact: '2025-10-20', tags: 'VIP,技术' },
    { name: '张华', phone: '13923456789', email: 'zhanghua@company.com', company: '企业B', position: '项目经理', location: '上海', status: '成交客户', salesperson_name: '李四', follow_up_status: '已成交', last_contact: '2025-10-18', tags: '重点客户' },
    { name: '王芳', phone: '13734567890', email: 'wangfang@company.com', company: '集团C', position: 'HR总监', location: '广州', status: '潜在客户', salesperson_name: '王五', follow_up_status: '待跟进', last_contact: '2025-10-15', tags: '培训需求' }
  ],
  salespersons: [
    { name: '张三', phone: '13600136000', email: 'zhangsan@company.com', department: '销售部', position: '销售经理', join_date: '2023-01-15', status: 'active', team: 'A组' },
    { name: '李四', phone: '13500135000', email: 'lisi@company.com', department: '销售部', position: '销售主管', join_date: '2023-03-20', status: 'active', team: 'B组' },
    { name: '王五', phone: '13400134000', email: 'wangwu@company.com', department: '销售部', position: '销售专员', join_date: '2024-06-10', status: 'pending', team: 'A组' }
  ],
  training_sessions: [
    { name: '前端开发进阶班', date: '2025-11-01', end_date: '2025-11-01', participants: 30, expert_name: '张教授', area: '北京', revenue: 90000, status: '计划中', rating: null, salesperson_name: '张三', course_id: 'COURSE001', course_description: 'React实战', capacity: 40 },
    { name: '项目管理实战班', date: '2025-11-05', end_date: '2025-11-05', participants: 25, expert_name: '李博士', area: '上海', revenue: 125000, status: '计划中', rating: null, salesperson_name: '李四', course_id: 'COURSE002', course_description: 'PMP认证', capacity: 30 },
    { name: 'UI设计原理班', date: '2025-11-10', end_date: '2025-11-10', participants: 20, expert_name: '王设计师', area: '广州', revenue: 50000, status: '计划中', rating: null, salesperson_name: '王五', course_id: 'COURSE003', course_description: 'Figma设计', capacity: 25 }
  ],
  salesperson_performance: [],
  course_sales_performance: []
};

// 配置常量
export const CONFIG = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMPORT_RECORDS: 50000,
  BATCH_SIZE: 1000,
  DEFAULT_PASSWORD: '123456',
  ACCEPTED_FILE_TYPES: ['.xlsx', '.csv'],
  PREVIEW_LIMIT: 50,
  HISTORY_LIMIT: 20,
  HISTORY_RETENTION_DAYS: 90
} as const;
