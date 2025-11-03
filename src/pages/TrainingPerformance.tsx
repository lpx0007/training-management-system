import { useState, useContext, useEffect } from 'react';
  import { AuthContext } from '@/contexts/authContext';
  import { useLocation } from 'react-router-dom';
  import { Calendar, Filter, Search, ChevronDown, Users, Clock, UserCheck, MapPin, GraduationCap, Plus, ExternalLink } from 'lucide-react';
  import { Empty } from '@/components/Empty';
  import Sidebar from '@/components/Sidebar';
  import supabaseService from '@/lib/supabase/supabaseService';
  import prospectusService from '@/lib/supabase/prospectusService';
  import type { TrainingSessionFrontend, Course, Customer, Expert, Prospectus } from '@/lib/supabase/types';
  import { toast } from 'sonner';
  import { exportAllAttendanceSheet, exportAttendanceSheetBySalesperson } from '@/lib/exporters/attendanceSheetExporter';
  import { generateDefaultAvatar } from '@/utils/imageUtils';

export default function TrainingPerformance() {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpert, setSelectedExpert] = useState('全部');
  const [selectedArea, setSelectedArea] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [dateRange, setDateRange] = useState<string[]>([]);
  const [allSessions, setAllSessions] = useState<TrainingSessionFrontend[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<TrainingSessionFrontend[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSession, setEditSession] = useState<TrainingSessionFrontend | null>(null);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [experts, setExperts] = useState<{id: number; name: string}[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [prospectuses, setProspectuses] = useState<Prospectus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<TrainingSessionFrontend | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCustomerSelectModalOpen, setIsCustomerSelectModalOpen] = useState(false);
  const [salespersonCustomers, setSalespersonCustomers] = useState<Customer[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(null);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [selectedExpertDetail, setSelectedExpertDetail] = useState<Expert | null>(null);
  const [isExpertModalOpen, setIsExpertModalOpen] = useState(false);

  // 初始化数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // 获取当前用户信息
        const isAdmin = user?.role === 'admin';
        const isExpert = user?.role === 'expert';
        const salespersonName = (isAdmin || isExpert) ? undefined : user?.name;
        
        console.log('👤 当前用户:', { role: user?.role, name: user?.name, isAdmin, isExpert });
        
        // 获取培训场次数据
        // 管理员：看到所有培训
        // 业务员：只看到自己客户参与的培训
        // 专家：只看到自己授课的培训
        let trainingSessions = await supabaseService.getTrainingSessions(salespersonName);
        
        // 如果是专家，过滤出自己授课的培训
        if (isExpert && user?.name) {
          trainingSessions = trainingSessions.filter(session => 
            session.expert === user.name || session.expert.includes(user.name)
          );
          console.log('👨‍🏫 专家过滤后的培训:', trainingSessions);
        }
        console.log('📊 获取到的培训场次数据:', trainingSessions);
        console.log('📅 第一条记录的 endDate:', trainingSessions[0]?.endDate);
        console.log('📅 第一条记录的 date:', trainingSessions[0]?.date);
        console.log('📅 日期是否相同:', trainingSessions[0]?.endDate === trainingSessions[0]?.date);
        
        // 检查所有记录的日期
        trainingSessions.forEach((session, index) => {
          if (session.endDate && session.endDate !== session.date) {
            console.log(`✅ 培训 ${index + 1} 应该显示日期范围:`, {
              name: session.name,
              date: session.date,
              endDate: session.endDate
            });
          } else {
            console.log(`⚠️ 培训 ${index + 1} 不显示日期范围:`, {
              name: session.name,
              date: session.date,
              endDate: session.endDate,
              reason: !session.endDate ? '没有结束日期' : '日期相同'
            });
          }
        });
        
        // 业务员看到的参训人数是自己的客户数量
        // 管理员看到的是所有客户数量
        setAllSessions(trainingSessions);
        
        // 调试：将数据暴露到全局变量
        (window as any).__TRAINING_SESSIONS__ = trainingSessions;
        
        // 获取专家列表
        const expertList = await supabaseService.getExperts();
        console.log('获取到的专家列表:', expertList);
        const mappedExperts = expertList.map(expert => ({ id: expert.id, name: expert.name }));
        console.log('映射后的专家列表:', mappedExperts);
        setExperts(mappedExperts);
        
        // 获取区域列表，过滤掉 null 值
        const areaList = Array.from(new Set(trainingSessions.map(session => session.area).filter((area): area is string => area !== null)));
        setAreas(areaList);
        
        // 获取课程列表
        const courseList = await supabaseService.getCourses();
        setCourses(courseList);
        
        // 获取招商简章列表
        const prospectList = await prospectusService.getProspectuses();
        setProspectuses(prospectList);
      } catch (error) {
        console.error('获取数据失败', error);
        toast.error('获取数据失败，请重试');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user?.role, user?.name]);
  
  // 关闭模态框时重置搜索条件
  useEffect(() => {
    if (!isCustomerSelectModalOpen) {
      setCustomerSearchTerm('');
    }
  }, [isCustomerSelectModalOpen]);

  // 点击外部关闭导出下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const exportMenu = document.getElementById('export-attendance-menu');
      const exportButton = event.target as HTMLElement;
      
      if (exportMenu && !exportMenu.classList.contains('hidden')) {
        // 检查点击是否在菜单或按钮外部
        if (!exportMenu.contains(exportButton) && !exportButton.closest('button')?.textContent?.includes('导出签到表')) {
          exportMenu.classList.add('hidden');
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // 筛选和排序数据
  useEffect(() => {
    if (isLoading) return;
    
    // 使用所有会话数据的副本进行筛选，避免依赖循环
    let result = [...allSessions];
    
    // 搜索筛选
    if (searchTerm) {
      result = result.filter(session => 
        session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.expert.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.courseId && courses.find(c => c.id === session.courseId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // 专家筛选
    if (selectedExpert !== '全部') {
      result = result.filter(session => session.expert === selectedExpert);
    }
    
    // 区域筛选
    if (selectedArea !== '全部') {
      result = result.filter(session => session.area === selectedArea);
    }
    
    // 状态筛选
    if (selectedStatus !== '全部') {
      const statusMap = {
        '即将开始': 'upcoming',
        '进行中': 'ongoing',
        '已完成': 'completed'
      };
      result = result.filter(session => session.status === statusMap[selectedStatus as keyof typeof statusMap]);
    }
    
    // 日期范围筛选
    if (dateRange.length === 2) {
      result = result.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= new Date(dateRange[0]) && sessionDate <= new Date(dateRange[1]);
      });
    }
    
    // 排序
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof typeof a];
        const bVal = b[sortConfig.key as keyof typeof b];
        
        // 处理 null 或 undefined 值
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredSessions(result);
  }, [allSessions, searchTerm, selectedExpert, selectedArea, selectedStatus, dateRange, sortConfig, isLoading, courses]);

  // 处理排序
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 培训状态列表
  const statuses = ['全部', '即将开始', '进行中', '已完成'];

  // 打开添加培训模态框
  const openAddModal = () => {
    setIsAddModalOpen(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setIsAddModalOpen(false);
    setIsDetailModalOpen(false);
    setIsExpertModalOpen(false);
  };

  // 打开培训详情模态框
  const openDetailModal = async (session: TrainingSessionFrontend) => {
    console.log('🔍 点击详情，培训ID:', session.id);
    console.log('🔍 当前培训数据:', session);
    console.log('🔍 当前用户角色:', user?.role);
    
    try {
      // 如果是专家角色，直接使用当前 session 数据，不需要加载参与者列表
      if (user?.role === 'expert') {
        console.log('👨‍🏫 专家角色：使用简化版详情');
        setSelectedSession(session);
        
        // 加载专家详细信息
        if (session.expertId) {
          try {
            const experts = await supabaseService.getExperts();
            const expert = experts.find(e => e.id === session.expertId);
            if (expert) {
              setSelectedExpertDetail(expert);
            }
          } catch (error) {
            console.error('获取专家信息失败:', error);
          }
        }
        
        setIsDetailModalOpen(true);
        console.log('✅ 专家详情模态框已打开');
        return;
      }
      
      // 管理员和业务员需要获取完整的培训信息，包括参与者列表
      const salespersonName = user?.role === 'salesperson' ? user.name : undefined;
      console.log('📡 正在获取完整培训信息...', { salespersonName });
      const fullSession = await supabaseService.getTrainingSessionById(session.id, salespersonName);
      console.log('✅ 获取到完整培训信息:', fullSession);
      if (fullSession) {
        setSelectedSession(fullSession);
        
        // 同时加载专家详细信息
        if (fullSession.expertId) {
          try {
            const experts = await supabaseService.getExperts();
            const expert = experts.find(e => e.id === fullSession.expertId);
            if (expert) {
              setSelectedExpertDetail(expert);
            }
          } catch (error) {
            console.error('获取专家信息失败:', error);
          }
        }
        
        setIsDetailModalOpen(true);
        console.log('✅ 详情模态框已打开');
      } else {
        console.error('❌ 获取到的培训信息为空');
        toast.error('获取培训详情失败');
      }
    } catch (error) {
      console.error('❌ 获取培训详情失败:', error);
      toast.error('获取培训详情失败');
    }
  };

   // 添加客户到培训
  const handleAddCustomer = async (trainingId: number) => {
    try {
      console.log('🔍 加载客户列表，用户角色:', user?.role, '用户ID:', user?.id);
      
      // 从数据库获取真实客户数据
      const allCustomers = await supabaseService.getCustomers();
      console.log('📊 获取到的所有客户数量:', allCustomers.length);
      
      let customersToShow: Customer[] = [];
      
      if (user?.role === 'admin') {
        // 管理员可以看到所有客户
        customersToShow = allCustomers;
        console.log('👑 管理员：显示所有客户');
      } else if (user?.role === 'salesperson') {
        // 业务员只能看到自己的客户（基于 salesperson_id）
        customersToShow = allCustomers.filter(c => c.salesperson_id === user.id);
        console.log(`👤 业务员 ${user.name}：显示 ${customersToShow.length} 个客户`);
      }
      
      if (customersToShow.length === 0) {
        toast.info('暂无客户，请先添加客户');
        return;
      }
      
      // 设置选中的培训ID和客户列表，打开选择模态框
      setSelectedTrainingId(trainingId);
      setSalespersonCustomers(customersToShow);
      setIsCustomerSelectModalOpen(true);
    } catch (error) {
      console.error('❌ 获取客户列表失败:', error);
      toast.error('获取客户列表失败，请重试');
    }
  };

  // 确认添加客户 - 添加去重逻辑
  const confirmAddCustomer = async (customer: Customer) => {
    try {
      if (!selectedTrainingId) return;
      
      // 获取当前培训的详细信息（不需要过滤，因为要检查所有参与者）
      const trainingSession = await supabaseService.getTrainingSessionById(selectedTrainingId);
      
      // 检查客户是否已经在该培训中（去重逻辑）
      if (trainingSession && trainingSession.participantsList) {
        const isCustomerAlreadyAdded = trainingSession.participantsList.some(
          participant => participant.customerId === customer.id || participant.name === customer.name
        );
        
        if (isCustomerAlreadyAdded) {
          toast.warning(`${customer.name} 已经在该培训中，请勿重复添加`);
          return;
        }
      }
      
      const success = await supabaseService.addCustomerToTraining(selectedTrainingId, {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        registration_date: new Date().toISOString().split('T')[0],
        payment_status: '已支付',
        salesperson_name: user?.name || '',
        customer_id: customer.id
      });
      
      if (success) {
        toast.success(`已成功添加客户 ${customer.name} 到培训`);
        // 刷新数据（业务员只加载自己的客户）
        const salespersonName = user?.role === 'salesperson' ? user.name : undefined;
        const sessions = await supabaseService.getTrainingSessions(salespersonName);
        setAllSessions(sessions);
        setIsCustomerSelectModalOpen(false);
        
        // 如果详情模态框是打开的，也刷新详情
        if (selectedSession) {
          const salespersonName = user?.role === 'salesperson' ? user.name : undefined;
          const updatedSession = await supabaseService.getTrainingSessionById(selectedSession.id, salespersonName);
          if (updatedSession) {
            setSelectedSession(updatedSession);
          }
        }
      }
    } catch (error) {
      toast.error('添加培训人失败，请重试');
    }
  };

  // 删除参训者
  const handleRemoveParticipant = async (participantId: number, participantName: string) => {
    if (!window.confirm(`确定要移除参训者 ${participantName} 吗？`)) {
      return;
    }

    try {
      const success = await supabaseService.removeParticipantFromTraining(participantId);
      
      if (success) {
        toast.success(`已成功移除参训者 ${participantName}`);
        
        // 刷新培训列表（业务员只加载自己的客户）
        const salespersonName = user?.role === 'salesperson' ? user.name : undefined;
        const sessions = await supabaseService.getTrainingSessions(salespersonName);
        setAllSessions(sessions);
        
        // 刷新详情模态框
        if (selectedSession) {
          const salespersonName = user?.role === 'salesperson' ? user.name : undefined;
          const updatedSession = await supabaseService.getTrainingSessionById(selectedSession.id, salespersonName);
          if (updatedSession) {
            setSelectedSession(updatedSession);
          }
        }
      }
    } catch (error) {
      console.error('❌ 删除参训者失败:', error);
      toast.error('删除参训者失败，请重试');
    }
  };

  // 导出签到表
  const handleExportAttendanceSheet = (type: 'all' | 'bySalesperson') => {
    if (!selectedSession || !selectedSession.participantsList || selectedSession.participantsList.length === 0) {
      toast.error('没有参训人员数据可导出');
      return;
    }

    try {
      // 关闭下拉菜单
      const exportMenu = document.getElementById('export-attendance-menu');
      if (exportMenu) {
        exportMenu.classList.add('hidden');
      }

      // 准备导出数据
      const config = {
        courseName: selectedSession.name,
        date: selectedSession.date,
        endDate: selectedSession.endDate || undefined,
        totalParticipants: selectedSession.participantsList.length,
        participants: selectedSession.participantsList.map(p => ({
          name: p.name,
          salespersonName: p.salespersonName || '未分配',
          phone: p.phone || ''
        }))
      };

      // 根据类型导出
      if (type === 'all') {
        exportAllAttendanceSheet(config);
        toast.success('签到表导出成功');
      } else {
        exportAttendanceSheetBySalesperson(config);
        toast.success('按业务员签到表导出成功');
      }
    } catch (error) {
      console.error('❌ 导出签到表失败:', error);
      toast.error('导出签到表失败，请重试');
    }
  };

  // 处理编辑培训
  const handleEditTraining = (session: TrainingSessionFrontend) => {
    setEditSession(session);
    setIsEditModalOpen(true);
  };

  // 提交编辑培训
  const handleEditTrainingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSession) return;
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      // 获取所有表单数据
      const courseName = formData.get('courseName') as string;
      const courseDescription = formData.get('courseDescription') as string;
      const expertId = parseInt(formData.get('expertId') as string);
      const startDate = formData.get('date') as string;
      const endDate = formData.get('endDate') as string;
      const startTime = formData.get('startTime') as string;
      const endTime = formData.get('endTime') as string;
      const area = formData.get('area') as string;
      const detailedAddress = formData.get('detailedAddress') as string;
      const status = formData.get('status') as string;
      const salespersonId = formData.get('salespersonId') as string;
      const capacity = parseInt(formData.get('capacity') as string) || 30;
      const prospectusId = formData.get('prospectusId') as string;
      
      // 调试日志：查看所有表单数据
      console.log('📝 编辑表单提交数据:', {
        courseName,
        courseDescription,
        expertId,
        startDate,
        endDate,
        startTime,
        endTime,
        area,
        status,
        salespersonId
      });
      
      if (!courseName) {
        toast.error('请输入课程名称');
        return;
      }
      
      const expert = experts.find(e => e.id === expertId);
      
      if (!expert) {
        toast.error('请选择有效的专家');
        return;
      }

      // 验证日期逻辑
      if (endDate && startDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end < start) {
          toast.error('结束日期不能早于开始日期');
          return;
        }
      }

      // 检查专家时间冲突（排除当前正在编辑的培训）
      const hasConflict = allSessions.some(session => {
        // 跳过当前正在编辑的培训
        if (session.id === editSession.id) {
          return false;
        }
        
        // 跳过不是同一个专家的培训
        if (session.expertId !== expertId) {
          return false;
        }
        
        // 获取现有培训的日期范围
        const existingStart = new Date(session.date);
        const existingEnd = session.endDate ? new Date(session.endDate) : new Date(session.date);
        
        // 获取新培训的日期范围
        const newStart = new Date(startDate);
        const newEnd = endDate ? new Date(endDate) : new Date(startDate);
        
        // 检查日期是否有重叠
        const dateOverlap = newStart <= existingEnd && newEnd >= existingStart;
        
        if (!dateOverlap) {
          return false;
        }
        
        // 如果日期有重叠，进一步检查时间
        // 如果没有设置具体时间，则认为是全天培训，有日期重叠就算冲突
        if (!startTime || !endTime || !session.startTime || !session.endTime) {
          return true;
        }
        
        // 如果设置了具体时间，检查时间是否重叠
        // 只有在同一天的情况下才需要检查时间重叠
        const isSameDay = newStart.toDateString() === existingStart.toDateString();
        if (isSameDay) {
          // 时间重叠的条件：新培训的开始时间 < 现有培训的结束时间 && 新培训的结束时间 > 现有培训的开始时间
          const timeOverlap = startTime < session.endTime && endTime > session.startTime;
          return timeOverlap;
        }
        
        return false;
      });
      
      if (hasConflict) {
        toast.error(`专家 ${expert.name} 在该时间段已有其他培训安排，请选择其他时间或专家`);
        return;
      }

      // 准备更新数据
      const updateData = {
        name: courseName,  // 直接使用课程名称，不添加日期后缀
        date: startDate,
        end_date: endDate || null,
        start_time: startTime || null,
        end_time: endTime || null,
        capacity: capacity,
        expert_id: expertId,
        expert_name: expert.name,
        area: area || null,
        detailed_address: detailedAddress || null,
        status: status || null,
        course_id: null,
        course_description: courseDescription || null,
        salesperson_id: salespersonId || null,
        prospectus_id: prospectusId ? parseInt(prospectusId) : null
      };
      
      console.log('💾 准备更新到数据库的数据:', updateData);

      // 调用 API 更新培训场次数据
      await supabaseService.updateTrainingSession(editSession.id, updateData);
      
      console.log('✅ 数据库更新成功');
      
      // 刷新数据（业务员只加载自己的客户）
      const salespersonName = user?.role === 'salesperson' ? user.name : undefined;
      const sessions = await supabaseService.getTrainingSessions(salespersonName);
      setAllSessions(sessions);
      setIsEditModalOpen(false);
      toast.success('培训计划已更新');
    } catch (error: any) {
      console.error('❌ 更新失败:', error);
      toast.error(`更新失败: ${error.message || '请重试'}`);
    }
  };

  // 根据日期自动计算培训状态
  const calculateTrainingStatus = (date: string): string => {
    const trainingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    trainingDate.setHours(0, 0, 0, 0);
    
    if (trainingDate > today) {
      return 'upcoming';      // 即将开始
    } else if (trainingDate.getTime() === today.getTime()) {
      return 'ongoing';       // 进行中
    } else {
      return 'completed';     // 已完成
    }
  };

  // 添加新培训
  const handleAddTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      // 获取表单数据
      const name = formData.get('name') as string;
      const startDate = formData.get('startDate') as string;
      const endDate = formData.get('endDate') as string;
      const expertId = parseInt(formData.get('expertId') as string);
      const startTime = formData.get('startTime') as string;
      const endTime = formData.get('endTime') as string;
      const area = formData.get('area') as string;
      const detailedAddress = formData.get('detailedAddress') as string;
      const capacity = parseInt(formData.get('capacity') as string) || 30;
      const prospectusId = formData.get('prospectusId') as string;
      
      // 验证必填字段
      if (!name || !startDate || !endDate || !expertId) {
        toast.error('请填写所有必填字段');
        return;
      }
      
      // 验证日期逻辑
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end < start) {
        toast.error('结束日期不能早于开始日期');
        return;
      }
      
      // 验证专家是否存在
      const expert = experts.find(e => e.id === expertId);
      if (!expert) {
        toast.error('请选择有效的专家');
        return;
      }
      
      // 验证时间逻辑
      if (startTime && endTime && startTime >= endTime) {
        toast.error('结束时间必须晚于开始时间');
        return;
      }

      // 检查专家时间冲突
      const hasConflict = allSessions.some(session => {
        // 跳过不是同一个专家的培训
        if (session.expertId !== expertId) {
          return false;
        }
        
        // 获取现有培训的日期范围
        const existingStart = new Date(session.date);
        const existingEnd = session.endDate ? new Date(session.endDate) : new Date(session.date);
        
        // 检查日期是否有重叠
        // 两个日期范围重叠的条件：新培训的开始日期 <= 现有培训的结束日期 && 新培训的结束日期 >= 现有培训的开始日期
        const dateOverlap = start <= existingEnd && end >= existingStart;
        
        if (!dateOverlap) {
          return false;
        }
        
        // 如果日期有重叠，进一步检查时间
        // 如果没有设置具体时间，则认为是全天培训，有日期重叠就算冲突
        if (!startTime || !endTime || !session.startTime || !session.endTime) {
          return true;
        }
        
        // 如果设置了具体时间，检查时间是否重叠
        // 只有在同一天的情况下才需要检查时间重叠
        const isSameDay = start.toDateString() === existingStart.toDateString();
        if (isSameDay) {
          // 时间重叠的条件：新培训的开始时间 < 现有培训的结束时间 && 新培训的结束时间 > 现有培训的开始时间
          const timeOverlap = startTime < session.endTime && endTime > session.startTime;
          return timeOverlap;
        }
        
        return false;
      });
      
      if (hasConflict) {
        toast.error(`专家 ${expert.name} 在该时间段已有其他培训安排，请选择其他时间或专家`);
        return;
      }
      
      // 根据开始日期自动计算状态
      const status = calculateTrainingStatus(startDate);
      
      console.log('准备添加培训:', {
        name,
        date: startDate,
        end_date: endDate,
        expert_id: expertId,
        expert_name: expert.name,
        start_time: startTime || null,
        end_time: endTime || null,
        area: area || null,
        status,
        salesperson_name: user?.name || null
      });
      
      // 调用 API 添加培训
      await supabaseService.addTrainingSession({
        name: name,
        date: startDate,
        end_date: endDate,
        start_time: startTime || null,
        end_time: endTime || null,
        capacity: capacity,
        participants: 0,
        expert_id: expertId,
        expert_name: expert.name,
        area: area || null,
        detailed_address: detailedAddress || null,
        revenue: null,
        status: status,
        rating: null,
        salesperson_id: null,
        salesperson_name: user?.name || null,
        course_id: null,
        course_description: null,
        prospectus_id: prospectusId ? parseInt(prospectusId) : null
      });
      
      toast.success('培训添加成功');
      closeModal();
      
      // 刷新数据（业务员只加载自己的客户）
      const salespersonName = user?.role === 'salesperson' ? user.name : undefined;
      const sessions = await supabaseService.getTrainingSessions(salespersonName);
      setAllSessions(sessions);
    } catch (error: any) {
      console.error('添加培训失败:', error);
      toast.error(error.message || '添加失败，请重试');
    }
  };

  // 获取课程名称
  const getCourseName = (courseId?: string): string => {
    if (!courseId) return '-';
    const course = courses.find(c => c.id === courseId);
    return course?.name || '-';
  };

  // 获取课程描述
  const getCourseDescription = (courseId?: string): string => {
    if (!courseId) return '-';
    const course = courses.find(c => c.id === courseId);
    return course?.description || '-';
  };

  // 打开专家详情模态框
  const openExpertDetail = async (expertId: number) => {
    try {
      // 获取专家详细信息
      const experts = await supabaseService.getExperts();
      const expert = experts.find(e => e.id === expertId);
      
      if (expert) {
        setSelectedExpertDetail(expert);
        setIsExpertModalOpen(true);
      } else {
        toast.error('获取专家信息失败');
      }
    } catch (error) {
      toast.error('获取专家信息失败');
    }
  };

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
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">培训计划</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative">
                <i className="fas fa-bell"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              {user?.role === 'admin' && (
                   <button 
                    onClick={openAddModal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center"
                  >
                    <Plus size={16} className="mr-2" />
                    添加培训
                  </button>
              )}
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-900">
          {/* 筛选和搜索区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索培训名称、专家或课程..."
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
                
                {/* 专家筛选 */}
                <select
                  value={selectedExpert}
                  onChange={(e) => setSelectedExpert(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="全部">筛选专家</option>
                  {experts.map(expert => (
                    <option key={expert.id} value={expert.name}>{expert.name}</option>
                  ))}
                </select>
                
                {/* 区域筛选 */}
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="全部">筛选区域</option>
                  {areas.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
                
                {/* 状态筛选 */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="全部">筛选状态</option>
                  {statuses.filter(s => s !== '全部').map(status => (
                    <option key={status} value={status}>{status}</option>
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
              <div
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">负责人</label>
                    <select
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">全部</option>
                      {/* 动态加载业务员列表 */}
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
              </div>
            )}
          </div>

          {/* 数据表格 */}
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
                          培训名称
                          {sortConfig?.key === 'name' && (
                            <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          举办日期
                          {sortConfig?.key === 'date' && (
                            <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleSort('participants')}
                      >
                        <div className="flex items-center">
                          参训人数
                          {sortConfig?.key === 'participants' && (
                            <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleSort('expert')}
                      >
                        <div className="flex items-center">
                          授课专家
                          {sortConfig?.key === 'expert' && (
                            <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        onClick={() => handleSort('area')}
                      >
                        <div className="flex items-center">
                          业务区域
                          {sortConfig?.key === 'area' && (
                            <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        负责人
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
                    {filteredSessions.map((session) => (
                      <tr 
                        key={session.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              <GraduationCap size={20} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-white">{session.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2 text-gray-400" />
                            <span>{session.date}</span>
                            {session.endDate && session.endDate !== session.date && (
                              <span className="mx-1 text-blue-600 font-medium">至 {session.endDate}</span>
                            )}
                          </div>
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock size={12} className="mr-2 text-gray-400" />
                            {session.startTime} - {session.endTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <Users size={14} className="mr-2 text-gray-400" />
                            {/* 专家显示容纳人数，业务员显示自己客户的参训人数，管理员显示总人数 */}
                            {user?.role === 'expert'
                              ? (session.capacity || 30)
                              : user?.role === 'salesperson' 
                                ? (session.participantsList?.length || 0)
                                : session.participants
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <UserCheck size={14} className="mr-2 text-gray-400" />
                            <button 
                              onClick={() => session.expertId && openExpertDetail(session.expertId)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 cursor-pointer"
                              disabled={!session.expertId}
                            >
                              {session.expert}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <MapPin size={14} className="mr-2 text-gray-400" />
                            {session.area}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {session.salespersonName || '未分配'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col space-y-2">
                            {/* 时间状态 */}
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              session.status === 'completed'
                                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                : session.status === 'upcoming'
                                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                            }`}>
                              {session.status === 'completed' ? '已完成' : session.status === 'upcoming' ? '即将开始' : '进行中'}
                            </span>
                            
                            {/* 报名进度条 - 始终显示培训的整体进度（所有业务员的客户） */}
                            {(() => {
                              const capacity = session.capacity || 30;
                              // 使用 session.participants 显示总的报名人数（所有业务员的客户）
                              const enrolled = session.participants || 0;
                              const remaining = Math.max(0, capacity - enrolled);
                              const percentage = Math.min(100, (enrolled / capacity) * 100);
                              
                              // 调试信息
                              console.log(`培训 ${session.name} 整体进度:`, {
                                capacity,
                                totalEnrolled: enrolled,
                                remaining,
                                percentage,
                                myCustomers: session.participantsList?.length || 0
                              });
                              
                              // 根据剩余人数确定颜色
                              let progressColor = 'bg-green-500'; // 绿色：充足
                              if (remaining <= capacity * 0.2) { // 剩余20%以下
                                progressColor = 'bg-red-500'; // 红色：紧张
                              } else if (remaining <= capacity * 0.5) { // 剩余50%以下
                                progressColor = 'bg-yellow-500'; // 黄色：一般
                              }
                              
                              return (
                                <div className="w-full min-w-[120px]">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">报名进度 {enrolled}/{capacity}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">缺口 {remaining}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-300 ${progressColor}`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openDetailModal(session)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                          >
                            详情
                          </button>
                          {user?.role !== 'salesperson' && (
                           <button 
                             className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 mr-3"
                             onClick={() => handleEditTraining(session)}
                           >
                             编辑
                           </button>
                          )}
                          {user?.role !== 'admin' && session.status === 'upcoming' && (
                            <button 
                              className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                              onClick={() => handleAddCustomer(session.id)}
                            >
                              添加培训人
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>{/* 分页控件 */}
              <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6 flex items-center justify-between">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    显示 <span className="font-medium">1</span> 到 <span className="font-medium">{filteredSessions.length}</span> 条，共 <span className="font-medium">{filteredSessions.length}</span> 条结果
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

       {/* 添加培训模态框 */}
       {isAddModalOpen && (
         <div
           className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
           onClick={closeModal}
         >
           <div
             className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white">添加培训计划</h2>
                 <button
                   onClick={closeModal}
                   className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                 >
                   <i className="fas fa-times text-xl"></i>
                 </button>
               </div>

               <form className="space-y-4" onSubmit={handleAddTraining}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* 培训名称 - 必填 */}
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       培训名称 <span className="text-red-500">*</span>
                     </label>
                     <input
                       type="text"
                       name="name"
                       placeholder="例如：前端开发进阶班"
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                       minLength={2}
                     />
                   </div>

                   {/* 开始日期 - 必填 */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       开始日期 <span className="text-red-500">*</span>
                     </label>
                     <input
                       type="date"
                       name="startDate"
                       min={new Date().toISOString().split('T')[0]}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     />
                   </div>

                   {/* 结束日期 - 必填 */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       结束日期 <span className="text-red-500">*</span>
                     </label>
                     <input
                       type="date"
                       name="endDate"
                       min={new Date().toISOString().split('T')[0]}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     />
                   </div>

                   {/* 授课专家 - 必填，下拉选择 */}
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       授课专家 <span className="text-red-500">*</span>
                     </label>
                     <select
                       name="expertId"
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     >
                       <option value="">请选择专家</option>
                       {experts.length > 0 ? (
                         experts.map(expert => (
                           <option key={expert.id} value={expert.id}>{expert.name}</option>
                         ))
                       ) : (
                         <option value="" disabled>加载中...</option>
                       )}
                     </select>
                     {experts.length === 0 && (
                       <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                         正在加载专家列表...
                       </p>
                     )}
                   </div>

                   {/* 开始时间 - 可选 */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">开始时间</label>
                     <input
                       type="time"
                       name="startTime"
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                   </div>

                   {/* 结束时间 - 可选 */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">结束时间</label>
                     <input
                       type="time"
                       name="endTime"
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                   </div>

                   {/* 容纳人数 - 可选 */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">容纳人数</label>
                     <input
                       type="number"
                       name="capacity"
                       defaultValue={30}
                       min={1}
                       placeholder="输入容纳人数"
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                   </div>

                   {/* 业务区域 - 可选，文本输入 */}
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">业务区域</label>
                     <input
                       type="text"
                       name="area"
                       placeholder="例如：北京、上海"
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                   </div>

                   {/* 详细地址 - 可选 */}
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">详细地址</label>
                     <input
                       type="text"
                       name="detailedAddress"
                       placeholder="例如：北京市朝阳区建国路88号SOHO现代城A座10层"
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                   </div>

                   {/* 招商简章 - 可选 */}
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">招商简章</label>
                     <select
                       name="prospectusId"
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     >
                       <option value="">不关联简章</option>
                       {prospectuses.map(p => (
                         <option key={p.id} value={p.id}>
                           {p.name} {p.has_sealed_version && '(已盖章)'}
                         </option>
                       ))}
                     </select>
                   </div>
                 </div>

                 {/* 提示信息 */}
                 <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                   <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                     <i className="fas fa-info-circle mr-2"></i>
                     培训状态将根据开始日期自动设置，负责人为当前登录用户
                   </p>
                 </div>

                 <div className="mt-6 flex justify-end">
                   <button
                     type="button"
                     onClick={closeModal}
                     className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors mr-2"
                   >
                     取消
                   </button>
                   <button
                     type="submit"
                     className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                   >
                     保存培训计划
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       )}

       {/* 编辑培训模态框 */}
       {isEditModalOpen && editSession && (
         <div
           className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
           onClick={() => setIsEditModalOpen(false)}
         >
           <div
             className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}
           >
             <div className="p-6">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-white">编辑培训计划</h2>
                 <button
                   onClick={() => setIsEditModalOpen(false)}
                   className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                 >
                   <i className="fas fa-times text-xl"></i>
                 </button>
               </div>

               <form className="space-y-4" onSubmit={handleEditTrainingSubmit}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">课程名称</label>
                     <input
                       type="text"
                       name="courseName"
                       defaultValue={editSession.courseId ? getCourseName(editSession.courseId) : editSession.name}
                       placeholder="请输入课程名称"
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">授课专家</label>
                     <select
                       name="expertId"
                       defaultValue={editSession.expertId || ''}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     >
                       <option value="">请选择专家</option>
                       {experts.map(expert => (
                         <option key={expert.id} value={expert.id}>{expert.name}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">开始日期</label>
                     <input
                       type="date"
                       name="date"
                       defaultValue={editSession.date}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">结束日期</label>
                     <input
                       type="date"
                       name="endDate"
                       defaultValue={editSession.endDate || ''}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">业务区域</label>
                     <select 
                       name="area"
                       defaultValue={editSession.area || ''}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     >
                       <option value="">请选择区域</option>
                       {areas.map(area => (
                         <option key={area} value={area}>{area}</option>
                       ))}
                     </select>
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">详细地址</label>
                     <input
                       type="text"
                       name="detailedAddress"
                       defaultValue={editSession.detailedAddress || ''}
                       placeholder="例如：北京市朝阳区建国路88号SOHO现代城A座10层"
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">招商简章</label>
                     <select
                       name="prospectusId"
                       defaultValue={editSession.prospectusId || ''}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     >
                       <option value="">不关联简章</option>
                       {prospectuses.map(p => (
                         <option key={p.id} value={p.id}>
                           {p.name} {p.has_sealed_version && '(已盖章)'}
                         </option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">开始时间</label>
                     <input
                       type="time"
                       name="startTime"
                       defaultValue={editSession.startTime}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">结束时间</label>
                     <input
                       type="time"
                       name="endTime"
                       defaultValue={editSession.endTime}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">容纳人数</label>
                     <input
                       type="number"
                       name="capacity"
                       defaultValue={editSession.capacity || 30}
                       min={1}
                       placeholder="输入容纳人数"
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">培训状态</label>
                     <select 
                       name="status"
                       defaultValue={editSession.status || ''}
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       required
                     >
                       <option value="upcoming">即将开始</option>
                       <option value="ongoing">进行中</option>
                       <option value="completed">已完成</option>
                     </select>
                   </div>
                   {user?.role === 'admin' && (
                     <div>
                       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">负责人</label>
                       <select
                         name="salespersonId"
                         defaultValue={editSession.salespersonId || ''}
                         className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                       >
                         <option value="">未分配</option>
                         {/* 动态加载业务员列表 */}
                       </select>
                     </div>
                   )}
                 </div>

                 {/* 课程内容 - 全宽字段 */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">课程内容</label>
                   <textarea
                     name="courseDescription"
                     defaultValue={editSession.courseDescription || (editSession.courseId ? getCourseDescription(editSession.courseId) : '')}
                     placeholder="请输入课程内容描述"
                     rows={4}
                     className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical"
                   />
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
                     保存修改
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       )}

      {/* 培训详情模态框 */}
      {isDetailModalOpen && selectedSession && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">培训详情</h2>
                <div className="flex items-center gap-3">
                  {/* 导出签到表按钮 */}
                  {user?.role === 'admin' && selectedSession.participantsList && selectedSession.participantsList.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const exportMenu = document.getElementById('export-attendance-menu');
                          if (exportMenu) {
                            exportMenu.classList.toggle('hidden');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors flex items-center gap-2"
                      >
                        <i className="fas fa-file-export"></i>
                        导出签到表
                        <ChevronDown size={14} />
                      </button>
                      <div
                        id="export-attendance-menu"
                        className="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleExportAttendanceSheet('all')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg transition-colors"
                        >
                          全部导出
                        </button>
                        <button
                          onClick={() => handleExportAttendanceSheet('bySalesperson')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b-lg transition-colors"
                        >
                          按业务员导出
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{selectedSession.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedSession.date}
                        {selectedSession.endDate && selectedSession.endDate !== selectedSession.date && (
                          <> 至 {selectedSession.endDate}</>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{selectedSession.startTime} - {selectedSession.endTime}</span>
                    </div>
                    <div className="flex items-start">
                      <MapPin size={16} className="text-gray-500 dark:text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{selectedSession.area}</span>
                        {selectedSession.detailedAddress && (
                          <a
                            href={`https://www.amap.com/search?query=${encodeURIComponent(selectedSession.detailedAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>{selectedSession.detailedAddress}</span>
                            <ExternalLink size={12} className="flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 培训内容/简介区域 */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3">培训内容</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                    {selectedSession.courseDescription || getCourseDescription(selectedSession.courseId || undefined) || '暂无课程内容描述'}
                  </p>
                </div>

                {/* 专家角色不显示专家信息、培训统计、其他信息板块 */}
                {user?.role !== 'expert' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3">专家信息</h4>
                      <div className="flex items-start gap-3">
                        <img
                          src={selectedExpertDetail?.avatar || generateDefaultAvatar(selectedSession.expert, 96)}
                          alt={selectedSession.expert}
                          className="flex-shrink-0 h-12 w-12 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <div 
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                            onClick={() => selectedSession.expertId && openExpertDetail(selectedSession.expertId)}
                          >
                            {selectedSession.expert}
                          </div>
                          {selectedExpertDetail?.title && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {selectedExpertDetail.title}
                            </div>
                          )}
                          {selectedExpertDetail?.bio && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                              {selectedExpertDetail.bio}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3">培训统计</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">容纳人数</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white">{selectedSession.capacity || 30}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">已报名人数</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white">{selectedSession.participants || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">缺口人数</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white">{Math.max(0, (selectedSession.capacity || 30) - (selectedSession.participants || 0))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3">其他信息</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">状态</span>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            selectedSession.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                              : selectedSession.status === 'upcoming'
                              ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                              : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                          }`}>
                            {selectedSession.status === 'completed' ? '已完成' : selectedSession.status === 'upcoming' ? '即将开始' : '进行中'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">负责人</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white">{selectedSession.salespersonName || '未分配'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">对应课程</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-white">{getCourseName(selectedSession.courseId || undefined)}</span>
                        </div>
                      </div>
                    </div>

                    {/* 招商简章区域 */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3">招商简章</h4>
                      {selectedSession.prospectusId ? (
                        <div className="space-y-3">
                          {(() => {
                            const prospectus = prospectuses.find(p => p.id === selectedSession.prospectusId);
                            if (!prospectus) {
                              return (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  简章信息加载失败
                                </div>
                              );
                            }
                            return (
                              <>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-800 dark:text-white flex items-center">
                                      {prospectus.name}
                                      {prospectus.has_sealed_version && (
                                        <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full">
                                          已盖章
                                        </span>
                                      )}
                                    </div>
                                    {prospectus.type && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        类型: {prospectus.type}
                                      </div>
                                    )}
                                    {prospectus.description && (
                                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                        {prospectus.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {(user?.role === 'admin' || user?.role === 'salesperson') && (
                                  <button
                                    onClick={async () => {
                                      const loadingToast = toast.loading('正在准备下载...');
                                      try {
                                        const url = await prospectusService.downloadProspectus(
                                          prospectus.id,
                                          true,
                                          selectedSession.id
                                        );
                                        
                                        // 使用 fetch 获取文件内容，然后创建 Blob URL 强制下载
                                        const response = await fetch(url);
                                        if (!response.ok) {
                                          throw new Error('下载文件失败');
                                        }
                                        
                                        const blob = await response.blob();
                                        const blobUrl = URL.createObjectURL(blob);
                                        
                                        // 创建隐藏的 a 标签触发下载
                                        const link = document.createElement('a');
                                        link.href = blobUrl;
                                        link.download = prospectus.name + '.pdf';
                                        link.style.display = 'none';
                                        document.body.appendChild(link);
                                        link.click();
                                        
                                        // 清理
                                        document.body.removeChild(link);
                                        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                        
                                        toast.dismiss(loadingToast);
                                        toast.success('简章下载成功');
                                      } catch (error: any) {
                                        toast.dismiss(loadingToast);
                                        toast.error(error.message || '下载失败');
                                      }
                                    }}
                                    className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                                  >
                                    <i className="fas fa-download"></i>
                                    下载简章{prospectus.has_sealed_version && '（盖章版）'}
                                  </button>
                                )}
                                {user?.role !== 'admin' && user?.role !== 'salesperson' && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                                    专家角色仅可查看，无下载权限
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                          暂无关联招商简章
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 专家角色不显示参训人员详细信息 */}
                {user?.role !== 'expert' && selectedSession.participantsList && selectedSession.participantsList.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3">
                      参训人员 ({selectedSession.participantsList.length})
                      {user?.role === 'salesperson' && (
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">（仅显示您的客户）</span>
                      )}
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">姓名</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">电话</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">邮箱</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">报名日期</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">支付状态</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {selectedSession.participantsList.map((participant) => {
                            // 业务员只能删除自己的客户，管理员可以删除所有客户
                            const canDelete = user?.role === 'admin' || participant.salespersonName === user?.name;
                            
                            return (
                              <tr key={participant.id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 dark:text-white">{participant.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{participant.phone}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{participant.email}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{participant.registrationDate}</td>
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    participant.paymentStatus === '已支付'
                                      ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                                      : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                                  }`}>
                                    {participant.paymentStatus}
                                  </span>
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  {canDelete ? (
                                    <button
                                      onClick={() => handleRemoveParticipant(participant.id, participant.name)}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                                      title="移除参训者"
                                    >
                                      删除
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-600 text-xs">无权限</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  关闭
                </button>
                {user?.role !== 'admin' && selectedSession.status === 'upcoming' && (
                  <button 
                    className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                    onClick={() => handleAddCustomer(selectedSession.id)}
                  >
                    添加客户
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

       {/* 客户选择模态框 */}
      {isCustomerSelectModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsCustomerSelectModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">选择客户</h2>
                <button
                  onClick={() => setIsCustomerSelectModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              {/* 搜索框 */}
              <div className="relative mb-4">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索客户姓名、公司或邮箱..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="space-y-4">
                {/* 应用搜索筛选 */}
                {salespersonCustomers
                  .filter(customer => 
                    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
                    (customer.company && customer.company.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
                    (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase()))
                  )
                  .map(customer => (
                    <div 
                      key={customer.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => confirmAddCustomer(customer)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <img
                            className="h-12 w-12 rounded-full object-cover"
                            src={customer.avatar || ''}
                            alt={customer.name}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-800 dark:text-white">{customer.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{customer.company} · {customer.position}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full mr-3 ${
                          customer.status === '已成交'
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                            : customer.status === '跟进中'
                            ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                            : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                        }`}>
                          {customer.status}
                        </span>
                        <button 
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmAddCustomer(customer);
                          }}
                        >
                          选择
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              
              {/* 清空搜索按钮 */}
              {customerSearchTerm && (
                <div className="flex justify-center mt-4">
                  <button 
                    onClick={() => setCustomerSearchTerm('')}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm"
                  >
                    清空搜索
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 专家详情模态框 */}
      {isExpertModalOpen && selectedExpertDetail && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">专家详情</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-shrink-0">
                  <img
                    src={selectedExpertDetail.avatar || ''}
                    alt={selectedExpertDetail.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedExpertDetail.name}</h3>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedExpertDetail.available
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                    }`}>
                      {selectedExpertDetail.available ? '可预约' : '不可预约'}
                    </span>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">{selectedExpertDetail.title}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center">
                      <i className="fas fa-graduation-cap text-gray-400 mr-2"></i>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedExpertDetail.field}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedExpertDetail.experience}授课经验</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedExpertDetail.location}</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-star text-yellow-400 mr-2"></i>
                      <span className="text-sm text-gray-600 dark:text-gray-400">评分: {selectedExpertDetail.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">简介</p><p className="text-sm text-gray-700 dark:text-gray-300">{selectedExpertDetail.bio}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">擅长课程</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedExpertDetail.courses && selectedExpertDetail.courses.map((course, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-sm rounded-full">
                      {course}
                    </span>
                  ))}
                  {(!selectedExpertDetail.courses || selectedExpertDetail.courses.length === 0) && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">暂无课程信息</span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">历史培训统计</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">总培训场次</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{selectedExpertDetail.past_sessions}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">总参训人数</p>
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{selectedExpertDetail.total_participants}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">授课课程</h4>
                {selectedExpertDetail.courses && selectedExpertDetail.courses.length > 0 ? (
                  <div className="space-y-2">
                    {selectedExpertDetail.courses.map((courseName: string, index: number) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{courseName}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">暂无课程信息</p>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}