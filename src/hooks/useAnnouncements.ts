import { useState, useEffect } from 'react';
import { announcementService } from '../lib/services/announcementService';
import type { Announcement } from '../types/announcement';

export const useAnnouncements = (isAdmin = false) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = isAdmin
        ? await announcementService.getAllAnnouncements()
        : await announcementService.getActiveAnnouncements();
      setAnnouncements(data);
      setError(null);
    } catch (err) {
      console.error('加载公告失败:', err);
      setError(err instanceof Error ? err.message : '加载公告失败');
      // 即使失败也设置默认值
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [isAdmin]);

  return {
    announcements,
    loading,
    error,
    refresh: loadAnnouncements,
  };
};
