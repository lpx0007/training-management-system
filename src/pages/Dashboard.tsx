import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  GraduationCap, 
  Users, 
  BarChart2, 
  UserCheck, 
  Bell, 
  Settings, 
  Moon, 
  Sun,
  Calendar,
  DollarSign,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/Sidebar';
import supabaseService from '@/lib/supabase/supabaseService';
import type { TrainingSession } from '@/lib/supabase/types';
import NotificationBell from '@/components/Notifications/NotificationBell';
import AnnouncementBanner from '@/components/Announcements/AnnouncementBanner';

// 模拟图表数据
const salesTrendData = [
  { month: '1月', revenue: 12000, students: 120 },
  { month: '2月', revenue: 19000, students: 180 },
  { month: '3月', revenue: 15000, students: 150 },
  { month: '4月', revenue: 25000, students: 220 },
  { month: '5月', revenue: 22000, students: 200 },
  { month: '6月', revenue: 30000, students: 280 },
];

const courseTypeData = [
  { name: '技术培训', value: 35 },
  { name: '管理培训', value: 25 },
  { name: '语言培训', value: 20 },
  { name: '其他培训', value: 20 },
];

const pendingTasks = [
  { id: 1, title: '完成6月份销售报表', priority: 'high', dueDate: '2025-10-25' },
  { id: 2, title: '与专家确认7月份培训安排', priority: 'medium', dueDate: '2025-10-28' },
  { id: 3, title: '客户满意度调查', priority: 'low', dueDate: '2025-11-05' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const location = useLocation();
  // 从 Supabase 获取培训场次
  useEffect(() => {
    const fetchTrainingSessions = async () => {
      try {
        const sessions = await supabaseService.getTrainingSessions();
        setTrainingSessions(sessions);
      } catch (error) {
        console.error('获取培训场次失败:', error);
        // 如果获取失败，设置为空数组
        setTrainingSessions([]);
      }
    };
    
    fetchTrainingSessions();
  }, []);

  // 计算总销售额
  const totalRevenue = salesTrendData.reduce((sum, item) => sum + item.revenue, 0);
  // 计算总学员数
  const totalStudents = salesTrendData.reduce((sum, item) => sum + item.students, 0);
  // 计算平均每学员消费
  const avgSpendPerStudent = totalStudents > 0 ? (totalRevenue / totalStudents).toFixed(0) : '0';
  
  // 计算待处理任务数量
  const pendingTasksCount = pendingTasks.length;

  // 专家的培训计划
  const expertTrainingSchedule = trainingSessions.filter(training => {
    // 简单模拟：专家只能看到自己参与的培训
    return user?.role === 'expert' && training.expert.includes(user.name);
  });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 使用统一的Sidebar组件 */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentPath={location.pathname}
      />

      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
              >
                <i className="fas fa-bars"></i>
              </button>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">仪表盘</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <NotificationBell />
              <Link 
                to="/profile-settings"
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
              >
                <Settings size={20} />
              </Link>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
          {/* 欢迎信息和公告栏 */}
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                欢迎回来，{user?.name}！
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>
            <div className="lg:col-span-3">
              <AnnouncementBanner />
            </div>
          </div>

          {/* 如果是专家角色，显示培训计划 */}
          {user?.role === 'expert' ? (
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">我的培训计划</h3>
                {expertTrainingSchedule.length > 0 ? (
                  <div className="space-y-4">
                    {expertTrainingSchedule.map(training => (
                      <div key={training.id} className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <GraduationCap size={24} />
                        </div>
                        <div className="ml-4 flex-1">
                          <h4 className="text-base font-medium text-gray-800 dark:text-white">{training.name}</h4>
                          <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <Calendar size={16} className="mr-2 flex-shrink-0" />
                            <span>{training.date}</span>
                            <span className="mx-3">•</span>
                            <span>{training.participants} 人参加</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          training.status === 'completed' 
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400' 
                            : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-400'
                        }`}>
                          {training.status === 'completed' ? '已完成' : '即将开始'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">暂无培训计划</p>
                  </div>
                )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700"
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">培训统计</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">总培训场次</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">25</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">总参训人数</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">750</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">平均评分</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">4.8</p>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            // 非专家角色显示正常仪表盘
            <>
              {/* 关键指标卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总销售额</p>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">¥{totalRevenue.toLocaleString()}</h3>
                      <p className="text-sm text-green-500 mt-1 flex items-center">
                        <i className="fas fa-arrow-up mr-1"></i> 12.5% 较上月
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <DollarSign size={24} />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总学员数</p>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalStudents}</h3>
                      <p className="text-sm text-green-500 mt-1 flex items-center">
                        <i className="fas fa-arrow-up mr-1"></i> 8.3% 较上月
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
                      <Users size={24} />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">平均消费</p>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">¥{avgSpendPerStudent}</h3>
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <i className="fas fa-arrow-down mr-1"></i> 2.1% 较上月
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Target size={24} />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">待办事项</p>
                       <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{pendingTasksCount}</h3>
                       <p className="text-sm text-gray-500 mt-1 flex items-center">
                         <Calendar size={14} className="mr-1" /> {pendingTasksCount}项待处理
                       </p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                      <i className="fas fa-tasks text-2xl"></i>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* 图表区域 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 lg:col-span-2"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white">销售业绩趋势</h3>
                    <div className="flex space-x-2">
                      <button className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                        月度
                      </button>
                      <button className="text-xs px-2 py-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        季度
                      </button>
                      <button className="text-xs px-2 py-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        年度
                      </button>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="month" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                        <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                            color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="销售额" />
                        <Line type="monotone" dataKey="students" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="学员数" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white">课程类型分布</h3>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={courseTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {courseTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                            color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                          }}
                          formatter={(value) => [`${value}%`, '占比']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

              {/* 待办事项和最近培训 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white">待办事项</h3>
                    <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">查看全部</button>
                  </div>
                   <ul className="space-y-3">
                     {pendingTasks.map(item => (
                       <li key={item.id} className="flex items-start">
                         <div className="flex-shrink-0 mt-1">
                           <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                         </div>
                         <div className="ml-3 flex-1">
                           <p className="text-sm font-medium text-gray-800 dark:text-white">{item.title}</p>
                           <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                             <span className={`px-1.5 py-0.5 rounded ${
                               item.priority === 'high' 
                                 ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400' 
                                 : item.priority === 'medium'
                                   ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400'
                                   : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                             }`}>
                               {item.priority === 'high' ? '高优先级' : item.priority === 'medium' ? '中优先级' : '低优先级'}
                             </span>
                             <span className="mx-2">•</span>
                             <span className="flex items-center">
                               <Calendar size={12} className="mr-1" />
                               {item.dueDate}
                             </span>
                           </div>
                         </div>
                       </li>
                     ))}
                   </ul>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 dark:text-white">最近培训</h3>
                    <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">查看全部</button>
                  </div>
                  <ul className="space-y-3">
                    {trainingSessions.slice(0, 3).map(training => (
                      <li key={training.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <GraduationCap size={20} />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-white">{training.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{training.date}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{training.participants} 人参加</span>
                          </div>
                        </div>
                        <div className="ml-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            training.status === 'completed' 
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400' 
                              : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400'
                          }`}>
                            {training.status === 'completed' ? '已完成' : '即将开始'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}