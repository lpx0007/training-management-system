import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import type { Schedule } from '@/lib/supabase/types';
import { calculateTrainingStatus } from '@/utils/statusUtils';
import { getStatusText, getStatusClassName } from '@/utils/statusUtils';

interface TrainingSession {
  id: number;
  name: string;
  expert_name: string | null;
  date: string;
  end_date: string | null;
  status: string;
  schedule_id: number | null;
}

interface ScheduleCourseModalProps {
  isOpen: boolean;
  schedule: Schedule | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScheduleCourseModal({ 
  isOpen, 
  schedule, 
  onClose, 
  onSuccess 
}: ScheduleCourseModalProps) {
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<TrainingSession[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTrainingSessions();
    }
  }, [isOpen]);

  // 获取所有培训场次
  const fetchTrainingSessions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setTrainingSessions(data || []);
      
      // 预选已关联的培训
      if (schedule) {
        const alreadyLinked = (data || [])
          .filter((session: TrainingSession) => session.schedule_id === schedule.id)
          .map((session: TrainingSession) => session.id);
        setSelectedSessions(new Set(alreadyLinked));
      }
    } catch (error) {
      console.error('获取培训列表失败:', error);
      toast.error('获取培训列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 筛选培训
  useEffect(() => {
    let result = [...trainingSessions];

    // 搜索筛选
    if (searchTerm) {
      result = result.filter((session: TrainingSession) =>
        session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.expert_name && session.expert_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 状态筛选
    if (statusFilter !== '全部') {
      result = result.filter((session: TrainingSession) => session.status === statusFilter);
    }

    // 日期范围筛选
    if (startDate) {
      result = result.filter((session: TrainingSession) => {
        const sessionDate = new Date(session.date);
        const filterStartDate = new Date(startDate);
        return sessionDate >= filterStartDate;
      });
    }

    if (endDate) {
      result = result.filter((session: TrainingSession) => {
        const sessionDate = new Date(session.date);
        const filterEndDate = new Date(endDate);
        return sessionDate <= filterEndDate;
      });
    }

    setFilteredSessions(result);
  }, [trainingSessions, searchTerm, statusFilter, startDate, endDate]);

  // 切换选择
  const toggleSelection = (sessionId: number) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedSessions.size === filteredSessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(filteredSessions.map((s: TrainingSession) => s.id)));
    }
  };

  // 保存适配
  const handleSave = async () => {
    if (!schedule) return;
    
    try {
      setIsSaving(true);

      // 获取所有培训的当前状态
      const { data: allSessions } = await supabase
        .from('training_sessions')
        .select('id, schedule_id');

      if (!allSessions) throw new Error('获取培训数据失败');

      // 找出需要更新的培训
      const updates = allSessions.map((session: any) => {
        const shouldLink = selectedSessions.has(session.id);
        const isLinked = session.schedule_id === schedule.id;

        if (shouldLink && !isLinked) {
          // 需要关联
          return { id: session.id, schedule_id: schedule.id };
        } else if (!shouldLink && isLinked) {
          // 需要取消关联
          return { id: session.id, schedule_id: null };
        }
        return null;
      }).filter(Boolean);

      // 批量更新
      for (const update of updates) {
        if (!update) continue;
        const { error } = await supabase
          .from('training_sessions')
          .update({ schedule_id: update.schedule_id } as any)
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success(`成功适配 ${selectedSessions.size} 个培训课程`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('保存失败:', error);
      toast.error(error.message || '保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (!isOpen || !schedule) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">适配课程</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                为"{schedule.name}"选择关联的培训课程
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* 搜索和筛选 */}
          <div className="mb-4 space-y-3">
            {/* 第一行：搜索和状态筛选 */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索培训名称或专家..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="全部">全部状态</option>
                <option value="upcoming">即将开始</option>
                <option value="ongoing">进行中</option>
                <option value="completed">已完成</option>
              </select>
            </div>

            {/* 第二行：日期范围筛选 */}
            <div className="flex gap-3 items-center">
              <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                课程时间：
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="开始日期"
              />
              <span className="text-gray-500 dark:text-gray-400">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="结束日期"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  清除
                </button>
              )}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              已选择 <span className="font-bold">{selectedSessions.size}</span> 个培训课程
              {filteredSessions.length > 0 && ` / 共 ${filteredSessions.length} 个`}
            </p>
          </div>

          {/* 培训列表 */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4">
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedSessions.size === filteredSessions.length && filteredSessions.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        培训名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        专家
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        日期
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSessions.map((session: TrainingSession) => (
                      <tr
                        key={session.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => toggleSelection(session.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedSessions.has(session.id)}
                            onChange={() => toggleSelection(session.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                          {session.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {session.expert_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(session.date)}
                        </td>
                        <td className="px-4 py-3">
                          {(() => {
                            const realStatus = calculateTrainingStatus(session.date, session.end_date || undefined);
                            return (
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClassName(realStatus)}`}>
                                {getStatusText(realStatus)}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">没有找到培训课程</p>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  保存中...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  保存适配
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
