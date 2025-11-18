import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { getRoleDefaultPermissions } from '@/constants/permissions';
import { getRoleDefaultMenuFeatures } from '@/constants/menuFeatures';
import type { UserRole } from '@/lib/supabase/types';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronDown, 
  Plus, 
  MapPin,
  Calendar,
  Briefcase,
  UserPlus,
  UserCheck,
  DollarSign,
  Upload,
  Download
} from 'lucide-react';
import { Empty } from '@/components/Empty';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/Notifications/NotificationBell';
import SalesPersonImportModal from '@/components/SalesPersonImportModal';
import supabaseService from '@/lib/supabase/supabaseService';
import { supabase } from '@/lib/supabase/client';
import type { Salesperson as BaseSalesperson } from '@/lib/supabase/types';

// 扩展 Salesperson 类型以包含绩效数据
interface Salesperson extends BaseSalesperson {
  performance: {
    revenue: number;
    completedSessions: number;
    conversionRate: number;
    customers: number;
  };
  joinDate?: string; // 映射 join_date
}

// 计算部门分布
const calculateDepartmentData = (salespersons: Salesperson[]) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const deptCounts: Record<string, number> = {};
  
  salespersons.forEach(s => {
    const dept = s.department || '未分配';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  
  return Object.entries(deptCounts).map(([name, value], index) => ({
    name,
    value,
    color: colors[index % colors.length]
  }));
};

// 计算团队分布
const calculateTeamData = (salespersons: Salesperson[]) => {
  const colors = ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];
  const teamCounts: Record<string, number> = {};
  
  salespersons.forEach(s => {
    const team = s.team || '未分配';
    teamCounts[team] = (teamCounts[team] || 0) + 1;
  });
  
  return Object.entries(teamCounts).map(([name, value], index) => ({
    name,
    value,
    color: colors[index % colors.length]
  }));
};

// 注意：已移除模拟数据，现在使用真实数据库数据



