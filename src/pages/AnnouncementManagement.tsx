import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { announcementService } from '../lib/services/announcementService';
import type { Announcement, CreateAnnouncementInput, AnnouncementPriority, UserRole } from '../types/announcement';
import { Plus, Edit, Trash2, Archive, Pin, PinOff, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Sidebar from '../components/Sidebar';
import NotificationManagement from '../components/Notifications/NotificationManagement';

const AnnouncementManagement: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'announcements' | 'notifications'>('announcements');
  const { announcements, loading, refresh } = useAnnouncements(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState<CreateAnnouncementInput>({
    title: '',
    content: '',
    priority: 'normal',
    status: 'active',
    target_roles: null,
    expires_at: null,
    is_pinned: false,
  });



  const handleCreate = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      status: 'active',
      target_roles: null,
      expires_at: null,
      is_pinned: false,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      status: announcement.status,
      target_roles: announcement.target_roles,
      expires_at: announcement.expires_at,
      is_pinned: announcement.is_pinned,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await announcementService.updateAnnouncement({
          id: editingAnnouncement.id,
          ...formData,
        });
      } else {
        await announcementService.createAnnouncement(formData);
      }
      setIsModalOpen(false);
      refresh();
    } catch (error) {
      console.error('保存公告失败:', error);
      alert('保存公告失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条公告吗？')) return;
    try {
      await announcementService.deleteAnnouncement(id);
      refresh();
    } catch (error) {
      console.error('删除公告失败:', error);
      alert('删除公告失败');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await announcementService.archiveAnnouncement(id);
      refresh();
    } catch (error) {
      console.error('归档公告失败:', error);
      alert('归档公告失败');
    }
  };

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      await announcementService.togglePin(id, !isPinned);
      refresh();
    } catch (error) {
      console.error('置顶操作失败:', error);
      alert('置顶操作失败');
    }
  };

  const getPriorityBadge = (priority: AnnouncementPriority) => {
    const styles = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
      important: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
    };
    const labels = {
      urgent: '紧急',
      important: '重要',
      normal: '普通',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
      archived: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
      draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
    };
    const labels = {
      active: '激活',
      archived: '已归档',
      draft: '草稿',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentPath={location.pathname}
      />

      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
              >
                <i className="fas fa-bars"></i>
              </button>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                {activeTab === 'announcements' ? '公告管理' : '通知管理'}
              </h1>
            </div>
            {activeTab === 'announcements' && (
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                创建公告
              </button>
            )}
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            {/* 标签页切换 */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
              <nav className="flex gap-8">
                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'announcements'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  公告管理
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'notifications'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  通知管理
                </button>
              </nav>
            </div>

            {activeTab === 'announcements' ? (
              <>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">加载中...</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    标题
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    优先级
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    状态
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    目标用户
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    创建时间
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {announcements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-4 max-w-md">
                      <div className="flex items-center gap-2 mb-1">
                        {announcement.is_pinned && (
                          <Pin size={16} className="text-purple-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                          {announcement.title}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {announcement.content}
                      </p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getPriorityBadge(announcement.priority)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(announcement.status)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {announcement.target_roles ? announcement.target_roles.join(', ') : '全部用户'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(announcement.created_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleTogglePin(announcement.id, announcement.is_pinned)}
                          className="p-1 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                          title={announcement.is_pinned ? '取消置顶' : '置顶'}
                        >
                          {announcement.is_pinned ? <PinOff size={18} /> : <Pin size={18} />}
                        </button>
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="p-1 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                          title="编辑"
                        >
                          <Edit size={18} />
                        </button>
                        {announcement.status === 'active' && (
                          <button
                            onClick={() => handleArchive(announcement.id)}
                            className="p-1 text-gray-600 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400"
                            title="归档"
                          >
                            <Archive size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="p-1 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                          title="删除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
                  </table>
                </div>
              </div>
            )}
              </>
            ) : (
              <NotificationManagement />
            )}
          </div>
        </main>
      </div>

      {/* 创建/编辑模态框 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingAnnouncement ? '编辑公告' : '创建公告'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  内容 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    优先级
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="normal">普通</option>
                    <option value="important">重要</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    状态
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="active">激活</option>
                    <option value="draft">草稿</option>
                    <option value="archived">已归档</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  目标用户
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.target_roles === null}
                      onChange={(e) => setFormData({ ...formData, target_roles: e.target.checked ? null : [] })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">全部用户</span>
                  </label>
                  {formData.target_roles !== null && (
                    <div className="ml-6 space-y-2">
                      {(['admin', 'salesperson', 'expert'] as UserRole[]).map((role) => (
                        <label key={role} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.target_roles?.includes(role)}
                            onChange={(e) => {
                              const roles = formData.target_roles || [];
                              setFormData({
                                ...formData,
                                target_roles: e.target.checked
                                  ? [...roles, role]
                                  : roles.filter((r) => r !== role),
                              });
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {role === 'admin' ? '管理员' : role === 'salesperson' ? '业务员' : '专家'}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">置顶显示</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingAnnouncement ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementManagement;
