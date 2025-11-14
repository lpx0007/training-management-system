import { supabase } from '@/lib/supabase/client';

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  status: string;
  error_message?: string;
  created_at: string;
}

class AuditService {
  /**
   * 记录审计日志
   */
  async logAction(params: {
    action: string;
    resourceType: string;
    resourceId: string;
    details: any;
    status?: string;
    errorMessage?: string;
  }): Promise<boolean> {
    try {
      // 获取当前用户信息
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('无法获取用户信息');
        return false;
      }

      // 获取用户名
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const userName = userProfile?.name || user.email || '未知用户';

      // 插入审计日志
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          user_name: userName,
          action: params.action,
          resource_type: params.resourceType,
          resource_id: params.resourceId,
          details: params.details,
          status: params.status || 'success',
          error_message: params.errorMessage,
          // IP地址和User-Agent可以从客户端获取或服务端记录
          ip_address: null,
          user_agent: navigator.userAgent
        });

      if (error) {
        console.error('记录审计日志失败:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('记录审计日志异常:', error);
      return false;
    }
  }

  /**
   * 获取审计日志列表（仅管理员）
   */
  async getAuditLogs(params?: {
    page?: number;
    pageSize?: number;
    userId?: string;
    resourceType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const {
        page = 1,
        pageSize = 50,
        userId,
        resourceType,
        action,
        startDate,
        endDate
      } = params || {};

      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });

      // 筛选条件
      if (userId) {
        query = query.eq('user_id', userId);
      }
      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }
      if (action) {
        query = query.eq('action', action);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      // 分页和排序
      const { data: logs, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        throw error;
      }

      return {
        logs: logs || [],
        total: count || 0
      };
    } catch (error) {
      console.error('获取审计日志失败:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * 记录参训人员修改日志
   */
  async logParticipantUpdate(
    participantId: number,
    oldValues: any,
    newValues: any,
    description: string
  ): Promise<boolean> {
    return this.logAction({
      action: 'update_participant',
      resourceType: 'training_participant',
      resourceId: participantId.toString(),
      details: {
        old_values: oldValues,
        new_values: newValues,
        description: description,
        changed_fields: Object.keys(newValues).filter(key => 
          oldValues[key] !== newValues[key]
        )
      }
    });
  }
}

export const auditService = new AuditService();
export default auditService;
