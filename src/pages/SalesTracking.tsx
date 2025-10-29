import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  DollarSign, 
  Search, 
  Filter, 
  ChevronDown, 
  Download,
  UserCheck,
  Target,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Empty } from '@/components/Empty';
import Sidebar from '@/components/Sidebar';
import {
  getSalesPersonsData,
  getMonthlySalesData,
  getDepartmentSalesData,
  getConversionRateDistribution,
  type SalesPersonData,
  type MonthlySalesData,
  type DepartmentSalesData
} from '@/lib/services/salesTrackingService';

export default function SalesTracking() {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('全部');
  const [selectedTimeRange, setSelectedTimeRange] = useState('本月');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState<SalesPersonData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // 真实数据状态
  const [salesData, setSalesData] = useState<SalesPersonData[]>([]);
  const [filteredSalesData, setFilteredSalesData] = useState<SalesPersonData[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySalesData[]>([]);
  const [departmentSalesData, setDepartmentSalesData] = useState<DepartmentSalesData[]>([]);
  const [conversionRateData, setConversionRateData] = useState<Array<{ name: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);

  // 加载数据
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        console.log('开始加载销售追踪数据...');
        
        const [sales, monthly, department, conversion] = await Promise.all([
          getSalesPersonsData(selectedTimeRange),
          getMonthlySalesData(),
          getDepartmentSalesData(),
          getConversionRateDistribution()
        ]);
        
        console.log('销售数据加载完成:', {
          salesCount: sales.length,
          monthlyCount: monthly.length,
          departmentCount: department.length,
          conversionCount: conversion.length
        });
        
        setSalesData(sales);
        setMonthlySalesData(monthly);
        setDepartmentSalesData(department);
        setConversionRateData(conversion);
      } catch (error) {
        console.error('加载销售数据失败:', error);
        // 即使出错也设置空数组,避免页面崩溃
        setSalesData([]);
        setMonthlySalesData([]);
        setDepartmentSalesData([]);
        setConversionRateData([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [selectedTimeRange]);

  // 筛选和排序数据
  useEffect(() => {
    let result = [...salesData];
    
    // 搜索筛选
    if (searchTerm) {
      result = result.filter(salesperson => 
        salesperson.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (salesperson.department && salesperson.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // 部门筛选
    if (selectedDepartment !== '全部') {
      result = result.filter(salesperson => salesperson.department === selectedDepartment);
    }
    
    // 权限控制 - 业务员只能查看自己的数据
    if (user?.role === 'salesperson') {
      const salespersonName = user.name;
      result = result.filter(salesperson => salesperson.name === salespersonName);
    }
    
    // 排序
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof SalesPersonData];
        const bValue = b[sortConfig.key as keyof SalesPersonData];
        
        if (aValue === undefined || bValue === undefined || aValue === null || bValue === null) return 0;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredSalesData(result);
  }, [searchTerm, selectedDepartment, sortConfig, user, salesData]);

  // 处理排序
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 打开销售详情
  const openSalesDetail = (salesperson: SalesPersonData) => {
    setSelectedSalesperson(salesperson);
    setIsDetailModalOpen(true);
  };

  // 部门列表
  const departments = ['全部', ...Array.from(new Set(salesData.map(salesperson => salesperson.department).filter(Boolean)))];

  // 计算统计数据
  const totalRevenue = filteredSalesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCustomers = filteredSalesData.reduce((sum, item) => sum + item.completedCustomers, 0);
  const avgConversionRate = filteredSalesData.length > 0
    ? filteredSalesData.reduce((sum, item) => sum + item.conversionRate, 0) / filteredSalesData.length
    : 0;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 使用统一的Sidebar组件 */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentPath="/sales-tracking"
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
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">销售业绩追踪</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative">
                <i className="fas fa-bell"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              {user?.role === 'admin' && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center"
                >
                  <Download size={16} className="mr-2" />
                  导出报表
                </motion.button>
              )}
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">加载数据中...</p>
              </div>
            </div>
          ) : (
            <>
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">成交客户数</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalCustomers}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
                  <UserCheck size={24} />
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">平均转化率</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{avgConversionRate.toFixed(1)}%</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Target size={24} />
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
                <h3 className="font-semibold text-gray-800 dark:text-white">月度销售趋势</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setSelectedTimeRange('半年')}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded transition-all",
                      selectedTimeRange === '半年' 
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium" 
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    )}
                  >
                    半年
                  </button>
                  <button 
                    onClick={() => setSelectedTimeRange('全年')}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded transition-all",
                      selectedTimeRange === '全年' 
                        ? "bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium" 
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    )}
                  >
                    全年
                  </button>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlySalesData}>
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
                    <Line type="monotone" dataKey="customers" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="成交客户数" />
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
                  <h3 className="font-semibold text-gray-800 dark:text-white">部门销售分布</h3>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentSalesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ¥${value.toLocaleString()}`}
                      >
                        {departmentSalesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                        }}
                        formatter={(value) => [`¥${value.toLocaleString()}`, '销售额']}
                      />
                    </PieChart>
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
                  <h3 className="font-semibold text-gray-800 dark:text-white">转化率分布</h3>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversionRateData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                      <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                        }}
                        formatter={(value) => [`${value}人`, '业务员数量']}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" name="业务员数量" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          </div>

          {/* 筛选和搜索区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索业务员姓名或部门..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* 部门筛选 */}
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  {departments.map(dept => (
                    <option key={dept || 'unknown'} value={dept || ''}>{dept || '未知'}</option>
                  ))}
                </select>
                
                {/* 时间范围筛选 */}
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="本月">本月</option>
                  <option value="上月">上月</option>
                  <option value="本季度">本季度</option>
                  <option value="上季度">上季度</option>
                  <option value="本年">本年</option>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">最低销售额</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">最低成交客户数</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">最低转化率</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">全部</option>
                      <option value="20">20%以上</option>
                      <option value="30">30%以上</option>
                      <option value="40">40%以上</option>
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

          {/* 销售排行榜 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-white">销售业绩排行榜</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedTimeRange}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      排名
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        业务员
                        {sortConfig?.key === 'name' && (
                          <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      部门
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => handleSort('revenue')}
                    >
                      <div className="flex items-center">
                        销售额
                        {sortConfig?.key === 'revenue' && (
                          <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => handleSort('completedCustomers')}
                    >
                      <div className="flex items-center">
                        成交客户数
                        {sortConfig?.key === 'completedCustomers' && (
                          <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => handleSort('conversionRate')}
                    >
                      <div className="flex items-center">
                        转化率
                        {sortConfig?.key === 'conversionRate' && (
                          <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                        )}
                      </div>
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
                  {filteredSalesData.length > 0 ? (
                    filteredSalesData.map((salesperson, index) => (
                      <motion.tr 
                        key={salesperson.id}
                        whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 1)' }}
                        className="transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300 dark:bg-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={salesperson.avatar || 'https://via.placeholder.com/40'}
                                alt={salesperson.name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-white">{salesperson.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-300">{salesperson.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-800 dark:text-white">¥{salesperson.revenue.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-300">{salesperson.completedCustomers}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${salesperson.conversionRate}%` }}
                              ></div>
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-600 dark:text-gray-300">{salesperson.conversionRate}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openSalesDetail(salesperson)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          >
                            查看详情
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Empty />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* 分页控件 */}
            {filteredSalesData.length > 0 && (
              <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6 flex items-center justify-between">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    显示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredSalesData.length}</span> 条，共 <span className="font-medium">{filteredSalesData.length}</span> 条结果
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
            </>
          )}
        </main>
      </div>

      {/* 业务员详情模态框 */}
      {isDetailModalOpen && selectedSalesperson && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">业务员详情</h2>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0">
                  <img
                    src={selectedSalesperson.avatar || 'https://via.placeholder.com/128'}
                    alt={selectedSalesperson.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{selectedSalesperson.name}</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">{selectedSalesperson.department}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">销售额</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">¥{selectedSalesperson.revenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">成交客户数</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{selectedSalesperson.completedCustomers}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">转化率</p>
                      <p className="text-2xl font-bold text-gray-800 dark:text-white">{selectedSalesperson.conversionRate}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Award size={20} className="text-yellow-400 mr-2" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      排名: 第 {selectedSalesperson.ranking} 名
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">业绩趋势</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { month: '1月', revenue: selectedSalesperson.revenue },
                      { month: '2月', revenue: selectedSalesperson.revenue * 1.1 },
                      { month: '3月', revenue: selectedSalesperson.revenue * 1.2 },
                      { month: '4月', revenue: selectedSalesperson.revenue * 0.9 },
                      { month: '5月', revenue: selectedSalesperson.revenue * 1.3 },
                      { month: '6月', revenue: selectedSalesperson.revenue * 1.4 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="month" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
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
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                  成交客户列表 ({selectedSalesperson.completedCustomerList?.length || 0}个客户, {selectedSalesperson.completedCustomers}次成交)
                </h4>
                <div className="space-y-3">
                  {selectedSalesperson.completedCustomerList && selectedSalesperson.completedCustomerList.length > 0 ? (
                    <>
                      {selectedSalesperson.completedCustomerList.slice(0, 5).map((customer: any) => (
                        <div key={customer.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <UserCheck size={20} />
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {customer.name}
                            </p>
                            <div className="flex items-center mt-1">
                              {customer.company && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 mr-4">
                                  {customer.company}
                                </span>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400 mr-4">
                                最近成交: {customer.latestDate ? new Date(customer.latestDate).toLocaleDateString() : '-'}
                              </span>
                              {customer.participationCount > 1 && (
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  参训{customer.participationCount}次
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs rounded-full">
                              已成交
                            </span>
                          </div>
                        </div>
                      ))}
                      {selectedSalesperson.completedCustomerList.length > 5 && (
                        <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                          还有 {selectedSalesperson.completedCustomerList.length - 5} 位客户...
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                      暂无成交客户
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}