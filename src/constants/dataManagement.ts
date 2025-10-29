import type { DataType, ColumnDefinition } from '@/types/dataManagement';

// 数据类型配置
export const DATA_TYPE_CONFIG = {
  courses: {
    label: '培训课程',
    icon: 'BookOpen',
    description: '批量导入或导出培训课程信息'
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
  }
} as const;

// 字段映射（数据库字段 -> 显示名称）
export const FIELD_MAPPINGS: Record<DataType, Record<string, string>> = {
  courses: {
    id: '课程ID',
    name: '课程名称',
    description: '课程描述',
    duration: '时长（小时）',
    price: '价格（元）',
    category: '课程分类',
    expert_id: '授课专家ID',
    created_at: '创建时间',
    updated_at: '更新时间'
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
    start_time: '开始时间',
    end_time: '结束时间',
    participants: '参训人数',
    expert_id: '专家ID',
    expert_name: '专家姓名',
    area: '举办地区',
    revenue: '销售额',
    status: '状态',
    rating: '评分',
    salesperson_id: '负责业务员ID',
    salesperson_name: '负责业务员',
    course_id: '关联课程ID',
    course_description: '课程描述',
    capacity: '容纳人数',
    created_at: '创建时间'
  }
};

// 模板列定义
export const TEMPLATE_COLUMNS: Record<DataType, ColumnDefinition[]> = {
  courses: [
    { key: 'id', label: '课程ID', required: true, width: 15 },
    { key: 'name', label: '课程名称', required: true, width: 20 },
    { key: 'description', label: '课程描述', required: false, width: 30 },
    { key: 'duration', label: '时长（小时）', required: false, width: 12 },
    { key: 'price', label: '价格（元）', required: false, width: 12 },
    { key: 'category', label: '课程分类', required: false, width: 15, options: ['技术培训', '管理培训', '销售培训', '其他'] },
    { key: 'expert_id', label: '授课专家ID', required: false, width: 15 }
  ],
  experts: [
    { key: 'name', label: '专家姓名', required: true, width: 15 },
    { key: 'email', label: '邮箱', required: true, width: 20 },  // ✅ 改为必填，移到前面
    { key: 'phone', label: '手机号', required: true, width: 15 },  // ✅ 改为必填，移到前面
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
    { key: 'end_time', label: '结束时间', required: true, width: 12 },
    { key: 'end_date', label: '结束日期', required: false, width: 15 },
    { key: 'start_time', label: '开始时间', required: false, width: 12 },
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
  ]
};

// 示例数据
export const EXAMPLE_DATA: Record<DataType, any[]> = {
  courses: [
    { id: 'COURSE001', name: '前端开发进阶', description: 'React + TypeScript 实战', duration: 16, price: 3000, category: '技术培训', expert_id: 1 },
    { id: 'COURSE002', name: '项目管理实战', description: 'PMP 认证培训', duration: 24, price: 5000, category: '管理培训', expert_id: 2 },
    { id: 'COURSE003', name: 'UI设计原理', description: 'Figma 设计实战', duration: 12, price: 2500, category: '技术培训', expert_id: 3 }
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
    { name: '前端开发进阶班', date: '2025-11-01', end_time: '17:00', end_date: '2025-11-01', start_time: '09:00', participants: 30, expert_name: '张教授', area: '北京', revenue: 90000, status: '计划中', rating: null, salesperson_name: '张三', course_id: 'COURSE001', course_description: 'React实战', capacity: 40 },
    { name: '项目管理实战班', date: '2025-11-05', end_time: '16:00', end_date: '2025-11-05', start_time: '10:00', participants: 25, expert_name: '李博士', area: '上海', revenue: 125000, status: '计划中', rating: null, salesperson_name: '李四', course_id: 'COURSE002', course_description: 'PMP认证', capacity: 30 },
    { name: 'UI设计原理班', date: '2025-11-10', end_time: '17:30', end_date: '2025-11-10', start_time: '09:30', participants: 20, expert_name: '王设计师', area: '广州', revenue: 50000, status: '计划中', rating: null, salesperson_name: '王五', course_id: 'COURSE003', course_description: 'Figma设计', capacity: 25 }
  ]
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
