/**
 * Supabase 数据库类型定义
 * 这些类型与数据库表结构对应
 */

// 用户角色类型
export type UserRole = 'admin' | 'salesperson' | 'expert' | 'manager' | 'conference_service';

// 用户资料
export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  department: string | null;
  department_id?: number | null;  // 部门ID（经理角色使用）
  
  // 状态字段
  status: 'enabled' | 'disabled';  // 账号状态（控制登录）
  work_status?: 'trial' | 'active' | 'vacation' | 'resigned' | null;  // 工作状态（业务员专用）
  
  // 业务员专用字段
  avatar?: string | null;
  phone?: string | null;
  email?: string | null;
  position?: string | null;
  join_date?: string | null;
  team?: string | null;
  
  created_at: string;
  updated_at: string;
}

// 招商简章
export interface Prospectus {
  id: number;
  name: string;
  type: string | null;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  sealed_file_name: string | null;
  sealed_file_path: string | null;
  sealed_file_size: number | null;
  has_sealed_version: boolean;
  uploaded_by: string | null;
  uploaded_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'error';
  download_count: number;
  created_at: string;
}

// 简章下载记录
export interface ProspectusDownload {
  id: number;
  prospectus_id: number;
  user_id: string;
  user_name: string;
  file_type: 'original' | 'sealed';
  downloaded_at: string;
  training_session_id: number | null;
  training_session_name?: string | null;  // 关联的培训名称
  created_at: string;
}

// 课表
export interface Schedule {
  id: number;
  name: string;
  type: string | null;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_by: string | null;
  uploaded_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'error';
  download_count: number;
  created_at: string;
}

// 课表下载记录
export interface ScheduleDownload {
  id: number;
  schedule_id: number;
  user_id: string;
  user_name: string;
  downloaded_at: string;
  training_session_id: number | null;
  training_session_name?: string | null;  // 关联的培训名称
  created_at: string;
}

// 课表与课程关联
export interface ScheduleCourse {
  id: number;
  schedule_id: number;
  course_id: number;
  created_at: string;
  created_by: string | null;
}

// 客户（数据库字段）
export interface Customer {
  id: number;
  name: string;
  avatar: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  position: string | null;
  location: string | null;
  status: string | null;
  salesperson_id: string | null;
  salesperson_name: string | null;
  follow_up_status: string | null;
  created_at: string;
  last_contact: string | null;
  tags: string | null;
  department: string | null; // 部门
  gender: string; // 性别（必填）
  accommodation_requirements: string | null; // 住宿需求
}

// 客户（前端友好类型，包含驼峰命名字段）
export interface CustomerFrontend extends Customer {
  salesperson?: string; // 映射到 salesperson_name
  followUpStatus?: string; // 映射到 follow_up_status
  lastContact?: string; // 映射到 last_contact
  createdAt?: string; // 映射到 created_at
  trainingHistory?: Array<{
    id: number;
    name: string;
    date: string;
    status: string;
  }>;
}

// 专家
export interface Expert {
  id: number;
  user_id: string | null;
  name: string;
  avatar: string | null;
  title: string | null;
  field: string | null;
  experience: string | null;
  rating: number | null;
  courses: string[] | null;
  location: string | null;
  available: boolean;
  gender?: string | null;
  bio: string | null;
  past_sessions: number;
  total_participants: number;
  phone: string | null;
  email?: string | null;
  id_number?: string | null;
  bank_card_number?: string | null;
  hourly_rate?: number | null;
  resume?: string | null;
  created_at: string;
}

// 业务员类型（现在是 UserProfile 的别名）
export type Salesperson = UserProfile;

// 业务员绩效
export interface SalespersonPerformance {
  id: number;
  salesperson_id: string;  // 改为 UUID
  revenue: number;
  completed_sessions: number;
  conversion_rate: number;
  customers_count: number;
  updated_at: string;
}

// 课程（旧版，已废弃）
export interface LegacyCourse {
  id: string;
  name: string;
  description: string | null;
  duration: number | null;
  price: number | null;
  category: string | null;
  expert_id: number | null;
  created_at: string;
  updated_at: string;
}

