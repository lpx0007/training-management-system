import { useState, useContext, useEffect, Fragment } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  Award, 
  Download,
  ChevronRight,
  ChevronDown,
  DollarSign,
  Trophy,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Empty } from '@/components/Empty';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/Notifications/NotificationBell';
import {
  type SalesPersonData,
  type MonthlySalesData
} from '@/lib/services/salesTrackingService';
import {
  getMonthlyPerformance,
  getCoursePerformanceDetail,
  getTopPerformers,
  calculateGrowthRate
} from '@/lib/services/performanceService';
import {
  getAllSalespersons
} from '@/lib/services/salespersonService';
import {
  getTrainingCoursesByTimeRange,
  getAvailableYears
} from '@/lib/services/trainingCourseService';
import trainingSessionService from '@/lib/supabase/supabaseService';

export default function SalesTracking() {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm] = useState(''); // 未使用的搜索功能，保留以避免useEffect报错
  const [selectedDepartment] = useState('全部'); // 未使用的筛选功能，保留以避免useEffect报错
  const [selectedTimeRange, setSelectedTimeRange] = useState('本月');
  const [selectedCourse] = useState('全部'); // 未使用的课程筛选，保留以避免useEffect报错
  const [activeTab, setActiveTab] = useState<'ranking' | 'detail' | 'department'>('ranking'); // Tab切换
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set()); // 展开的课程
  const [expandedDetailCourses, setExpandedDetailCourses] = useState<Set<string>>(new Set()); // 详情框中展开的课程
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'revenue', direction: 'desc' });
  const [selectedSalesperson, setSelectedSalesperson] = useState<SalesPersonData | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportType, setExportType] = useState<'salesperson' | 'course'>('salesperson');
  // 业务员业绩筛选
  const [performanceFilters, setPerformanceFilters] = useState({
    timeRange: '本月',
    department: user?.role === 'manager' ? (user.department || '全部') : '全部',
    salesperson: '全部'
  });
  // 课程销售业绩筛选
  const [courseSalesFilters, setCourseSalesFilters] = useState({
    course: '全部',
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString()
  });
  // 可用的年份列表
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  // 根据时间筛选的课程列表
  const [filteredCoursesForExport, setFilteredCoursesForExport] = useState<any[]>([]);
  // 真实数据状态
  const [salesData, setSalesData] = useState<SalesPersonData[]>([]);
  const [filteredSalesData, setFilteredSalesData] = useState<SalesPersonData[]>([]);
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySalesData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 筛选后的业务员列表（用于导出模态框联动）
  const [filteredSalespersonsForExport, setFilteredSalespersonsForExport] = useState<SalesPersonData[]>([]);
  
  // 真实业绩数据
  const [realPerformanceData, setRealPerformanceData] = useState<any>(null);
  const [courseDetails, setCourseDetails] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any>(null);
  const [growthRate, setGrowthRate] = useState(0);

  // 部门业绩相关状态
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [departmentTimeRange, setDepartmentTimeRange] = useState('本月');
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set()); // 展开的部门
  
  // 当部门筛选改变时，更新业务员列表
  useEffect(() => {
    if (performanceFilters.department === '全部') {
      setFilteredSalespersonsForExport(salesData);
    } else {
      const filtered = salesData.filter(sp => sp.department === performanceFilters.department);
      setFilteredSalespersonsForExport(filtered);
    }
    // 如果当前选中的业务员不在新的部门中，重置为全部
    if (performanceFilters.salesperson !== '全部') {
      const currentSalesperson = salesData.find(sp => sp.name === performanceFilters.salesperson);
      if (currentSalesperson && currentSalesperson.department !== performanceFilters.department && performanceFilters.department !== '全部') {
        setPerformanceFilters(prev => ({ ...prev, salesperson: '全部' }));
      }
    }
  }, [performanceFilters.department, salesData]);

  // 加载可用年份列表
  useEffect(() => {
    async function loadYears() {
      const years = await getAvailableYears();
      setAvailableYears(years);
    }
    loadYears();
  }, []);

  // 根据年月加载课程列表
  useEffect(() => {
    async function loadFilteredCourses() {
      const courses = await getTrainingCoursesByTimeRange(
        courseSalesFilters.year,
        courseSalesFilters.month
      );
      setFilteredCoursesForExport(courses);
    }
    loadFilteredCourses();
  }, [courseSalesFilters.year, courseSalesFilters.month]);

  // 加载数据
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        console.log('开始加载销售追踪数据...');
        
        // 加载真实业绩数据 - 传递用户信息用于权限过滤
        const [performanceData, topPerf, lastMonthData, currentMonthData, courseDetailData, allSalespersons] = await Promise.all([
          getMonthlyPerformance(selectedTimeRange, user?.role, user?.department_id, user?.permissions), // 传递用户角色、部门ID和权限
          getTopPerformers(selectedTimeRange, user?.role, user?.department),
          getMonthlyPerformance('上月', user?.role, user?.department_id, user?.permissions),
          getMonthlyPerformance('本月', user?.role, user?.department_id, user?.permissions),
          getCoursePerformanceDetail(selectedCourse, selectedTimeRange),
          // 获取所有业务员（用于导出筛选）
          getAllSalespersons()
        ]);
        
        // 计算环比增长
        const growth = await calculateGrowthRate(
          currentMonthData.totalRevenue,
          lastMonthData.totalRevenue
        );
        
        setRealPerformanceData(performanceData);
        // courseList 未使用，不再设置
        setTopPerformers(topPerf);
        setGrowthRate(growth);
        setCourseDetails(courseDetailData || []);
        
        // 如果有真实数据，使用真实数据
        console.log('🔍 加载的业绩数据:', performanceData);
        console.log('🔍 salesPersonData是否存在?', !!performanceData?.salesPersonData);
        console.log('🔍 salesPersonData长度:', performanceData?.salesPersonData?.length);
        console.log('🔍 salesPersonData内容:', performanceData?.salesPersonData);
        
        // 合并真实业绩数据和所有业务员列表
        if (performanceData && performanceData.salesPersonData && performanceData.salesPersonData.length > 0) {
          console.log('✅ 使用真实数据，设置salesData:', performanceData.salesPersonData);
          // 创建一个包含所有业务员的列表，有业绩的用真实数据，没业绩的显示0
          const allSalesData = allSalespersons.map((sp: any) => {
            const performanceRecord = performanceData.salesPersonData.find((p: any) => p.id === sp.id);
            if (performanceRecord) {
              return performanceRecord;
            } else {
              // 没有业绩的业务员，显示0
              return {
                id: sp.id,
                name: sp.name,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(sp.name)}&background=random`,
                department: sp.department,
                revenue: 0,
                completedSessions: 0,
                completedCustomers: 0,
                conversionRate: 0,
                participantCount: 0,
                trend: 'stable' as const
              };
            }
          });
          setSalesData(allSalesData);
        } else {
          console.log('⚠️ 没有真实数据，使用所有业务员列表');
          // 使用所有业务员列表，业绩都显示为0
          const allSalesData = allSalespersons.map((sp: any) => ({
            id: sp.id,
            name: sp.name,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(sp.name)}&background=random`,
            department: sp.department,
            revenue: 0,
            completedSessions: 0,
            completedCustomers: 0,
            conversionRate: 0,
            participantCount: 0,
            trend: 'stable' as const
          }));
          setSalesData(allSalesData);
          setMonthlySalesData([]);
        }
        
        // 只显示培训计划中的课程（有实际培训场次的课程）
        // 不需要合并courses表的数据
        setCourseDetails(courseDetailData || []);
      } catch (error) {
        console.error('加载销售数据失败:', error);
        // 即使出错也设置空数组,避免页面崩溃
        setSalesData([]);
        setMonthlySalesData([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [selectedTimeRange, selectedCourse, user]);

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
    
    // 权限控制
    if (user?.role === 'admin') {
      // 管理员：查看所有数据（不过滤）
    } else if (user?.role === 'manager') {
      // 部门经理：只查看本部门数据
      if (user.department) {
        result = result.filter(salesperson => 
          salesperson.department === user.department
        );
      }
    } else if (user?.role === 'salesperson') {
      // 业务员：只查看自己的数据  
      result = result.filter(salesperson => String(salesperson.id) === String(user.id));
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

  // 打开导出模态框
  const openExportModal = () => {
    setIsExportModalOpen(true);
  };

  // 获取部门业绩数据
  const getDepartmentPerformanceData = async (timeRange: string) => {
    try {
      const performanceData = await getMonthlyPerformance(timeRange);
      
      // 获取所有业务员（包括没有业绩的），按部门统计总人数
      const allUsers = await trainingSessionService.getAllUsersWithPermissions();
      const salespersons = allUsers.filter((u: any) => u.role === 'salesperson');
      const departmentTotalCount: Record<string, number> = {};
      salespersons.forEach((person: any) => {
        const dept = person.department || '未分配';
        departmentTotalCount[dept] = (departmentTotalCount[dept] || 0) + 1;
      });

      if (performanceData && performanceData.salesPersonData) {
        // 按部门分组统计业绩（只统计有业绩的业务员）
        const departmentStats = performanceData.salesPersonData
          .filter((person: any) => person.revenue > 0)
          .reduce((acc: any, person: any) => {
            const dept = person.department || '未分配';
            if (!acc[dept]) {
              acc[dept] = {
                department: dept,
                revenue: 0,
                completedSessions: 0,
                completedCustomers: 0,
                participantCount: 0,
                salespersonCount: departmentTotalCount[dept] || 0, // 使用部门总人数
                salespersons: []
              };
            }
            acc[dept].revenue += person.revenue || 0;
            acc[dept].completedSessions += person.completedSessions || 0;
            acc[dept].completedCustomers += person.completedCustomers || 0;
            acc[dept].participantCount += person.participantCount || 0;
            acc[dept].salespersons.push(person);
            return acc;
          }, {});

        // 转换为数组并排序
        const departmentArray = Object.values(departmentStats).sort((a: any, b: any) => b.revenue - a.revenue);
        setDepartmentData(departmentArray);
      }
    } catch (error) {
      console.error('加载部门业绩数据失败:', error);
      setDepartmentData([]);
    }
  };

  // 监听部门业绩时间范围变化
  useEffect(() => {
    if (activeTab === 'department') {
      getDepartmentPerformanceData(departmentTimeRange);
    }
  }, [departmentTimeRange, activeTab]);

  // 处理导出报表
  const handleExportReport = async () => {
    let toastId: string | number | undefined;
    try {
      const { toast } = await import('sonner');
      const dataManagementService = (await import('@/lib/services/dataManagementService')).default;
      
      toastId = toast.loading('正在导出报表...');
      
      // 根据导出类型选择不同的配置
      const config = exportType === 'salesperson' ? {
        dataType: 'salesperson_performance' as const,
        format: 'excel' as const,
        range: 'filtered' as const,
        selectedFields: ['name', 'department', 'revenue', 'completedSessions', 'completedCustomers', 'conversionRate'],
        filters: performanceFilters
      } : {
        dataType: 'course_sales_performance' as const,
        format: 'excel' as const,
        range: 'filtered' as const,
        selectedFields: ['courseName', 'sessions', 'participants', 'revenue', 'avgPrice', 'salespersonDetails'],
        filters: {
          ...courseSalesFilters,
          // 转换年月为timeRange格式
          timeRange: courseSalesFilters.month 
            ? `${courseSalesFilters.year}-${courseSalesFilters.month.padStart(2, '0')}` 
            : courseSalesFilters.year
        }
      };
      
      // 获取数据
      const data = await dataManagementService.exportData(config, user?.id, user?.role, []);
      
      // 导出文件
      const { exportToExcel } = await import('@/lib/exporters/fileExporter');
      const blob = exportToExcel(data, config);
      
      // 下载文件
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = exportType === 'salesperson' 
        ? `业务员业绩报表_${new Date().toLocaleDateString('zh-CN')}.xlsx`
        : `课程销售报表_${new Date().toLocaleDateString('zh-CN')}.xlsx`;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.dismiss(toastId);
      toast.success('导出成功');
      setIsExportModalOpen(false);
    } catch (error: any) {
      const { toast } = await import('sonner');
      if (toastId) toast.dismiss(toastId);
      toast.error(error.message || '导出失败');
    }
  };

  // 使用真实数据计算统计
  const totalRevenue = realPerformanceData?.totalRevenue || filteredSalesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalParticipants = realPerformanceData?.totalParticipants || filteredSalesData.reduce((sum, item) => sum + (item.completedCustomers * 8), 0);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 使用统一的Sidebar组件 */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentPath="/sales-tracking"
      />

      {/* 移动端透明遮罩层 - 点击关闭侧边栏 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-transparent z-20 lg:hidden"
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
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">销售业绩</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openExportModal}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? '总业绩' : user?.role === 'manager' ? '部门业绩' : '我的业绩'}</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">¥{totalRevenue.toLocaleString()}</h3>
                  <p className="text-xs text-gray-400 mt-1">本月累计</p>
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? '环比增长' : '完成率'}</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                    {user?.role === 'admin' 
                      ? `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}%`
                      : '78%'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{user?.role === 'admin' ? '较上月' : '较目标'}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
                  <TrendingUp size={24} />
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? '冠军部门' : user?.role === 'manager' ? '冠军员工' : '部门排名'}</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                    {user?.role === 'admin' 
                      ? topPerformers?.topDepartment || '销售一部'
                      : user?.role === 'manager' 
                        ? topPerformers?.topSalesperson || '暂无'
                        : '第2名/5人'}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {user?.role === 'admin' 
                      ? `贡献${topPerformers?.topDepartmentPercent || 0}%`
                      : user?.role === 'manager' 
                        ? `贡献${topPerformers?.topSalespersonPercent || 0}%`
                        : '销售一部'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Trophy size={24} />
                </div>
              </div>
            </motion.div>

            {/* 第4个卡片：参训人数 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{user?.role === 'salesperson' ? '参训客户' : '参训人数'}</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalParticipants}人</h3>
                  <p className="text-xs text-gray-400 mt-1">本月新增</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
                  <Award size={24} />
                </div>
              </div>
            </motion.div>
          </div>


          {/* 图表区域 - 仅保留两个图表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 销售业绩趋势 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">销售业绩趋势</h3>
                <select
                  className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  defaultValue="月度"
                >
                  <option value="周度">周度</option>
                  <option value="月度">月度</option>
                  <option value="季度">季度</option>
                </select>
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

            {/* 课程销售进度 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">课程销售进度</h3>
                <select
                  className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  defaultValue="本月"
                >
                  <option value="已结束">已结束</option>
                  <option value="本月">本月</option>
                  <option value="本季度">本季度</option>
                  <option value="本年度">本年度</option>
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courseDetails.slice(0, 5).map(course => ({
                    name: course.courseNameOnly || course.courseName,
                    revenue: course.revenue,
                    participants: course.totalParticipants
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                        color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="销售收入" />
                    <Bar dataKey="participants" fill="#10b981" name="参训人数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>


          {/* 数据表格区域 - 带Tab切换 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
            {/* Tab导航 */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('ranking')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === 'ranking'
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                  )}
                >
                  📊 业务员销售榜
                </button>
                <button
                  onClick={() => setActiveTab('detail')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === 'detail'
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                  )}
                >
                  📋 课程销售明细
                </button>
                <button
                  onClick={() => setActiveTab('department')}
                  className={cn(
                    "py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === 'department'
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300"
                  )}
                >
                  🏢 部门业绩明细
                </button>
              </nav>
            </div>

            {/* Tab内容区域 */}
            {activeTab === 'ranking' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 dark:text-white">业务员销售榜</h3>
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                    className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="全部">全部</option>
                    <option value="本月">本月</option>
                    <option value="上月">上月</option>
                    <option value="本季度">本季度</option>
                    <option value="本年">本年</option>
                  </select>
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
                      <td colSpan={6} className="px-6 py-12 text-center">
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
        )}

        {/* Tab 2: 课程销售明细 */}
        {activeTab === 'detail' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 dark:text-white">课程销售明细</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">时间范围:</label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="全部">全部</option>
                  <option value="本月">本月</option>
                  <option value="上月">上月</option>
                  <option value="本季度">本季度</option>
                  <option value="本年">本年</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    课程名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    开课日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    结束日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    培训地点
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    收费标准
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    参训人数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    总收入
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {courseDetails && courseDetails.length > 0 ? (
                  courseDetails.map((course: any, index: number) => {
                    // 使用组合键确保唯一性
                    const uniqueKey = course.id || `course-${index}`;
                    const isExpanded = expandedCourses.has(uniqueKey);
                    return (
                      <Fragment key={uniqueKey}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {course.courseNameOnly || course.courseName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {course.sessionDate ? new Date(course.sessionDate).toLocaleDateString('zh-CN') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {course.endDate ? new Date(course.endDate).toLocaleDateString('zh-CN') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {course.area || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col gap-1">
                              <span className="text-green-600 dark:text-green-400">
                                线上: ¥{course.onlinePrice?.toLocaleString() || 0}
                              </span>
                              <span className="text-blue-600 dark:text-blue-400">
                                线下: ¥{course.offlinePrice?.toLocaleString() || 0}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {course.totalParticipants}人
                            <span className="text-xs text-gray-400 ml-1">
                              (线上{course.onlineParticipants}/线下{course.offlineParticipants})
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ¥{course.revenue?.toLocaleString() || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn(
                              "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                              course.status === '已完成' 
                                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400"
                            )}>
                              {course.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => {
                                const uniqueKey = course.id || `course-${index}`;
                                const newExpanded = new Set(expandedCourses);
                                if (isExpanded) {
                                  newExpanded.delete(uniqueKey);
                                } else {
                                  newExpanded.add(uniqueKey);
                                }
                                setExpandedCourses(newExpanded);
                              }}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              {isExpanded ? '收起' : '展开'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                              <div className="text-sm">
                                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">业务员销售明细</h4>
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                  <thead>
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">业务员</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">销售人数</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">销售收入</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">占比</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {course.salespersonList && course.salespersonList.length > 0 ? (
                                      course.salespersonList.map((sp: any, index: number) => (
                                        <tr key={index}>
                                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{sp.name}</td>
                                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{sp.count}人</td>
                                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">¥{sp.revenue?.toLocaleString() || 0}</td>
                                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{sp.percentage}%</td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={4} className="px-4 py-2 text-center text-gray-500 dark:text-gray-400">暂无业务员数据</td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <p className="text-lg mb-2">📋 暂无课程数据</p>
                        <p className="text-sm">请确保已创建培训课程并添加参训人员</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: 部门业绩明细 */}
        {activeTab === 'department' && (
          <div>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 dark:text-white">部门业绩明细</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">时间范围:</label>
                <select
                  value={departmentTimeRange}
                  onChange={(e) => setDepartmentTimeRange(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="本月">本月</option>
                  <option value="本季度">本季度</option>
                  <option value="本年">本年</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      排名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      部门名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      业务员数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      销售额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      成交客户数
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      人均业绩
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {departmentData.length > 0 ? (
                    departmentData.map((dept: any, index: number) => {
                      const isExpanded = expandedDepartments.has(dept.department);
                      return (
                        <Fragment key={dept.department}>
                          <motion.tr 
                            whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 1)' }}
                            className="transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              <div className="flex items-center">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                                  {index + 1}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {dept.department}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {dept.salespersonCount} 人
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              ¥{dept.revenue.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {dept.completedCustomers}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              ¥{Math.round(dept.revenue / dept.salespersonCount).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedDepartments);
                                  if (isExpanded) {
                                    newExpanded.delete(dept.department);
                                  } else {
                                    newExpanded.add(dept.department);
                                  }
                                  setExpandedDepartments(newExpanded);
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors flex items-center gap-1 justify-end"
                              >
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                {isExpanded ? '收起' : '查看详情'}
                              </button>
                            </td>
                          </motion.tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                                <div className="text-sm">
                                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">业务员成交明细</h4>
                                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead>
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">业务员</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">销售额</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">成交客户</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">占比</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                      {dept.salespersons.map((person: any) => (
                                        <tr key={person.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                          <td className="px-4 py-3">
                                            <div className="flex items-center">
                                              <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                                                <img 
                                                  src={person.avatar} 
                                                  alt={person.name}
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                              <span className="text-gray-900 dark:text-white font-medium">
                                                {person.name}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-gray-900 dark:text-white font-semibold">
                                            ¥{person.revenue.toLocaleString()}
                                          </td>
                                          <td className="px-4 py-3 text-gray-900 dark:text-white">
                                            {person.completedCustomers}
                                          </td>
                                          <td className="px-4 py-3">
                                            <div className="flex items-center">
                                              <span className="text-gray-900 dark:text-white mr-2">
                                                {((person.revenue / dept.revenue) * 100).toFixed(1)}%
                                              </span>
                                              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-20">
                                                <div 
                                                  className="bg-blue-500 h-2 rounded-full"
                                                  style={{ width: `${(person.revenue / dept.revenue) * 100}%` }}
                                                ></div>
                                              </div>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <div className="text-6xl mb-4">📊</div>
                        <div className="text-lg font-medium mb-2">暂无部门业绩数据</div>
                        <div className="text-sm">当前时间范围内没有部门业绩数据</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-lg text-center border border-blue-200 dark:border-blue-700">
                      <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">销售额</p>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">¥{selectedSalesperson.revenue.toLocaleString()}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-6 rounded-lg text-center border border-green-200 dark:border-green-700">
                      <p className="text-sm text-green-600 dark:text-green-400 mb-2">成交次数</p>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">{selectedSalesperson.completedCustomers}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">（同一客户多次参训算多次）</p>
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
                  成交客户列表（按课程） ({selectedSalesperson.completedCustomers}次成交)
                </h4>
                <div className="space-y-3">
                  {selectedSalesperson.completedCustomerList && selectedSalesperson.completedCustomerList.length > 0 ? (
                    <>
                      {(() => {
                        // 按课程分组客户
                        const courseGroups = new Map<string, any[]>();
                        selectedSalesperson.completedCustomerList.forEach((customer: any) => {
                          const courseName = customer.courseName || '未知课程';
                          if (!courseGroups.has(courseName)) {
                            courseGroups.set(courseName, []);
                          }
                          courseGroups.get(courseName)!.push(customer);
                        });
                        
                        return Array.from(courseGroups.entries()).map(([courseName, customers]) => {
                          const isExpanded = expandedDetailCourses.has(courseName);
                          const totalRevenue = customers.reduce((sum, c) => sum + (c.amount || 0), 0);
                          const customerCount = customers.length;
                          
                          return (
                            <div key={courseName} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                              {/* 课程汇总行 */}
                              <div 
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => {
                                  const newExpanded = new Set(expandedDetailCourses);
                                  if (isExpanded) {
                                    newExpanded.delete(courseName);
                                  } else {
                                    newExpanded.add(courseName);
                                  }
                                  setExpandedDetailCourses(newExpanded);
                                }}
                              >
                                <div className="flex items-center flex-1">
                                  {isExpanded ? (
                                    <ChevronDown size={20} className="text-gray-500 dark:text-gray-400 mr-2" />
                                  ) : (
                                    <ChevronRight size={20} className="text-gray-500 dark:text-gray-400 mr-2" />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                      {courseName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {customerCount} 次成交
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                    ¥{totalRevenue.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              {/* 展开的客户列表 */}
                              {isExpanded && (
                                <div className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {customers.map((customer: any, index: number) => (
                                    <div key={`${customer.id}-${index}`} className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <UserCheck size={16} />
                                      </div>
                                      <div className="ml-3 flex-1">
                                        <div className="flex items-center justify-between">
                                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                                            {customer.name}
                                          </p>
                                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                            ¥{customer.amount?.toLocaleString() || 0}
                                          </span>
                                        </div>
                                        <div className="flex items-center mt-1">
                                          <span className="text-xs text-gray-500 dark:text-gray-400 mr-4">
                                            <i className="fas fa-phone mr-1"></i>
                                            {customer.phone || '未填写'}
                                          </span>
                                          <span className="text-xs text-gray-500 dark:text-gray-400">
                                            <i className="fas fa-calendar mr-1"></i>
                                            {customer.latestDate ? new Date(customer.latestDate).toLocaleDateString('zh-CN') : '-'}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 text-xs rounded-full">
                                          已成交
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </>
                  ) : (
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                      暂无成交记录
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


      {/* 导出报表模态框 */}
      {isExportModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={() => setIsExportModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">导出业绩报表</h2>
            
            {/* 导出类型选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">导出类型</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setExportType('salesperson')}
                  className={`py-2 px-4 rounded-lg border-2 transition-all ${
                    exportType === 'salesperson'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  按业务员导出
                </button>
                <button
                  onClick={() => setExportType('course')}
                  className={`py-2 px-4 rounded-lg border-2 transition-all ${
                    exportType === 'course'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  按课程导出
                </button>
              </div>
            </div>


            {/* 业务员业绩筛选 */}
            {exportType === 'salesperson' && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">业绩筛选条件</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      时间范围
                    </label>
                    <select
                      value={performanceFilters.timeRange}
                      onChange={(e) => setPerformanceFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="全部">全部时间</option>
                      <option value="本月">本月</option>
                      <option value="本季度">本季度</option>
                      <option value="本年度">本年度</option>
                      <option value="上月">上月</option>
                      <option value="上季度">上季度</option>
                      <option value="去年">去年</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      部门
                    </label>
                    {user?.role === 'manager' ? (
                      // 部门经理只能导出自己的部门
                      <input
                        type="text"
                        value={user.department || '未分配部门'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      />
                    ) : (
                      // 管理员可以选择部门
                      <select
                        value={performanceFilters.department}
                        onChange={(e) => setPerformanceFilters(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="全部">全部部门</option>
                        <option value="销售一部">销售一部</option>
                        <option value="销售二部">销售二部</option>
                        <option value="销售三部">销售三部</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      业务员
                    </label>
                    <select
                      value={performanceFilters.salesperson}
                      onChange={(e) => setPerformanceFilters(prev => ({ ...prev, salesperson: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="全部">全部业务员</option>
                      {filteredSalespersonsForExport.map(sp => (
                        <option key={sp.id} value={sp.name}>{sp.name}</option>
                      ))}
                    </select>
                    {performanceFilters.department !== '全部' && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        仅显示 {performanceFilters.department} 的业务员
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 课程销售业绩筛选 */}
            {exportType === 'course' && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">课程筛选条件</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      年份
                    </label>
                    <select
                      value={courseSalesFilters.year}
                      onChange={(e) => {
                        setCourseSalesFilters(prev => ({ ...prev, year: e.target.value, course: '全部' }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      {availableYears.length > 0 ? (
                        availableYears.map(year => (
                          <option key={year} value={year}>{year}年</option>
                        ))
                      ) : (
                        <option value={new Date().getFullYear().toString()}>{new Date().getFullYear()}年</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      月份
                    </label>
                    <select
                      value={courseSalesFilters.month}
                      onChange={(e) => {
                        setCourseSalesFilters(prev => ({ ...prev, month: e.target.value, course: '全部' }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">全年</option>
                      {[...Array(12)].map((_, i) => (
                        <option key={i+1} value={(i+1).toString()}>{i+1}月</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      课程
                    </label>
                    <select
                      value={courseSalesFilters.course}
                      onChange={(e) => setCourseSalesFilters(prev => ({ ...prev, course: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="全部">全部课程</option>
                      {filteredCoursesForExport.map(course => (
                        <option key={course.name} value={course.name}>
                          {course.name} ({course.sessions.length}场)
                        </option>
                      ))}
                    </select>
                    {filteredCoursesForExport.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        该时间段没有培训计划
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 按钮区域 */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExportReport}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center"
              >
                <Download size={16} className="mr-2" />
                确认导出
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}