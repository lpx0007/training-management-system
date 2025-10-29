import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnnouncements } from '../hooks/useAnnouncements';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { AlertCircle, Info, Megaphone, Pin } from 'lucide-react';
import type { AnnouncementPriority } from '../types/announcement';
import Sidebar from '../components/Sidebar';

const AnnouncementList: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { announcements, loading } = useAnnouncements();

  const getIcon = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle size={24} className="text-red-500" />;
      case 'important':
        return <Megaphone size={24} className="text-orange-500" />;
      default:
        return <Info size={24} className="text-blue-500" />;
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
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">公告列表</h1>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">加载中...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">暂无公告</p>
              </div>
            ) : (
              <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {/* 图标 */}
                <div className="flex-shrink-0 mt-1">
                  {getIcon(announcement.priority)}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {announcement.is_pinned && (
                        <Pin size={16} className="text-purple-500" />
                      )}
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {announcement.title}
                      </h2>
                      {getPriorityBadge(announcement.priority)}
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap mb-3">
                    {announcement.content}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(announcement.created_at), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                    {announcement.target_roles && (
                      <>
                        <span>•</span>
                        <span>
                          目标用户: {announcement.target_roles.map(role => 
                            role === 'admin' ? '管理员' : role === 'salesperson' ? '业务员' : '专家'
                          ).join(', ')}
                        </span>
                      </>
                    )}
                    {announcement.expires_at && (
                      <>
                        <span>•</span>
                        <span>
                          有效期至: {new Date(announcement.expires_at).toLocaleDateString('zh-CN')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnnouncementList;
