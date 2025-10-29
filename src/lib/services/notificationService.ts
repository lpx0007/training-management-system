import { supabase } from '../supabase/client';
import type { Notification, CreateNotificationInput, NotificationTemplate } from '../../types/notification';

export const notificationService = {
  // 获取当前用户的通知
  async getUserNotifications(limit = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取通知失败:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('获取通知异常:', error);
      return [];
    }
  },

  // 获取未读通知数量
  async getUnreadCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (error) {
        console.error('获取未读数量失败:', error);
        return 0;
      }
      return count || 0;
    } catch (error) {
      console.error('获取未读数量异常:', error);
      return 0;
    }
  },

  // 标记通知为已读
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  // 标记所有通知为已读
  async markAllAsRead(): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);

    if (error) throw error;
  },

  // 创建通知
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 批量创建通知
  async createBatchNotifications(inputs: CreateNotificationInput[]): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .insert(inputs)
      .select();

    if (error) throw error;
    return data || [];
  },

  // 记录通知发送历史
  async recordNotificationHistory(record: {
    scenario_type: string;
    title: string;
    content: string;
    target_count: number;
    target_roles?: string[];
    related_training_id?: number;
    related_training_name?: string;
  }): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('notification_history')
        .insert({
          ...record,
          created_by: userData.user?.id,
        });

      if (error) {
        console.error('记录通知历史失败:', error);
      }
    } catch (error) {
      console.error('记录通知历史异常:', error);
    }
  },

  // 获取通知发送历史
  async getNotificationHistory(limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('notification_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取通知历史失败:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('获取通知历史异常:', error);
      return [];
    }
  },

  // 订阅实时通知
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  },

  // 获取通知模板
  async getTemplates(): Promise<NotificationTemplate[]> {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  // 使用模板创建通知
  async createFromTemplate(
    templateType: string,
    userId: string,
    variables: Record<string, string>,
    link?: string
  ): Promise<Notification> {
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('type', templateType)
      .eq('is_active', true)
      .single();

    if (templateError) throw templateError;

    // 替换模板变量
    let title = template.title_template;
    let content = template.content_template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), value);
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return this.createNotification({
      user_id: userId,
      type: templateType as any,
      title,
      content,
      link,
    });
  },
};
