import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { Plus, Search, Calendar, MapPin, Users, DollarSign, Eye, Edit, UserPlus, Trash2, ChevronLeft, ChevronRight, Upload, Download } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TrainingSessionFormModal from '@/components/TrainingSessionFormModal';
import ParticipantFormModal from '@/components/ParticipantFormModal';
import DeleteSessionDialog from '@/components/DeleteSessionDialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import type { TrainingSession, TrainingSessionFrontend, CourseWithSessions } from '@/lib/supabase/types';
import { dbToFrontendTrainingSession } from '@/lib/supabase/types';
import courseService from '@/lib/services/courseService';
import trainingSessionService from '@/lib/services/trainingSessionService';
import { getStatusText, getStatusClassName, calculateTrainingStatus } from '@/utils/statusUtils';

export default function TrainingManagement() {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('month');
  const [selectedExpert, setSelectedExpert] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [trainingSessions, setTrainingSessions] = useState<TrainingSessionFrontend[]>([]);
  const [courses, setCourses] = useState<CourseWithSessions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithSessions | null>(null);
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSessionFrontend | null>(null);
  // 删除相关状态
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<TrainingSessionFrontend | null>(null);
  const [participantCount, setParticipantCount] = useState(0);
  
  // 时间线视图状态
  const [timelineStartDate, setTimelineStartDate] = useState(new Date());
  const [timelineDays, setTimelineDays] = useState(14); // 默认显示14天

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 加载课程数据
      const coursesData = await courseService.getCoursesWithSessions();
      setCourses(coursesData);
      
      // 加载培训场次（过滤已删除）
      const { data: sessionsData, error } = await supabase
        .from('training_sessions')
        .select('*')
        .is('deleted_at', null)  // 只显示未删除的
        .order('date', { ascending: false});

      if (error) throw error;

      const sessions = (sessionsData || []).map((session: TrainingSession) => 
        dbToFrontendTrainingSession(session)
      );
      
      setTrainingSessions(sessions);
    } catch (error: any) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理导入培训场次
  const handleImportSessions = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const { parseFile } = await import('@/lib/parsers/fileParser');
          const { validateData } = await import('@/lib/validators/dataValidator');
          const dataManagementService = (await import('@/lib/services/dataManagementService')).default;
          
          toast.loading('正在解析文件...');
          const data = await parseFile(file, 'training_sessions');
          
          const validation = await validateData(data, 'training_sessions');
          if (validation.length > 0 && validation[0].error) {
            toast.error(`验证失败: ${validation[0].error}`);
            return;
          }
          
          const result = await dataManagementService.importData('training_sessions', data, 'skip');
          
          if (result.success > 0) {
            toast.success(`成功导入 ${result.success} 个培训场次`);
            loadData(); // 刷新列表
          }
          if (result.failed > 0) {
            toast.error(`${result.failed} 个培训场次导入失败`);
          }
        } catch (error: any) {
          toast.error(error.message || '导入失败');
        }
      }
    };
    input.click();
  };

  // 处理导出培训场次
  const handleExportSessions = async () => {
    try {
      const dataManagementService = (await import('@/lib/services/dataManagementService')).default;
      
      toast.loading('正在导出...');
      
      // 导出配置
      const config = {
        dataType: 'training_sessions' as const,
        format: 'excel' as const,
        range: 'all' as const,
        selectedFields: ['course_name', 'session_number', 'name', 'date', 'end_date', 'location', 'area', 'instructor', 'expert', 'salesperson_name', 'capacity', 'participants', 'status'],
        filters: {}
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
      a.download = `培训计划_${new Date().toLocaleDateString('zh-CN')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('导出成功');
    } catch (error: any) {
      toast.error(error.message || '导出失败');
    }
  };

  // 打开添加场次模态框
  const handleAddSession = () => {
    if (courses.length === 0) {
      toast.warning('请先创建课程');
      return;
    }
    // 默认选择第一个课程
    setSelectedCourse(courses[0]);
    setIsAddModalOpen(true);
  };

  // 保存培训场次
  const handleSaveSession = async (sessionData: Partial<TrainingSession>) => {
    try {
      const { error } = await supabase
        .from('training_sessions')
        .insert(sessionData as any);

      if (error) throw error;

      toast.success('培训场次添加成功');
      loadData();
    } catch (error: any) {
      console.error('添加培训场次失败:', error);
      toast.error(error.message || '添加培训场次失败');
      throw error;
    }
  };

  // 打开添加参训人员模态框
  const handleAddParticipant = (session: TrainingSessionFrontend) => {
    setSelectedSession(session);
    setIsParticipantModalOpen(true);
  };

  // 保存参训人员后重新加载
  const handleSaveParticipant = async () => {
    await loadData();
    setIsParticipantModalOpen(false);
  };
  
  // 打开删除确认对话框
  const handleDeleteClick = async (session: TrainingSessionFrontend) => {
    setSessionToDelete(session);
    
    // 获取参训人数
    try {
      const count = await trainingSessionService.getParticipantCount(session.id);
      setParticipantCount(count);
    } catch (error) {
      console.error('获取参训人数失败:', error);
      setParticipantCount(0);
    }
    
    setIsDeleteDialogOpen(true);
  };
  
  // 确认删除
  const handleConfirmDelete = async (deleteType: 'hard' | 'soft', reason: string) => {
    if (!sessionToDelete || !user) return;
    
    try {
      await trainingSessionService.deleteSession(sessionToDelete.id, {
        deleteType,
        reason,
        userId: user.id,
        userName: user.name || '系统管理员'
      });
      
      if (deleteType === 'soft') {
        toast.success('培训已临时删除，可在管理员界面恢复');
      } else {
        toast.success('培训已彻底删除，数据已自动备份到数据库');
      }
      
      await loadData();
      setIsDeleteDialogOpen(false);
      setSessionToDelete(null);
      setParticipantCount(0);
    } catch (error: any) {
      console.error('删除失败:', error);
      toast.error(error.message || '删除失败，请重试');
      throw error;
    }
  };

  // 过滤数据
  const getFilteredSessions = () => {
    let filtered = trainingSessions;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.area?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 日期过滤
    const now = new Date();
    if (selectedDateFilter === 'day') {
      const today = now.toISOString().split('T')[0];
      filtered = filtered.filter(session => session.date === today);
    } else if (selectedDateFilter === 'month') {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear;
      });
    } else if (selectedDateFilter === 'year') {
      const currentYear = now.getFullYear();
      filtered = filtered.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.getFullYear() === currentYear;
      });
    }

    // 专家过滤
    if (selectedExpert !== 'all') {
      filtered = filtered.filter(session => session.expert === selectedExpert);
    }

    // 地区过滤
    if (selectedArea !== 'all') {
      filtered = filtered.filter(session => session.area === selectedArea);
    }

    // 状态过滤
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(session => session.status === selectedStatus);
    }

    return filtered;
  };

  const filteredSessions = getFilteredSessions();

  // 获取唯一值用于筛选器
  const uniqueExperts = [...new Set(trainingSessions.map(s => s.expert).filter(Boolean))];
  const uniqueAreas = [...new Set(trainingSessions.map(s => s.area).filter(Boolean))];

  // 时间线辅助函数
  const getTimelineDates = () => {
    const dates = [];
    const startDate = new Date(timelineStartDate);
    for (let i = 0; i < timelineDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    console.log('时间线日期数量:', dates.length, '起始日期:', startDate.toISOString().split('T')[0]);
    return dates;
  };

  const getSessionsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return trainingSessions.filter(session => {
      const sessionStart = session.date;
      const sessionEnd = session.endDate || session.date;
      return dateStr >= sessionStart && dateStr <= sessionEnd;
    });
  };

  const navigateTimeline = (direction: 'prev' | 'next') => {
    const newDate = new Date(timelineStartDate);
    const daysToMove = Math.floor(timelineDays / 2);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? daysToMove : -daysToMove));
    setTimelineStartDate(newDate);
  };

  const getAreaColor = (area: string) => {
    const colors: { [key: string]: string } = {
      '上海': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700',
      '广州': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
      '杭州': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
      '深圳': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700',
      '北京': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
    };
    return colors[area] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600';
  };

  // 状态显示
  // 使用统一的状态工具 getStatusClassName 和 getStatusText (已导入)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-8">
            {/* 页面头部 */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Calendar className="mr-3" size={32} />
                    培训计划
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    管理培训场次和参与者
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* 导入培训 */}
                  <button
                    onClick={handleImportSessions}
                    className="px-2 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1 sm:gap-2"
                    title="批量导入培训计划"
                  >
                    <Upload size={20} />
                    <span className="hidden sm:inline">导入</span>
                  </button>
                  
                  {/* 导出培训 */}
                  <button
                    onClick={handleExportSessions}
                    className="px-2 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1 sm:gap-2"
                    title="导出培训数据"
                  >
                    <Download size={20} />
                    <span className="hidden sm:inline">导出</span>
                  </button>
                  
                  {/* 添加培训 */}
                  {user?.role === 'admin' && (
                    <button
                      onClick={handleAddSession}
                      className="px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                    >
                      <Plus size={20} />
                      <span className="ml-1 sm:ml-0">添加<span className="hidden sm:inline">培训</span></span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 时间线视图 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
              {/* 时间线头部 */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar size={20} />
                  培训排期时间线
                </h2>
                <div className="flex items-center gap-2">
                  {/* 时间范围切换 */}
                  <select
                    value={timelineDays}
                    onChange={(e) => setTimelineDays(Number(e.target.value))}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={7}>7天</option>
                    <option value={14}>14天</option>
                    <option value={21}>21天</option>
                    <option value={30}>30天</option>
                  </select>
                  {/* 导航按钮 */}
                  <button
                    onClick={() => navigateTimeline('prev')}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="前一周"
                  >
                    <ChevronLeft size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => setTimelineStartDate(new Date())}
                    className="px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                    title="回到今天"
                  >
                    今天
                  </button>
                  <button
                    onClick={() => navigateTimeline('next')}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="后一周"
                  >
                    <ChevronRight size={20} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* 时间线主体 */}
              <div className="overflow-x-auto">
                <div className="flex gap-2 min-w-max pb-2">
                  {getTimelineDates().map((date, index) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const isToday = dateStr === new Date().toISOString().split('T')[0];
                    const dayName = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
                    const sessions = getSessionsForDate(date);

                    return (
                      <div
                        key={index}
                        className={`flex-shrink-0 w-32 border rounded-lg ${
                          isToday
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
                        }`}
                      >
                        {/* 日期头 */}
                        <div className={`p-2 border-b text-center ${
                          isToday
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-100 dark:bg-blue-900/30'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}>
                          <div className={`text-xs ${
                            isToday
                              ? 'text-blue-600 dark:text-blue-400 font-semibold'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            周{dayName}
                          </div>
                          <div className={`text-sm font-semibold ${
                            isToday
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {date.getMonth() + 1}/{date.getDate()}
                          </div>
                        </div>

                        {/* 培训列表 */}
                        <div className="p-2 space-y-2 min-h-[120px]">
                          {sessions.length === 0 ? (
                            <div className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">
                              无培训
                            </div>
                          ) : (
                            sessions.slice(0, 3).map((session) => (
                              <div
                                key={session.id}
                                className={`p-2 rounded border ${getAreaColor(session.area || '')} cursor-pointer hover:shadow-md transition-shadow`}
                                onClick={() => {
                                  setSelectedSession(session);
                                  setIsParticipantModalOpen(true);
                                }}
                                title={`${session.name}\n${session.area || ''}\n${session.participants || 0}/${session.capacity}人`}
                              >
                                <div className="text-xs font-semibold truncate mb-1">
                                  {session.name}
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <MapPin size={10} />
                                  <span className="truncate">{session.area || '-'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs mt-1">
                                  <Users size={10} />
                                  <span>{session.participants || 0}/{session.capacity}</span>
                                </div>
                              </div>
                            ))
                          )}
                          {sessions.length > 3 && (
                            <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                              +{sessions.length - 3} 更多
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 搜索和筛选 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* 搜索框 */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="搜索培训名称、地区..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* 筛选器 */}
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={selectedDateFilter}
                    onChange={(e) => setSelectedDateFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">全部日期</option>
                    <option value="day">今天</option>
                    <option value="month">本月</option>
                    <option value="year">本年</option>
                  </select>

                  <select
                    value={selectedExpert}
                    onChange={(e) => setSelectedExpert(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">南选专家</option>
                    {uniqueExperts.map(expert => (
                      <option key={expert || 'unknown'} value={expert || ''}>{expert}</option>
                    ))}
                  </select>

                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">南选地区</option>
                    {uniqueAreas.map(area => (
                      <option key={area || 'unknown'} value={area || ''}>{area}</option>
                    ))}
                  </select>

                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">全部状态</option>
                    <option value="upcoming">即将开始</option>
                    <option value="ongoing">进行中</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 培训列表 */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">加载中...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-gray-500 dark:text-gray-400">暂无培训计划</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      {/* 左侧信息 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {session.name}
                          </h3>
                          {(() => {
                            const realStatus = calculateTrainingStatus(session.date, session.endDate || undefined);
                            return (
                              <span className={`px-2 py-1 text-xs rounded ${getStatusClassName(realStatus)}`}>
                                {getStatusText(realStatus)}
                              </span>
                            );
                          })()}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {/* 日期 */}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Calendar size={16} />
                            <span>{session.date} 至 {session.endDate || session.date}</span>
                          </div>

                          {/* 参训人数 */}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Users size={16} />
                            <span>{session.participants || 0}人</span>
                          </div>

                          {/* 收费标准 */}
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <DollarSign size={16} />
                            <span>
                              线上: ¥{session.online_price?.toLocaleString() || 0} | 
                              线下: ¥{session.offline_price?.toLocaleString() || 0}
                            </span>
                          </div>

                          {/* 地区 */}
                          {session.area && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <MapPin size={16} />
                              <span>{session.area}</span>
                            </div>
                          )}
                        </div>

                        {/* 进度条 */}
                        {session.capacity > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600 dark:text-gray-400">
                                报名进度: {session.participants}/{session.capacity}人
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {Math.round((session.participants / session.capacity) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((session.participants / session.capacity) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* 负责人和专家 */}
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          {session.salespersonName && (
                            <span>负责人: {session.salespersonName}</span>
                          )}
                          {session.expert && session.expert !== '未指定' && (
                            <span>专家: {session.expert}</span>
                          )}
                        </div>
                      </div>

                      {/* 右侧操作按钮 */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="查看详情"
                        >
                          <Eye size={18} />
                        </button>
                        {user?.role === 'admin' && (
                          <>
                            <button
                              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="编辑"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleAddParticipant(session)}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm flex items-center gap-1"
                              title="添加参训人"
                            >
                              <UserPlus size={16} />
                              添加团组/人
                            </button>
                            <button
                              onClick={() => handleDeleteClick(session)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="删除培训"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 添加培训场次模态框 */}
      {isAddModalOpen && selectedCourse && (
        <TrainingSessionFormModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedCourse(null);
          }}
          onSave={handleSaveSession}
          course={selectedCourse}
        />
      )}

      {/* 添加参训人员模态框 */}
      {isParticipantModalOpen && selectedSession && (
        <ParticipantFormModal
          isOpen={isParticipantModalOpen}
          onClose={() => {
            setIsParticipantModalOpen(false);
            setSelectedSession(null);
          }}
          onSave={handleSaveParticipant}
          session={selectedSession}
        />
      )}
      
      {/* 删除确认对话框 */}
      <DeleteSessionDialog
        isOpen={isDeleteDialogOpen}
        session={sessionToDelete}
        participantCount={participantCount}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSessionToDelete(null);
          setParticipantCount(0);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