// 课程（数据库字段）
export interface CourseDB {
  id: number;
  module: string;
  name: string;
  code?: string | null;
  duration_days: number;
  sessions_per_year: number;
  standard_fee?: number | null;
  online_price?: number | null;
  offline_price?: number | null;
  average_price?: number | null;
  description?: string | null;
  notes?: string | null;
  status: string;
  project_manager_id?: string | null;
  created_at: string;
  updated_at?: string | null;
}

// 课程（前端类型）
export interface Course {
  id: number;
  module: string;
  name: string;
  code?: string;
  durationDays: number;
  sessionsPerYear: number;
  standardFee?: number;
  onlinePrice?: number;
  offlinePrice?: number;
  averagePrice?: number;
  description?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'archived';
  projectManagerId?: string;
  projectManagerName?: string;
  createdAt: string;
  updatedAt?: string;
}

// 课程与场次汇总
export interface CourseWithSessions extends Course {
  sessions: TrainingSessionFrontend[];
  actualSessionCount: number;
  totalParticipants: number;
  totalRevenue: number;
}

// 培训场次（数据库字段）
export interface TrainingSession {
  id: number;
  name: string;
  date: string;
  end_date: string | null;
  capacity: number; // 容纳人数
  participants: number;
  expert_id: number | null;
  expert_name: string | null;
  area: string | null;
  detailed_address: string | null;
  revenue: number | null;
  status: string | null;
  rating: number | null;
  salesperson_id: string | null;  // 改为 UUID
  salesperson_name: string | null;
  conference_service_id: string | null;  // 会务客服ID (UUID)
  conference_service_name: string | null; // 会务客服姓名
  course_id: number | null;       // 关联课程ID
  course_name: string | null;      // 冗余：课程名称
  session_number: number | null;   // 第几期
  course_description: string | null;
  prospectus_id: number | null;  // 招商简章ID
  schedule_id: number | null;    // 课表ID
  training_mode: string | null;  // 培训模式：online/offline/mixed
  online_price: number | null;   // 线上价格
  offline_price: number | null;  // 线下价格
  auto_calculate_revenue: boolean | null;  // 自动计算收入
  created_at: string;
  // 软删除字段
  deleted_at: string | null;      // 删除时间
  deleted_by: string | null;      // 删除人ID（UUID）
  deleted_by_name: string | null; // 删除人姓名
  delete_reason: string | null;   // 删除原因
}

// 培训场次（前端友好类型，包含驼峰命名字段）
export interface TrainingSessionFrontend extends Omit<TrainingSession, 'expert_id' | 'expert_name' | 'end_date' | 'salesperson_id' | 'salesperson_name' | 'conference_service_id' | 'conference_service_name' | 'course_id' | 'course_name' | 'session_number' | 'course_description' | 'created_at' | 'detailed_address' | 'prospectus_id' | 'schedule_id' | 'deleted_at' | 'deleted_by' | 'deleted_by_name' | 'delete_reason'> {
  expertId: number | null;
  expert: string;
  endDate: string | null;
  detailedAddress: string | null;
  salespersonId: string | null;  // 改为 UUID
  salespersonName: string | null;
  conferenceServiceId: string | null;  // 会务客服ID (UUID)
  conferenceServiceName: string | null; // 会务客服姓名
  courseId: number | null;        // 关联课程ID
  courseName: string | null;      // 课程名称
  sessionNumber: number;          // 第几期
  courseDescription: string | null;
  prospectusId: number | null;  // 招商简章ID
  scheduleId: number | null;    // 课表ID
  createdAt: string;
  // 软删除字段（驼峰命名）
  deletedAt: string | null;
  deletedBy: string | null;
  deletedByName: string | null;
  deleteReason: string | null;
  participantsList?: TrainingParticipantFrontend[];
}

// 培训参与者（数据库字段）
export interface TrainingParticipant {
  id: number;
  training_session_id: number;
  customer_id: number | null;
  name: string;
  phone: string | null;
  email: string | null;
  registration_date: string | null;
  payment_status: string | null;
  salesperson_name: string | null;
  participation_mode: string | null;  // 参与方式：online/offline
  payment_amount: number | null;      // 付款金额
  actual_price: number | null;        // 实际价格（优惠后）
  discount_rate: number | null;       // 折扣率（百分比）
  created_at: string;
}

