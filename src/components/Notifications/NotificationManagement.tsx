import React, { useState } from 'react';
import ScenarioNotificationManagement from './ScenarioNotificationManagement';
import NotificationHistory from './NotificationHistory';

const NotificationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'send' | 'history'>('send');

  return (
    <div>
      {/* 标签页切换 */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('send')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'send'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            发送通知
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            发送历史
          </button>
        </nav>
      </div>

      {/* 内容区域 */}
      {activeTab === 'send' ? (
        <ScenarioNotificationManagement />
      ) : (
        <NotificationHistory />
      )}
    </div>
  );
};

export default NotificationManagement;
