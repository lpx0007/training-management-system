import { supabase } from '../supabase/client';
import type { Announcement, CreateAnnouncementInput, UpdateAnnouncementInput } from '../../types/announcement';

export const announcementService = {
  // 获取激活的公告（用户视图）
  async getActiveAnnouncements(limit = 10): Promise<Announcement[]> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('status', 'active')
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('获取公告失败:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('获取公告异常:', error);
      return [];
    }
  },

  // 获取所有公告（管理员视图）
  async getAllAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 创建公告
  async createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        ...input,
        created_by: userData.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 更新公告
  async updateAnnouncement(input: UpdateAnnouncementInput): Promise<Announcement> {
    const { id, ...updates } = input;
    
    const { data, error } = await supabase
      .from('announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 删除公告
  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 归档公告
  async archiveAnnouncement(id: string): Promise<Announcement> {
    return this.updateAnnouncement({ id, status: 'archived' });
  },

  // 置顶/取消置顶
  async togglePin(id: string, isPinned: boolean): Promise<Announcement> {
    return this.updateAnnouncement({ id, is_pinned: isPinned });
  },
};
