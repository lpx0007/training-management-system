import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { User, Mail, Phone, Building, Lock, Save } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { toast } from 'sonner';
import supabaseService from '@/lib/supabase/supabaseService';

export default function ProfileSettings() {
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 个人信息表单
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    department: '',
    email: '',
  });

  // 原始数据，用于检测是否修改了敏感信息
  const [originalData, setOriginalData] = useState({
    phone: '',
    email: '',
  });

  // 密码修改表单
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 验证密码的表单（用于修改敏感信息）
  const [verifyPassword, setVerifyPassword] = useState('');

  // 加载用户信息
  useEffect(() => {
    if (user) {
      // 获取完整的用户信息（包括手机号和邮箱）
      loadFullProfile();
    }
  }, [user]);

  const loadFullProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await supabaseService.getUserProfile(user.id);
      if (profile) {
        // 根据角色从不同的表获取手机号
        let phone = '';
        if (user.role === 'salesperson') {
          const salesperson = await supabaseService.getSalespersonByUserId(user.id);
          phone = salesperson?.phone || '';
        } else if (user.role === 'expert') {
          const expert = await supabaseService.getExpertByUserId(user.id);
          phone = expert?.phone || '';
        }

        // 获取邮箱
        const currentUser = await supabaseService.getCurrentUser();
        const email = currentUser?.email || '';
        
        setFormData({
          name: user.name || '',
          username: user.username || '',
          phone,
          department: user.department || '',
          email,
        });

        // 保存原始数据
        setOriginalData({
          phone,
          email,
        });
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // 检查是否修改了敏感信息（手机号或邮箱）
    const phoneChanged = formData.phone !== originalData.phone;
    const emailChanged = formData.email !== originalData.email;
    const sensitiveInfoChanged = phoneChanged || emailChanged;

    // 如果修改了敏感信息，需要验证密码
    if (sensitiveInfoChanged && !verifyPassword) {
      toast.error('修改手机号或邮箱需要验证当前密码');
      return;
    }
    
    setLoading(true);
    
    try {
      // 如果修改了敏感信息，先验证密码
      if (sensitiveInfoChanged) {
        const isValid = await supabaseService.verifyPassword(formData.email, verifyPassword);
        if (!isValid) {
          toast.error('当前密码验证失败');
          setLoading(false);
          return;
        }
      }

      // 更新用户资料
      await supabaseService.updateUserProfile(user.id, {
        name: formData.name,
        username: formData.username,
        department: formData.department || null,
      });

      // 如果修改了邮箱
      if (emailChanged) {
        await supabaseService.updateEmail(formData.email);
        toast.info('邮箱更新成功，请查收验证邮件');
      }

      // 根据角色更新手机号
      if (phoneChanged) {
        if (user.role === 'salesperson') {
          await supabaseService.updateSalespersonPhone(user.id, formData.phone);
        } else if (user.role === 'expert') {
          await supabaseService.updateExpertPhone(user.id, formData.phone);
        }
      }

      // 更新本地用户状态
      setUser({
        ...user,
        name: formData.name,
        username: formData.username,
        department: formData.department || undefined,
      });

      // 更新原始数据
      setOriginalData({
        phone: formData.phone,
        email: formData.email,
      });

      // 清空验证密码
      setVerifyPassword('');

      toast.success('个人信息更新成功');
    } catch (error: any) {
      console.error('更新失败:', error);
      toast.error(error.message || '更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证当前密码
    if (!passwordData.currentPassword) {
      toast.error('请输入当前密码');
      return;
    }

    // 验证新密码
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('新密码长度至少为6位');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      // 先验证当前密码
      const isValid = await supabaseService.verifyPassword(formData.email, passwordData.currentPassword);
      if (!isValid) {
        toast.error('当前密码错误');
        setPasswordLoading(false);
        return;
      }

      // 更新密码
      await supabaseService.updatePassword(passwordData.newPassword);
      
      // 清空表单
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast.success('密码修改成功');
    } catch (error: any) {
      console.error('修改密码失败:', error);
      toast.error(error.message || '修改密码失败，请重试');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentPath={location.pathname}
      />

      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
              >
                <i className="fas fa-bars"></i>
              </button>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">个人设置</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* 个人信息卡片 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <div className="ml-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{user?.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    {user?.role === 'admin' ? '管理员' : user?.role === 'salesperson' ? '业务员' : '专家'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User size={16} className="inline mr-2" />
                      姓名
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User size={16} className="inline mr-2" />
                      用户名
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail size={16} className="inline mr-2" />
                      邮箱
                      {formData.email !== originalData.email && (
                        <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">需要验证密码</span>
                      )}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="请输入邮箱"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Phone size={16} className="inline mr-2" />
                      手机号
                      {formData.phone !== originalData.phone && (
                        <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">需要验证密码</span>
                      )}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="请输入手机号"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Building size={16} className="inline mr-2" />
                      部门
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="请输入部门"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* 如果修改了敏感信息，显示密码验证字段 */}
                {(formData.phone !== originalData.phone || formData.email !== originalData.email) && (
                  <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                      <Lock size={16} className="inline mr-2" />
                      您正在修改敏感信息，请输入当前密码以验证身份
                    </p>
                    <input
                      type="password"
                      value={verifyPassword}
                      onChange={(e) => setVerifyPassword(e.target.value)}
                      placeholder="请输入当前密码"
                      className="w-full px-4 py-2 border border-orange-300 dark:border-orange-700 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save size={16} className="mr-2" />
                    {loading ? '保存中...' : '保存更改'}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* 修改密码卡片 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <Lock size={20} className="mr-2" />
                修改密码
              </h3>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    当前密码
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="请输入当前密码"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    新密码
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="请输入新密码（至少6位）"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    确认新密码
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="请再次输入新密码"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Lock size={16} className="mr-2" />
                    {passwordLoading ? '修改中...' : '修改密码'}
                  </button>
                </div>
              </form>
            </motion.div>

            {/* 账号信息卡片 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">账号信息</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">用户ID</span>
                  <span className="text-gray-800 dark:text-white font-mono">{user?.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">角色</span>
                  <span className="text-gray-800 dark:text-white">
                    {user?.role === 'admin' ? '管理员' : user?.role === 'salesperson' ? '业务员' : '专家'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-gray-400">账号状态</span>
                  <span className="text-green-600 dark:text-green-400">正常</span>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
