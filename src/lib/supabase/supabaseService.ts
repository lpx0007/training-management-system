/**
 * Supabase 服务层
 * 封装所有数据库操作，提供统一的 API 接口
 */

import { supabase } from './client';
import { handleSupabaseError, logError, retryOperation } from './errorHandler';
import type {
  Customer,
  Expert,
  Salesperson,
  TrainingSession,
  TrainingSessionFrontend,
  TrainingParticipant,
  TrainingParticipantFrontend,
  Course,
  Permission,
  UserProfile,
} from './types';
import { 
  dbToFrontendTrainingSession as convertTrainingSession,
  dbToFrontendTrainingParticipant as convertTrainingParticipant
} from './types';
import type { User, Session } from '@supabase/supabase-js';

class SupabaseService {
  // ============================================
  // 认证相关方法
  // ============================================

  /**
   * 用户登录（支持邮箱或手机号）
   * @param emailOrPhone 邮箱或手机号
   * @param password 密码
   * @returns 用户信息和 session
   */
  async signIn(emailOrPhone: string, password: string) {
    try {
      console.log('🔐 supabaseService.signIn 开始，输入:', emailOrPhone);
      
      let loginEmail = emailOrPhone;
      
      // 判断输入的是手机号还是邮箱
      const isPhone = /^1[3-9]\d{9}$/.test(emailOrPhone);
      
      if (isPhone) {
        console.log('📱 检测到手机号，查询对应的邮箱...');
        
        // 通过手机号查询邮箱
        const { data: profile, error: queryError } = await supabase
          .from('user_profiles')
          .select('email')
          .eq('phone', emailOrPhone)
          .single();
        
        if (queryError || !profile || !(profile as UserProfile).email) {
          console.error('❌ 手机号未注册或未绑定邮箱:', emailOrPhone);
          throw new Error('该手机号未注册');
        }
        
        loginEmail = (profile as UserProfile).email!;
        console.log('✅ 找到对应邮箱:', loginEmail);
      }
      
      // 步骤 1: 认证
      console.log('🔐 使用邮箱认证:', loginEmail);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        console.error('❌ 认证失败:', error.message);
        throw error;
      }

      if (!data.user) {
        throw new Error('认证成功但未返回用户信息');
      }

      console.log('✅ 认证成功，用户 ID:', data.user.id);

      // 步骤 2: 获取用户资料
      console.log('📋 获取用户资料...');
      const profile = await this.getUserProfile(data.user.id);
      
      if (!profile) {
        throw new Error('无法获取用户资料');
      }

      console.log('✅ 用户资料获取成功:', profile.name);

      return {
        user: data.user,
        session: data.session,
        profile,
      };
    } catch (error) {
      console.error('❌ signIn 错误:', error);
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'signIn');
      throw supabaseError;
    }
  }

  /**
   * 用户登出
   */
  async signOut() {
    try {
      console.log('🚪 supabaseService.signOut 开始');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ 登出失败:', error.message);
        throw error;
      }
      console.log('✅ 登出成功');
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'signOut');
      throw supabaseError;
    }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getCurrentUser');
      return null;
    }
  }

  /**
   * 获取当前 session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('❌ 获取 session 失败:', error.message);
        throw error;
      }
      return session;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getSession');
      return null;
    }
  }

  /**
   * 获取用户资料
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    console.log('🔍 getUserProfile 调用，用户 ID:', userId);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ 查询用户资料失败:', error.message);
        throw error;
      }
      
      if (!data) {
        console.error('❌ 用户资料不存在');
        return null;
      }
      
      console.log('✅ 用户资料查询成功:', (data as UserProfile).name, (data as UserProfile).role);
      return data as UserProfile;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      console.error('❌ getUserProfile 异常:', supabaseError.message);
      logError(supabaseError, 'getUserProfile');
      return null;
    }
  }

  /**
   * 获取所有用户（包含权限和功能面板信息）
   */
  async getAllUsersWithPermissions() {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!users) return [];

      // 并行获取每个用户的权限和功能面板访问权限
      const usersWithPermissions = await Promise.all(
        users.map(async (user) => {
          const [permissions, menuAccess] = await Promise.all([
            this.getUserPermissions(user.id),
            this.getUserMenuAccess(user.id)
          ]);

          return {
            ...user,
            permissions,
            menuAccess
          };
        })
      );

      return usersWithPermissions;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getAllUsersWithPermissions');
      throw supabaseError;
    }
  }

  /**
   * 获取指定角色的用户
   */
  async getUsersByRole(role: 'admin' | 'salesperson' | 'expert') {
    try {
      const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', role)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!users) return [];

      // 并行获取每个用户的权限和功能面板访问权限
      const usersWithPermissions = await Promise.all(
        users.map(async (user) => {
          const [permissions, menuAccess] = await Promise.all([
            this.getUserPermissions(user.id),
            this.getUserMenuAccess(user.id)
          ]);

          return {
            ...user,
            permissions,
            menuAccess
          };
        })
      );

      return usersWithPermissions;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getUsersByRole');
      throw supabaseError;
    }
  }

  /**
   * 搜索用户
   */
  async searchUsers(searchTerm: string, filters?: { role?: string; status?: string }) {
    try {
      let query = supabase
        .from('user_profiles')
        .select('*');

      // 搜索条件
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,department.ilike.%${searchTerm}%`);
      }

      // 筛选条件
      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      query = query.order('created_at', { ascending: false });

      const { data: users, error } = await query;

      if (error) throw error;
      if (!users) return [];

      // 并行获取每个用户的权限和功能面板访问权限
      const usersWithPermissions = await Promise.all(
        users.map(async (user) => {
          const [permissions, menuAccess] = await Promise.all([
            this.getUserPermissions(user.id),
            this.getUserMenuAccess(user.id)
          ]);

          return {
            ...user,
            permissions,
            menuAccess
          };
        })
      );

      return usersWithPermissions;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'searchUsers');
      throw supabaseError;
    }
  }

  /**
   * 监听认证状态变化
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // ============================================
  // 客户管理方法
  // ============================================

  /**
   * 获取客户列表
   * RLS 策略会自动过滤：管理员看所有，业务员只看自己的
   */
  async getCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await retryOperation(async () => {
        return await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getCustomers');
      throw supabaseError;
    }
  }

  /**
   * 根据 ID 获取客户
   */
  async getCustomerById(id: number): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getCustomerById');
      return null;
    }
  }

  /**
   * 添加客户
   */
  async addCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer] as any)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'addCustomer');
      throw supabaseError;
    }
  }

  /**
   * 更新客户
   */
  async updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Customer;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateCustomer');
      throw supabaseError;
    }
  }

  /**
   * 删除客户
   */
  async deleteCustomer(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'deleteCustomer');
      throw supabaseError;
    }
  }

  // ============================================
  // 培训场次管理方法
  // ============================================

  /**
   * 获取培训场次列表
   * @param salespersonId 可选，业务员ID（UUID），用于过滤该业务员的客户参与的培训
   */
  async getTrainingSessions(salespersonId?: string): Promise<TrainingSessionFrontend[]> {
    try {
      const { data, error } = await retryOperation(async () => {
        return await supabase
          .from('training_sessions')
          .select('*')
          .order('date', { ascending: false });
      });

      if (error) throw error;
      
      const sessions = (data || []) as TrainingSession[];
      
      // 如果指定了业务员ID，先获取该业务员的客户ID列表
      let salespersonCustomerIds: number[] = [];
      if (salespersonId) {
        try {
          const { data: customers } = await supabase
            .from('customers')
            .select('id')
            .eq('salesperson_id', salespersonId);
          
          salespersonCustomerIds = (customers || []).map(c => c.id);
          console.log(`📋 业务员 ${salespersonId} 的客户ID列表:`, salespersonCustomerIds);
        } catch (e) {
          console.warn('获取业务员客户列表失败:', e);
        }
      }
      
      // 优化：一次性加载所有参与者数据
      const sessionIds = sessions.map(s => s.id);
      let allParticipants: any[] = [];
      
      if (sessionIds.length > 0) {
        try {
          let query = supabase
            .from('training_participants')
            .select('*')
            .in('training_session_id', sessionIds);
          
          // 如果指定了业务员，只加载该业务员客户的参训记录
          if (salespersonId && salespersonCustomerIds.length > 0) {
            query = query.in('customer_id', salespersonCustomerIds);
          }
          
          const { data: participantsData } = await query;
          allParticipants = participantsData || [];
        } catch (e) {
          console.warn('批量加载参与者失败:', e);
        }
      }
      
      // 按培训ID分组参与者
      const participantsBySession = allParticipants.reduce((acc, participant) => {
        const sessionId = participant.training_session_id;
        if (!acc[sessionId]) {
          acc[sessionId] = [];
        }
        acc[sessionId].push(participant);
        return acc;
      }, {} as Record<number, any[]>);
      
      // 转换为前端友好格式并附加参与者列表
      const sessionsWithParticipants = sessions.map(session => {
        const converted = convertTrainingSession(session);
        converted.participantsList = participantsBySession[session.id] || [];
        return converted;
      });
      
      // 注意：业务员应该能看到所有培训（用于给自己客户报名）
      // 数据隔离通过 participantsList 只包含该业务员的客户来实现
      // 不要在这里过滤培训列表，否则业务员无法报名新培训
      
      return sessionsWithParticipants;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getTrainingSessions');
      throw supabaseError;
    }
  }

  /**
   * 根据 ID 获取培训场次
   * @param id 培训场次ID
   * @param salespersonId 可选，业务员ID（UUID），用于过滤该业务员的客户（通常不需要过滤，业务员应该看到该培训的所有参训人）
   */
  async getTrainingSessionById(id: number, salespersonId?: string): Promise<TrainingSessionFrontend | null> {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) return null;
      
      // 转换为前端格式
      const session = convertTrainingSession(data as TrainingSession);
      
      // 加载参与者列表（不过滤，显示所有参训人）
      try {
        const participants = await this.getTrainingParticipants(id);
        session.participantsList = participants;
      } catch (e) {
        console.warn('加载参与者列表失败:', e);
        session.participantsList = [];
      }
      
      return session;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getTrainingSessionById');
      return null;
    }
  }

  /**
   * 添加培训场次
   */
  async addTrainingSession(
    session: Omit<TrainingSession, 'id' | 'created_at'>
  ): Promise<TrainingSession> {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .insert(session as any)
        .select()
        .single();

      if (error) throw error;
      return data as TrainingSession;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'addTrainingSession');
      throw supabaseError;
    }
  }

  /**
   * 更新培训场次
   */
  async updateTrainingSession(
    id: number,
    updates: Partial<TrainingSession>
  ): Promise<TrainingSession> {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as TrainingSession;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateTrainingSession');
      throw supabaseError;
    }
  }

  /**
   * 删除培训场次
   */
  async deleteTrainingSession(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'deleteTrainingSession');
      throw supabaseError;
    }
  }

  /**
   * 根据业务员获取培训场次
   */
  async getTrainingSessionsBySalesperson(salespersonName: string): Promise<TrainingSession[]> {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('salesperson_name', salespersonName)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getTrainingSessionsBySalesperson');
      throw supabaseError;
    }
  }

  // ============================================
  // 培训参与者管理方法
  // ============================================

  /**
   * 获取培训参与者列表
   * @param trainingSessionId 培训场次ID
   * @param salespersonName 可选，业务员姓名，用于过滤该业务员的客户
   */
  async getTrainingParticipants(trainingSessionId: number, salespersonName?: string): Promise<TrainingParticipantFrontend[]> {
    try {
      let query = supabase
        .from('training_participants')
        .select('*')
        .eq('training_session_id', trainingSessionId);
      
      // 如果指定了业务员，只加载该业务员的客户
      if (salespersonName) {
        query = query.eq('salesperson_name', salespersonName);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // 转换为前端友好格式
      const participants = (data || []) as TrainingParticipant[];
      return participants.map(p => convertTrainingParticipant(p));
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getTrainingParticipants');
      throw supabaseError;
    }
  }

  /**
   * 添加客户到培训
   */
  async addCustomerToTraining(
    trainingSessionId: number,
    participant: Omit<TrainingParticipant, 'id' | 'training_session_id' | 'created_at'>
  ): Promise<TrainingParticipant> {
    try {
      const { data, error } = await supabase
        .from('training_participants')
        .insert({
          ...participant,
          training_session_id: trainingSessionId,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // 更新培训场次的参与人数
      await this.updateTrainingSession(trainingSessionId, {
        participants: (await this.getTrainingParticipants(trainingSessionId)).length,
      });

      return data as TrainingParticipant;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'addCustomerToTraining');
      throw supabaseError;
    }
  }

  /**
   * 从培训中移除参与者
   */
  async removeParticipantFromTraining(participantId: number): Promise<boolean> {
    try {
      // 先获取参与者信息以便更新培训场次人数
      const { data: participant } = await supabase
        .from('training_participants')
        .select('training_session_id')
        .eq('id', participantId)
        .single();

      const { error } = await supabase
        .from('training_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      // 更新培训场次的参与人数
      if (participant && (participant as any).training_session_id) {
        await this.updateTrainingSession((participant as any).training_session_id, {
          participants: (await this.getTrainingParticipants((participant as any).training_session_id)).length,
        });
      }

      return true;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'removeParticipantFromTraining');
      throw supabaseError;
    }
  }

  /**
   * 修改参训人员信息
   */
  async updateParticipant(
    participantId: number,
    updates: {
      actual_price?: number;
      discount_rate?: number;
      payment_amount?: number;
      participation_mode?: 'online' | 'offline';
      payment_status?: string;
    }
  ): Promise<boolean> {
    try {
      // 先获取原始数据用于审计日志
      const { data: oldData } = await supabase
        .from('training_participants')
        .select('*')
        .eq('id', participantId)
        .single();

      if (!oldData) {
        throw new Error('参训人员不存在');
      }

      // 更新数据
      const { error } = await supabase
        .from('training_participants')
        .update(updates)
        .eq('id', participantId);

      if (error) throw error;

      return true;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateParticipant');
      throw supabaseError;
    }
  }

  /**
   * 获取参训人员详细信息
   */
  async getParticipantById(participantId: number): Promise<TrainingParticipant | null> {
    try {
      const { data, error } = await supabase
        .from('training_participants')
        .select('*')
        .eq('id', participantId)
        .single();

      if (error) throw error;
      
      return data as TrainingParticipant;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getParticipantById');
      throw supabaseError;
    }
  }

  // ============================================
  // 专家管理方法
  // ============================================

  /**
   * 获取专家列表
   */
  async getExperts(): Promise<Expert[]> {
    try {
      const { data, error } = await retryOperation(async () => {
        return await supabase
          .from('experts')
          .select('*')
          .order('created_at', { ascending: false });
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getExperts');
      throw supabaseError;
    }
  }

  /**
   * 根据 ID 获取专家
   */
  async getExpertById(id: number): Promise<Expert | null> {
    try {
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getExpertById');
      return null;
    }
  }

  /**
   * 添加专家
   */
  async addExpert(expert: Omit<Expert, 'id' | 'created_at'>): Promise<Expert> {
    try {
      const { data, error } = await supabase
        .from('experts')
        .insert(expert as any)
        .select()
        .single();

      if (error) throw error;
      return data as Expert;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'addExpert');
      throw supabaseError;
    }
  }

  /**
   * 更新专家
   */
  async updateExpert(id: number, updates: Partial<Expert>): Promise<Expert> {
    try {
      const { data, error } = await supabase
        .from('experts')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Expert;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateExpert');
      throw supabaseError;
    }
  }

  /**
   * 删除专家
   */
  async deleteExpert(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('experts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'deleteExpert');
      throw supabaseError;
    }
  }

  /**
   * 上传专家简历到存储，并返回公开访问的 URL
   * 需要在 Supabase Storage 中创建名为 expert-resumes 的 Bucket（公开读取）
   */
  async uploadExpertResume(expertId: number, file: File): Promise<string> {
    try {
      const bucket = 'expert-resumes';
      const ext = file.name?.split('.').pop() || 'pdf';
      const path = `experts/${expertId}/resume_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'uploadExpertResume');
      throw supabaseError;
    }
  }

  // ============================================
  // 业务员管理方法
  // ============================================

  /**
   * 获取员工列表（不包含管理员和专家，专家有单独的管理模块）
   */
  async getSalespersons(): Promise<Salesperson[]> {
    try {
      const { data, error } = await retryOperation(async () => {
        return await supabase
          .from('user_profiles')
          .select('*')
          .in('role', ['salesperson', 'manager', 'conference_service']) // 不包含专家
          .order('created_at', { ascending: false });
      });

      if (error) throw error;
      
      // 为没有position的用户根据role设置默认职位
      const dataWithPosition = (data || []).map(user => ({
        ...user,
        position: user.position || (
          user.role === 'manager' ? '部门经理' : 
          user.role === 'conference_service' ? '会务客服' :
          '业务员'
        )
      }));
      
      console.log('🔧 getSalespersons 返回的数据:', dataWithPosition);
      console.log('🔧 员工数量:', dataWithPosition?.length || 0);
      return dataWithPosition || [];
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getSalespersons');
      throw supabaseError;
    }
  }

  /**
   * 根据 ID 获取业务员
   */
  async getSalespersonById(id: string): Promise<Salesperson | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', id)
        .eq('role', 'salesperson')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getSalespersonById');
      return null;
    }
  }

  /**
   * 添加业务员（管理员创建）
   * 同时创建 auth.users 和 user_profiles 记录
   */
  async addSalesperson(salesperson: Omit<Salesperson, 'id' | 'created_at'>): Promise<Salesperson> {
    try {
      console.log('🔍 管理员添加业务员:', salesperson.name, salesperson.email, salesperson.phone);
      
      // 验证必填字段
      if (!salesperson.email || !salesperson.phone) {
        throw new Error('邮箱和手机号都是必填项');
      }
      
      // 检查邮箱是否已存在
      const { data: existingEmail } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', salesperson.email)
        .single();
      
      if (existingEmail) {
        throw new Error('该邮箱已被注册');
      }
      
      // 检查手机号是否已存在
      const { data: existingPhone } = await supabase
        .from('user_profiles')
        .select('phone')
        .eq('phone', salesperson.phone)
        .single();
      
      if (existingPhone) {
        throw new Error('该手机号已被注册');
      }
      
      console.log('📝 创建 Auth 用户（默认密码: 123456）');
      
      // 创建 Auth 用户（默认密码 123456）
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: salesperson.email,
        phone: salesperson.phone,
        password: '123456',  // 默认密码
        options: {
          emailRedirectTo: undefined,  // 不发送验证邮件
          data: {
            name: salesperson.name,
            department: salesperson.department || '销售一部',
            position: salesperson.position || '销售顾问',
            team: salesperson.team
          }
        }
      });

      if (authError) {
        console.error('❌ Auth 用户创建失败:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('用户创建失败');
      }

      console.log('✅ Auth 用户创建成功:', authData.user.id);
      console.log('⏳ 触发器将自动创建 user_profiles 记录');
      
      // 等待触发器创建 user_profiles 记录
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 获取创建的 user_profiles 记录
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError || !profileData) {
        console.error('❌ 获取 user_profiles 失败:', profileError);
        throw new Error('用户创建成功但无法获取资料');
      }
      
      console.log('✅ 业务员添加成功');
      
      return profileData as Salesperson;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'addSalesperson');
      throw supabaseError;
    }
  }

  /**
   * 更新员工信息（适用于所有员工角色）
   */
  async updateSalesperson(id: string, updates: Partial<Salesperson>): Promise<Salesperson> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates as any)
        .eq('id', id)
        // 移除角色限制，允许更新所有员工角色（业务员、部门经理、专家、会务客服）
        .select()
        .single();

      if (error) throw error;
      return data as Salesperson;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateSalesperson');
      throw supabaseError;
    }
  }

  /**
   * 删除业务员
   */
  async deleteSalesperson(id: string): Promise<boolean> {
    try {
      // 调用数据库函数完全删除用户（包括 auth.users 和 user_profiles）
      const { data, error } = await supabase.rpc('delete_user_completely', {
        user_id: id
      });

      if (error) throw error;
      
      // 如果函数返回 false，表示删除失败
      if (data === false) {
        throw new Error('删除用户失败');
      }
      
      return true;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'deleteSalesperson');
      throw supabaseError;
    }
  }

  // ============================================
  // 课程管理方法
  // ============================================

  /**
   * 获取课程列表
   */
  async getCourses(): Promise<Course[]> {
    try {
      const { data, error } = await retryOperation(async () => {
        return await supabase
          .from('courses')
          .select('*')
          .order('created_at', { ascending: false });
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getCourses');
      throw supabaseError;
    }
  }

  /**
   * 根据 ID 获取课程
   */
  async getCourseById(id: string): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getCourseById');
      return null;
    }
  }

  /**
   * 添加课程
   */
  async addCourse(course: Omit<Course, 'created_at' | 'updated_at'>): Promise<Course> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert(course as any)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'addCourse');
      throw supabaseError;
    }
  }

  /**
   * 更新课程
   */
  async updateCourse(id: string, updates: Partial<Course>): Promise<Course> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Course;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateCourse');
      throw supabaseError;
    }
  }

  /**
   * 删除课程
   */
  async deleteCourse(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'deleteCourse');
      throw supabaseError;
    }
  }

  // ============================================
  // 权限管理方法
  // ============================================

  /**
   * 获取所有权限
   */
  async getPermissions(): Promise<Permission[]> {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getPermissions');
      throw supabaseError;
    }
  }

  /**
   * 获取用户权限
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission_id')
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map((p: any) => p.permission_id) || [];
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getUserPermissions');
      return [];
    }
  }

  /**
   * 更新用户权限
   */
  async updateUserPermissions(userId: string, permissionIds: string[]): Promise<boolean> {
    try {
      // 先删除现有权限
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      // 添加新权限
      if (permissionIds.length > 0) {
        const { error } = await supabase
          .from('user_permissions')
          .insert(
            permissionIds.map(permissionId => ({
              user_id: userId,
              permission_id: permissionId,
            })) as any
          );

        if (error) throw error;
      }

      return true;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateUserPermissions');
      throw supabaseError;
    }
  }

  /**
   * 批量更新用户权限（针对选中的用户）
   */
  async batchUpdateUserPermissions(
    userIds: string[],
    permissionIds: string[],
    action: 'grant' | 'revoke'
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = { success: 0, failed: 0, errors: [] as string[] };

    try {
      for (const userId of userIds) {
        try {
          if (action === 'grant') {
            // 授予权限：添加新权限（忽略已存在的）
            const { error } = await supabase
              .from('user_permissions')
              .upsert(
                permissionIds.map(permissionId => ({
                  user_id: userId,
                  permission_id: permissionId,
                })),
                { onConflict: 'user_id,permission_id', ignoreDuplicates: true }
              );

            if (error) throw error;
          } else {
            // 撤销权限：删除指定权限
            const { error } = await supabase
              .from('user_permissions')
              .delete()
              .eq('user_id', userId)
              .in('permission_id', permissionIds);

            if (error) throw error;
          }

          result.success++;
        } catch (error: any) {
          result.failed++;
          result.errors.push(`用户 ${userId}: ${error.message}`);
        }
      }

      return result;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'batchUpdateUserPermissions');
      throw supabaseError;
    }
  }

  /**
   * 批量更新角色权限（针对指定角色的所有用户）
   */
  async batchUpdateRolePermissions(
    role: 'admin' | 'salesperson' | 'expert' | 'manager',
    permissionIds: string[],
    strategy: 'override' | 'merge' | 'reset'
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = { success: 0, failed: 0, errors: [] as string[] };

    try {
      // 获取该角色的所有用户
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', role);

      if (usersError) throw usersError;
      if (!users || users.length === 0) {
        return result;
      }

      const userIds = users.map(u => u.id);

      // 根据策略执行不同的操作
      if (strategy === 'override') {
        // 完全覆盖：删除现有权限，添加新权限
        for (const userId of userIds) {
          try {
            await this.updateUserPermissions(userId, permissionIds);
            result.success++;
          } catch (error: any) {
            result.failed++;
            result.errors.push(`用户 ${userId}: ${error.message}`);
          }
        }
      } else if (strategy === 'merge') {
        // 合并模式：保留现有权限，添加新权限
        const batchResult = await this.batchUpdateUserPermissions(userIds, permissionIds, 'grant');
        return batchResult;
      } else if (strategy === 'reset') {
        // 重置为角色默认权限
        const { getRoleDefaultPermissions } = await import('@/constants/permissions');
        const defaultPermissions = getRoleDefaultPermissions(role);
        
        for (const userId of userIds) {
          try {
            await this.updateUserPermissions(userId, defaultPermissions);
            result.success++;
          } catch (error: any) {
            result.failed++;
            result.errors.push(`用户 ${userId}: ${error.message}`);
          }
        }
      }

      return result;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'batchUpdateRolePermissions');
      throw supabaseError;
    }
  }

  // ============================================
  // 功能面板访问管理方法
  // ============================================

  /**
   * 获取所有功能面板定义
   */
  async getAllMenuFeatures() {
    try {
      const { data, error } = await supabase
        .from('menu_features')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getAllMenuFeatures');
      throw supabaseError;
    }
  }

  /**
   * 获取用户可访问的功能面板
   */
  async getUserMenuAccess(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_menu_access')
        .select('menu_feature_id')
        .eq('user_id', userId)
        .eq('enabled', true);

      if (error) throw error;
      return data?.map((m: any) => m.menu_feature_id) || [];
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getUserMenuAccess');
      return [];
    }
  }

  /**
   * 更新用户功能面板访问权限
   */
  async updateUserMenuAccess(userId: string, featureIds: string[]): Promise<boolean> {
    try {
      // 先删除现有访问权限
      await supabase
        .from('user_menu_access')
        .delete()
        .eq('user_id', userId);

      // 添加新的访问权限
      if (featureIds.length > 0) {
        const { error } = await supabase
          .from('user_menu_access')
          .insert(
            featureIds.map(featureId => ({
              user_id: userId,
              menu_feature_id: featureId,
              enabled: true,
            })) as any
          );

        if (error) throw error;
      }

      return true;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateUserMenuAccess');
      throw supabaseError;
    }
  }

  /**
   * 批量更新功能面板访问权限（针对选中的用户）
   */
  async batchUpdateMenuAccess(
    userIds: string[],
    featureIds: string[],
    action: 'enable' | 'disable'
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = { success: 0, failed: 0, errors: [] as string[] };

    try {
      for (const userId of userIds) {
        try {
          if (action === 'enable') {
            // 启用功能面板
            const { error } = await supabase
              .from('user_menu_access')
              .upsert(
                featureIds.map(featureId => ({
                  user_id: userId,
                  menu_feature_id: featureId,
                  enabled: true,
                })),
                { onConflict: 'user_id,menu_feature_id' }
              );

            if (error) throw error;
          } else {
            // 禁用功能面板
            const { error } = await supabase
              .from('user_menu_access')
              .delete()
              .eq('user_id', userId)
              .in('menu_feature_id', featureIds);

            if (error) throw error;
          }

          result.success++;
        } catch (error: any) {
          result.failed++;
          result.errors.push(`用户 ${userId}: ${error.message}`);
        }
      }

      return result;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'batchUpdateMenuAccess');
      throw supabaseError;
    }
  }

  /**
   * 批量更新角色功能面板访问权限（针对指定角色的所有用户）
   */
  async batchUpdateRoleMenuAccess(
    role: 'admin' | 'salesperson' | 'expert' | 'manager',
    featureIds: string[],
    strategy: 'override' | 'merge' | 'reset'
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = { success: 0, failed: 0, errors: [] as string[] };

    try {
      // 获取该角色的所有用户
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', role);

      if (usersError) throw usersError;
      if (!users || users.length === 0) {
        return result;
      }

      const userIds = users.map(u => u.id);

      // 根据策略执行不同的操作
      if (strategy === 'override') {
        // 完全覆盖
        for (const userId of userIds) {
          try {
            await this.updateUserMenuAccess(userId, featureIds);
            result.success++;
          } catch (error: any) {
            result.failed++;
            result.errors.push(`用户 ${userId}: ${error.message}`);
          }
        }
      } else if (strategy === 'merge') {
        // 合并模式
        const batchResult = await this.batchUpdateMenuAccess(userIds, featureIds, 'enable');
        return batchResult;
      } else if (strategy === 'reset') {
        // 重置为角色默认
        const { getRoleDefaultMenuFeatures } = await import('@/constants/menuFeatures');
        const defaultFeatures = getRoleDefaultMenuFeatures(role);
        
        for (const userId of userIds) {
          try {
            await this.updateUserMenuAccess(userId, defaultFeatures);
            result.success++;
          } catch (error: any) {
            result.failed++;
            result.errors.push(`用户 ${userId}: ${error.message}`);
          }
        }
      }

      return result;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'batchUpdateRoleMenuAccess');
      throw supabaseError;
    }
  }

  /**
   * 验证用户是否可访问功能面板
   */
  async canAccessMenuFeature(userId: string, featureId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_menu_access')
        .select('enabled')
        .eq('user_id', userId)
        .eq('menu_feature_id', featureId)
        .single();

      if (error) return false;
      return data?.enabled || false;
    } catch (error) {
      logError(handleSupabaseError(error), 'canAccessMenuFeature');
      return false;
    }
  }

  // ============================================
  // 审计日志方法
  // ============================================

  /**
   * 记录权限变更
   */
  async logPermissionChange(
    operatorId: string,
    targetUserId: string,
    action: 'grant' | 'revoke',
    permissions: string[]
  ): Promise<void> {
    try {
      // 获取操作者和目标用户信息
      const [operator, targetUser] = await Promise.all([
        this.getUserProfile(operatorId),
        this.getUserProfile(targetUserId)
      ]);

      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: operatorId,
          user_name: operator?.name || 'Unknown',
          action: `permission_${action}`,
          resource_type: 'user_permissions',
          resource_id: targetUserId,
          details: {
            target_user_name: targetUser?.name || 'Unknown',
            permissions,
            action
          },
          status: 'success'
        });

      if (error) throw error;
    } catch (error) {
      logError(handleSupabaseError(error), 'logPermissionChange');
      // 审计日志失败不应阻止主操作
    }
  }

  /**
   * 获取用户权限变更历史
   */
  async getUserPermissionHistory(
    userId: string,
    options?: { startDate?: Date; endDate?: Date }
  ) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('resource_type', 'user_permissions')
        .eq('resource_id', userId)
        .order('timestamp', { ascending: false });

      if (options?.startDate) {
        query = query.gte('timestamp', options.startDate.toISOString());
      }
      if (options?.endDate) {
        query = query.lte('timestamp', options.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getUserPermissionHistory');
      return [];
    }
  }

  /**
   * 获取权限变更统计
   */
  async getPermissionChangeStats(options?: { startDate?: Date; endDate?: Date }) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('action, status, timestamp')
        .like('action', 'permission_%');

      if (options?.startDate) {
        query = query.gte('timestamp', options.startDate.toISOString());
      }
      if (options?.endDate) {
        query = query.lte('timestamp', options.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // 统计数据
      const stats = {
        total: data?.length || 0,
        grant: data?.filter(log => log.action === 'permission_grant').length || 0,
        revoke: data?.filter(log => log.action === 'permission_revoke').length || 0,
        success: data?.filter(log => log.status === 'success').length || 0,
        failed: data?.filter(log => log.status === 'failed').length || 0,
      };

      return stats;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getPermissionChangeStats');
      return { total: 0, grant: 0, revoke: 0, success: 0, failed: 0 };
    }
  }

  // ============================================
  // 实时订阅方法
  // ============================================

  /**
   * 订阅客户数据变化
   */
  subscribeToCustomers(callback: (payload: any) => void) {
    return supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        callback
      )
      .subscribe();
  }

  /**
   * 订阅培训场次数据变化
   */
  subscribeToTrainingSessions(callback: (payload: any) => void) {
    return supabase
      .channel('training-sessions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'training_sessions' },
        callback
      )
      .subscribe();
  }

  /**
   * 取消订阅
   */
  unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  }

  // ============================================
  // 用户注册和状态管理
  // ============================================

  /**
   * 注册业务员账号
   */
  async registerSalesperson(data: {
    name: string;
    email: string;
    password: string;
    phone: string;  // ✅ 改为必填
    department?: string;
  }): Promise<void> {
    try {
      console.log('🔍 开始注册业务员:', data.email, data.phone);
      
      // 检查邮箱是否已存在
      const { data: existingEmail } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', data.email)
        .single();
      
      if (existingEmail) {
        console.error('❌ 邮箱已被注册:', data.email);
        throw new Error('该邮箱已被注册，请使用其他邮箱或直接登录');
      }
      
      // 检查手机号是否已存在
      const { data: existingPhone } = await supabase
        .from('user_profiles')
        .select('phone')
        .eq('phone', data.phone)
        .single();
      
      if (existingPhone) {
        console.error('❌ 手机号已被注册:', data.phone);
        throw new Error('该手机号已被注册，请使用其他手机号');
      }
      
      // 创建 Auth 用户
      // 注意：user_profiles 记录会由数据库触发器 handle_new_user() 自动创建
      // 触发器使用 SECURITY DEFINER，会绕过 RLS 策略，确保记录创建成功
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        phone: data.phone,  // ✅ 设置 auth.users.phone
        password: data.password,
        options: {
          emailRedirectTo: undefined, // 不需要邮箱确认
          data: {
            name: data.name,
            department: data.department || '销售一部'
          }
        }
      });

      if (authError) {
        console.error('❌ Auth 用户创建失败:', authError);
        // 检查是否是邮箱已存在的错误
        if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
          throw new Error('该邮箱已被注册，请使用其他邮箱或直接登录');
        }
        throw authError;
      }
      if (!authData.user) {
        console.error('❌ 用户数据为空');
        throw new Error('用户创建失败');
      }

      console.log('✅ 业务员注册成功！');
      console.log('📋 用户 ID:', authData.user.id);
      console.log('📧 邮箱:', data.email);
      console.log('⏳ 状态: pending（等待管理员审核）');
      
      // 注意：不需要验证记录是否创建，因为触发器使用 SECURITY DEFINER
      // 它会绕过 RLS 策略，确保记录一定会创建成功
    } catch (error) {
      console.error('❌ 注册过程出错:', error);
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'registerSalesperson');
      throw supabaseError;
    }
  }

  /**
   * 检查用户状态
   */
  async checkUserStatus(userId: string): Promise<void> {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('status')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!profile) {
        throw new Error('用户配置文件不存在');
      }

      if (profile.status === 'disabled') {
        throw new Error('账号已被禁用，请联系管理员');
      }

      // status === 'enabled' 时正常通过
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'checkUserStatus');
      throw supabaseError;
    }
  }

  /**
   * 审核通过业务员
   */
  async approveSalesperson(salespersonId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          status: 'enabled',
          work_status: 'active'
        })
        .eq('id', userId)
        .eq('role', 'salesperson');

      if (error) throw error;

      console.log('✅ 业务员审核通过');
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'approveSalesperson');
      throw supabaseError;
    }
  }

  /**
   * 拒绝业务员
   */
  async rejectSalesperson(salespersonId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          status: 'disabled',
          work_status: 'resigned'
        })
        .eq('id', userId)
        .eq('role', 'salesperson');

      if (error) throw error;

      console.log('✅ 业务员已拒绝');
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'rejectSalesperson');
      throw supabaseError;
    }
  }

  // ============================================
  // 个人设置相关方法
  // ============================================

  /**
   * 更新用户资料
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates as any)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateUserProfile');
      throw supabaseError;
    }
  }

  /**
   * 更新用户头像
   */
  async updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ avatar: avatarUrl })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateUserAvatar');
      throw supabaseError;
    }
  }

  /**
   * 更新专家头像
   */
  async updateExpertAvatar(expertId: number, avatarUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('experts')
        .update({ avatar: avatarUrl })
        .eq('id', expertId);

      if (error) throw error;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateExpertAvatar');
      throw supabaseError;
    }
  }

  /**
   * 更新客户头像
   */
  async updateCustomerAvatar(customerId: number, avatarUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ avatar: avatarUrl })
        .eq('id', customerId);

      if (error) throw error;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateCustomerAvatar');
      throw supabaseError;
    }
  }

  /**
   * 更新业务员手机号
   */
  async updateSalespersonPhone(userId: string, phone: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ phone })
        .eq('id', userId)
        .eq('role', 'salesperson');

      if (error) throw error;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateSalespersonPhone');
      throw supabaseError;
    }
  }

  /**
   * 更新专家手机号
   */
  async updateExpertPhone(userId: string, phone: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('experts')
        .update({ phone })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateExpertPhone');
      throw supabaseError;
    }
  }

  /**
   * 根据用户ID获取业务员信息
   */
  async getSalespersonByUserId(userId: string): Promise<Salesperson | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .eq('role', 'salesperson')
        .single();

      if (error) throw error;
      return data as Salesperson;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getSalespersonByUserId');
      return null;
    }
  }

  /**
   * 根据用户ID获取专家信息
   */
  async getExpertByUserId(userId: string): Promise<Expert | null> {
    try {
      const { data, error } = await supabase
        .from('experts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data as Expert;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'getExpertByUserId');
      return null;
    }
  }

  /**
   * 更新密码
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updatePassword');
      throw supabaseError;
    }
  }

  /**
   * 验证密码是否正确
   */
  async verifyPassword(email: string, password: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('密码验证失败:', error.message);
        return false;
      }

      return !!data.user;
    } catch (error) {
      console.error('验证密码时出错:', error);
      return false;
    }
  }

  /**
   * 更新邮箱
   */
  async updateEmail(newEmail: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;
    } catch (error) {
      const supabaseError = handleSupabaseError(error);
      logError(supabaseError, 'updateEmail');
      throw supabaseError;
    }
  }
}

// 导出单例
const supabaseService = new SupabaseService();
export default supabaseService;
