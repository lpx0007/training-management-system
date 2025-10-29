import React, { useState, useEffect } from 'react';
import { useAnnouncements } from '../../hooks/useAnnouncements';
import { ChevronLeft, ChevronRight, Megaphone, AlertCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AnnouncementBanner: React.FC = () => {
  const { announcements, loading, error } = useAnnouncements();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  // 如果加载失败，不显示
  if (error) {
    console.error('公告加载失败:', error);
    return null;
  }

  // 自动轮播
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000); // 每5秒切换

    return () => clearInterval(interval);
  }, [announcements.length, isPaused]);

  if (loading || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const getIcon = () => {
    switch (currentAnnouncement.priority) {
      case 'urgent':
        return <AlertCircle size={18} className="text-red-500 flex-shrink-0" />;
      case 'important':
        return <Megaphone size={18} className="text-orange-500 flex-shrink-0" />;
      default:
        return <Info size={18} className="text-blue-500 flex-shrink-0" />;
    }
  };

  const getPriorityLabel = () => {
    switch (currentAnnouncement.priority) {
      case 'urgent':
        return '紧急';
      case 'important':
        return '重要';
      default:
        return '';
    }
  };

  const getPriorityColor = () => {
    switch (currentAnnouncement.priority) {
      case 'urgent':
        return 'text-red-600 dark:text-red-400';
      case 'important':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div 
      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-blue-200 dark:border-gray-600"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 图标 */}
      <div className="flex-shrink-0 hidden sm:block">
        {getIcon()}
      </div>

      {/* 内容 */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {getPriorityLabel() && (
            <span className={`text-xs font-bold ${getPriorityColor()} whitespace-nowrap`}>
              [{getPriorityLabel()}]
            </span>
          )}
          {currentAnnouncement.is_pinned && (
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
              [置顶]
            </span>
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0">
            {currentAnnouncement.title}
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5 hidden sm:block">
          {currentAnnouncement.content}
        </p>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {announcements.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="p-1 rounded hover:bg-white/50 dark:hover:bg-gray-600 transition-colors"
              aria-label="上一条"
            >
              <ChevronLeft size={14} className="text-gray-600 dark:text-gray-300 sm:w-4 sm:h-4" />
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[32px] sm:min-w-[40px] text-center whitespace-nowrap">
              {currentIndex + 1}/{announcements.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1 rounded hover:bg-white/50 dark:hover:bg-gray-600 transition-colors"
              aria-label="下一条"
            >
              <ChevronRight size={14} className="text-gray-600 dark:text-gray-300 sm:w-4 sm:h-4" />
            </button>
          </>
        )}
        <button
          onClick={() => navigate('/announcements')}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium whitespace-nowrap hidden sm:inline"
        >
          查看全部
        </button>
        <button
          onClick={() => navigate('/announcements')}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium whitespace-nowrap sm:hidden"
        >
          更多
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
