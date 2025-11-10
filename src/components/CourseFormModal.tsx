import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import type { CourseDB } from '../lib/supabase/types';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Partial<CourseDB>) => Promise<void>;
  course?: CourseDB | null;
  mode: 'add' | 'edit';
}

const MODULES = [
  '综合管理',
  '非财高管',
  '管理会计',
  '公司金融',
  '风险合规',
  '内审实务',
  '数智转型',
  '会计准则',
  '税务管理',
  '行业课程'
];

const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  course,
  mode
}) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<Array<{id: string, name: string}>>([]);
  
  const [formData, setFormData] = useState({
    module: '',
    name: '',
    code: '',
    duration_days: 0,
    sessions_per_year: 0,
    standard_fee: 0,
    online_price: null as number | null,
    offline_price: null as number | null,
    description: '',
    notes: '',
    status: 'active' as string,
    project_manager_id: null as string | null
  });

  // 加载用户列表
  useEffect(() => {
    const loadUsers = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name')
        .order('name');
      
      if (!error && data) {
        setUsers(data);
      }
    };
    
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // 初始化表单数据
  useEffect(() => {
    if (course && mode === 'edit') {
      setFormData({
        module: course.module || '',
        name: course.name || '',
        code: course.code || '',
        duration_days: course.duration_days || 0,
        sessions_per_year: course.sessions_per_year || 0,
        standard_fee: course.standard_fee || 0,
        online_price: course.online_price || null,
        offline_price: course.offline_price || null,
        description: course.description || '',
        notes: course.notes || '',
        status: course.status || 'active',
        project_manager_id: course.project_manager_id || null
      });
    } else {
      // 添加模式，重置表单
      setFormData({
        module: '',
        name: '',
        code: '',
        duration_days: 3,
        sessions_per_year: 1,
        standard_fee: 0,
        online_price: null,
        offline_price: null,
        description: '',
        notes: '',
        status: 'active',
        project_manager_id: null
      });
    }
    setErrors({});
  }, [course, mode, isOpen]);

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.module.trim()) {
      newErrors.module = '请选择课程模块';
    }
    if (!formData.name.trim()) {
      newErrors.name = '请输入课程名称';
    }
    if (formData.duration_days <= 0) {
      newErrors.duration_days = '每期天数必须大于0';
    }
    if (formData.sessions_per_year <= 0) {
      newErrors.sessions_per_year = '全年期数必须大于0';
    }
    if (formData.standard_fee <= 0) {
      newErrors.standard_fee = '标准费用必须大于0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // 准备提交数据
      const submitData: Partial<CourseDB> = {
        ...formData,
        // 空字符串转为null
        description: formData.description.trim() || null,
        notes: formData.notes.trim() || null,
        // 0值转为null（可选字段）
        online_price: formData.online_price || null,
        offline_price: formData.offline_price || null
      };
      
      // 添加模式不传code，由后端自动生成
      if (mode === 'edit') {
        submitData.code = formData.code;
      }

      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('保存课程失败:', error);
      setErrors({ submit: '保存失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  // 处理输入变化
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // 数字字段特殊处理
    if (['duration_days', 'sessions_per_year', 'standard_fee', 'online_price', 'offline_price', 'average_price'].includes(name)) {
      const numValue = value === '' ? 0 : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose}></div>

      {/* 模态框 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'add' ? '添加课程' : '编辑课程'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 表单内容 */}
          <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="space-y-4">
              {/* 课程模块 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  课程模块 <span className="text-red-500">*</span>
                </label>
                <select
                  name="module"
                  value={formData.module}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.module ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                >
                  <option value="">请选择模块</option>
                  {MODULES.map(module => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                </select>
                {errors.module && (
                  <p className="mt-1 text-sm text-red-500">{errors.module}</p>
                )}
              </div>

              {/* 课程名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  课程名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="请输入课程名称"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* 课程编号 - 仅编辑模式显示 */}
              {mode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    课程编号
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                  <p className="mt-1 text-xs text-gray-500">编号由系统自动生成，不可修改</p>
                </div>
              )}

              {/* 天数和期数 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    每期天数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="duration_days"
                    value={formData.duration_days}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.duration_days ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {errors.duration_days && (
                    <p className="mt-1 text-sm text-red-500">{errors.duration_days}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    全年期数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="sessions_per_year"
                    value={formData.sessions_per_year}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.sessions_per_year ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {errors.sessions_per_year && (
                    <p className="mt-1 text-sm text-red-500">{errors.sessions_per_year}</p>
                  )}
                </div>
              </div>

              {/* 价格信息 */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">价格信息</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标准费用（元） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="standard_fee"
                    value={formData.standard_fee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.standard_fee ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {errors.standard_fee && (
                    <p className="mt-1 text-sm text-red-500">{errors.standard_fee}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      线上价格（元）
                    </label>
                    <input
                      type="number"
                      name="online_price"
                      value={formData.online_price || ''}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="选填"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      线下价格（元）
                    </label>
                    <input
                      type="number"
                      name="offline_price"
                      value={formData.offline_price || ''}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="选填"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                </div>

              </div>

              {/* 课程描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  课程描述
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="请输入课程描述（选填）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={loading}
                />
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="请输入备注信息（选填）"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={loading}
                />
              </div>

              {/* 项目负责人 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  项目负责人
                </label>
                <select
                  name="project_manager_id"
                  value={formData.project_manager_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">未分配</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">选择该课程的项目负责人</p>
              </div>

              {/* 状态 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="active">启用</option>
                  <option value="inactive">停用</option>
                </select>
              </div>

              {/* 提交错误 */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}
            </div>
          </form>

          {/* 底部按钮 */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  保存
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseFormModal;
