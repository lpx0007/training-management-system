import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  Plus, 
  Download, 
  Edit, 
  Trash2, 
  BookOpen
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/Notifications/NotificationBell';
import { PermissionGuard } from '@/components/PermissionGuard';
import ScheduleUploadModal from '@/components/ScheduleUploadModal';
import ScheduleEditModal from '@/components/ScheduleEditModal';
import ScheduleCourseModal from '@/components/ScheduleCourseModal';
import { toast } from 'sonner';
import scheduleService from '@/lib/supabase/scheduleService';
import type { Schedule } from '@/lib/supabase/types';

export default function ScheduleManagement() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // 模态框状态
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);

  // 初始化数据
  useEffect(() => {
    fetchSchedules();
  }, []);

  // 获取课表列表
  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const schedules = await scheduleService.getSchedules();
      setAllSchedules(schedules);
      setFilteredSchedules(schedules);
    } catch (error: any) {
      console.error('获取课表列表失败:', error);
      toast.error(error.message || '获取课表列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 筛选和排序
  useEffect(() => {
    let filtered = allSchedules.filter(schedule => {
      const matchesSearch = schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (schedule.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesType = selectedType === '全部' || schedule.type === selectedType;
      const matchesStatus = selectedStatus === '全部' || schedule.status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    // 排序
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Schedule];
        const bValue = b[sortConfig.key as keyof Schedule];
        
        // 处理null值
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredSchedules(filtered);
  }, [allSchedules, searchTerm, selectedType, selectedStatus, sortConfig]);

  // 处理排序
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 上传课表
  const handleUpload = async (file: File, metadata: { name: string; type: string; description: string }) => {
    const loadingToast = toast.loading('正在上传课表...');
    try {
      await scheduleService.uploadSchedule(file, metadata);
      await fetchSchedules();
      toast.dismiss(loadingToast);
      toast.success('课表上传成功');
      setIsUploadModalOpen(false);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || '上传失败');
    }
  };

  // 编辑课表
  const handleEdit = async (id: number, updates: { name: string; type: string; description: string }) => {
    const loadingToast = toast.loading('正在更新课表...');
    try {
      await scheduleService.updateSchedule(id, updates);
      await fetchSchedules();
      toast.dismiss(loadingToast);
      toast.success('课表更新成功');
      setIsEditModalOpen(false);
      setSelectedSchedule(null);
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || '更新失败');
    }
  };

  // 删除课表
  const handleDelete = async (schedule: Schedule) => {
    if (!confirm(`确定要删除课表"${schedule.name}"吗？此操作不可撤销。`)) {
      return;
    }

    const loadingToast = toast.loading('正在删除课表...');
    try {
      await scheduleService.deleteSchedule(schedule.id);
      await fetchSchedules();
      toast.dismiss(loadingToast);
      toast.success('课表删除成功');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || '删除失败');
    }
  };

  // 下载课表
  const handleDownload = async (schedule: Schedule) => {
    const loadingToast = toast.loading('正在准备下载...');
    try {
      const url = await scheduleService.downloadSchedule(schedule.id);
      
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
      link.download = schedule.name + '.pdf';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // 清理
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      toast.dismiss(loadingToast);
      toast.success('课表下载成功');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || '下载失败');
    }
  };

  // 替换文件
  const handleReplaceFile = async (schedule: Schedule, file: File) => {
    const loadingToast = toast.loading('正在替换文件...');
    try {
      await scheduleService.replaceScheduleFile(schedule.id, file);
      await fetchSchedules();
      toast.dismiss(loadingToast);
      toast.success('文件替换成功');
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || '替换失败');
    }
  };

  // 获取唯一的类型列表
  const uniqueTypes = ['全部', ...Array.from(new Set(allSchedules.map(s => s.type).filter(Boolean)))];
  
  // 为筛选器显示修正文本
  const getTypeDisplayText = (type: string) => {
    if (type === '全部') return '筛选类型';
    return type || '未分类';
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 格式化日期（只显示年月日）
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit'
    });
  };

  // 状态标签
  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { text: '正常', color: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' },
      inactive: { text: '停用', color: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300' },
      error: { text: '异常', color: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300' }
    };
    const badge = statusMap[status as keyof typeof statusMap] || statusMap.active;
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* 透明遮罩层 - 仅在移动端显示 */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-0 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
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
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white">课表管理</h1>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <PermissionGuard permission="schedule_upload">
                  <button 
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center"
                  >
                    <Plus size={16} className="mr-2" />
                    上传课表
                  </button>
                </PermissionGuard>
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
                    placeholder="搜索课表名称、类型或描述..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {/* 类型筛选 */}
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {uniqueTypes.map(type => (
                      <option key={type} value={type || ''}>{getTypeDisplayText(type || '')}</option>
                    ))}
                  </select>

                  {/* 状态筛选 */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="全部">筛选状态</option>
                    <option value="active">正常</option>
                    <option value="inactive">停用</option>
                    <option value="error">错误</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 数据表格 */}
            {isLoading ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
              </div>
            ) : filteredSchedules.length > 0 ? (
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
                            课表名称
                            {sortConfig?.key === 'name' && (
                              <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          类型
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          文件大小
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                          onClick={() => handleSort('download_count')}
                        >
                          <div className="flex items-center">
                            下载次数
                            {sortConfig?.key === 'download_count' && (
                              <i className={`fas ml-1 ${sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down'}`}></i>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                          onClick={() => handleSort('uploaded_at')}
                        >
                          <div className="flex items-center">
                            上传时间
                            {sortConfig?.key === 'uploaded_at' && (
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
                          className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                        >
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredSchedules.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {schedule.name}
                                </div>
                                {schedule.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {schedule.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                              {schedule.type || '未分类'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatFileSize(schedule.file_size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {schedule.download_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(schedule.uploaded_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(schedule.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <PermissionGuard permission="schedule_download">
                                <button
                                  onClick={() => handleDownload(schedule)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                                  title="下载课表"
                                >
                                  <Download size={16} />
                                </button>
                              </PermissionGuard>
                              
                              <PermissionGuard permission="schedule_edit">
                                <button
                                  onClick={() => {
                                    setSelectedSchedule(schedule);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 p-1 rounded"
                                  title="编辑课表"
                                >
                                  <Edit size={16} />
                                </button>
                              </PermissionGuard>

                              <PermissionGuard permission="schedule_edit">
                                <button
                                  onClick={() => {
                                    setSelectedSchedule(schedule);
                                    setIsCourseModalOpen(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded"
                                  title="关联课程"
                                >
                                  <BookOpen size={16} />
                                </button>
                              </PermissionGuard>
                              
                              <PermissionGuard permission="schedule_delete">
                                <button
                                  onClick={() => handleDelete(schedule)}
                                  className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded"
                                  title="删除课表"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </PermissionGuard>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无课表</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">还没有上传任何课表文件</p>
                <PermissionGuard permission="schedule_upload">
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center mx-auto"
                  >
                    <Plus size={16} className="mr-2" />
                    上传课表
                  </button>
                </PermissionGuard>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 课表上传模态框 */}
      <ScheduleUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      {/* 课表编辑模态框 */}
      <ScheduleEditModal
        isOpen={isEditModalOpen}
        schedule={selectedSchedule}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSchedule(null);
        }}
        onUpdate={handleEdit}
        onReplaceFile={handleReplaceFile}
      />

      {/* 课程关联模态框 */}
      <ScheduleCourseModal
        isOpen={isCourseModalOpen}
        schedule={selectedSchedule}
        onClose={() => {
          setIsCourseModalOpen(false);
          setSelectedSchedule(null);
        }}
        onSuccess={() => {
          // 刷新课表列表以显示更新后的关联信息
          fetchSchedules();
        }}
      />
    </div>
  );
}
