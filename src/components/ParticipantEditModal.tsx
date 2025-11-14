import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import supabaseService from '@/lib/supabase/supabaseService';
import auditService from '@/lib/services/auditService';
import { TrainingParticipant } from '@/lib/supabase/types';

interface ParticipantEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  participant: TrainingParticipant | null;
  onSuccess: () => void;
  trainingSession: any; // 培训信息，用于计算价格
}

const ParticipantEditModal: React.FC<ParticipantEditModalProps> = ({
  isOpen,
  onClose,
  participant,
  onSuccess,
  trainingSession
}) => {
  const [actualPrice, setActualPrice] = useState<number>(0);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [participationMode, setParticipationMode] = useState<'online' | 'offline'>('offline');
  const [paymentStatus, setPaymentStatus] = useState<string>('未支付');
  const [remark, setRemark] = useState<string>(''); // 修改备注
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (participant) {
      setActualPrice((participant as any).actual_price || (participant as any).payment_amount || 0);
      setDiscountRate((participant as any).discount_rate || 0);
      setParticipationMode((participant as any).participation_mode || 'offline');
      setPaymentStatus(participant.payment_status || '未支付');
    }
  }, [participant]);

  // 计算标准价格
  const getStandardPrice = () => {
    if (!trainingSession) return 0;
    return participationMode === 'online' 
      ? (trainingSession.online_price || 0)
      : (trainingSession.offline_price || 0);
  };

  // 计算折扣后价格
  const calculateDiscountedPrice = () => {
    const standardPrice = getStandardPrice();
    return standardPrice * (1 - discountRate / 100);
  };

  // 当折扣率改变时，自动更新实收价格
  useEffect(() => {
    if (discountRate > 0) {
      setActualPrice(calculateDiscountedPrice());
    }
  }, [discountRate, participationMode, trainingSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!participant) return;
    
    setIsSubmitting(true);
    
    try {
      // 获取原始数据
      const oldData = await supabaseService.getParticipantById(participant.id);
      
      // 准备更新数据
      const updates = {
        actual_price: actualPrice,
        discount_rate: discountRate,
        payment_amount: actualPrice, // 保持两个字段同步
        participation_mode: participationMode,
        payment_status: paymentStatus
      };

      // 更新参训人员信息
      await supabaseService.updateParticipant(participant.id, updates);

      // 记录审计日志
      if (oldData) {
        const changedFields = [];
        if (oldData.actual_price !== actualPrice || (oldData as any).payment_amount !== actualPrice) {
          changedFields.push(`实收价格: ${(oldData as any).actual_price || (oldData as any).payment_amount || 0} → ${actualPrice}`);
        }
        if ((oldData as any).discount_rate !== discountRate) {
          changedFields.push(`折扣率: ${(oldData as any).discount_rate || 0}% → ${discountRate}%`);
        }
        if ((oldData as any).participation_mode !== participationMode) {
          changedFields.push(`参与方式: ${(oldData as any).participation_mode || 'offline'} → ${participationMode}`);
        }
        if (oldData.payment_status !== paymentStatus) {
          changedFields.push(`支付状态: ${oldData.payment_status || '未支付'} → ${paymentStatus}`);
        }

        if (changedFields.length > 0) {
          const description = `修改参训人员信息: ${participant.name} - ${changedFields.join(', ')}${remark ? ` | 备注: ${remark}` : ''}`;
          await auditService.logParticipantUpdate(
            participant.id,
            {
              actual_price: (oldData as any).actual_price || (oldData as any).payment_amount,
              discount_rate: (oldData as any).discount_rate,
              participation_mode: (oldData as any).participation_mode,
              payment_status: oldData.payment_status
            },
            updates,
            description
          );
        }
      }

      toast.success('参训人员信息修改成功');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('修改参训人员信息失败:', error);
      toast.error('修改失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !participant) return null;

  const standardPrice = getStandardPrice();
  const discountedPrice = calculateDiscountedPrice();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              修改参训信息
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>

          {/* 参训人员基本信息 */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-800 dark:text-white mb-2">参训人员</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <div>姓名: {participant.name}</div>
              <div>电话: {participant.phone}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 参与方式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                参与方式 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setParticipationMode('offline')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    participationMode === 'offline'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  线下 (¥{trainingSession?.offline_price || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setParticipationMode('online')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    participationMode === 'online'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                  }`}
                >
                  线上 (¥{trainingSession?.online_price || 0})
                </button>
              </div>
            </div>

            {/* 价格计算 */}
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <div>标准价格: ¥{standardPrice.toFixed(2)}</div>
                {discountRate > 0 && (
                  <div>折扣后价格: ¥{discountedPrice.toFixed(2)} ({discountRate}% OFF)</div>
                )}
              </div>
            </div>

            {/* 折扣率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                折扣率 (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountRate}
                onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 实收价格 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                实收价格 (¥) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={actualPrice}
                onChange={(e) => setActualPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                可手动调整最终实收价格
              </p>
            </div>

            {/* 支付状态 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                支付状态
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="未支付">未支付</option>
                <option value="已支付">已支付</option>
                <option value="部分支付">部分支付</option>
                <option value="已退款">已退款</option>
              </select>
            </div>

            {/* 修改备注 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                修改备注
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="请输入修改原因（选填）"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                此备注将记录到管理员审计日志中
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '保存中...' : '保存修改'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ParticipantEditModal;
