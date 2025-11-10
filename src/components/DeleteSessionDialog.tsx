import { useState } from 'react';
import { AlertTriangle, Archive, Trash2 } from 'lucide-react';
import type { TrainingSessionFrontend } from '@/lib/supabase/types';

interface DeleteSessionDialogProps {
  isOpen: boolean;
  session: TrainingSessionFrontend | null;
  participantCount: number;
  onClose: () => void;
  onConfirm: (deleteType: 'hard' | 'soft', reason: string) => Promise<void>;
}

export default function DeleteSessionDialog({
  isOpen,
  session,
  participantCount,
  onClose,
  onConfirm
}: DeleteSessionDialogProps) {
  const [deleteType, setDeleteType] = useState<'hard' | 'soft'>('soft');
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!isOpen || !session) return null;
  
  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm(deleteType, reason);
      onClose();
      setReason('');
      setDeleteType('soft');
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleClose = () => {
    if (!isDeleting) {
      setReason('');
      setDeleteType('soft');
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 标题 */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={24} />
            删除培训场次
          </h3>
        </div>
        
        {/* 内容 */}
        <div className="px-6 py-4 space-y-4">
          {/* 培训信息 */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">培训名称：</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {session.name}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">培训日期：</span>
                <span className="text-gray-900 dark:text-white">{session.date}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">参训人数：</span>
                <span className="text-gray-900 dark:text-white">{participantCount}人</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">业绩金额：</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ¥{session.revenue?.toLocaleString() || 0}
                </span>
              </div>
            </div>
          </div>
          
          {/* 删除方式选择 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              请选择删除方式：
            </label>
            
            {/* 方案B：软删除（推荐） */}
            <div 
              onClick={() => setDeleteType('soft')}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                deleteType === 'soft'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={deleteType === 'soft'}
                  onChange={() => setDeleteType('soft')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Archive className="text-blue-600 dark:text-blue-400" size={20} />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      临时删除（可恢复）
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded">
                      ✅ 推荐
                    </span>
                  </div>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-7">
                    <li>• 保留培训和参训记录</li>
                    <li>• 业绩数据不受影响</li>
                    <li>• 在管理员界面可见（标注"已删除"）</li>
                    <li>• 可随时一键恢复</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* 方案A：彻底删除 */}
            <div 
              onClick={() => setDeleteType('hard')}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                deleteType === 'hard'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  checked={deleteType === 'hard'}
                  onChange={() => setDeleteType('hard')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Trash2 className="text-red-600 dark:text-red-400" size={20} />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      彻底删除（不可恢复）
                    </span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs rounded">
                      ⚠️ 谨慎
                    </span>
                  </div>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-7">
                    <li>• 完全删除培训和参训记录</li>
                    <li>• 清除所有业绩数据</li>
                    <li>• <strong className="text-orange-600 dark:text-orange-400">自动备份到数据库</strong></li>
                    <li>• 需要时可从数据库恢复</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* 删除原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              删除原因（可选）：
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请简要说明删除原因，便于后续追溯..."
              disabled={isDeleting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 
                       text-gray-900 dark:text-white resize-none
                       disabled:opacity-50 disabled:cursor-not-allowed"
              rows={3}
            />
          </div>
          
          {/* 警告提示 */}
          {deleteType === 'hard' && participantCount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-red-700 dark:text-red-400">
                  <strong>警告：</strong>
                  彻底删除将清除{participantCount}条参训记录和¥{session.revenue?.toLocaleString() || 0}的业绩数据。
                  此操作对业绩统计有重大影响。数据将自动备份到数据库，如需恢复请联系数据库管理员。
                </div>
              </div>
            </div>
          )}
          
          {/* 无参训人的提示 */}
          {participantCount === 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  此培训暂无参训记录，删除不会影响业绩数据。
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                     rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              deleteType === 'soft'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isDeleting ? '删除中...' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  );
}
