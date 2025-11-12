import React, { useState, useEffect, useContext } from 'react';
import { X, Save, Loader2, User, Phone, Mail, DollarSign } from 'lucide-react';
import { AuthContext } from '@/contexts/authContext';
import { supabase } from '@/lib/supabase/client';
import type { TrainingSessionFrontend } from '../lib/supabase/types';

interface ParticipantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  session: TrainingSessionFrontend;
}

interface ParticipantData {
  customer_id: number | null;
  name: string;
  phone: string;
  email: string;
  participation_mode: 'online' | 'offline';
  actual_price: number;
  discount_rate: number;
  payment_amount: number;
  payment_status: 'pending' | 'partial' | 'completed';
}

const ParticipantFormModal: React.FC<ParticipantFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  session
}) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Array<{id: number, name: string, phone: string, email: string}>>([]);
  
  const [formData, setFormData] = useState<ParticipantData>({
    customer_id: null,
    name: '',
    phone: '',
    email: '',
    participation_mode: 'offline',
    actual_price: session.offline_price || 0,
    discount_rate: 0,
    payment_amount: 0,
    payment_status: 'pending'
  });

  // 加载客户列表
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen]);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('加载客户列表失败:', error);
    }
  };

  // 计算实际支付金额
  useEffect(() => {
    const basePrice = formData.actual_price;
    const discount = formData.discount_rate;
    const paymentAmount = basePrice * (1 - discount / 100);
    setFormData(prev => ({ ...prev, payment_amount: paymentAmount }));
  }, [formData.actual_price, formData.discount_rate]);

  // 参与模式变化时更新价格
  useEffect(() => {
    const price = formData.participation_mode === 'online' 
      ? (session.online_price || 0)
      : (session.offline_price || 0);
    setFormData(prev => ({ ...prev, actual_price: price }));
  }, [formData.participation_mode, session.online_price, session.offline_price]);

  // 选择客户
  const handleSelectCustomer = (customerId: string) => {
    if (!customerId) {
      setFormData(prev => ({ ...prev, customer_id: null, name: '', phone: '', email: '' }));
      return;
    }
    
    const customer = customers.find(c => c.id === parseInt(customerId));
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || ''
      }));
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入姓名';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入联系电话';
    }
    if (formData.actual_price < 0) {
      newErrors.actual_price = '价格不能为负数';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
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
      // 构建参训者数据
      const participantData = {
        training_session_id: session.id,
        customer_id: formData.customer_id, // 添加customer_id用于RLS策略判断
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        participation_mode: formData.participation_mode,
        actual_price: formData.actual_price,
        discount_rate: formData.discount_rate,
        payment_amount: formData.payment_amount,
        payment_status: formData.payment_status,
        salesperson_name: user?.name || null,
        registration_date: new Date().toISOString().split('T')[0]
      };

      const { error } = await supabase
        .from('training_participants')
        .insert(participantData as any);

      if (error) throw error;

      // 更新培训场次的参训人数
      const { error: updateError } = await supabase
        .from('training_sessions')
        .update({ 
          participants: (session.participants || 0) + 1 
        } as any)
        .eq('id', session.id);

      if (updateError) throw updateError;

      await onSave();
      onClose();
    } catch (error: any) {
      console.error('添加参训者失败:', error);
      setErrors({ submit: error.message || '添加失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              添加参训人员
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              为 <span className="font-medium text-gray-700 dark:text-gray-300">{session.name}</span> 添加参训者
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
          <div className="space-y-4">
            {/* 选择已有客户 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                选择已有客户（可选）
              </label>
              <select
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={loading}
              >
                <option value="">手动输入新客户</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                选择客户后会自动填充联系信息
              </p>
            </div>

            {/* 姓名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <User className="inline w-4 h-4 mr-1" />
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="请输入姓名"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={loading}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* 联系方式 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Phone className="inline w-4 h-4 mr-1" />
                  联系电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="请输入联系电话"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                    errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Mail className="inline w-4 h-4 mr-1" />
                  电子邮箱
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="请输入电子邮箱"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={loading}
                />
              </div>
            </div>

            {/* 参与模式和价格 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="inline w-4 h-4 mr-1" />
                参与模式与价格
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">参与模式</label>
                  <select
                    name="participation_mode"
                    value={formData.participation_mode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  >
                    <option value="online">线上</option>
                    <option value="offline">线下</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">单价</label>
                  <input
                    type="number"
                    name="actual_price"
                    value={formData.actual_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">折扣率(%)</label>
                  <input
                    type="number"
                    name="discount_rate"
                    value={formData.discount_rate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">实际支付金额：</span>
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    ¥{formData.payment_amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* 支付状态 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                支付状态
              </label>
              <select
                name="payment_status"
                value={formData.payment_status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={loading}
              >
                <option value="pending">待支付</option>
                <option value="partial">部分支付</option>
                <option value="completed">已支付</option>
              </select>
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
                添加参训者
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantFormModal;