// 培训参与者（前端友好类型）
export interface TrainingParticipantFrontend {
  id: number;
  trainingSessionId: number;
  customerId: number | null;
  name: string;
  phone: string | null;
  email: string | null;
  registrationDate: string | null;
  paymentStatus: string | null;
  salespersonName: string | null;
  participationMode: string | null;   // 参与方式：online/offline
  paymentAmount: number | null;       // 付款金额
  actualPrice: number | null;         // 实际价格（优惠后）
  discountRate: number | null;        // 折扣率（百分比）
  createdAt: string;
}

// 客户培训历史
export interface CustomerTrainingHistory {
  id: number;
  customer_id: number;
  training_session_id: number | null;
  training_name: string | null;
  date: string | null;
  status: string | null;
  created_at: string;
}

// 权限
export interface Permission {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
}

// 用户权限
export interface UserPermission {
  user_id: string;
  permission_id: string;
}

// 专家反馈
export interface ExpertFeedback {
  id: number;
  expert_id: number;
  content: string | null;
  rating: number;
  created_at: string;
}

// 数据转换工具函数
export function dbToFrontendCustomer(dbCustomer: Customer): CustomerFrontend {
  return {
    ...dbCustomer,
    salesperson: dbCustomer.salesperson_name || undefined,
    followUpStatus: dbCustomer.follow_up_status || undefined,
    lastContact: dbCustomer.last_contact || undefined,
    createdAt: dbCustomer.created_at,
    trainingHistory: []
  };
}

export function dbToFrontendTrainingSession(dbSession: TrainingSession): TrainingSessionFrontend {
  return {
    id: dbSession.id,
    name: dbSession.name,
    date: dbSession.date,
    endDate: dbSession.end_date,
    capacity: dbSession.capacity || 30,
    participants: dbSession.participants,
    expertId: dbSession.expert_id,
    expert: dbSession.expert_name || '未指定',
    area: dbSession.area || '未指定',
    detailedAddress: dbSession.detailed_address,
    revenue: dbSession.revenue,
    status: dbSession.status,
    rating: dbSession.rating,
    salespersonId: dbSession.salesperson_id,
    salespersonName: dbSession.salesperson_name,
    conferenceServiceId: dbSession.conference_service_id,
    conferenceServiceName: dbSession.conference_service_name,
    courseId: dbSession.course_id,
    courseName: dbSession.course_name,      // 新增
    sessionNumber: dbSession.session_number || 1,  // 新增
    courseDescription: dbSession.course_description,
    prospectusId: dbSession.prospectus_id,
    scheduleId: dbSession.schedule_id || null,
    training_mode: dbSession.training_mode,
    online_price: dbSession.online_price,
    offline_price: dbSession.offline_price,
    auto_calculate_revenue: dbSession.auto_calculate_revenue,
    createdAt: dbSession.created_at,
    // 软删除字段
    deletedAt: dbSession.deleted_at,
    deletedBy: dbSession.deleted_by,
    deletedByName: dbSession.deleted_by_name,
    deleteReason: dbSession.delete_reason,
    participantsList: []
  };
}

// 课程类型转换
export function dbToFrontendCourse(dbCourse: CourseDB): Course {
  return {
    id: dbCourse.id,
    module: dbCourse.module,
    name: dbCourse.name,
    code: dbCourse.code || undefined,
    durationDays: dbCourse.duration_days,
    sessionsPerYear: dbCourse.sessions_per_year,
    standardFee: dbCourse.standard_fee || undefined,
    onlinePrice: dbCourse.online_price || undefined,
    offlinePrice: dbCourse.offline_price || undefined,
    averagePrice: dbCourse.average_price || undefined,
    description: dbCourse.description || undefined,
    notes: dbCourse.notes || undefined,
    status: (dbCourse.status as 'active' | 'inactive' | 'archived') || 'active',
    projectManagerId: dbCourse.project_manager_id || undefined,
    createdAt: dbCourse.created_at,
    updatedAt: dbCourse.updated_at || undefined,
  };
}

export function dbToFrontendTrainingParticipant(dbParticipant: TrainingParticipant): TrainingParticipantFrontend {
  return {
    id: dbParticipant.id,
    trainingSessionId: dbParticipant.training_session_id,
    customerId: dbParticipant.customer_id,
    name: dbParticipant.name,
    phone: dbParticipant.phone,
    email: dbParticipant.email,
    registrationDate: dbParticipant.registration_date,
    paymentStatus: dbParticipant.payment_status,
    salespersonName: dbParticipant.salesperson_name,
    participationMode: dbParticipant.participation_mode,
    paymentAmount: dbParticipant.payment_amount,
    actualPrice: dbParticipant.actual_price,
    discountRate: dbParticipant.discount_rate,
    createdAt: dbParticipant.created_at
  };
}

