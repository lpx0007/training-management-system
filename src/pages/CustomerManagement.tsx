import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Users,
  Calendar,
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Clock,
  DollarSign,
  UserPlus,
  UserCircle
} from 'lucide-react';
import { Empty } from '@/components/Empty';
import Sidebar from '@/components/Sidebar';
import { toast } from 'sonner';
import { generateDefaultAvatar } from '@/utils/imageUtils';

import supabaseService from '@/lib/supabase/supabaseService';
import type { Customer, CustomerFrontend } from '@/lib/supabase/types';

export default function CustomerManagement() {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [selectedArea, setSelectedArea] = useState('全部');
  const [selectedFollowUpStatus, setSelectedFollowUpStatus] = useState('全部');
  const [selectedSalesperson, setSelectedSalesperson] = useState('全部');
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerFrontend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerFrontend | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState<Partial<CustomerFrontend>>({});
  const [newCustomerData, setNewCustomerData] = useState<Partial<CustomerFrontend>>({
    name: '',
    phone: '',
    email: '',
    company: '',
    position: '',
    location: '',
    status: '潜在客户',
    tags: [],
    avatar: null
  });

  // 业务员列表
  const [salespersons, setSalespersons] = useState<Array<{ id: string; name: string }>>([]);

  // 图表数据
  let customerStatusData: Array<{ name: string; value: number; color: string }> = [];
  let customerAreaData: Array<{ name: string; value: number }> = [];
  let customerIndustryData: Array<{ name: string; value: number }> = [];
  // 所有客户数据
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  // 转换数据库客户数据为前端格式
  const convertToFrontend = (customer: Customer): CustomerFrontend => ({
    ...customer,
    salesperson: customer.salesperson_name || '',
    followUpStatus: customer.follow_up_status || '',
    lastContact: customer.last_contact || '',
    createdAt: customer.created_at,
    trainingHistory: []
  });

  // 加载业务员列表
  useEffect(() => {
    const fetchSalespersons = async () => {
      try {
        // 获取所有业务员（现在直接从 user_profiles 获取，id 就是 UUID）
        const salespersonsList = await supabaseService.getSalespersons();
        
        // 直接使用 id 和 name
        const validSalespersons = salespersonsList.map(sp => ({
          id: sp.id,
          name: sp.name
        }));
        
        // 确保列表中包含所有客户的业务员（即使他们不在标准业务员列表中）
        const allCustomerSalespersons = allCustomers
          .filter(c => c.salesperson_id && c.salesperson_name)
          .map(c => ({ id: c.salesperson_id!, name: c.salesperson_name! }));
        
        // 合并并去重
        const allSalespersonsMap = new Map<string, string>();
        [...validSalespersons, ...allCustomerSalespersons].forEach(sp => {
          if (sp && sp.id && sp.name) {
            allSalespersonsMap.set(sp.id, sp.name);
          }
        });
        
        const mergedSalespersons = Array.from(allSalespersonsMap.entries()).map(([id, name]) => ({ id, name }));
        console.log('业务员列表加载完成:', mergedSalespersons);
        setSalespersons(mergedSalespersons);
      } catch (error) {
        console.error('获取业务员列表失败', error);
      }
    };

    if (user?.role === 'admin') {
      fetchSalespersons();
    }
  }, [user, allCustomers]);

  // 初始化加载客户数据
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        // 从 Supabase 获取所有客户数据
        const customers = await supabaseService.getCustomers();
        console.log('原始客户数据数量:', customers.length);
        setAllCustomers(customers);
      } catch (error) {
        console.error('获取客户数据失败', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [user]);

  // 应用筛选条件
  useEffect(() => {
    let filtered = [...allCustomers];

    // 根据用户角色进行数据过滤
    if (user?.role === 'salesperson') {
      // 业务员只能查看自己的客户
      filtered = filtered.filter(customer => customer.salesperson_id === user.id);
    }

    // 应用搜索筛选
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    // 应用状态筛选
    if (selectedStatus !== '全部') {
      filtered = filtered.filter(customer => customer.status === selectedStatus);
    }

    // 应用区域筛选
    if (selectedArea !== '全部') {
      filtered = filtered.filter(customer => customer.location === selectedArea);
    }

    // 应用跟进状态筛选
    if (selectedFollowUpStatus !== '全部') {
      filtered = filtered.filter(customer => customer.follow_up_status === selectedFollowUpStatus);
    }

    // 应用业务员筛选
    if (selectedSalesperson !== '全部') {
      if (selectedSalesperson === '未分配') {
        filtered = filtered.filter(customer => !customer.salesperson_id);
      } else {
        filtered = filtered.filter(customer => customer.salesperson_id === selectedSalesperson);
      }
    }

    // 应用排序
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];
        if (aValue == null && bValue == null) return 0;
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

    // 转换为前端格式并更新客户列表
    const frontendFiltered = filtered.map(convertToFrontend);
    setFilteredCustomers(frontendFiltered);
  }, [allCustomers, user, searchTerm, selectedStatus, selectedArea, selectedFollowUpStatus, selectedSalesperson, sortConfig]);

  // 处理排序
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 打开客户详情
  const openCustomerDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  // 打开编辑客户模态框
  const openEditModal = (customer: Customer) => {
    console.log('打开编辑模态框 - 客户信息:', {
      name: customer.name,
      salesperson_id: customer.salesperson_id,
      salesperson_name: customer.salesperson_name
    });
    console.log('当前业务员列表:', salespersons);
    setSelectedCustomer(customer);
    setEditCustomerData({ ...customer });
    setIsEditModalOpen(true);
  };

  // 打开添加客户模态框
  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  // 处理编辑客户信息
  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedCustomer.id) return;

    try {
      // 转换前端字段为数据库字段
      const dbUpdates: Partial<Customer> = { ...editCustomerData };
      
      // 先处理字段映射
      if (editCustomerData.salesperson !== undefined) {
        dbUpdates.salesperson_name = editCustomerData.salesperson;
        delete (dbUpdates as any).salesperson;
      }
      if (editCustomerData.followUpStatus !== undefined) {
        dbUpdates.follow_up_status = editCustomerData.followUpStatus;
        delete (dbUpdates as any).followUpStatus;
      }
      if (editCustomerData.lastContact !== undefined) {
        dbUpdates.last_contact = editCustomerData.lastContact;
        delete (dbUpdates as any).lastContact;
      }
      delete (dbUpdates as any).createdAt;
      delete (dbUpdates as any).trainingHistory;
      
      // 删除不应该更新的字段
      delete (dbUpdates as any).id;
      delete (dbUpdates as any).created_at;
      
      // 处理业务员字段 - 如果管理员修改了业务员
      if (user?.role === 'admin' && editCustomerData.salesperson_id !== undefined) {
        // 如果选择了有效的业务员
        if (editCustomerData.salesperson_id && editCustomerData.salesperson_id !== '') {
          const selectedSalesperson = salespersons.find(sp => sp.id === editCustomerData.salesperson_id);
          if (selectedSalesperson) {
            dbUpdates.salesperson_id = selectedSalesperson.id;
            dbUpdates.salesperson_name = selectedSalesperson.name;
          }
        } else {
          // 如果清空了业务员选择
          dbUpdates.salesperson_id = null;
          dbUpdates.salesperson_name = null;
        }
      }
      
      // 最后处理空字符串字段，转换为 null（遍历所有字段）
      Object.keys(dbUpdates).forEach(key => {
        const value = (dbUpdates as any)[key];
        if (value === '') {
          (dbUpdates as any)[key] = null;
        }
      });

      console.log('更新客户数据:', dbUpdates);
      const updatedCustomer = await supabaseService.updateCustomer(selectedCustomer.id, dbUpdates);
      if (updatedCustomer) {
        // 更新 allCustomers
        setAllCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updatedCustomer : c));
        
        // 同时更新 filteredCustomers，立即显示更新
        const frontendCustomer = convertToFrontend(updatedCustomer);
        setFilteredCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? frontendCustomer : c));

        // 关闭模态框
        setIsEditModalOpen(false);
        toast.success('客户信息已更新');
      }
    } catch (error) {
      console.error('更新客户信息失败', error);
      toast.error('更新客户信息失败，请重试');
    }
  };

  // 处理添加客户
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== 开始添加客户 ===');
    console.log('表单数据:', newCustomerData);

    // 验证必填字段
    if (!newCustomerData.name || !newCustomerData.phone || !newCustomerData.company) {
      console.log('验证失败：缺少必填字段');
      toast.error('请填写所有必填字段');
      return;
    }

    console.log('验证通过，开始保存...');

    try {
      // 确定业务员信息
      let salespersonId: string | null = null;
      let salespersonName: string | null = null;

      if (user?.role === 'admin') {
        // 管理员：使用选择的业务员
        if (newCustomerData.salesperson_id) {
          salespersonId = newCustomerData.salesperson_id;
          salespersonName = newCustomerData.salesperson_name || null;
        }
      } else {
        // 业务员：使用当前用户
        console.log('获取当前用户信息...');
        const currentUser = await supabaseService.getCurrentUser();
        console.log('当前用户:', currentUser);

        if (!currentUser) {
          console.log('错误：无法获取当前用户');
          toast.error('无法获取当前用户信息');
          return;
        }
        salespersonId = currentUser.id;
        salespersonName = user?.name || null;
      }

      // 准备客户数据 - 使用正确的数据库字段名
      const customerToAdd: Omit<Customer, 'id' | 'created_at'> = {
        name: newCustomerData.name,
        phone: newCustomerData.phone,
        email: newCustomerData.email || null,
        company: newCustomerData.company,
        position: newCustomerData.position || null,
        location: newCustomerData.location || null,
        status: newCustomerData.status || '潜在客户',
        salesperson_id: salespersonId,
        salesperson_name: salespersonName,
        follow_up_status: '待跟进',
        last_contact: new Date().toISOString().split('T')[0],
        tags: (newCustomerData.tags as string[]) || [],
        avatar: null
      };

      console.log('准备添加的客户数据:', customerToAdd);
      console.log('调用 supabaseService.addCustomer...');

      const addedCustomer = await supabaseService.addCustomer(customerToAdd);
      console.log('添加结果:', addedCustomer);

      if (addedCustomer) {
        console.log('客户添加成功！');

        // 重新从数据库加载所有客户数据
        console.log('重新加载客户列表...');
        const updatedCustomers = await supabaseService.getCustomers();
        console.log('重新加载后的客户数量:', updatedCustomers.length);
        setAllCustomers(updatedCustomers);
        
        // 同时更新 filteredCustomers，立即显示新客户
        // 根据当前用户角色过滤
        let newFiltered = [...updatedCustomers];
        if (user?.role === 'salesperson') {
          // 业务员只看自己的客户
          newFiltered = updatedCustomers.filter(c => c.salesperson_id === user.id);
        }
        // 应用搜索和筛选条件
        if (searchTerm) {
          newFiltered = newFiltered.filter(c => 
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.company?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
          );
        }
        if (selectedStatus !== '全部') {
          newFiltered = newFiltered.filter(c => c.status === selectedStatus);
        }
        if (selectedArea !== '全部') {
          newFiltered = newFiltered.filter(c => c.location === selectedArea);
        }
        if (selectedFollowUpStatus !== '全部') {
          newFiltered = newFiltered.filter(c => c.follow_up_status === selectedFollowUpStatus);
        }
        if (selectedSalesperson !== '全部') {
          if (selectedSalesperson === '未分配') {
            newFiltered = newFiltered.filter(c => !c.salesperson_id);
          } else {
            newFiltered = newFiltered.filter(c => c.salesperson_id === selectedSalesperson);
          }
        }
        
        console.log('更新后的筛选客户数量:', newFiltered.length);
        const frontendFiltered = newFiltered.map(convertToFrontend);
        setFilteredCustomers(frontendFiltered);

        // 重置表单
        setNewCustomerData({
          name: '',
          phone: '',
          email: '',
          company: '',
          position: '',
          location: '',
          status: '潜在客户',
          tags: [],
          avatar: null
        });

        // 关闭模态框
        setIsAddModalOpen(false);
        toast.success('客户添加成功！');
        console.log('=== 添加客户完成 ===');
      } else {
        console.log('警告：addCustomer 返回空值');
        toast.error('添加客户失败：未返回数据');
      }
    } catch (error: any) {
      console.error('添加客户失败:', error);
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast.error(error.message || '添加客户失败，请重试');
    }
  };



  // 计算统计数据
  const totalCustomers = filteredCustomers.length;
  const convertedCustomers = filteredCustomers.filter(customer => customer.status === '已成交').length;
  const followUpCustomers = filteredCustomers.filter(customer => customer.followUpStatus === '待跟进' || customer.followUpStatus === '进行中').length;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 使用统一的Sidebar组件 */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentPath="/customer-management"
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
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">客户信息管理</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative"><i className="fas fa-bell"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openAddModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center"
              >
                <Plus size={16} className="mr-2" />
                添加客户
              </motion.button>
            </div>
          </div>

          {/* 编辑客户模态框 */}
          {isEditModalOpen && selectedCustomer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setIsEditModalOpen(false)}
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
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">编辑客户信息</h2>
                    <button
                      onClick={() => setIsEditModalOpen(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <i className="fas fa-times text-xl"></i>
                    </button>
                  </div>

                  <form className="space-y-4" onSubmit={handleEditCustomer}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户姓名</label>
                        <input
                          type="text"
                          value={editCustomerData.name || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, name: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="请输入客户姓名"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">联系电话</label>
                        <input
                          type="tel"
                          value={editCustomerData.phone || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, phone: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="请输入联系电话"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">电子邮箱</label>
                        <input
                          type="email"
                          value={editCustomerData.email || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, email: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="请输入电子邮箱"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所在地区</label>
                        <select
                          value={editCustomerData.location || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, location: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="">请选择地区</option>
                          <option value="北京">北京</option>
                          <option value="上海">上海</option>
                          <option value="广州">广州</option>
                          <option value="深圳">深圳</option>
                          <option value="其他">其他</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">公司名称</label>
                        <input
                          type="text"
                          value={editCustomerData.company || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, company: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="请输入公司名称"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">职位</label>
                        <input
                          type="text"
                          value={editCustomerData.position || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, position: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="请输入职位"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户状态</label>
                        <select
                          value={editCustomerData.status || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, status: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="潜在客户">潜在客户</option>
                          <option value="跟进中">跟进中</option>
                          <option value="已成交">已成交</option>
                          <option value="已流失">已流失</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">跟进状态</label>
                        <select
                          value={editCustomerData.followUpStatus || ''}
                          onChange={(e) => setEditCustomerData({ ...editCustomerData, followUpStatus: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="已完成">已完成</option>
                          <option value="进行中">进行中</option>
                          <option value="待跟进">待跟进</option>
                        </select>
                      </div>
                      {user?.role === 'admin' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">负责业务员</label>
                          <select
                            value={editCustomerData.salesperson_id !== undefined ? (editCustomerData.salesperson_id || '') : (selectedCustomer?.salesperson_id || '')}
                            onChange={(e) => {
                              const selectedSalesperson = salespersons.find(sp => sp.id === e.target.value);
                              setEditCustomerData({ 
                                ...editCustomerData, 
                                salesperson_id: e.target.value,
                                salesperson: selectedSalesperson?.name || ''
                              });
                            }}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="">请选择业务员</option>
                            {salespersons.map((sp) => (
                              <option key={sp.id} value={sp.id}>
                                {sp.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户标签</label>
                      <div className="flex flex-wrap gap-2">
                        {['重要客户', '潜在客户', '高价值客户', '技术类', '管理类', '营销类', '设计类'].map((tag) => (
                          <label key={tag} className="inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={(editCustomerData.tags as string[] || []).includes(tag)}
                              onChange={(e) => {
                                const currentTags = editCustomerData.tags as string[] || [];
                                if (e.target.checked) {
                                  setEditCustomerData({ ...editCustomerData, tags: [...currentTags, tag] });
                                } else {
                                  setEditCustomerData({ ...editCustomerData, tags: currentTags.filter(t => t !== tag) });
                                }
                              }}
                            />
                            <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{tag}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors mr-2"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      >
                        保存更改
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">客户总数</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalCustomers}</h3>
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">已成交客户</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{convertedCustomers}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">待跟进客户</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{followUpCustomers}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                  <Clock size={24} />
                </div>
              </div>
            </motion.div>
          </div>

          {/* 图表区域 - 仅管理员可见 */}
          {user?.role === 'admin' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
              >
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white">客户状态分布</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }: { name: string; value: number }) => `${name}: ${value}人`}
                      >
                        {customerStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                        }}
                        formatter={(value: number) => [`${value}人`, '客户数量']}
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
                  <h3 className="font-semibold text-gray-800 dark:text-white">客户区域分布</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerAreaData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                      <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                        }}
                        formatter={(value: number) => [`${value}人`, '客户数量']}
                      />
                      <Bar dataKey="value" fill="#3b82f6" name="客户数量" />
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
                  <h3 className="font-semibold text-gray-800 dark:text-white">客户行业分布</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={customerIndustryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                      <XAxis type="number" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                      <YAxis dataKey="name" type="category" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                        }}
                        formatter={(value: number) => [`${value}人`, '客户数量']}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" name="客户数量" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          )}

          {/* 筛选和搜索区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索客户姓名、公司、邮箱或电话..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* 筛选器 */}
              <div className="flex flex-wrap gap-2">
                {/* 状态筛选 */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="全部">全部状态</option>
                  <option value="已成交">已成交</option>
                  <option value="跟进中">跟进中</option>
                  <option value="潜在客户">潜在客户</option>
                  <option value="已流失">已流失</option>
                </select>

                {/* 区域筛选 */}
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="全部">全部地区</option>
                  <option value="北京">北京</option>
                  <option value="上海">上海</option>
                  <option value="广州">广州</option>
                  <option value="深圳">深圳</option>
                  <option value="其他">其他</option>
                </select>

                {/* 跟进状态筛选 */}
                <select
                  value={selectedFollowUpStatus}
                  onChange={(e) => setSelectedFollowUpStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="全部">全部跟进</option>
                  <option value="已完成">已完成</option>
                  <option value="进行中">进行中</option>
                  <option value="待跟进">待跟进</option>
                </select>

                {/* 业务员筛选 - 仅管理员可见 */}
                {user?.role === 'admin' && (
                  <select
                    value={selectedSalesperson}
                    onChange={(e) => setSelectedSalesperson(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="全部">全部业务员</option>
                    <option value="未分配">未分配</option>
                    {salespersons.map(salesperson => (
                      <option key={salesperson.id} value={salesperson.id}>
                        {salesperson.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>


          </div>

          {/* 客户列表 */}
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
                        客户信息
                        {sortConfig?.key === 'name' && (
                          <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      联系方式
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      公司信息
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        状态
                        {sortConfig?.key === 'status' && (
                          <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                        )}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      负责业务员
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => handleSort('lastContact')}
                    >
                      <div className="flex items-center">
                        最后联系
                        {sortConfig?.key === 'lastContact' && (
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                          <p className="text-gray-500 dark:text-gray-400">加载中...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <motion.tr
                        key={customer.id}
                        whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(249, 250, 251, 1)' }}
                        className="transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={customer.avatar || generateDefaultAvatar(customer.name, 80)}
                                alt={customer.name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-white">{customer.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {(customer.tags || []).map((tag, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 mr-1">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center mb-1">
                            <Phone size={14} className="mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                          <div className="flex items-center">
                            <Mail size={14} className="mr-2 text-gray-400" />
                            {customer.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center mb-1">
                            <Briefcase size={14} className="mr-2 text-gray-400" />
                            {customer.company}
                          </div>
                          <div className="flex items-center">
                            <MapPin size={14} className="mr-2 text-gray-400" />
                            {customer.location}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.status === '已成交'
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                            : customer.status === '跟进中'
                              ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                              : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                            }`}>
                            {customer.status}
                          </span>
                          <div className="mt-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.followUpStatus === '已完成'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                              : customer.followUpStatus === '待跟进'
                                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                              }`}>
                              {customer.followUpStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {customer.salesperson}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {customer.lastContact ? customer.lastContact.split('T')[0] : ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openCustomerDetail(customer)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                          >
                            详情
                          </button>
                          {user?.role === 'admin' || user?.name === customer.salesperson ? (
                            <>
                              <button
                                onClick={() => openEditModal(customer)}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3"
                              >
                                编辑
                              </button>
                              <button
                                onClick={async () => {
                                  if (window.confirm(`确定要删除客户 ${customer.name} 吗？`)) {
                                    try {
                                      const success = await supabaseService.deleteCustomer(customer.id);
                                      if (success) {
                                        toast.success('客户已成功删除');
                                        // 立即从列表中移除
                                        setAllCustomers(prev => prev.filter(c => c.id !== customer.id));
                                        setFilteredCustomers(prev => prev.filter(c => c.id !== customer.id));
                                      } else {
                                        toast.error('删除客户失败');
                                      }
                                    } catch (error) {
                                      console.error('删除客户时出错:', error);
                                      toast.error('删除客户失败，请重试');
                                    }
                                  }
                                }}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              >
                                删除
                              </button>
                            </>
                          ) : null}
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
            {filteredCustomers.length > 0 && (
              <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6 flex items-center justify-between">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    显示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredCustomers.length}</span> 条，共 <span className="font-medium">{filteredCustomers.length}</span> 条结果
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
        </main>
      </div>

      {/* 客户详情模态框 */}
      {isDetailModalOpen && selectedCustomer && (
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">客户详情</h2>
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
                    src={selectedCustomer.avatar || generateDefaultAvatar(selectedCustomer.name, 256)}
                    alt={selectedCustomer.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{selectedCustomer.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(selectedCustomer.tags || []).map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <Phone size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <Mail size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Briefcase size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{selectedCustomer.company}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">{selectedCustomer.location}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-2 ${selectedCustomer.status === '已成交'
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                        : selectedCustomer.status === '跟进中'
                          ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                        }`}>
                        {selectedCustomer.status}
                      </span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedCustomer.followUpStatus === '已完成'
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                        : selectedCustomer.followUpStatus === '待跟进'
                          ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                          : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                        }`}>
                        {selectedCustomer.followUpStatus}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <UserPlus size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">负责业务员: {selectedCustomer.salesperson || selectedCustomer.salesperson_name || '未分配'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">培训历史</h4>
                {(selectedCustomer.trainingHistory || []).length > 0 ? (
                  <div className="space-y-3">
                    {(selectedCustomer.trainingHistory || []).map((training) => (
                      <div key={training.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                          <Calendar size={20} />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-white">{training.name}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 mr-4">
                              {training.date}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${training.status === '已完成'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                              : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                              }`}>
                              {training.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">暂无培训记录</p>
                )}
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">跟进记录</h4>
                <div className="space-y-3">
                  {/* 模拟数据 */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <UserCircle size={16} />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {selectedCustomer.salesperson || selectedCustomer.salesperson_name || '业务员'}的跟进记录 #{i}
                          </p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            2025-10-{i + 15}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          与客户沟通了培训需求，客户对{(selectedCustomer.trainingHistory || []).length > 0 ? selectedCustomer.trainingHistory![0].name : '我们的培训课程'}表现出浓厚兴趣，
                          计划在近期安排进一步的详细咨询。
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors mr-2"
                >
                  关闭
                </button>
                {(user?.role === 'admin' || user?.id === selectedCustomer.salesperson_id) && (
                  <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                    安排跟进
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 添加客户模态框 */}
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">添加客户</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleAddCustomer}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户姓名 *</label>
                    <input
                      type="text"
                      value={newCustomerData.name || ''}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入客户姓名"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">联系电话 *</label>
                    <input
                      type="tel"
                      value={newCustomerData.phone || ''}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入联系电话"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">电子邮箱</label>
                    <input
                      type="email"
                      value={newCustomerData.email || ''}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入电子邮箱"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所在地区</label>
                    <select
                      value={newCustomerData.location || ''}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, location: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">请选择地区</option>
                      <option value="北京">北京</option>
                      <option value="上海">上海</option>
                      <option value="广州">广州</option>
                      <option value="深圳">深圳</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">公司名称 *</label>
                    <input
                      type="text"
                      value={newCustomerData.company || ''}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, company: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入公司名称"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">职位</label>
                    <input
                      type="text"
                      value={newCustomerData.position || ''}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, position: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入职位"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户状态</label>
                    <select
                      value={newCustomerData.status || '潜在客户'}
                      onChange={(e) => setNewCustomerData({ ...newCustomerData, status: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="潜在客户">潜在客户</option>
                      <option value="跟进中">跟进中</option>
                      <option value="已成交">已成交</option>
                    </select>
                  </div>
                  {user?.role === 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">负责业务员</label>
                      <select
                        value={newCustomerData.salesperson_id || ''}
                        onChange={(e) => {
                          const selectedSalesperson = salespersons.find(sp => sp.id === e.target.value);
                          setNewCustomerData({ 
                            ...newCustomerData, 
                            salesperson_id: e.target.value,
                            salesperson_name: selectedSalesperson?.name || ''
                          });
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">请选择业务员</option>
                        {salespersons.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户标签</label>
                  <div className="flex flex-wrap gap-2">
                    {['重要客户', '潜在客户', '高价值客户', '技术类', '管理类', '营销类', '设计类'].map((tag) => (
                      <label key={tag} className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={(newCustomerData.tags as string[] || []).includes(tag)}
                          onChange={(e) => {
                            const currentTags = newCustomerData.tags as string[] || [];
                            if (e.target.checked) {
                              setNewCustomerData({ ...newCustomerData, tags: [...currentTags, tag] });
                            } else {
                              setNewCustomerData({ ...newCustomerData, tags: currentTags.filter(t => t !== tag) });
                            }
                          }}
                        />
                        <div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{tag}</span>
                      </label>
                    ))}
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
                  >
                    保存客户
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}