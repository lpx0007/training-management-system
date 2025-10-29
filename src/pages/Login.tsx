import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  // 如果已经认证，重定向到仪表盘
  useEffect(() => {
    // 只在加载完成且已认证时重定向
    if (!loading && isAuthenticated) {
      console.log('✅ 已认证，重定向到 dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    console.log('🔐 开始登录流程，邮箱:', email);
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      console.log('登录结果:', success ? '成功' : '失败');
      
      if (success) {
        // 登录成功，useEffect 会处理重定向
        console.log('✅ 登录成功，等待重定向');
      }
    } catch (error) {
      console.error('❌ 登录异常:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
              >
                <i className="fas fa-graduation-cap text-2xl"></i>
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">培训机构业务管理系统</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">请登录您的账户</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱/手机号</label>
                <motion.div 
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="请输入邮箱或手机号"
                    autoComplete="username"
                  />
                </motion.div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">密码</label>
                <motion.div 
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="请输入密码"
                    autoComplete="current-password"
                  />
                </motion.div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading || !email || !password}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                className={cn(
                  "w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg shadow-md transition-all duration-300 flex items-center justify-center",
                  isLoading || !email || !password ? "opacity-70 cursor-not-allowed" : "hover:shadow-lg"
                )}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录中...
                  </>
                ) : (
                  '登录系统'
                )}
              </motion.button>
            </form>

            {/* 注册入口 */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                还没有账号？
                <a 
                  href="/register" 
                  className="ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  立即注册
                </a>
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                测试账号:
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span className="block">admin@example.com / admin123456 (管理员)</span>
                <span className="block mt-1">sales1@example.com / sales123456 (业务员)</span>
                <span className="block mt-1">expert1@example.com / expert123456 (专家)</span>
              </p>
            </div>
          </div>

          <div className="px-8 py-4 bg-gray-50 dark:bg-gray-700/50 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              © {new Date().getFullYear()} 培训机构业务管理系统 - 提升培训管理效率
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}