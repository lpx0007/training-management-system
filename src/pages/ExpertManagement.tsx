import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  UserCheck, 
  Search, 
  Filter, 
  ChevronDown, 
  Star, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Calendar,
  Briefcase,
  Check,
  X,
  Upload,
  Download
} from 'lucide-react';
import { Empty } from '@/components/Empty';
import { PermissionGuard } from '@/components/PermissionGuard';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/Notifications/NotificationBell';
import ExpertImportModal from '@/components/ExpertImportModal';
import supabaseService from '@/lib/supabase/supabaseService';
import type { Expert } from '@/lib/supabase/types';
import { generateDefaultAvatar } from '@/utils/imageUtils';

// 计算专家领域分布
const calculateFieldData = (experts: Expert[]) => {
  const fieldCounts: Record<string, number> = {};
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  
  experts.forEach(expert => {
    if (expert.field) {
      fieldCounts[expert.field] = (fieldCounts[expert.field] || 0) + 1;
    }
  });
  
  return Object.entries(fieldCounts).map(([name, value], index) => ({
    name,
    value,
    color: colors[index % colors.length]
  }));
};

// 计算专家评分分布
const calculateRatingData = (experts: Expert[]) => {
  const ratings = { '4.5-5分': 0, '4-4.5分': 0, '3.5-4分': 0, '3分以下': 0 };
  
  experts.forEach(expert => {
    const rating = expert.rating || 0;
    if (rating >= 4.5) ratings['4.5-5分']++;
    else if (rating >= 4) ratings['4-4.5分']++;
    else if (rating >= 3.5) ratings['3.5-4分']++;
    else ratings['3分以下']++;
  });
  
  return Object.entries(ratings).map(([name, value]) => ({ name, value }));
};

// 计算经验分布
const calculateExperienceData = (experts: Expert[]) => {
  const experience = { '5年以下': 0, '5-10年': 0, '10-15年': 0, '15年以上': 0 };
  
  experts.forEach(expert => {
    const years = parseInt(expert.experience || '0');
    if (years < 5) experience['5年以下']++;
    else if (years <= 10) experience['5-10年']++;
    else if (years <= 15) experience['10-15年']++;
    else experience['15年以上']++;
  });
  
  return Object.entries(experience).map(([name, value]) => ({ name, value }));
};