export function frontendToDbCustomer(frontendCustomer: Partial<CustomerFrontend>): Partial<Customer> {
  const dbCustomer: Partial<Customer> = { ...frontendCustomer };
  
  // 移除前端专用字段
  delete (dbCustomer as any).salesperson;
  delete (dbCustomer as any).followUpStatus;
  delete (dbCustomer as any).lastContact;
  delete (dbCustomer as any).createdAt;
  delete (dbCustomer as any).trainingHistory;
  
  // 如果有前端字段，映射到数据库字段
  if (frontendCustomer.salesperson !== undefined) {
    dbCustomer.salesperson_name = frontendCustomer.salesperson;
  }
  if (frontendCustomer.followUpStatus !== undefined) {
    dbCustomer.follow_up_status = frontendCustomer.followUpStatus;
  }
  if (frontendCustomer.lastContact !== undefined) {
    dbCustomer.last_contact = frontendCustomer.lastContact;
  }
  if (frontendCustomer.createdAt !== undefined) {
    dbCustomer.created_at = frontendCustomer.createdAt;
  }
  
  return dbCustomer;
}

// Supabase 数据库类型定义
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at'>;
        Update: Partial<Omit<Customer, 'id' | 'created_at'>>;
      };
      experts: {
        Row: Expert;
        Insert: Omit<Expert, 'id' | 'created_at'>;
        Update: Partial<Omit<Expert, 'id' | 'created_at'>>;
      };
      // salespersons 表已删除，业务员数据现在在 user_profiles 中
      salesperson_performance: {
        Row: SalespersonPerformance;
        Insert: Omit<SalespersonPerformance, 'id' | 'updated_at'>;
        Update: Partial<Omit<SalespersonPerformance, 'id'>>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Course, 'id' | 'created_at'>>;
      };
      training_sessions: {
        Row: TrainingSession;
        Insert: Omit<TrainingSession, 'id' | 'created_at'>;
        Update: Partial<Omit<TrainingSession, 'id' | 'created_at'>>;
      };
      training_participants: {
        Row: TrainingParticipant;
        Insert: Omit<TrainingParticipant, 'id' | 'created_at'>;
        Update: Partial<Omit<TrainingParticipant, 'id' | 'created_at'>>;
      };
      customer_training_history: {
        Row: CustomerTrainingHistory;
        Insert: Omit<CustomerTrainingHistory, 'id' | 'created_at'>;
        Update: Partial<Omit<CustomerTrainingHistory, 'id' | 'created_at'>>;
      };
      permissions: {
        Row: Permission;
        Insert: Permission;
        Update: Partial<Permission>;
      };
      user_permissions: {
        Row: UserPermission;
        Insert: UserPermission;
        Update: never;
      };
      expert_feedback: {
        Row: ExpertFeedback;
        Insert: Omit<ExpertFeedback, 'id' | 'created_at'>;
        Update: Partial<Omit<ExpertFeedback, 'id' | 'created_at'>>;
      };
      prospectuses: {
        Row: Prospectus;
        Insert: Omit<Prospectus, 'id' | 'created_at' | 'updated_at' | 'uploaded_at'>;
        Update: Partial<Omit<Prospectus, 'id' | 'created_at' | 'uploaded_at'>>;
      };
      prospectus_downloads: {
        Row: ProspectusDownload;
        Insert: Omit<ProspectusDownload, 'id' | 'created_at' | 'downloaded_at'>;
        Update: never;
      };
      schedules: {
        Row: Schedule;
        Insert: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'uploaded_at'>;
        Update: Partial<Omit<Schedule, 'id' | 'created_at' | 'uploaded_at'>>;
      };
      schedule_downloads: {
        Row: ScheduleDownload;
        Insert: Omit<ScheduleDownload, 'id' | 'created_at' | 'downloaded_at'>;
        Update: never;
      };
      schedule_courses: {
        Row: ScheduleCourse;
        Insert: Omit<ScheduleCourse, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}
