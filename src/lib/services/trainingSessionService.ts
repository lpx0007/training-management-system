import { supabase } from '../supabase/client';
import type { TrainingSession } from '../supabase/types';

interface DeleteOptions {
  deleteType: 'hard' | 'soft';
  reason?: string;
  userId: string;
  userName: string;
}

class TrainingSessionService {
  // 创建培训场次
  async createTrainingSession(sessionData: Partial<TrainingSession>): Promise<TrainingSession> {
    const { data, error } = await supabase
      .from('training_sessions')
      .insert(sessionData as any)
      .select()
      .single();

    if (error) throw error;
    return data as TrainingSession;
  }

  // 更新培训场次
  async updateTrainingSession(id: number, sessionData: Partial<TrainingSession>): Promise<TrainingSession> {
    const { data, error } = await supabase
      .from('training_sessions')
      .update(sessionData as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TrainingSession;
  }

  // 软删除培训场次
  async softDeleteSession(id: number, options: Omit<DeleteOptions, 'deleteType'>): Promise<void> {
    const { reason, userId, userName } = options;
    
    const { error } = await supabase
      .from('training_sessions')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_by_name: userName,
        delete_reason: reason || '管理员临时删除'
      })
      .eq('id', id);
    
    if (error) throw error;
  }
  
  // 彻底删除培训场次（含自动备份）
  async hardDeleteWithBackup(id: number, options: Omit<DeleteOptions, 'deleteType'>): Promise<void> {
    const { reason, userId, userName } = options;
    
    // 1. 获取培训场次数据
    const { data: session, error: fetchError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) throw new Error('培训场次不存在');
    
    // 2. 获取所有参训记录
    const { data: participants, error: participantsError } = await supabase
      .from('training_participants')
      .select('*')
      .eq('training_session_id', id);
    
    if (participantsError) throw participantsError;
    
    try {
      // 3. 备份培训场次
      const { data: backupSession, error: backupSessionError } = await supabase
        .from('training_sessions_backup')
        .insert({
          // 复制所有原始字段
          id: session.id,
          course_id: session.course_id,
          course_name: session.course_name,
          session_number: session.session_number,
          name: session.name,
          date: session.date,
          end_date: session.end_date,
          location: session.location,
          area: session.area,
          instructor: session.instructor,
          expert: session.expert,
          salesperson_id: session.salesperson_id,
          salesperson_name: session.salesperson_name,
          training_mode: session.training_mode,
          online_price: session.online_price,
          offline_price: session.offline_price,
          participants: session.participants,
          capacity: session.capacity,
          revenue: session.revenue,
          status: session.status,
          description: session.description,
          created_at: session.created_at,
          updated_at: session.updated_at,
          // 备份元数据
          original_id: session.id,
          deleted_by: userId,
          deleted_by_name: userName,
          deleted_at: new Date().toISOString(),
          delete_reason: reason || '管理员彻底删除',
          can_restore: true
        })
        .select()
        .single();
      
      if (backupSessionError) throw backupSessionError;
      
      // 4. 备份参训记录
      if (participants && participants.length > 0) {
        const backupParticipants = participants.map((p: any) => ({
          // 复制所有原始字段
          id: p.id,
          training_session_id: p.training_session_id,
          customer_id: p.customer_id,
          name: p.name,
          phone: p.phone,
          email: p.email,
          company: p.company,
          position: p.position,
          registration_date: p.registration_date,
          payment_status: p.payment_status,
          payment_amount: p.payment_amount,
          actual_price: p.actual_price,
          participation_mode: p.participation_mode,
          discount_rate: p.discount_rate,
          salesperson_name: p.salesperson_name,
          notes: p.notes,
          created_at: p.created_at,
          updated_at: p.updated_at,
          // 备份元数据
          original_id: p.id,
          session_backup_id: backupSession.backup_id,
          deleted_by: userId,
          deleted_by_name: userName,
          deleted_at: new Date().toISOString()
        }));
        
        const { error: backupParticipantsError } = await supabase
          .from('training_participants_backup')
          .insert(backupParticipants);
        
        if (backupParticipantsError) throw backupParticipantsError;
      }
      
      // 5. 删除参训记录
      const { error: deleteParticipantsError } = await supabase
        .from('training_participants')
        .delete()
        .eq('training_session_id', id);
      
      if (deleteParticipantsError) throw deleteParticipantsError;
      
      // 6. 删除培训场次
      const { error: deleteSessionError } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', id);
      
      if (deleteSessionError) throw deleteSessionError;
      
      console.log('✅ 彻底删除成功，已自动备份到数据库');
      
    } catch (error) {
      console.error('❌ 删除失败:', error);
      throw error;
    }
  }
  
  // 统一删除接口（根据 deleteType 调用不同方法）
  async deleteSession(id: number, options: DeleteOptions): Promise<void> {
    if (options.deleteType === 'soft') {
      await this.softDeleteSession(id, options);
    } else {
      await this.hardDeleteWithBackup(id, options);
    }
  }
  
  // 恢复软删除的培训
  async restoreSoftDeleted(id: number): Promise<void> {
    const { error } = await supabase
      .from('training_sessions')
      .update({
        deleted_at: null,
        deleted_by: null,
        deleted_by_name: null,
        delete_reason: null
      })
      .eq('id', id);
    
    if (error) throw error;
  }
  
  // 从备份恢复培训（一键恢复）
  async restoreFromBackup(backupId: number): Promise<{ sessionId: number }> {
    try {
      // 1. 获取备份的培训数据
      const { data: backupSession, error: fetchError } = await supabase
        .from('training_sessions_backup')
        .select('*')
        .eq('backup_id', backupId)
        .single();
      
      if (fetchError) throw new Error('备份记录不存在');
      if (!backupSession.can_restore) throw new Error('此备份不允许恢复');
      
      // 2. 获取备份的参训记录
      const { data: backupParticipants, error: participantsError } = await supabase
        .from('training_participants_backup')
        .select('*')
        .eq('session_backup_id', backupId);
      
      if (participantsError) throw participantsError;
      
      // 3. 恢复培训场次（不使用原始ID，让数据库自动生成新ID）
      const { data: restoredSession, error: restoreSessionError } = await supabase
        .from('training_sessions')
        .insert({
          course_id: backupSession.course_id,
          course_name: backupSession.course_name,
          session_number: backupSession.session_number,
          name: backupSession.name,
          date: backupSession.date,
          end_date: backupSession.end_date,
          location: backupSession.location,
          area: backupSession.area,
          instructor: backupSession.instructor,
          expert: backupSession.expert,
          salesperson_id: backupSession.salesperson_id,
          salesperson_name: backupSession.salesperson_name,
          training_mode: backupSession.training_mode,
          online_price: backupSession.online_price,
          offline_price: backupSession.offline_price,
          participants: backupSession.participants,
          capacity: backupSession.capacity,
          revenue: backupSession.revenue,
          status: backupSession.status,
          notes: backupSession.notes,
          // 软删除字段设为 NULL
          deleted_at: null,
          deleted_by: null,
          deleted_by_name: null,
          delete_reason: null,
          created_at: new Date().toISOString(), // 使用当前时间作为恢复时间
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (restoreSessionError) throw restoreSessionError;
      if (!restoredSession) throw new Error('恢复培训失败');
      
      // 4. 恢复参训记录（如果有）
      if (backupParticipants && backupParticipants.length > 0) {
        const participantsToRestore = backupParticipants.map(p => ({
          training_session_id: restoredSession.id, // 使用新的培训ID
          customer_id: p.customer_id,
          customer_name: p.customer_name,
          participation_type: p.participation_type,
          participation_mode: p.participation_mode,
          salesperson_id: p.salesperson_id,
          salesperson_name: p.salesperson_name,
          discount_rate: p.discount_rate,
          actual_price: p.actual_price,
          payment_amount: p.payment_amount,
          added_at: new Date().toISOString(), // 使用当前时间
          added_by: p.added_by,
          notes: p.notes
        }));
        
        const { error: restoreParticipantsError } = await supabase
          .from('training_participants')
          .insert(participantsToRestore);
        
        if (restoreParticipantsError) {
          // 如果参训记录恢复失败，删除已恢复的培训场次
          await supabase.from('training_sessions').delete().eq('id', restoredSession.id);
          throw new Error('恢复参训记录失败');
        }
      }
      
      // 5. 标记备份为已恢复（设置 can_restore = false）
      await supabase
        .from('training_sessions_backup')
        .update({ can_restore: false })
        .eq('backup_id', backupId);
      
      return { sessionId: restoredSession.id };
    } catch (error: any) {
      console.error('从备份恢复失败:', error);
      throw new Error(error.message || '从备份恢复失败');
    }
  }
  
  // 获取参训人数
  async getParticipantCount(sessionId: number): Promise<number> {
    const { count, error } = await supabase
      .from('training_participants')
      .select('*', { count: 'exact', head: true })
      .eq('training_session_id', sessionId);
    
    if (error) throw error;
    return count || 0;
  }
  
  // 获取已删除的培训列表（仅管理员）
  async getDeletedSessions(): Promise<TrainingSession[]> {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  // 旧版本兼容：直接删除（不推荐使用）
  async deleteTrainingSession(id: number): Promise<void> {
    console.warn('⚠️ deleteTrainingSession 已弃用，请使用 deleteSession 方法');
    const { error } = await supabase
      .from('training_sessions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // 获取课程的所有场次
  async getSessionsByCourseId(courseId: number): Promise<TrainingSession[]> {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('course_id', courseId)
      .order('session_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // 获取单个场次
  async getTrainingSession(id: number): Promise<TrainingSession> {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}

export default new TrainingSessionService();