export default function ExpertManagement() {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('全部');
  const [selectedExperience, setSelectedExperience] = useState('全部');
  const [selectedAvailability, setSelectedAvailability] = useState('全部');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 加载专家数据
  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getExperts();
      setExperts(data);
      setFilteredExperts(data);
    } catch (error) {
      console.error('加载专家数据失败:', error);
      toast.error('加载专家数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 筛选专家数据
  useEffect(() => {
    let result = [...experts];
    
    // 搜索筛选
    if (searchTerm) {
      result = result.filter(expert => 
        expert.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expert.bio?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 领域筛选
    if (selectedField !== '全部') {
      result = result.filter(expert => expert.field === selectedField);
    }
    
    // 经验筛选
    if (selectedExperience !== '全部') {
      result = result.filter(expert => {
        const expYears = parseInt(expert.experience || '0');
        switch(selectedExperience) {
          case '5年以下': return expYears < 5;
          case '5-10年': return expYears >= 5 && expYears <= 10;
          case '10-15年': return expYears > 10 && expYears <= 15;
          case '15年以上': return expYears > 15;
          default: return true;
        }
      });
    }
    
    // 可用性筛选
    if (selectedAvailability !== '全部') {
      result = result.filter(expert => expert.available === (selectedAvailability === '可预约'));
    }
    
    setFilteredExperts(result);
  }, [searchTerm, selectedField, selectedExperience, selectedAvailability, experts]);

  // 打开编辑专家模态框
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editExpert, setEditExpert] = useState<Expert | null>(null);
  const [addResumeFile, setAddResumeFile] = useState<File | null>(null);
  const [editResumeFile, setEditResumeFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Partial<Expert>>({
    name: '',
    title: '',
    field: '',
    experience: '',
    rating: 0,
    courses: [],
    location: '',
    available: true,
    gender: '',
    bio: '',
    past_sessions: 0,
    total_participants: 0,
    avatar: '',
    id_number: '',
    bank_card_number: '',
    hourly_rate: 0,
    resume: ''
  });
  
  const openEditModal = (expert: Expert) => {
    setEditExpert(expert);
    setFormData(expert);
    setEditResumeFile(null);
    setIsEditModalOpen(true);
  };

  const openAddModal = () => {
    setEditExpert(null);
    setFormData({
      name: '',
      title: '',
      field: '',
      experience: '',
      rating: 0,
      courses: [],
      location: '',
      available: true,
      gender: '',
      bio: '',
      past_sessions: 0,
      total_participants: 0,
      avatar: '',
      id_number: '',
      bank_card_number: '',
      hourly_rate: 0,
      resume: ''
    });
    setAddResumeFile(null);
    setIsAddModalOpen(true);
  };

  // 保存专家编辑
  const saveExpertEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExpert) return;
    
    try {
      let updates = { ...formData } as Partial<Expert>;
      if (editResumeFile) {
        const url = await supabaseService.uploadExpertResume(editExpert.id, editResumeFile);
        updates.resume = url;
      }
      await supabaseService.updateExpert(editExpert.id, updates);
      toast.success('专家信息已更新');
      setIsEditModalOpen(false);
      loadExperts();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败，请重试');
    }
  };

  // 处理导入专家
  const handleImportExperts = async (data: any[]) => {
    try {
      const dataManagementService = (await import('@/lib/services/dataManagementService')).default;
      
      const toastId = toast.loading('正在导入专家...');
      
      const result = await dataManagementService.importData('experts', data, 'skip');
      
      toast.dismiss(toastId);
      
      if (result.success > 0) {
        toast.success(`成功导入 ${result.success} 位专家`);
        loadExperts(); // 刷新列表
      }
      if (result.failed > 0) {
        toast.error(`${result.failed} 位专家导入失败`);
      }
    } catch (error: any) {
      toast.error(error.message || '导入失败');
    }
  };

  // 处理导出专家
  const handleExportExperts = async () => {
    const toastId = toast.loading('正在导出...');
    
    try {
      // 格式化导出数据
      const exportData = filteredExperts.map(expert => ({
        姓名: expert.name,
        手机号: expert.phone || '',
        邮箱: expert.email || '',
        专业领域: expert.field || '',
        职称: expert.title || '',
        性别: expert.gender || '',
        地区: expert.location || '',
        简介: expert.bio || '',
        经验: expert.experience || '',
        评分: expert.rating || 0,
        往期场次: expert.past_sessions || 0,
        总参与人数: expert.total_participants || 0,
        是否可用: expert.available ? '可预约' : '不可约',
        身份证号: expert.id_number || '',
        银行卡号: expert.bank_card_number || '',
        课时费: expert.hourly_rate ?? '',
        简历: expert.resume || ''
      }));
      
      // 导出文件
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '专家信息');
      XLSX.writeFile(wb, `专家信息_${new Date().toLocaleDateString('zh-CN')}.xlsx`);
      
      toast.dismiss(toastId);
      toast.success(`成功导出 ${exportData.length} 条专家数据`);
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || '导出失败');
    }
  };

  // 添加专家
  const addExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const created = await supabaseService.addExpert(formData as Omit<Expert, 'id' | 'created_at'>);
      if (addResumeFile && created?.id) {
        const url = await supabaseService.uploadExpertResume(created.id, addResumeFile);
        await supabaseService.updateExpert(created.id, { resume: url });
      }
      toast.success('专家添加成功');
      setIsAddModalOpen(false);
      loadExperts();
    } catch (error) {
      console.error('添加失败:', error);
      toast.error('添加失败，请重试');
    }
  };

  // 删除专家（带关联数据提示）
  const deleteExpert = async (id: number) => {
    try {
      // 1. 查询关联的培训场次数量（使用驼峰命名）
      const sessions = await supabaseService.getTrainingSessions();
      const relatedSessions = sessions.filter(s => s.expertId === id);
      
      // 2. 查询关联的课程数量（暂时设为0，后续完善）
      const relatedCourses: any[] = [];
      
      // 3. 构建确认消息
      const expert = experts.find(e => e.id === id);
      let message = `确定要删除专家「${expert?.name}」吗？\n\n`;
      
      if (relatedSessions.length > 0) {
        message += `该专家有以下关联数据：\n`;
        if (relatedSessions.length > 0) {
          message += `• ${relatedSessions.length} 个培训场次\n`;
        }
        // if (relatedCourses.length > 0) {
        //   message += `• ${relatedCourses.length} 个课程\n`;
        // }
        message += `\n删除后，这些记录的专家将被清空。\n`;
        message += `建议先重新分配培训场次和课程。\n\n`;
        message += `仍要继续删除吗？`;
      }
      
      // 4. 显示确认对话框
      if (!confirm(message)) return;
      
      // 5. 执行删除
      await supabaseService.deleteExpert(id);
      
      // 6. 清空关联数据的专家引用（暂时跳过，后续处理）
      // if (relatedSessions.length > 0) {
      //   await supabaseService.clearExpertFromSessions(id, relatedSessions, []);
      // }
      
      // 7. 显示删除结果
      if (relatedSessions.length > 0 || relatedCourses.length > 0) {
        toast.success(
          `专家已删除。${relatedSessions.length} 个培训场次和 ${relatedCourses.length} 个课程的专家已清空。`,
          { duration: 5000 }
        );
      } else {
        toast.success('专家已删除');
      }
      
      loadExperts();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  // 打开专家详情
  const openExpertDetail = (expert: Expert) => {
    setSelectedExpert(expert);
    setIsDetailModalOpen(true);
  };

  // 领域列表
  const fields = ['全部', ...Array.from(new Set(experts.map(expert => expert.field).filter((f): f is string => Boolean(f))))];
  
  // 为筛选器显示修正文本
  const getFieldDisplayText = (field: string) => field === '全部' ? '筛选领域' : field;

  // 计算统计数据
  const totalExperts = filteredExperts.length;
  const availableExperts = filteredExperts.filter(expert => expert.available).length;
  const avgRating = filteredExperts.length > 0 
    ? filteredExperts.reduce((sum, expert) => sum + (expert.rating || 0), 0) / filteredExperts.length 
    : 0;

  // 计算图表数据
  const expertFieldData = calculateFieldData(filteredExperts);
  const expertRatingData = calculateRatingData(filteredExperts);
  const experienceData = calculateExperienceData(filteredExperts);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 使用统一的Sidebar组件 */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentPath="/expert-management"
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
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">专家资源管理</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              
              {/* 导入专家 */}
              <PermissionGuard permission="expert_import">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-2 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm flex items-center"
                  title="批量导入专家"
                >
                  <Upload size={16} className="sm:mr-2" />
                  <span className="hidden sm:inline">导入</span>
                </motion.button>
              </PermissionGuard>
              
              {/* 导出专家 */}
              <PermissionGuard permission="expert_export">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleExportExperts()}
                  className="px-2 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-sm flex items-center"
                  title="导出专家数据"
                >
                  <Download size={16} className="sm:mr-2" />
                  <span className="hidden sm:inline">导出</span>
                </motion.button>
              </PermissionGuard>
              
              {/* 添加专家 */}
              <PermissionGuard permission="expert_add">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openAddModal}
                  className="px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center text-sm sm:text-base"
                >
                  <Plus size={16} className="sm:mr-2" />
                  <span className="ml-1 sm:ml-0">添加<span className="hidden sm:inline">专家</span></span>
                </motion.button>
              </PermissionGuard>
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">专家总数</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalExperts}</h3>
                </div>

              
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
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
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">可预约专家</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{availableExperts}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600 dark:text-green-400">
                  <Check size={24} />
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">平均评分</p>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{avgRating.toFixed(1)}</h3>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                  <Star size={24} />
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">专家领域分布</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expertFieldData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}人`}
                    >
                      {expertFieldData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                        color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                      }}
                      formatter={(value) => [`${value}人`, '专家数量']}
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
                <h3 className="font-semibold text-gray-800 dark:text-white">专家评分分布</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expertRatingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                        color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                      }}
                      formatter={(value) => [`${value}人`, '专家数量']}
                    />
                    <Bar dataKey="value" fill="#f59e0b" name="专家数量" />
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
                <h3 className="font-semibold text-gray-800 dark:text-white">专家经验分布</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={experienceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="name" stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                        borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                        color: theme === 'dark' ? '#f3f4f6' : '#1f2937'
                      }}
                      formatter={(value) => [`${value}人`, '专家数量']}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" name="专家数量" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* 筛选和搜索区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索专家姓名、头衔或简介..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* 领域筛选 */}
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  {fields.map(field => (
                    <option key={field} value={field}>{getFieldDisplayText(field)}</option>
                  ))}
                </select>
                
                {/* 经验筛选 */}
                <select
                  value={selectedExperience}
                  onChange={(e) => setSelectedExperience(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="全部">筛选经验</option>
                  <option value="5年以下">5年以下</option>
                  <option value="5-10年">5-10年</option>
                  <option value="10-15年">10-15年</option>
                  <option value="15年以上">15年以上</option>
                </select>
                
                {/* 可用性筛选 */}
                <select
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                >
                  <option value="全部">筛选状态</option>
                  <option value="可预约">可预约</option>
                  <option value="不可预约">不可预约</option>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">最低评分</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">全部</option>
                      <option value="4.5">4.5分以上</option>
                      <option value="4">4分以上</option>
                      <option value="3.5">3.5分以上</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">擅长课程数</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">全部</option>
                      <option value="3">3门以上</option>
                      <option value="5">5门以上</option>
                      <option value="10">10门以上</option>
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

          {/* 专家列表 - 表格形式 */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredExperts.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        专家信息
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        专业领域
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        经验/地区
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        擅长课程
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        培训统计
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        评分
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredExperts.map((expert) => (
                      <motion.tr
                        key={expert.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        {/* 专家信息 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="relative flex-shrink-0">
                              <img
                                src={expert.avatar || generateDefaultAvatar(expert.name ?? '专家', 80)}
                                alt={expert.name ?? ''}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              {expert.available ? (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                              ) : (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {expert.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {expert.title}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 专业领域 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                            {expert.field || '未设置'}
                          </span>
                        </td>

                        {/* 经验/地区 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {expert.experience || '未设置'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <MapPin size={12} className="mr-1" />
                            {expert.location || '未设置'}
                          </div>
                        </td>

                        {/* 擅长课程 */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {expert.courses && expert.courses.length > 0 ? (
                              <>
                                {expert.courses.slice(0, 2).map((course, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded"
                                  >
                                    {course}
                                  </span>
                                ))}
                                {expert.courses.length > 2 && (
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                                    +{expert.courses.length - 2}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">暂无</span>
                            )}
                          </div>
                        </td>

                        {/* 培训统计 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {expert.past_sessions || 0} 场
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {expert.total_participants || 0} 人
                          </div>
                        </td>

                        {/* 评分 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Star size={14} className="text-yellow-400 mr-1 fill-yellow-400" />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {expert.rating?.toFixed(1) || '0.0'}
                            </span>
                          </div>
                        </td>

                        {/* 状态 */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {expert.available ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300">
                              可预约
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">
                              不可预约
                            </span>
                          )}
                        </td>

                        {/* 操作 */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openExpertDetail(expert)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="查看详情"
                            >
                              <Eye size={18} />
                            </motion.button>
                            {user?.role === 'admin' && (
                              <>
                                <PermissionGuard permission="expert_edit">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => openEditModal(expert)}
                                    className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                                    title="编辑"
                                  >
                                    <Edit size={18} />
                                  </motion.button>
                                </PermissionGuard>
                                <PermissionGuard permission="expert_delete">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => deleteExpert(expert.id)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                    title="删除"
                                  >
                                    <Trash2 size={18} />
                                  </motion.button>
                                </PermissionGuard>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
              <Empty />
            </div>
          )}
        </main>
      </div>

       {/* 添加专家模态框 */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">添加专家</h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={addExpert} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      身份证号
                    </label>
                    <input
                      type="text"
                      value={formData.id_number ?? ''}
                      onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      银行卡号
                    </label>
                    <input
                      type="text"
                      value={formData.bank_card_number ?? ''}
                      onChange={(e) => setFormData({ ...formData, bank_card_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      课时费
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourly_rate ?? 0}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      简历
                    </label>
                    {formData.resume ? (
                      <a href={formData.resume} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline break-all mb-2 inline-block">已上传文件</a>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">未上传</p>
                    )}
                    <PermissionGuard permission="expert_add">
                      <input
                        type="file"
                        accept="application/pdf,.doc,.docx,image/*"
                        onChange={(e) => setAddResumeFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </PermissionGuard>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name ?? ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      头衔 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title ?? ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      专业领域
                    </label>
                    <input
                      type="text"
                      value={formData.field ?? ''}
                      onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      授课经验
                    </label>
                    <input
                      type="text"
                      placeholder="例如: 10年"
                      value={formData.experience ?? ''}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      评分
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating ?? 0}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      所在地区
                    </label>
                    <input
                      type="text"
                      value={formData.location ?? ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      性别
                    </label>
                    <select
                      value={formData.gender ?? ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">未设置</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      身份证号
                    </label>
                    <input
                      type="text"
                      value={formData.id_number ?? ''}
                      onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      银行卡号
                    </label>
                    <input
                      type="text"
                      value={formData.bank_card_number ?? ''}
                      onChange={(e) => setFormData({ ...formData, bank_card_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      课时费
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourly_rate ?? 0}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      简历
                    </label>
                    {formData.resume ? (
                      <a href={formData.resume} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline break-all mb-2 inline-block">查看当前简历</a>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">未上传简历</p>
                    )}
                    <PermissionGuard permission="expert_edit">
                      <input
                        type="file"
                        accept="application/pdf,.doc,.docx,image/*"
                        onChange={(e) => setEditResumeFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                      />
                      {editResumeFile && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">已选择: {editResumeFile.name}</p>
                      )}
                    </PermissionGuard>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      头像URL
                    </label>
                    <input
                      type="text"
                      value={formData.avatar ?? ''}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      可预约状态
                    </label>
                    <select
                      value={formData.available ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, available: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">可预约</option>
                      <option value="false">不可预约</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    擅长课程（用逗号分隔）
                  </label>
                  <input
                    type="text"
                    placeholder="例如: React开发, Vue.js, TypeScript"
                    value={formData.courses?.join(', ') ?? ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      courses: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    个人简介
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio ?? ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    添加专家
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 编辑专家模态框 */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">编辑专家</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={saveExpertEdit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name ?? ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      头衔 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title ?? ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      专业领域
                    </label>
                    <input
                      type="text"
                      value={formData.field ?? ''}
                      onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      授课经验
                    </label>
                    <input
                      type="text"
                      placeholder="例如: 10年"
                      value={formData.experience ?? ''}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      评分
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating ?? 0}
                      onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      所在地区
                    </label>
                    <input
                      type="text"
                      value={formData.location ?? ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      性别
                    </label>
                    <select
                      value={formData.gender ?? ''}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">未设置</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      身份证号
                    </label>
                    <input
                      type="text"
                      value={formData.id_number ?? ''}
                      onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      银行卡号
                    </label>
                    <input
                      type="text"
                      value={formData.bank_card_number ?? ''}
                      onChange={(e) => setFormData({ ...formData, bank_card_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      课时费
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hourly_rate ?? 0}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      简历
                    </label>
                    {formData.resume ? (
                      <a href={formData.resume} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline break-all mb-2 inline-block">查看当前简历</a>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">未上传简历</p>
                    )}
                    <PermissionGuard permission="expert_edit">
                      <input
                        type="file"
                        accept="application/pdf,.doc,.docx,image/*"
                        onChange={(e) => setEditResumeFile(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-400"
                      />
                      {editResumeFile && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-1">已选择: {editResumeFile.name}</p>
                      )}
                    </PermissionGuard>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      头像URL
                    </label>
                    <input
                      type="text"
                      value={formData.avatar ?? ''}
                      onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      可预约状态
                    </label>
                    <select
                      value={formData.available ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, available: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="true">可预约</option>
                      <option value="false">不可预约</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    擅长课程（用逗号分隔）
                  </label>
                  <input
                    type="text"
                    placeholder="例如: React开发, Vue.js, TypeScript"
                    value={formData.courses?.join(', ') ?? ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      courses: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    个人简介
                  </label>
                  <textarea
                    rows={4}
                    value={formData.bio ?? ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    保存修改
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 专家详情模态框 */}
      {isDetailModalOpen && selectedExpert && (
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
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">专家详情</h2>
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
                    src={selectedExpert.avatar || generateDefaultAvatar(selectedExpert.name ?? '专家', 256)}
                    alt={selectedExpert.name ?? ''}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedExpert.name}</h3>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedExpert.available
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                    }`}>
                      {selectedExpert.available ? '可预约' : '不可预约'}
                    </span>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">{selectedExpert.title}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <Briefcase size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedExpert.field}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedExpert.experience}授课经验</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedExpert.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Star size={16} className="text-yellow-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">评分: {selectedExpert.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">简介</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedExpert.bio}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">资质与结算</h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">身份证号</p>
                      <p className="text-sm text-gray-800 dark:text-white break-all">{selectedExpert.id_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">银行卡号</p>
                      <p className="text-sm text-gray-800 dark:text-white break-all">{selectedExpert.bank_card_number || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">课时费</p>
                      <p className="text-sm text-gray-800 dark:text-white">{selectedExpert.hourly_rate != null ? `¥${Number(selectedExpert.hourly_rate).toLocaleString()}` : '-'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">简历</p>
                      {selectedExpert.resume ? (
                        <a 
                          href={selectedExpert.resume} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center justify-center w-10 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                          title="下载简历"
                        >
                          <Download size={20} />
                        </a>
                      ) : (
                        <div className="inline-flex items-center justify-center w-10 h-8 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-lg">
                          <span className="text-xs">-</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">擅长课程</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedExpert.courses && selectedExpert.courses.length > 0 ? (
                    selectedExpert.courses.map((course, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                        {course}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">暂无课程信息</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">历史培训统计</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">总培训场次</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedExpert.past_sessions || 0}</h3>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">总参训人数</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedExpert.total_participants || 0}</h3>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors mr-2"
                >
                  关闭
                </button>
                {selectedExpert.available && (
                  <button
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    预约专家
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* 导入专家模态框 */}
      <ExpertImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportExperts}
      />
    </div>
  );
}