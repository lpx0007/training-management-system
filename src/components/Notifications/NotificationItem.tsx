import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification } from '../../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  UserPlus, 
  Key, 
  AlertCircle, 
  Megaphone,
  CheckCircle,
  XCircle 
} from 'lucide-react';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const { markAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'registration_pending':
        return <UserPlus size={20} className="text-blue-500" />;
      case 'password_reminder':
        return <Key size={20} className="text-yellow-500" />;
      case 'system_alert':
        return <AlertCircle size={20} className="text-red-500" />;
      case 'announcement':
        return <Megaphone size={20} className="text-purple-500" />;
      case 'registration_approved':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'registration_rejected':
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <AlertCircle size={20} className="text-gray-500" />;
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: zhCN,
  });

  return (
    <div
      onClick={handleClick}
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex gap-3">
        {/* 图标 */}
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title}
            </p>
            {!notification.is_read && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
            )}
          </div>
          
          {notification.content && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {notification.content}
            </p>
          )}
          
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {timeAgo}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
