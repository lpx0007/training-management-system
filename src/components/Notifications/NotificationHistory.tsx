import React, { useState, useEffect } from 'react';
import { notificationService } from '../../lib/services/notificationService';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, Clock, AlertCircle, Megaphone, Users, FileText } from 'lucide-react';

interface HistoryRecord {
  id: string;
  scenario_type: string;
  title: string;
  content: string;
  target_count: number;
  target_roles: string[] | null;
  related_training_id: number | null;
  related_training_name: string | null;
  created_at: string;
}

const NotificationHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotificationHistory();
      setHistory(data);
    } catch (error) {
      console.error('加载历史记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScenarioIcon = (type: string) => {
    switch (type) {
      case 'training_reminder':
        return <Calendar size={20} className="text-blue-500" />;
      case 'registration_deadline':
        return <Clock size={20} className="text-orange-500" />;
      case 'system_maintenance':
        return <AlertCircle size={20} className="text-yellow-500" />;
      case 'important_notice':
        return <Megaphone size={20} className="text-purple-500" />;
      default:
        return <FileText size={20} className="text-gray-500" />;
    }
  };

  const getScenarioName = (type: string) => {
    const names: Record<string, string> = {
      training_reminder: '课程提醒',
      registration_deadline: '报名截止',
      system_maintenance: '系统维护',
      important_notice: '重要通知',
      custom: '自定义通知',
    };
    return names[type] || type;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          通知发送历史
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          查看所有已发送的通知记录
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500">暂无发送记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((record) => (
            <div
              key={record.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedRecord(record)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getScenarioIcon(record.scenario_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                      {getScenarioName(record.scenario_type)}
                    </span>
                    {record.related_training_name && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        · {record.related_training_name}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                    {record.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {record.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {record.target_count} 人
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(record.created_at), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 详情模态框 */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {getScenarioIcon(selectedRecord.scenario_type)}
                <div>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    {getScenarioName(selectedRecord.scenario_type)}
                  </span>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                    {selectedRecord.title}
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    通知内容
                  </label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {selectedRecord.content}
                  </p>
                </div>

                {selectedRecord.related_training_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      关联培训
                    </label>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {selectedRecord.related_training_name}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    发送对象
                  </label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {selectedRecord.target_count} 位用户
                    {selectedRecord.target_roles && selectedRecord.target_roles.length > 0 && (
                      <span className="ml-2">
                        ({selectedRecord.target_roles.map(role => 
                          role === 'admin' ? '管理员' : role === 'salesperson' ? '业务员' : '专家'
                        ).join(', ')})
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    发送时间
                  </label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(selectedRecord.created_at).toLocaleString('zh-CN')}
                    {' '}
                    ({formatDistanceToNow(new Date(selectedRecord.created_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })})
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;
