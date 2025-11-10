import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
  import { motion } from 'framer-motion';
  import { Link } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Download, 
  Filter, 
  ChevronDown, 
  Search, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  BarChart2, 
  UserCheck, 
  MapPin,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Empty } from '@/components/Empty';
import Sidebar from '@/components/Sidebar';
import { toast } from 'sonner';
import dataService from '@/lib/dataService';

// Mock数据 - 培训场次数据
const mockTrainingData = [
  {
    id: 1,
    name: '前端开发进阶班',
    date: '2025-10-20',
    participants: 45,
    revenue: 45000,
    expert: '张教授',
    area: '北京',
    salesperson: '张三',
    status: '已完成',
    participantsList: [
      { id: 1, name: '李明', phone: '138****1234', email: 'liming@example.com', registrationDate: '2025-10-01', paymentStatus: '已支付' },
      { id: 2, name: '张华', phone: '139****5678', email: 'zhanghua@example.com', registrationDate: '2025-10-05', paymentStatus: '已支付' },
      { id: 3, name: '王芳', phone: '137****9012', email: 'wangfang@example.com', registrationDate: '2025-10-10', paymentStatus: '已支付' },
    ]
  },
  {
    id: 2,
    name: '项目管理实战',
    date: '2025-10-23',
    participants: 30,
    revenue: 36000,
    expert: '李博士',
    area: '上海',
    salesperson: '李四',
    status: '即将开始',
    participantsList: [
      { id: 1, name: '刘强', phone: '136****3456', email: 'liuqiang@example.com', registrationDate: '2025-10-15', paymentStatus: '已支付' },
      { id: 2, name: '陈静', phone: '135****7890', email: 'chenjing@example.com', registrationDate: '2025-10-18', paymentStatus: '已支付' },
    ]
  },
  {
    id: 3,
    name: 'UI设计原理',
    date: '2025-10-28',
    participants: 25,
    revenue: 30000,
    expert: '王设计师',
    area: '广州',
    salesperson: '王五',
    status: '即将开始',
    participantsList: [
      { id: 1, name: '赵敏', phone: '134****2345', email: 'zhaomin@example.com', registrationDate: '2025-10-20', paymentStatus: '已支付' },
    ]
  },
  {
    id: 4,
    name: '数据分析与可视化',
    date: '2025-10-15',
    participants: 40,
    revenue: 40000,
    expert: '陈数据',
    area: '深圳',
    salesperson: '赵六',
    status: '已完成',
    participantsList: [
      { id: 1, name: '黄强', phone: '133****6789', email: 'huangqiang@example.com', registrationDate: '2025-10-05', paymentStatus: '已支付' },
      { id: 2, name: '周丽', phone: '132****0123', email: 'zhouli@example.com', registrationDate: '2025-10-10', paymentStatus: '已支付' },
      { id: 3, name: '吴杰', phone: '131****4567', email: 'wujie@example.com', registrationDate: '2025-10-12', paymentStatus: '未支付' },
    ]
  },
  {
    id: 5,
    name: '市场营销策略',
    date: '2025-10-18',
    participants: 35,
    revenue: 38500,
    expert: '赵市场',
    area: '北京',
    salesperson: '钱七',
    status: '已完成',
    participantsList: [
      { id: 1, name: '郑华', phone: '130****8901', email: 'zhenghua@example.com', registrationDate: '2025-10-08', paymentStatus: '已支付' },
      { id: 2, name: '孙艺', phone: '129****2345', email: 'sunyi@example.com', registrationDate: '2025-10-12', paymentStatus: '已支付' },
    ]
  }
];

// Mock数据 - 月度业绩趋势
const monthlyPerformanceData = [
  { month: '1月', revenue: 70000, participants: 150 },
  { month: '2月', revenue: 85000, participants: 180 },
  { month: '3月', revenue: 92000, participants: 200 },
  { month: '4月', revenue: 105000, participants: 220 },
  { month: '5月', revenue: 120000, participants: 250 },
  { month: '6月', revenue: 135000, participants: 280 },
  { month: '7月', revenue: 140000, participants: 300 },
  { month: '8月', revenue: 150000, participants: 320 },
  { month: '9月', revenue: 160000, participants: 350 },
  { month: '10月', revenue: 170000, participants: 380 }
];

