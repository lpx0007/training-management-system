import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { Plus, Search, Download, Upload, Grid3X3, List, CheckSquare, Menu, BookOpen } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/Notifications/NotificationBell';
import { CourseCard } from '@/components/CourseCard';
import { CourseTable } from '@/components/CourseTable';
import { CourseMergedView } from '@/components/CourseMergedView';
import CourseFormModal from '@/components/CourseFormModal';
import CourseImportModal from '@/components/CourseImportModal';
import TrainingSessionFormModal from '@/components/TrainingSessionFormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import courseService from '@/lib/services/courseService';
import trainingSessionService from '@/lib/services/trainingSessionService';
import type { CourseWithSessions, CourseDB, TrainingSession } from '@/lib/supabase/types';

type ViewMode = 'card' | 'list' | 'merged';

export default function CourseManagement() {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [selectedManager, setSelectedManager] = useState('全部');
  const [coursesWithSessions, setCoursesWithSessions] = useState<CourseWithSessions[]>([]);
  const [managers, setManagers] = useState<Array<{id: string, name: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseDB | null>(null);
  const [modules, setModules] = useState<string[]>([]);
  const [isBatchManagerModalOpen, setIsBatchManagerModalOpen] = useState(false);
  const [batchManagerId, setBatchManagerId] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [enableBatchSelect, setEnableBatchSelect] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [selectedCourseForSession, setSelectedCourseForSession] = useState<CourseWithSessions | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // 初始化数据
  useEffect(() => {
    loadData();
  }, []);

  // 加载数据
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 加载带场次信息的课程数据（所有视图都需要）
      const data = await courseService.getCoursesWithSessions();
      setCoursesWithSessions(data);
      
      // 提取所有模块
      const uniqueModules = [...new Set(data.map((c: CourseWithSessions) => c.module))].filter(Boolean) as string[];
      setModules(uniqueModules);
      
      // 提取所有负责人
      const uniqueManagers = data
        .filter((c: CourseWithSessions) => c.projectManagerId && c.projectManagerName)
        .map((c: CourseWithSessions) => ({ id: c.projectManagerId!, name: c.projectManagerName! }))
        .filter((m, index, self) => self.findIndex(t => t.id === m.id) === index);
      setManagers(uniqueManagers);
    } catch (error: any) {
      console.error('加载课程失败:', error);
      toast.error('加载课程失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 切换视图模式
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    loadData();
  };

  // 过滤课程
  const getFilteredCourses = () => {
    let filtered = coursesWithSessions;
    
    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // 模块过滤
    if (selectedModule !== '全部') {
      filtered = filtered.filter(course => course.module === selectedModule);
    }
    
    // 状态过滤
    if (selectedStatus !== '全部') {
      filtered = filtered.filter(course => course.status === selectedStatus);
    }
    
    // 负责人过滤
    if (selectedManager !== '全部') {
      filtered = filtered.filter(course => course.projectManagerId === selectedManager);
    }
    
    return filtered;
  };

  const filteredData = getFilteredCourses();

  // 添加课程
  const handleAddCourse = async (courseData: Partial<CourseDB>) => {
    try {
      await courseService.createCourse(courseData);
      toast.success('课程添加成功');
      setIsAddModalOpen(false);
      loadData();
    } catch (error: any) {
      console.error('添加课程失败:', error);
      toast.error(error.message || '添加课程失败');
    }
  };

  // 编辑课程
  const handleEditCourse = async (courseData: Partial<CourseDB>) => {
    if (!selectedCourse) return;
    
    try {
      await courseService.updateCourse(selectedCourse.id, courseData);
      toast.success('课程更新成功');
      setIsEditModalOpen(false);
      setSelectedCourse(null);
      loadData();
    } catch (error: any) {
      console.error('更新课程失败:', error);
      toast.error(error.message || '更新课程失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = async (courseId: number) => {
    try {
      // 从数据库获取最新数据
      const courseData = await courseService.getCourseById(courseId);
      if (courseData) {
        setSelectedCourse(courseData);
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error('获取课程数据失败:', error);
      toast.error('无法加载课程数据');
    }
  };

  // 添加培训场次
  const handleAddSession = (courseId: number) => {
    const course = coursesWithSessions.find(c => c.id === courseId);
    if (course) {
      setSelectedCourseForSession(course);
      setIsSessionModalOpen(true);
    }
  };

  // 保存培训场次
  const handleSaveSession = async (sessionData: Partial<TrainingSession>) => {
    try {
      await trainingSessionService.createTrainingSession(sessionData);
      toast.success('培训场次添加成功');
      loadData(); // 重新加载数据以更新期数
    } catch (error: any) {
      console.error('添加培训场次失败:', error);
      toast.error(error.message || '添加培训场次失败');
      throw error; // 让模态框知道保存失败
    }
  };

  // 打开删除确认对话框
  const handleDeleteClick = (courseId: number) => {
    setCourseToDelete(courseId);
    setIsDeleteDialogOpen(true);
  };

  // 确认删除课程
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    setIsDeleting(true);
    try {
      // 检查是否有关联的培训场次
      const courseWithSessions = coursesWithSessions.find(c => c.id === courseToDelete);
      if (courseWithSessions && courseWithSessions.actualSessionCount > 0) {
        toast.error(`无法删除：该课程已有${courseWithSessions.actualSessionCount}个培训场次，请先删除相关场次`);
        setIsDeleteDialogOpen(false);
        setCourseToDelete(null);
        setIsDeleting(false);
        return;
      }

      await courseService.deleteCourse(courseToDelete);
      toast.success('课程删除成功');
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
      loadData();
    } catch (error: any) {
      console.error('删除课程失败:', error);
      toast.error(error.message || '删除课程失败');
    } finally {
      setIsDeleting(false);
    }
  };

  // 取消删除
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setCourseToDelete(null);
  };

  // 批量修改状态
  const handleBatchChangeStatus = async (status: 'active' | 'inactive') => {
    if (selectedCourseIds.length === 0) {
      toast.warning('请先选择要修改的课程');
      return;
    }

    try {
      const promises = selectedCourseIds.map(id => 
        courseService.updateCourse(id, { status })
      );
      await Promise.all(promises);
      toast.success(`已${status === 'active' ? '启用' : '停用'}${selectedCourseIds.length}个课程`);
      setSelectedCourseIds([]);
      loadData();
    } catch (error: any) {
      console.error('批量修改状态失败:', error);
      toast.error(error.message || '批量修改状态失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedCourseIds.length === 0) {
      toast.warning('请先选择要删除的课程');
      return;
    }

    // 检查是否有关联场次
    const coursesWithSessionsList = selectedCourseIds.filter(id => {
      const course = coursesWithSessions.find((c: CourseWithSessions) => c.id === id);
      return course && course.actualSessionCount > 0;
    });

    if (coursesWithSessionsList.length > 0) {
      toast.error(`有${coursesWithSessionsList.length}个课程已有培训场次，无法删除`);
      return;
    }

    setCourseToDelete(-1); // 特殊标记表示批量删除
    setIsDeleteDialogOpen(true);
  };

  // 确认批量删除
  const handleConfirmBatchDelete = async () => {
    setIsDeleting(true);
    try {
      const promises = selectedCourseIds.map(id => 
        courseService.deleteCourse(id)
      );
      await Promise.all(promises);
      toast.success(`已删除${selectedCourseIds.length}个课程`);
      setSelectedCourseIds([]);
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
      loadData();
    } catch (error: any) {
      console.error('批量删除失败:', error);
      toast.error(error.message || '批量删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  // 批量分配负责人
  const handleBatchAssignManager = () => {
    if (selectedCourseIds.length === 0) {
      toast.warning('请先选择要分配的课程');
      return;
    }
    setIsBatchManagerModalOpen(true);
  };

  // 确认批量分配负责人
  const handleConfirmBatchAssignManager = async () => {
    if (!batchManagerId) {
      toast.warning('请选择负责人');
      return;
    }

    try {
      const promises = selectedCourseIds.map(id =>
        courseService.updateCourse(id, { project_manager_id: batchManagerId })
      );
      await Promise.all(promises);
      toast.success(`已为${selectedCourseIds.length}个课程分配负责人`);
      setSelectedCourseIds([]);
      setIsBatchManagerModalOpen(false);
      setBatchManagerId('');
      loadData();
    } catch (error: any) {
      console.error('批量分配负责人失败:', error);
      toast.error(error.message || '批量分配负责人失败');
    }
  };

  const filteredCourses = getFilteredCourses();

  // 导出课程
  const handleExportCourses = () => {
    const exportData = filteredCourses.map(course => ({
      '课程代码': course.code || '',
      '课程名称': course.name,
      '模块分类': course.module || '',
      '培训天数': course.durationDays || 0,
      '培训期数(每年)': course.sessionsPerYear || 0,
      '课程状态': course.status === 'active' ? '启用' : '停用',
      '课程描述': course.description || '',
      '已开设场次': course.actualSessionCount || 0,
      '项目负责人': course.projectManagerName || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '课程列表');
    XLSX.writeFile(wb, `课程列表_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`导出成功，共${exportData.length}条数据`);
  };

  // 导入课程
  const handleImportCourses = async (courses: any[]) => {
    try {
      // 逐个创建课程
      let successCount = 0;
      for (const course of courses) {
        try {
          await courseService.createCourse(course);
          successCount++;
        } catch (error) {
          console.error(`导入课程失败: ${course.name}`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`成功导入${successCount}个课程`);
        await loadData();
      }
      
      if (successCount < courses.length) {
        toast.warning(`${courses.length - successCount}个课程导入失败`);
      }
    } catch (error) {
      console.error('导入课程失败:', error);
      throw error;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-0 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {/* 页面头部 */}
          <div className="bg-white dark:bg-gray-800 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* 移动端菜单按钮 */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-600 dark:text-gray-300"
                >
                  <Menu size={20} />
                </button>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  课程管理
                </h1>
              </div>
              <div className="flex items-center gap-3">
                {/* 通知提醒 */}
                <NotificationBell />
                {/* 添加课程按钮 */}
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    <span>添加课程</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 lg:p-6">
            {/* 统计信息 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-400">总模块数</div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {modules.length}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-400">总课程数</div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {coursesWithSessions.length}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-400">总期数</div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {coursesWithSessions.reduce((sum, course) => {
                    // 每个课程的期数相加
                    return sum + (course.sessionsPerYear || 0);
                  }, 0)}
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                <div className="text-xs text-gray-500 dark:text-gray-400">总天数</div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {coursesWithSessions.reduce((sum, course) => {
                    // 每个课程的（期数 × 天数）相加
                    return sum + ((course.sessionsPerYear || 0) * (course.durationDays || 0));
                  }, 0)}
                </div>
              </div>
            </div>

            {/* 工具栏 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-4">
              <div className="flex flex-col lg:flex-row gap-3">
                {/* 左侧：搜索和筛选 */}
                <div className="flex-1 flex flex-col sm:flex-row gap-3">
                  {/* 搜索框 */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="搜索课程..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  {/* 筛选器 */}
                  <div className="flex gap-2 flex-wrap">
                    <select
                      value={selectedModule}
                      onChange={(e) => setSelectedModule(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="全部">所有模块</option>
                      {modules.map(module => (
                        <option key={module} value={module}>{module}</option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="全部">所有状态</option>
                      <option value="active">进行中</option>
                      <option value="inactive">已停用</option>
                      <option value="archived">已归档</option>
                    </select>

                    <select
                      value={selectedManager}
                      onChange={(e) => setSelectedManager(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="全部">所有负责人</option>
                      {managers.map(manager => (
                        <option key={manager.id} value={manager.id}>{manager.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 右侧：视图切换和操作按钮 */}
                <div className="flex gap-2 flex-wrap">
                  {/* 视图切换 */}
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => handleViewModeChange('card')}
                      className={`px-3 py-2 rounded-md transition-colors ${
                        viewMode === 'card'
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title="卡片视图"
                    >
                      <Grid3X3 size={20} />
                    </button>
                    <button
                      onClick={() => handleViewModeChange('list')}
                      className={`px-3 py-2 rounded-md transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title="列表视图"
                    >
                      <List size={20} />
                    </button>
                    <button
                      onClick={() => handleViewModeChange('merged')}
                      className={`px-3 py-2 rounded-md transition-colors ${
                        viewMode === 'merged'
                          ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                      title="合并视图"
                    >
                      <BookOpen size={20} />
                    </button>
                  </div>

                  {/* 操作按钮 */}
                  {viewMode === 'list' && (
                    <button
                      onClick={() => {
                        setEnableBatchSelect(!enableBatchSelect);
                        setSelectedCourseIds([]);
                      }}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                        enableBatchSelect
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <CheckSquare size={20} />
                      <span className="hidden sm:inline">{enableBatchSelect ? '取消' : '批量'}</span>
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-2 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm flex items-center"
                        title="批量导入课程"
                      >
                        <Upload size={16} className="sm:mr-2" />
                        <span className="hidden sm:inline">导入</span>
                      </button>
                      <button
                        onClick={handleExportCourses}
                        className="px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center"
                        title="导出课程"
                      >
                        <Download size={16} className="sm:mr-2" />
                        <span className="hidden sm:inline">导出</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 批量操作工具栏 */}
            {enableBatchSelect && selectedCourseIds.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckSquare size={20} className="text-blue-600" />
                    <span className="text-blue-900 dark:text-blue-100 font-medium">
                      已选中 {selectedCourseIds.length} 个课程
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => handleBatchChangeStatus('active')}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                        >
                          批量启用
                        </button>
                        <button
                          onClick={() => handleBatchChangeStatus('inactive')}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                        >
                          批量停用
                        </button>
                        <button
                          onClick={handleBatchAssignManager}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                        >
                          分配负责人
                        </button>
                        <button
                          onClick={handleBatchDelete}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                        >
                          批量删除
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setSelectedCourseIds([])}
                      className="px-4 py-2 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-900 dark:text-blue-100 rounded-lg transition-colors text-sm"
                    >
                      取消选择
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 内容区域 - 根据视图模式显示不同内容 */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500 dark:text-gray-400">加载中...</div>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <BookOpen size={48} className="mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无课程</h3>
                <p className="text-sm mb-4">
                  {searchTerm || selectedModule !== '全部' || selectedStatus !== '全部' 
                    ? "没有找到符合条件的课程" 
                    : "还没有添加任何课程"}
                </p>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    添加第一个课程
                  </button>
                )}
              </div>
            ) : viewMode === 'card' ? (
              // 卡片视图
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {(filteredData as CourseWithSessions[]).map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onAddSession={handleAddSession}
                    onEdit={openEditModal}
                    onDelete={user?.role === 'admin' ? handleDeleteClick : undefined}
                  />
                ))}
              </div>
            ) : viewMode === 'list' ? (
              // 列表视图（表格）
              <CourseTable
                courses={filteredData as CourseWithSessions[]}
                onAddSession={handleAddSession}
                onEdit={openEditModal}
                onDelete={user?.role === 'admin' ? handleDeleteClick : undefined}
                selectedIds={selectedCourseIds}
                onSelectionChange={setSelectedCourseIds}
                enableBatchSelect={enableBatchSelect}
              />
            ) : (
              // 合并视图
              <CourseMergedView
                courses={filteredData as CourseWithSessions[]}
                onAddSession={handleAddSession}
                onEdit={openEditModal}
                onDelete={user?.role === 'admin' ? handleDeleteClick : undefined}
              />
            )}
          </div>
        </main>
      </div>

      {/* 导入课程模态框 */}
      <CourseImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCourses}
      />

      {/* 添加课程模态框 */}
      <CourseFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddCourse}
        mode="add"
      />

      {/* 编辑课程模态框 */}
      <CourseFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCourse(null);
        }}
        onSave={handleEditCourse}
        course={selectedCourse}
        mode="edit"
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={courseToDelete === -1 ? handleConfirmBatchDelete : handleConfirmDelete}
        title={courseToDelete === -1 ? '批量删除课程' : '确认删除课程'}
        message={
          courseToDelete === -1
            ? `确定要删除选中的 ${selectedCourseIds.length} 个课程吗？此操作不可恢复。`
            : `确定要删除这个课程吗？此操作不可恢复。${
                courseToDelete 
                  ? coursesWithSessions.find(c => c.id === courseToDelete)?.actualSessionCount 
                    ? '\n\n注意：该课程已有培训场次，无法删除。' 
                    : '' 
                  : ''
              }`
        }
        confirmText="删除"
        cancelText="取消"
        type="danger"
        loading={isDeleting}
      />

      {/* 批量分配负责人对话框 */}
      {isBatchManagerModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                批量分配负责人
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                为选中的 {selectedCourseIds.length} 个课程分配项目负责人
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  选择负责人
                </label>
                <select
                  value={batchManagerId}
                  onChange={(e) => setBatchManagerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">未分配</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsBatchManagerModalOpen(false);
                    setBatchManagerId('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmBatchAssignManager}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  确认分配
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加培训场次模态框 */}
      {isSessionModalOpen && selectedCourseForSession && (
        <TrainingSessionFormModal
          isOpen={isSessionModalOpen}
          onClose={() => {
            setIsSessionModalOpen(false);
            setSelectedCourseForSession(null);
          }}
          onSave={handleSaveSession}
          course={selectedCourseForSession}
        />
      )}
    </div>
  );
}
