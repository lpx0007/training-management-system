/**
 * Supabase 数据库类型定义
 * 这些类型与数据库表结构对应
 */

// 用户角色类型
export type UserRole = 'admin' | 'salesperson' | 'expert';

// 用户资料
export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  department: string | null;
  
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
  tags: string[] | null;
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
  bio: string | null;
  past_sessions: number;
  total_participants: number;
  phone: string | null;
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

// 课程
export interface Course {
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

// 培训场次（数据库字段）
export interface TrainingSession {
  id: number;
  name: string;
  date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
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
  course_id: string | null;
  course_description: string | null;
  created_at: string;
}

// 培训场次（前端友好类型，包含驼峰命名字段）
export interface TrainingSessionFrontend extends Omit<TrainingSession, 'expert_id' | 'expert_name' | 'start_time' | 'end_time' | 'end_date' | 'salesperson_id' | 'salesperson_name' | 'course_id' | 'course_description' | 'created_at' | 'detailed_address'> {
  expertId: number | null;
  expert: string;
  startTime: string;
  endTime: string;
  endDate: string | null;
  detailedAddress: string | null;
  salespersonId: string | null;  // 改为 UUID
  salespersonName: string | null;
  courseId: string | null;
  courseDescription: string | null;
  createdAt: string;
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
    startTime: dbSession.start_time || '09:00',
    endTime: dbSession.end_time || '17:00',
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
    courseId: dbSession.course_id,
    courseDescription: dbSession.course_description,
    createdAt: dbSession.created_at,
    participantsList: []
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
    };
  };
}