// Mock数据 - 区域销售分布
const areaPerformanceData = [
  { name: '北京', revenue: 83500, participants: 80 },
  { name: '上海', revenue: 36000, participants: 30 },
  { name: '广州', revenue: 30000, participants: 25 },
  { name: '深圳', revenue: 40000, participants: 40 }
];

// Mock数据 - 销售业绩排名
const salesPerformanceData = [
  { name: '张三', revenue: 45000, participants: 45 },
  { name: '赵六', revenue: 40000, participants: 40 },
  { name: '钱七', revenue: 38500, participants: 35 },
  { name: '李四', revenue: 36000, participants: 30 },
  { name: '王五', revenue: 30000, participants: 25 }
];

export default function DataExport() {
  const { user, logout } = useContext(AuthContext);
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [selectedArea, setSelectedArea] = useState('全部');
  const [dateRange, setDateRange] = useState<string[]>([]);
  const [filteredTrainingData, setFilteredTrainingData] = useState(mockTrainingData);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportType, setExportType] = useState('all');
  const [selectedTraining, setSelectedTraining] = useState<typeof mockTrainingData[0] | null>(null);

  // 筛选数据
  useEffect(() => {
    let result = [...mockTrainingData];
    
    // 搜索筛选
    if (searchTerm) {
      result = result.filter(training => 
        training.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.expert.toLowerCase().includes(searchTerm.toLowerCase()) ||
        training.salesperson.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 状态筛选
    if (selectedStatus !== '全部') {
      result = result.filter(training => training.status === selectedStatus);
    }
    
    // 区域筛选
    if (selectedArea !== '全部') {
      result = result.filter(training => training.area === selectedArea);
    }
    
    // 日期范围筛选
    if (dateRange.length === 2) {
      result = result.filter(training => {
        const trainingDate = new Date(training.date);
        return trainingDate >= new Date(dateRange[0]) && trainingDate <= new Date(dateRange[1]);
      });
    }
    
    setFilteredTrainingData(result);
  }, [searchTerm, selectedStatus, selectedArea, dateRange]);

  // 处理导出
  const handleExport = async () => {
    let dataToExport = filteredTrainingData;
    
    if (exportType === 'selected' && selectedTraining) {
      dataToExport = [selectedTraining];
    }
    
    try {
      const result = await dataService.exportData(dataToExport, exportFormat);
      toast.success(result);
    } catch (error) {
      toast.error('导出失败，请重试');
    }
  };

  // 状态列表
  const statuses = ['全部', ...Array.from(new Set(mockTrainingData.map(training => training.status)))];
  
  // 区域列表
  const areas = ['全部', ...Array.from(new Set(mockTrainingData.map(training => training.area)))];

  // 计算统计数据
  const totalRevenue = filteredTrainingData.reduce((sum, item) => sum + item.revenue, 0);
  const totalParticipants = filteredTrainingData.reduce((sum, item) => sum + item.participants, 0);
  const totalSessions = filteredTrainingData.length;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 使用统一的Sidebar组件 */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentPath="/data-export"
      />

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
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">数据导出与分析</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative">
                <i className="fas fa-bell"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总销售额</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">¥{totalRevenue.toLocaleString()}</h3>
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总参训人数</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalParticipants}</h3>
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">培训场次</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalSessions}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Calendar size={24} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">月度业绩趋势</h3>
                <div className="flex space-x-2">
                  <button className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                    全年
                  </button>
                  <button className="text-xs px-2 py-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    半年
                  </button>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyPerformanceData}>
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
                    <Line type="monotone" dataKey="participants" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="参训人数" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white">区域销售分布</h3>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={areaPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                      <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                        }}
                        formatter={(value) => [`¥${value.toLocaleString()}`, '销售额']}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" name="销售额" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white">销售业绩排名</h3>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={salesPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                      <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                      <YAxis dataKey="name" type="category" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} width={60} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                        }}
                        formatter={(value) => [`¥${value.toLocaleString()}`, '销售额']}
                      />
                      <Bar dataKey="revenue" fill="#8b5cf6" name="销售额" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>

          {/* 导出设置区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">导出设置</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">导出格式</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="pdf">PDF (.pdf)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">导出范围</label>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="all">全部数据</option>
                  <option value="filtered">筛选后数据</option>
                  <option value="selected">选中项目</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">导出内容</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="all">全部内容</option>
                  <option value="basic">基本信息</option>
                  <option value="participants">参训人员名单</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center transition-colors"
              >
                <Download size={18} className="mr-2" />
                导出数据
              </motion.button>
            </div>
          </div>

          {/* 筛选和搜索区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索培训名称、专家或业务员..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* 日期范围选择器 */}
                <div className="relative">
                  <input
                    type="date"
                    className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    onChange={(e) => {
                      const newDate = e.target.value;
                      if (dateRange.length === 0 || dateRange.length === 2) {
                        setDateRange([newDate]);
                      } else {
                        const startDate = new Date(dateRange[0]);
                        const endDate = new Date(newDate);
                        if (endDate >= startDate) {
                          setDateRange([dateRange[0], newDate]);
                        } else {
                          setDateRange([newDate, dateRange[0]]);
                        }
                      }
                    }}
                  />
                  <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                
                {dateRange.length > 0 && (
                  <div className="relative">
                    <input
                      type="date"
                      min={dateRange[0]}
                      className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      onChange={(e) => {
                        const newDate = e.target.value;
                        const startDate = new Date(dateRange[0]);
                        const endDate = new Date(newDate);
                        if (endDate >= startDate) {
                          setDateRange([dateRange[0], newDate]);
                        } else {
                          setDateRange([newDate, dateRange[0]]);
                        }
                      }}
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">至</span>
                  </div>
                )}
                
                {/* 状态筛选 */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                
                {/* 区域筛选 */}
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                
                {/* 更多筛选按钮 */}
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all flex items-center"
                >
                  <Filter size={16} className="mr-2" />
                  筛选
                  <ChevronDown size={16} className="ml-1" />
                </button>
              </div>
            </div>
            
            {/* 筛选下拉面板 */}
            {isFilterDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">最低参训人数</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">最低销售额</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">负责业务员</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">全部</option>
                      <option value="张三">张三</option>
                      <option value="李四">李四</option>
                      <option value="王五">王五</option>
                      <option value="赵六">赵六</option>
                      <option value="钱七">钱七</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                    重置
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all">
                    应用筛选
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* 培训列表 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      选择
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      培训名称
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      举办日期
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      参训人数
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      销售额
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      授课专家
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      业务区域
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      负责业务员
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      状态
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTrainingData.length > 0 ? (
                    filteredTrainingData.map((training) => (
                      <motion.tr 
                        key={training.id}
                        whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 1)' }}
                        className="transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedTraining?.id === training.id}
                            onChange={() => setSelectedTraining(selectedTraining?.id === training.id ? null : training)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800 dark:text-white">{training.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2 text-gray-400" />
                            {training.date}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users size={14} className="mr-2 text-gray-400" />
                            {training.participants}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign size={14} className="mr-2 text-gray-400" />
                            {training.revenue.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {training.expert}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <MapPin size={14} className="mr-2 text-gray-400" />
                            {training.area}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {training.salesperson}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            training.status === '已完成'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                              : training.status === '即将开始'
                              ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                              : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                          }`}>
                            {training.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                          >
                            查看详情
                          </button>
                          <button 
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          >
                            导出详情
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <Empty />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* 分页控件 */}
            {filteredTrainingData.length > 0 && (
              <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6 flex items-center justify-between">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    显示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredTrainingData.length}</span> 条，共 <span className="font-medium">{filteredTrainingData.length}</span> 条结果
                  </p>
                </div>
                <div className="flex-1 flex justify-between sm:justify-end">
                  <button
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    上一页
                  </button>
                  <button
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 导出历史 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">导出历史</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      导出文件
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      导出时间
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      导出人
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      文件大小
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {/* 模拟导出历史数据 */}
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText size={18} className="text-blue-500 mr-2" />
                          <div className="text-sm font-medium text-gray-800 dark:text-white">培训数据_{i}.xlsx</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {new Date(Date.now() - i * 86400000).toLocaleString('zh-CN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        系统管理员
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {(Math.random() * 10 + 1).toFixed(2)} MB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3">
                          下载
                        </button>
                        <button className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300">
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}