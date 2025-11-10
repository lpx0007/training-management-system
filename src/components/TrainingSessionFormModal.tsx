import React, { useState, useEffect, useContext } from 'react';
import { X, Save, Loader2, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { AuthContext } from '@/contexts/authContext';
import type { CourseWithSessions, TrainingSession } from '../lib/supabase/types';

interface TrainingSessionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: Partial<TrainingSession>) => Promise<void>;
  course: CourseWithSessions;
}

const TrainingSessionFormModal: React.FC<TrainingSessionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  course
}) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    end_date: '',
    area: '',
    detailed_address: '',
    capacity: course.sessionsPerYear > 0 ? Math.floor(100 / course.sessionsPerYear) : 30,
    participants: 0,
    expert_name: '',
    training_mode: 'mixed' as string,
    online_price: course.onlinePrice || course.standardFee || 0,
    offline_price: course.offlinePrice || course.standardFee || 0,
    auto_calculate_revenue: true
  });

  // 根据日期自动计算状态
  const calculateTrainingStatus = (startDate: string, endDate?: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : new Date(startDate);
    end.setHours(0, 0, 0, 0);
    
    if (today < start) {
      return 'upcoming';
    } else if (today > end) {
      return 'completed';
    } else {
      return 'ongoing';
    }
  };

  // 初始化表单数据
  useEffect(() => {
    if (course && isOpen) {
      // 计算下一期数
      const nextSessionNumber = course.actualSessionCount + 1;
      
      // 自动生成场次名称
      const sessionName = `${course.name} 第${nextSessionNumber}期`;
      
      setFormData({
        name: sessionName,
        date: '',
        end_date: '',
        area: '',
        detailed_address: '',
        capacity: course.sessionsPerYear > 0 ? Math.floor(100 / course.sessionsPerYear) : 30,
        participants: 0,
        expert_name: '',
        training_mode: course.onlinePrice && course.offlinePrice ? 'mixed' : 'offline',
        online_price: course.onlinePrice || course.standardFee || 0,
        offline_price: course.offlinePrice || course.standardFee || 0,
        auto_calculate_revenue: true
      });
    }
    setErrors({});
  }, [course, isOpen]);

  // 根据开始日期和课程天数自动计算结束日期
  useEffect(() => {
    if (formData.date && course.durationDays) {
      const startDate = new Date(formData.date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + course.durationDays - 1);
      
      const endDateString = endDate.toISOString().split('T')[0];
      if (endDateString !== formData.end_date) {
        setFormData(prev => ({ ...prev, end_date: endDateString }));
      }
    }
  }, [formData.date, course.durationDays]);

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入场次名称';
    }
    if (!formData.date) {
      newErrors.date = '请选择开始日期';
    }
    if (formData.capacity <= 0) {
      newErrors.capacity = '容量必须大于0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: value === '' ? 0 : parseFloat(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // 清除该字段的错误
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // 计算下一期数
      const nextSessionNumber = course.actualSessionCount + 1;
      
      // 根据日期自动计算状态
      const status = calculateTrainingStatus(formData.date, formData.end_date);
      
      // 构建培训场次数据
      const sessionData: Partial<TrainingSession> = {
        name: formData.name,
        date: formData.date,
        end_date: formData.end_date || null,
        area: formData.area || null,
        detailed_address: formData.detailed_address || null,
        capacity: formData.capacity,
        participants: formData.participants,
        expert_name: formData.expert_name || null,
        training_mode: formData.training_mode,
        online_price: formData.online_price || null,
        offline_price: formData.offline_price || null,
        status: status,
        course_id: course.id,
        course_name: course.name,
        session_number: nextSessionNumber,
        course_description: course.description || null,
        salesperson_id: user?.id || null,
        salesperson_name: user?.name || null,
        auto_calculate_revenue: formData.auto_calculate_revenue
      };

      await onSave(sessionData);
      onClose();
    } catch (error: any) {
      console.error('保存培训场次失败:', error);
      setErrors({ submit: error.message || '保存失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              添加培训场次
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              为 <span className="font-medium text-gray-700 dark:text-gray-300">{course.name}</span> 添加第 {course.actualSessionCount + 1} 期
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4">
          {/* 课程信息（只读） */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">课程模块</span>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{course.module}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">每期天数</span>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{course.durationDays} 天</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">已有期数</span>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{course.actualSessionCount}/{course.sessionsPerYear}</div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">标准费用</span>
                <div className="font-medium text-gray-900 dark:text-white mt-1">¥{course.standardFee?.toLocaleString() || '-'}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 场次名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                场次名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="请输入场次名称"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* 日期 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  开始日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={loading}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-500">{errors.date}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  结束日期
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  自动计算：{formData.end_date}
                </p>
              </div>
            </div>

            {/* 地点 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  地区
                </label>
                <input
                  type="text"
                  name="area"
                  value={formData.area}
                  onChange={handleChange}
                  placeholder="如：北京、上海"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  详细地址
                </label>
                <input
                  type="text"
                  name="detailed_address"
                  value={formData.detailed_address}
                  onChange={handleChange}
                  placeholder="具体培训地址"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 人数 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Users className="inline w-4 h-4 mr-1" />
                  容量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.capacity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={loading}
                />
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-500">{errors.capacity}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  已报名人数
                </label>
                <input
                  type="number"
                  name="participants"
                  value={formData.participants}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 专家 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                授课专家
              </label>
              <input
                type="text"
                name="expert_name"
                value={formData.expert_name}
                onChange={handleChange}
                placeholder="专家姓名"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={loading}
              />
            </div>

            {/* 培训模式和价格 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                培训模式与价格
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <select
                    name="training_mode"
                    value={formData.training_mode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  >
                    <option value="online">线上</option>
                    <option value="offline">线下</option>
                    <option value="mixed">混合</option>
                  </select>
                </div>
                <div>
                  <input
                    type="number"
                    name="online_price"
                    value={formData.online_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="线上价格"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="offline_price"
                    value={formData.offline_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="线下价格"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                培训状态将根据开始日期和结束日期自动计算
              </p>
            </div>

            {/* 自动计算收入 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="auto_calculate_revenue"
                checked={formData.auto_calculate_revenue}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                自动计算培训收入（基于参训人数和价格）
              </label>
            </div>

            {/* 提交错误 */}
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}
          </div>
        </form>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存场次
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingSessionFormModal;
