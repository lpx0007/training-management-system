import React from 'react';
import { Bell } from 'lucide-react';

// 简化版通知铃铛 - 用于测试
const NotificationBellSimple: React.FC = () => {
  return (
    <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative">
      <Bell size={20} />
      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
    </button>
  );
};

export default NotificationBellSimple;