export default function SalesPersonManagement() {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [selectedTeam, setSelectedTeam] = useState('全部');
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [filteredSalespersons, setFilteredSalespersons] = useState<Salesperson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedSalesperson, setSelectedSalesperson] = useState<Salesperson | null>(null);
  const [salespersonCustomers, setSalespersonCustomers] = useState<any[]>([]);
  const [displayedCustomerCount, setDisplayedCustomerCount] = useState(10);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCustomerDetailModalOpen, setIsCustomerDetailModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // 添加业务员表单状态
  const [newSalespersonForm, setNewSalespersonForm] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    department: '',
    team: '',
    join_date: '',
    status: 'enabled' as 'enabled' | 'disabled', // 管理员创建的账号默认为 enabled
    work_status: 'active' as 'trial' | 'active' | 'vacation' | 'resigned', // 默认为在职
    role: 'salesperson' as UserRole  // 添加角色字段，默认为业务员
  });


  // 计算图表数据
  const departmentData = calculateDepartmentData(filteredSalespersons);
  const teamData = calculateTeamData(filteredSalespersons);
  
  // 计算业绩数据（取前5名）
  const performanceData = filteredSalespersons
    .sort((a, b) => b.performance.revenue - a.performance.revenue)
    .slice(0, 5)
    .map(s => ({
      name: s.name,
      revenue: s.performance.revenue / 1000, // 转换为千元
      customers: s.performance.customers
    }));

  // 初始化加载数据
  useEffect(() => {
    loadSalespersons();
  }, []);

  const loadSalespersons = async () => {
    try {
      setIsLoading(true);
      let baseSalespersons = await supabaseService.getSalespersons();
      console.log('📋 从数据库加载的业务员列表:', baseSalespersons);
      
      // 如果是部门经理，只显示本部门的业务员
      if (user?.role === 'manager') {
        const userProfile = await supabaseService.getUserProfile(user.id);
        const managerDepartmentId = userProfile?.department_id;
        
        if (managerDepartmentId) {
          baseSalespersons = baseSalespersons.filter(sp => sp.department_id === managerDepartmentId);
          console.log(`🏢 部门经理 ${user.name} 所在部门ID: ${managerDepartmentId}`);
          console.log(`📋 过滤后业务员数量: ${baseSalespersons.length}`);
        }
      }
      
      console.log('📋 业务员数量:', baseSalespersons.length);
      console.log('📋 业务员名字列表:', baseSalespersons.map(sp => sp.name));
      
      // 加载所有客户数据
      const allCustomers = await supabaseService.getCustomers();
      console.log('👥 客户总数:', allCustomers.length);
      
      // 加载所有参训记录用于计算销售额（按 customer_id → customers.salesperson_id 归属）
      // 若参训记录缺少 customer_id，再兜底使用姓名映射到ID
      const customerToSalespersonId = new Map<number, string>();
      (allCustomers || []).forEach((c: any) => {
        if (c?.id && c?.salesperson_id) customerToSalespersonId.set(c.id, c.salesperson_id);
      });

      const nameToSalespersonId = new Map<string, string>();
      (baseSalespersons || []).forEach((sp: any) => {
        if (sp?.name && sp?.id) nameToSalespersonId.set(sp.name, sp.id);
      });

      const revenueBySalespersonId = new Map<string, number>();
      try {
        const { data: allParticipants } = await supabase
          .from('training_participants')
          .select('customer_id, salesperson_name, actual_price, payment_amount');
        (allParticipants || []).forEach((p: any) => {
          const amount = (Number(p?.actual_price) || Number(p?.payment_amount) || 0);
          if (!amount) return;

          let ownerId: string | undefined;
          if (p?.customer_id && customerToSalespersonId.has(p.customer_id)) {
            ownerId = customerToSalespersonId.get(p.customer_id)!;
          } else if (p?.salesperson_name && nameToSalespersonId.has(p.salesperson_name)) {
            // 兜底：参训记录未关联客户时，才使用姓名映射
            ownerId = nameToSalespersonId.get(p.salesperson_name)!;
          }

          if (!ownerId) return;
          revenueBySalespersonId.set(ownerId, (revenueBySalespersonId.get(ownerId) || 0) + amount);
        });
      } catch (e) {
        console.warn('加载参训记录失败，销售额将显示为0:', e);
      }
      
      // 为每个业务员添加绩效数据（从数据库计算）
      const salespersonsWithPerformance: Salesperson[] = baseSalespersons.map(sp => {
        // 计算该业务员的客户数量 - 使用 id 匹配（现在 id 就是 UUID）
        const customerCount = allCustomers.filter(
          customer => customer.salesperson_id === sp.id || customer.salesperson_name === sp.name
        ).length;
        
        console.log(`业务员 ${sp.name} (ID: ${sp.id}) 的客户数量:`, customerCount);
        
        return {
          ...sp,
          joinDate: sp.join_date || undefined,
          performance: {
            revenue: revenueBySalespersonId.get(sp.id) || 0,
            completedSessions: 0,
            conversionRate: 0,
            customers: customerCount
          }
        };
      });
      
      setSalespersons(salespersonsWithPerformance);
      setFilteredSalespersons(salespersonsWithPerformance);
    } catch (error) {
      console.error('获取业务员数据失败', error);
      toast.error('获取数据失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 筛选和排序数据
  useEffect(() => {
    let result = [...salespersons];
    
    // 搜索筛选
    if (searchTerm) {
      result = result.filter(salesperson => 
        salesperson.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salesperson.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salesperson.team?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 部门筛选
    if (selectedDepartment !== '全部') {
      result = result.filter(salesperson => salesperson.department === selectedDepartment);
    }
    
    // 状态筛选
    if (selectedStatus !== '全部') {
      result = result.filter(salesperson => {
        if (selectedStatus === '待审核') {
          return salesperson.status === 'disabled' && salesperson.work_status === 'trial';
        } else if (selectedStatus === '在职') {
          return salesperson.status === 'enabled' && salesperson.work_status === 'active';
        } else if (selectedStatus === '试用期') {
          return salesperson.status === 'enabled' && salesperson.work_status === 'trial';
        } else if (selectedStatus === '离职') {
          return salesperson.status === 'disabled' && salesperson.work_status === 'resigned';
        }
        return true;
      });
    }
    
    // 团队筛选
    if (selectedTeam !== '全部') {
      result = result.filter(salesperson => salesperson.team === selectedTeam);
    }
    
    // 简单排序（按名称）
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Salesperson];
        const bValue = b[sortConfig.key as keyof Salesperson];
        
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredSalespersons(result);
  }, [searchTerm, selectedDepartment, selectedStatus, selectedTeam, sortConfig, salespersons]);

  // 处理排序
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 打开业务员详情
  const openSalespersonDetail = async (salesperson: Salesperson) => {
    setSelectedSalesperson(salesperson);
    setIsDetailModalOpen(true);
    setDisplayedCustomerCount(10); // 重置显示数量
    
    // 加载该业务员的客户数据
    try {
      const customers = await supabaseService.getCustomers();
      // 筛选出该业务员负责的客户
      const salespersonCustomers = customers.filter(
        customer => customer.salesperson_name === salesperson.name
      );
      setSalespersonCustomers(salespersonCustomers);
    } catch (error) {
      console.error('加载客户数据失败:', error);
      setSalespersonCustomers([]);
    }
  };

  // 打开客户详情
  const openCustomerDetail = (customer: any) => {
    setSelectedCustomer(customer);
    setIsCustomerDetailModalOpen(true);
  };

  // 显示更多客户
  const showMoreCustomers = () => {
    setDisplayedCustomerCount(prev => prev + 10);
  };

  // 审核通过业务员
  const handleApproveSalesperson = async (salesperson: Salesperson) => {
    try {
      await supabaseService.approveSalesperson(salesperson.id, salesperson.id);
      toast.success(`已通过 ${salesperson.name} 的注册申请`);
      // 重新加载业务员列表
      loadSalespersons();
    } catch (error: any) {
      console.error('审核通过失败:', error);
      toast.error('审核失败：' + error.message);
    }
  };

  // 拒绝业务员
  const handleRejectSalesperson = async (salesperson: Salesperson) => {
    if (!confirm(`确定要拒绝 ${salesperson.name} 的注册申请吗？`)) {
      return;
    }

    try {
      await supabaseService.rejectSalesperson(salesperson.id, salesperson.id);
      toast.success(`已拒绝 ${salesperson.name} 的注册申请`);
      // 重新加载业务员列表
      loadSalespersons();
    } catch (error: any) {
      console.error('拒绝审核失败:', error);
      toast.error('操作失败：' + error.message);
    }
  };

  // 处理导入业务员
  const handleImportSalespersons = async (data: any[]) => {
    try {
      const dataManagementService = (await import('@/lib/services/dataManagementService')).default;
      
      const toastId = toast.loading('正在导入业务员...');
      
      const result = await dataManagementService.importData('salespersons', data, 'skip');
      
      toast.dismiss(toastId);
      
      if (result.success > 0) {
        toast.success(`成功导入 ${result.success} 位业务员`);
        loadSalespersons(); // 刷新列表
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} 位业务员导入失败`);
      }
    } catch (error: any) {
      toast.error(error.message || '导入失败');
    }
  };

  // 处理导出业务员
  const handleExportSalespersons = async () => {
    const toastId = toast.loading('正在导出...');
    
    try {
      // 只导出业务员角色的用户
      const salespersonData = filteredSalespersons.filter(
        (person) => person.role === 'salesperson' || !person.role // 兼容旧数据
      );
      
      // 格式化导出数据
      const exportData = salespersonData.map(person => ({
        姓名: person.name,
        职位: person.position || '销售顾问',
        部门: person.department || '',
        手机号: person.phone || '',
        邮箱: person.email || '',
        团队: person.team || '',
        入职日期: person.join_date || '',
        状态: person.status === 'enabled' ? '在职' : '离职',
        工作状态: person.work_status === 'trial' ? '试用期' : 
                   person.work_status === 'resigned' ? '离职' : '正式'
      }));
      
      // 导出文件
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '业务员信息');
      XLSX.writeFile(wb, `业务员信息_${new Date().toLocaleDateString('zh-CN')}.xlsx`);
      
      toast.dismiss(toastId);
      toast.success(`成功导出 ${exportData.length} 条业务员数据`);
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || '导出失败');
    }
  };

  // 打开添加业务员模态框
  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  // 编辑业务员信息
  const [isEditSalespersonModalOpen, setIsEditSalespersonModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const handleEditSalesperson = (salesperson: Salesperson) => {
    setSelectedSalesperson(salesperson);
    setIsEditSalespersonModalOpen(true);
  };
  
  // 职位到角色的映射
  const positionToRole: Record<string, UserRole> = {
    '部门经理': 'manager',
    '销售顾问': 'salesperson',
    '销售专员': 'salesperson',
    '业务员': 'salesperson',
    '专家': 'expert',
    '培训师': 'expert',
    '讲师': 'expert',
    '会务客服': 'conference_service',
  };

  // 获取职位对应的角色
  const getRoleFromPosition = (position: string): UserRole | null => {
    return positionToRole[position] || null;
  };

  const saveSalespersonEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedSalesperson) return;
    
    const formData = new FormData(e.currentTarget);
    
    // 获取表单数据并处理空值
    const name = formData.get('name') as string;
    const position = formData.get('position') as string;
    const phone = formData.get('phone') as string;
    const email = formData.get('email') as string;
    const department = formData.get('department') as string;
    const team = formData.get('team') as string;
    const joinDate = formData.get('joinDate') as string;
    const status = formData.get('status') as 'enabled' | 'disabled';
    const workStatus = formData.get('work_status') as 'trial' | 'active' | 'vacation' | 'resigned';
    
    // 检查职位是否变更并获取新角色
    const newRole = getRoleFromPosition(position);
    const currentRole = selectedSalesperson.role || 'salesperson';
    const roleChanged = newRole && newRole !== currentRole;
    
    // 构建更新对象
    const updates: any = {
      name: name,
      position: position || null,
      phone: phone,
      email: email || null,
      department: department || null,
      team: team || null,
      join_date: joinDate || null,
      status: status,
      work_status: workStatus,
    };
    
    // 如果角色变更，添加role字段
    if (roleChanged && newRole) {
      updates.role = newRole;
    }
    
    console.log('=== 开始保存业务员信息 ===');
    console.log('更新数据:', updates);
    console.log('角色变更:', roleChanged, '新角色:', newRole);
    
    try {
      // 更新用户基本信息
      await supabaseService.updateSalesperson(selectedSalesperson.id, updates);
      
      // 如果角色变更，更新权限和菜单访问
      if (roleChanged && newRole) {
        console.log('检测到角色变更，正在更新权限...');
        
        // 获取新角色的默认权限和菜单
        const defaultPermissions = getRoleDefaultPermissions(newRole);
        const defaultMenuFeatures = getRoleDefaultMenuFeatures(newRole);
        
        console.log('新角色默认权限:', defaultPermissions);
        console.log('新角色默认菜单:', defaultMenuFeatures);
        
        // 更新权限
        await supabaseService.updateUserPermissions(selectedSalesperson.id, defaultPermissions);
        
        // 更新菜单访问
        await supabaseService.updateUserMenuAccess(selectedSalesperson.id, defaultMenuFeatures);
        
        toast.success(`已将 ${name} 提拔为${position}，并更新相应权限`);
      } else {
        toast.success('业务员信息已更新');
      }
      
      setIsEditSalespersonModalOpen(false);
      // 重新加载数据
      await loadSalespersons();
      console.log('=== 保存成功 ===');
    } catch (error: any) {
      console.error('保存失败:', error);
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      toast.error(error.message || '保存失败，请重试');
    }
  };

  // 删除业务员（带关联数据提示）
  const handleDelete = async (id: string) => {
    try {
      // 找到要删除的业务员
      const salesperson = salespersons.find(s => s.id === id);
      if (!salesperson) {
        toast.error('未找到该业务员');
        return;
      }
      
      // 1. 查询关联的客户数量（customers.salesperson_id 是 UUID，关联到 user_profiles.id）
      const customers = await supabaseService.getCustomers();
      const relatedCustomers = customers.filter(c => c.salesperson_id === id);
      
      // 2. 查询关联的培训场次数量（使用驼峰命名）
      const sessions = await supabaseService.getTrainingSessions();
      const relatedSessions = sessions.filter(s => s.salespersonId === id);
      
      // 3. 构建确认消息
      let message = `确定要删除业务员「${salesperson.name}」吗？\n\n`;
      
      if (relatedCustomers.length > 0 || relatedSessions.length > 0) {
        message += `该业务员有以下关联数据：\n`;
        if (relatedCustomers.length > 0) {
          message += `• ${relatedCustomers.length} 个客户\n`;
        }
        if (relatedSessions.length > 0) {
          message += `• ${relatedSessions.length} 个培训场次\n`;
        }
        message += `\n删除后，这些记录的负责人将被清空。\n`;
        message += `建议先重新分配客户和培训场次。\n\n`;
        message += `仍要继续删除吗？`;
      }
      
      // 4. 显示确认对话框
      if (window.confirm(message)) {
        await supabaseService.deleteSalesperson(id);
        
        // 5. 显示删除结果
        if (relatedCustomers.length > 0 || relatedSessions.length > 0) {
          toast.success(
            `业务员已删除。${relatedCustomers.length} 个客户和 ${relatedSessions.length} 个培训场次的负责人已清空。`,
            { duration: 5000 }
          );
        } else {
          toast.success('业务员已删除');
        }
        
        loadSalespersons();
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  // 部门列表
  const departments = ['全部', ...Array.from(new Set(salespersons.map(s => s.department).filter((d): d is string => Boolean(d))))];
  
  // 团队列表
  const teams = ['全部', ...Array.from(new Set(salespersons.map(s => s.team).filter((t): t is string => Boolean(t))))];

  // 为筛选器显示修正文本
  const getDepartmentDisplayText = (dept: string) => dept === '全部' ? '筛选部门' : dept;
  const getTeamDisplayText = (team: string) => team === '全部' ? '筛选团队' : team;

  // 计算统计数据
  const totalSalespersons = filteredSalespersons.length;
  const activeSalespersons = filteredSalespersons.filter(salesperson => salesperson.status === 'enabled' && salesperson.work_status === 'active').length;
  const totalRevenue = filteredSalespersons.reduce((sum, salesperson) => sum + salesperson.performance.revenue, 0);
  const totalCustomers = filteredSalespersons.reduce((sum, salesperson) => sum + salesperson.performance.customers, 0);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 使用统一的Sidebar组件 */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentPath="/salesperson-management"
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
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">员工管理</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              
              {/* 导入业务员 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsImportModalOpen(true)}
                className="px-2 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm flex items-center"
                title="批量导入业务员"
              >
                <Upload size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">导入</span>
              </motion.button>
              
              {/* 导出业务员 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportSalespersons}
                className="px-2 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm flex items-center"
                title="导出业务员数据"
              >
                <Download size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">导出</span>
              </motion.button>
              
              {/* 添加业务员 */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openAddModal}
                className="px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center text-sm sm:text-base"
              >
                <Plus size={16} className="sm:mr-2" />
                <span className="ml-1 sm:ml-0">添加<span className="hidden sm:inline">员工</span></span>
              </motion.button>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">业务员总数</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalSalespersons}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">在职业务员</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{activeSalespersons}</h3>
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">总销售额</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">¥{totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">客户总数</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalCustomers}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                  <UserPlus size={24} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white">部门分布</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}人`}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                        }}
                        formatter={(value) => [`${value}人`, '业务员数量']}
                      />
                    </PieChart>
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
                  <h3 className="font-semibold text-gray-800 dark:text-white">团队分布</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={teamData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}人`}
                      >
                        {teamData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                        }}
                        formatter={(value) => [`${value}人`, '业务员数量']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">销售业绩对比</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
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
                    <Bar dataKey="revenue" fill="#3b82f6" name="销售额" />
                    <Bar dataKey="customers" fill="#10b981" name="客户数" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* 筛选和搜索区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索业务员姓名、部门或团队..."
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
                    <option key={dept} value={dept}>{getDepartmentDisplayText(dept)}</option>
                  ))}
                </select>
                
                {/* 团队筛选 */}
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  {teams.map(team => (
                    <option key={team} value={team}>{getTeamDisplayText(team)}</option>
                  ))}
                </select>
                
                {/* 状态筛选 */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="全部">筛选状态</option>
                  <option value="待审核">待审核</option>
                  <option value="在职">在职</option>
                  <option value="试用期">试用期</option>
                  <option value="离职">离职</option>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">最低客户数</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
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

          {/* 业务员列表 */}
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
            </div>
          ) : filteredSalespersons.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center">
                          姓名
                          {sortConfig?.key === 'name' && (
                            <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleSort('department')}
                      >
                        <div className="flex items-center">
                          部门
                          {sortConfig?.key === 'department' && (
                            <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        职位
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleSort('performance.revenue')}
                      >
                        <div className="flex items-center">
                          销售额
                          {sortConfig?.key === 'performance.revenue' && (
                            <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleSort('performance.customers')}
                      >
                        <div className="flex items-center">
                          客户数
                          {sortConfig?.key === 'performance.customers' && (
                            <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleSort('joinDate')}
                      >
                        <div className="flex items-center">
                          入职日期
                          {sortConfig?.key === 'joinDate' && (
                            <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                          )}
                        </div>
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
                    {filteredSalespersons.map((salesperson) => (
                      <motion.tr 
                        key={salesperson.id}
                        whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 1)' }}
                        className="transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={salesperson.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                alt={salesperson.name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-white">{salesperson.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {salesperson.department}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {salesperson.position}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-white">
                          ¥{salesperson.performance.revenue.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {salesperson.performance.customers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {salesperson.joinDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {/* 工作状态 */}
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              salesperson.work_status === 'trial'
                                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                                : salesperson.work_status === 'active'
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                : salesperson.work_status === 'vacation'
                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                                : salesperson.work_status === 'resigned'
                                ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300'
                                : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                            }`}>
                              {salesperson.work_status === 'trial' ? '试用期' : salesperson.work_status === 'active' ? '在职' : salesperson.work_status === 'vacation' ? '休假' : salesperson.work_status === 'resigned' ? '离职' : '在职'}
                            </span>
                            {/* 账号状态 */}
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              salesperson.status === 'enabled'
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                            }`}>
                              {salesperson.status === 'enabled' ? '已启用' : '已禁用'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {salesperson.status === 'disabled' && salesperson.work_status === 'trial' ? (
                            <>
                              <button 
                                onClick={() => handleApproveSalesperson(salesperson)}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3"
                              >
                                通过
                              </button>
                              <button 
                                onClick={() => handleRejectSalesperson(salesperson)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 mr-3"
                              >
                                拒绝
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => openSalespersonDetail(salesperson)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                              >
                                详情
                              </button>
                              <button 
                               className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3"
                               onClick={() => handleEditSalesperson(salesperson)}
                               >
                                 编辑
                               </button>
                              <button 
                                onClick={() => handleDelete(salesperson.id)}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              >
                                删除
                              </button>
                            </>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 分页控件 */}
              <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6 flex items-center justify-between">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    显示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredSalespersons.length}</span> 条，共 <span className="font-medium">{filteredSalespersons.length}</span> 条结果
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
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
              <Empty />
            </div>
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">员工详情</h2>
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
                    src={selectedSalesperson.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                    alt={selectedSalesperson.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{selectedSalesperson.name}</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">{selectedSalesperson.position}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <Briefcase size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedSalesperson.department}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedSalesperson.team}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-phone text-gray-400 mr-2"></i>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedSalesperson.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-envelope text-gray-400 mr-2"></i>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedSalesperson.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">入职日期: {selectedSalesperson.joinDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* 工作状态 */}
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedSalesperson.work_status === 'trial'
                          ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                          : selectedSalesperson.work_status === 'active'
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                          : selectedSalesperson.work_status === 'vacation'
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                          : selectedSalesperson.work_status === 'resigned'
                          ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300'
                          : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                      }`}>
                        {selectedSalesperson.work_status === 'trial' ? '试用期' : selectedSalesperson.work_status === 'active' ? '在职' : selectedSalesperson.work_status === 'vacation' ? '休假' : selectedSalesperson.work_status === 'resigned' ? '离职' : '在职'}
                      </span>
                      {/* 账号状态 */}
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedSalesperson.status === 'enabled'
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                      }`}>
                        {selectedSalesperson.status === 'enabled' ? '已启用' : '已禁用'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">业绩统计</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">总销售额</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">¥{selectedSalesperson.performance.revenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">完成培训场次</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{selectedSalesperson.performance.completedSessions}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">客户总数</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-white">{selectedSalesperson.performance.customers}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">最近业绩趋势</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { month: '1月', revenue: Math.round(selectedSalesperson.performance.revenue * 0.8) },
                      { month: '2月', revenue: Math.round(selectedSalesperson.performance.revenue * 0.9) },
                      { month: '3月', revenue: selectedSalesperson.performance.revenue },{ month: '4月', revenue: Math.round(selectedSalesperson.performance.revenue * 1.1) },
                      { month: '5月', revenue: Math.round(selectedSalesperson.performance.revenue * 1.2) },
                      { month: '6月', revenue: Math.round(selectedSalesperson.performance.revenue * 1.3) }
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
                  负责客户 ({salespersonCustomers.length})
                </h4>
                <div className="space-y-3">
                  {salespersonCustomers.length > 0 ? (
                    <>
                      {salespersonCustomers.slice(0, displayedCustomerCount).map((customer) => (
                        <div 
                          key={customer.id} 
                          className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                          onClick={() => openCustomerDetail(customer)}
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Users size={16} />
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {customer.name}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="mr-4">
                                {customer.company}
                              </span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                customer.status === '已成交' 
                                  ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                  : customer.status === '跟进中'
                                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                                  : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                              }`}>
                                {customer.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {salespersonCustomers.length > displayedCustomerCount && (
                        <button 
                          onClick={showMoreCustomers}
                          className="w-full py-2 text-center text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                          显示更多 (还有 {salespersonCustomers.length - displayedCustomerCount} 个客户)
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Users size={48} className="mx-auto mb-2 opacity-50" />
                      <p>暂无负责客户</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors mr-2"
                >
                  关闭
                </button>
                     <button
                       className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                       onClick={() => handleEditSalesperson(selectedSalesperson)}
                     >
                       编辑信息
                     </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 添加业务员模态框 */}
      {isAddModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsAddModalOpen(false)}
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">添加员工</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">姓名 *</label>
                    <input
                      type="text"
                      value={newSalespersonForm.name}
                      onChange={(e) => setNewSalespersonForm({ ...newSalespersonForm, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入姓名"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">职位/角色 *</label>
                    <select
                      value={newSalespersonForm.position}
                      onChange={(e) => {
                        const positionSelect = e.target;
                        const role = getRoleFromPosition(positionSelect.value);
                        if (role) {
                          setNewSalespersonForm({ ...newSalespersonForm, position: positionSelect.value, role });
                        } else {
                          setNewSalespersonForm({ ...newSalespersonForm, position: positionSelect.value });
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="管理员">管理员</option>
                      <option value="部门经理">部门经理</option>
                      <option value="业务员">业务员</option>
                      <option value="会务客服">会务客服</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      💡 提示：更改职位将自动授予对应角色的权限。专家请在"专家管理"中添加。
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">手机号码 *</label>
                    <input
                      type="tel"
                      value={newSalespersonForm.phone}
                      onChange={(e) => setNewSalespersonForm({ ...newSalespersonForm, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入手机号码"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">电子邮箱</label>
                    <input
                      type="email"
                      value={newSalespersonForm.email}
                      onChange={(e) => setNewSalespersonForm({ ...newSalespersonForm, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入电子邮箱"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">部门</label>
                    <select
                      value={newSalespersonForm.department}
                      onChange={(e) => setNewSalespersonForm({ ...newSalespersonForm, department: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">请选择部门</option>
                      <option value="销售一部">销售一部</option>
                      <option value="销售二部">销售二部</option>
                      <option value="销售三部">销售三部</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">团队</label>
                    <select
                      value={newSalespersonForm.team}
                      onChange={(e) => setNewSalespersonForm({ ...newSalespersonForm, team: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">请选择团队</option>
                      <option value="北京团队">北京团队</option>
                      <option value="上海团队">上海团队</option>
                      <option value="广州团队">广州团队</option>
                      <option value="深圳团队">深圳团队</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">入职日期</label>
                    <input
                      type="date"
                      value={newSalespersonForm.join_date}
                      onChange={(e) => setNewSalespersonForm({ ...newSalespersonForm, join_date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">账号状态</label>
                    <select
                      value={newSalespersonForm.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as 'enabled' | 'disabled';
                        // 根据账号状态自动调整工作状态
                        let newWorkStatus = newSalespersonForm.work_status;
                        if (newStatus === 'disabled') {
                          // 禁用账号时，工作状态只能是离职
                          newWorkStatus = 'resigned';
                        } else if (newStatus === 'enabled' && newWorkStatus === 'resigned') {
                          // 启用账号时，如果当前是离职状态，改为在职
                          newWorkStatus = 'active';
                        }
                        setNewSalespersonForm({ ...newSalespersonForm, status: newStatus, work_status: newWorkStatus });
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="enabled">启用</option>
                      <option value="disabled">禁用</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">工作状态</label>
                    <select
                      value={newSalespersonForm.work_status}
                      onChange={(e) => {
                        const newWorkStatus = e.target.value as 'trial' | 'active' | 'vacation' | 'resigned';
                        // 根据工作状态自动调整账号状态
                        let newStatus = newSalespersonForm.status;
                        if (newWorkStatus === 'resigned') {
                          // 离职时，账号必须禁用
                          newStatus = 'disabled';
                        } else if (['trial', 'active', 'vacation'].includes(newWorkStatus)) {
                          // 试用期、在职、休假时，账号必须启用
                          newStatus = 'enabled';
                        }
                        setNewSalespersonForm({ ...newSalespersonForm, work_status: newWorkStatus, status: newStatus });
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="trial">试用期</option>
                      <option value="active">在职</option>
                      <option value="vacation">休假</option>
                      <option value="resigned">离职</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors mr-2"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    onClick={async (e) => {
                      e.preventDefault();
                      
                      // 验证必填字段
                      if (!newSalespersonForm.name || !newSalespersonForm.email || !newSalespersonForm.phone) {
                        toast.error('请填写姓名、邮箱和手机号');
                        return;
                      }
                      
                      // 验证邮箱格式
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSalespersonForm.email)) {
                        toast.error('邮箱格式不正确');
                        return;
                      }
                      
                      // 验证手机号格式
                      if (!/^1[3-9]\d{9}$/.test(newSalespersonForm.phone)) {
                        toast.error('手机号格式不正确');
                        return;
                      }
                      
                      try {
                        console.log('🔍 管理员创建业务员，状态:', newSalespersonForm.status);
                        
                        // 调用 addSalesperson 方法
                        await supabaseService.addSalesperson({
                          name: newSalespersonForm.name,
                          email: newSalespersonForm.email,
                          phone: newSalespersonForm.phone || null,
                          position: newSalespersonForm.position || null,
                          department: newSalespersonForm.department || null,
                          team: newSalespersonForm.team || null,
                          join_date: newSalespersonForm.join_date || null,
                          status: newSalespersonForm.status,
                          work_status: newSalespersonForm.work_status,
                          avatar: null,
                          username: newSalespersonForm.email, // 使用邮箱作为用户名
                          role: newSalespersonForm.role || 'salesperson',
                          updated_at: new Date().toISOString()
                        });
                        
                        toast.success('业务员添加成功');
                        setIsAddModalOpen(false);
                        
                        // 重置表单
                        setNewSalespersonForm({
                          name: '',
                          position: '',
                          phone: '',
                          email: '',
                          department: '',
                          team: '',
                          join_date: '',
                          status: 'enabled',
                          work_status: 'active',
                          role: 'salesperson'
                        });
                        
                        // 重新加载数据
                        await loadSalespersons();
                      } catch (error: any) {
                        console.error('添加业务员失败:', error);
                        toast.error(error.message || '添加失败，请重试');
                      }
                    }}
                  >
                    添加业务员
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}

       {/* 编辑业务员信息模态框 */}
       {isEditSalespersonModalOpen && selectedSalesperson && (
         <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
           onClick={() => setIsEditSalespersonModalOpen(false)}
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
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white">编辑员工信息</h2>
                 <button
                   onClick={() => setIsEditSalespersonModalOpen(false)}
                   className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                 >
                   <i className="fas fa-times text-xl"></i>
                 </button>
               </div>

               <form className="space-y-4" onSubmit={saveSalespersonEdit}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">姓名 *</label>
                     <input
                       type="text"
                       name="name"
                       defaultValue={selectedSalesperson.name || ''}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     />
                   </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">职位/角色 *</label>
                    <select
                      name="position"
                      defaultValue={selectedSalesperson.position || '业务员'}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="管理员">管理员</option>
                      <option value="部门经理">部门经理</option>
                      <option value="业务员">业务员</option>
                      <option value="会务客服">会务客服</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      💡 提示：更改职位将自动授予对应角色的权限。专家请在"专家管理"中编辑。
                    </p>
                  </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">手机号码 *</label>
                     <input
                       type="tel"
                       name="phone"
                       defaultValue={selectedSalesperson.phone || ''}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">电子邮箱</label>
                     <input
                       type="email"
                       name="email"
                       defaultValue={selectedSalesperson.email || ''}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">部门</label>
                     <input
                       type="text"
                       name="department"
                       defaultValue={selectedSalesperson.department || ''}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">团队</label>
                     <input
                       type="text"
                       name="team"
                       defaultValue={selectedSalesperson.team || ''}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">入职日期</label>
                     <input
                       type="date"
                       name="joinDate"
                       defaultValue={selectedSalesperson.joinDate || ''}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">账号状态</label>
                     <select
                       id="edit-status"
                       name="status"
                       defaultValue={selectedSalesperson.status || 'enabled'}
                       onChange={(e) => {
                         const statusSelect = e.target;
                         const workStatusSelect = document.getElementById('edit-work-status') as HTMLSelectElement;
                         if (workStatusSelect) {
                           if (statusSelect.value === 'disabled') {
                             // 禁用账号时，工作状态只能是离职
                             workStatusSelect.value = 'resigned';
                           } else if (statusSelect.value === 'enabled' && workStatusSelect.value === 'resigned') {
                             // 启用账号时，如果当前是离职状态，改为在职
                             workStatusSelect.value = 'active';
                           }
                         }
                       }}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     >
                       <option value="enabled">启用</option>
                       <option value="disabled">禁用</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">工作状态</label>
                     <select
                       id="edit-work-status"
                       name="work_status"
                       defaultValue={selectedSalesperson.work_status || 'active'}
                       onChange={(e) => {
                         const workStatusSelect = e.target;
                         const statusSelect = document.getElementById('edit-status') as HTMLSelectElement;
                         if (statusSelect) {
                           if (workStatusSelect.value === 'resigned') {
                             // 离职时，账号必须禁用
                             statusSelect.value = 'disabled';
                           } else if (['trial', 'active', 'vacation'].includes(workStatusSelect.value)) {
                             // 试用期、在职、休假时，账号必须启用
                             statusSelect.value = 'enabled';
                           }
                         }
                       }}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     >
                       <option value="trial">试用期</option>
                       <option value="active">在职</option>
                       <option value="vacation">休假</option>
                       <option value="resigned">离职</option>
                     </select>
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注信息</label>
                   <textarea
                     className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
                     placeholder="请输入备注信息"
                   ></textarea>
                 </div>

                 <div className="mt-6 flex justify-end">
                   <button
                     type="button"
                     onClick={() => setIsEditSalespersonModalOpen(false)}
                     className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors mr-2"
                   >
                     取消
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                   >
                     保存修改
                   </button>
                 </div>
               </form>
             </div>
           </motion.div>
         </motion.div>
       )}

      {/* 客户详情模态框 */}
      {isCustomerDetailModalOpen && selectedCustomer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsCustomerDetailModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">客户详情</h2>
                <button
                  onClick={() => setIsCustomerDetailModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">客户姓名</label>
                    <p className="text-base font-medium text-gray-800 dark:text-white">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">公司名称</label>
                    <p className="text-base font-medium text-gray-800 dark:text-white">{selectedCustomer.company}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">联系电话</label>
                    <p className="text-base font-medium text-gray-800 dark:text-white">{selectedCustomer.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">邮箱</label>
                    <p className="text-base font-medium text-gray-800 dark:text-white">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">所在地区</label>
                    <p className="text-base font-medium text-gray-800 dark:text-white">{selectedCustomer.location}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">客户状态</label>
                    <p className="text-base font-medium text-gray-800 dark:text-white">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedCustomer.status === '已成交' 
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                          : selectedCustomer.status === '跟进中'
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                      }`}>
                        {selectedCustomer.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">负责业务员</label>
                    <p className="text-base font-medium text-gray-800 dark:text-white">{selectedCustomer.salesperson_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400">最后联系时间</label>
                    <p className="text-base font-medium text-gray-800 dark:text-white">
                      {selectedCustomer.last_contact ? selectedCustomer.last_contact.split('T')[0] : ''}
                    </p>
                  </div>
                </div>

                {selectedCustomer.tags && selectedCustomer.tags.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">标签</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCustomer.tags.map((tag: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-sm rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsCustomerDetailModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 导入业务员模态框 */}
      <SalesPersonImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportSalespersons}
      />
    </div>
  );
}