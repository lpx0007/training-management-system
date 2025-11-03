import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { useLocation } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Plus, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { Empty } from '@/components/Empty';
import Sidebar from '@/components/Sidebar';
import { toast } from 'sonner';
import prospectusService from '@/lib/supabase/prospectusService';
import { supabase } from '@/lib/supabase/client';
import type { Prospectus } from '@/lib/supabase/types';

export default function ProspectusManagement() {
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('全部');
  const [allProspectuses, setAllProspectuses] = useState<Prospectus[]>([]);
  const [filteredProspectuses, setFilteredProspectuses] = useState<Prospectus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // 模态框状态
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDownloadHistoryModalOpen, setIsDownloadHistoryModalOpen] = useState(false);
  const [isAdaptCoursesModalOpen, setIsAdaptCoursesModalOpen] = useState(false);
  const [selectedProspectus, setSelectedProspectus] = useState<Prospectus | null>(null);

  // 初始化数据
  useEffect(() => {
    fetchProspectuses();
  }, []);

  // 获取简章列表
  const fetchProspectuses = async () => {
    try {
      setIsLoading(true);
      const data = await prospectusService.getProspectuses();
      setAllProspectuses(data);
    } catch (error: any) {
      console.error('获取简章列表失败:', error);
      toast.error('获取简章列表失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 筛选和排序数据
  useEffect(() => {
    if (isLoading) return;
    
    let result = [...allProspectuses];
    
    // 搜索筛选
    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.type && p.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // 类型筛选
    if (selectedType !== '全部') {
      result = result.filter(p => p.type === selectedType);
    }
    
    // 状态筛选
    if (selectedStatus !== '全部') {
      result = result.filter(p => p.status === selectedStatus);
    }
    
    // 排序
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Prospectus];
        const bVal = b[sortConfig.key as keyof Prospectus];
        
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
    
    setFilteredProspectuses(result);
  }, [allProspectuses, searchTerm, selectedType, selectedStatus, sortConfig, isLoading]);

  // 处理排序
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 获取唯一的类型列表
  const types = ['全部', ...Array.from(new Set(allProspectuses.map(p => p.type).filter((t): t is string => Boolean(t))))];
  const statuses = ['全部', 'active', 'inactive', 'error'];

  // 打开上传模态框
  const openUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  // 打开编辑模态框
  const openEditModal = (prospectus: Prospectus) => {
    setSelectedProspectus(prospectus);
    setIsEditModalOpen(true);
  };

  // 打开下载记录模态框
  const openDownloadHistoryModal = (prospectus: Prospectus) => {
    setSelectedProspectus(prospectus);
    setIsDownloadHistoryModalOpen(true);
  };

  // 打开适配课程模态框
  const openAdaptCoursesModal = (prospectus: Prospectus) => {
    setSelectedProspectus(prospectus);
    setIsAdaptCoursesModalOpen(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setIsUploadModalOpen(false);
    setIsEditModalOpen(false);
    setIsDownloadHistoryModalOpen(false);
    setIsAdaptCoursesModalOpen(false);
    setSelectedProspectus(null);
  };

  // 删除简章
  const handleDelete = async (prospectus: Prospectus) => {
    if (!window.confirm(`确定要删除简章"${prospectus.name}"吗？此操作不可恢复。`)) {
      return;
    }

    try {
      await prospectusService.deleteProspectus(prospectus.id);
      toast.success('简章删除成功');
      fetchProspectuses();
    } catch (error: any) {
      toast.error(error.message || '删除失败，请重试');
    }
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
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">招商简章</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 relative">
                <i className="fas fa-bell"></i>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              {user?.role === 'admin' && (
                <button 
                  onClick={openUploadModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center"
                >
                  <Plus size={16} className="mr-2" />
                  上传简章
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
                  placeholder="搜索简章名称、类型或描述..."
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
                  {types.map(type => (
                    <option key={type} value={type}>{type || '未分类'}</option>
                  ))}
                </select>

                {/* 状态筛选 */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === '全部' ? '全部状态' : status === 'active' ? '正常' : status === 'inactive' ? '停用' : '异常'}
                    </option>
                  ))}
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
          ) : filteredProspectuses.length > 0 ? (
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
                          简章名称
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
                        下载次数
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
                    {filteredProspectuses.map((prospectus) => (
                      <tr 
                        key={prospectus.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                              <FileText size={20} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-white">
                                {prospectus.name}
                                {prospectus.has_sealed_version && (
                                  <span title="已盖章">
                                    <CheckCircle size={14} className="inline ml-2 text-green-500" />
                                  </span>
                                )}
                              </div>
                              {prospectus.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {prospectus.description.length > 50 
                                    ? prospectus.description.substring(0, 50) + '...' 
                                    : prospectus.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {prospectus.type || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {formatFileSize(prospectus.file_size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center">
                            <Clock size={14} className="mr-2 text-gray-400" />
                            {formatDate(prospectus.uploaded_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          <button
                            onClick={() => openDownloadHistoryModal(prospectus)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 flex items-center"
                          >
                            <Download size={14} className="mr-1" />
                            {prospectus.download_count}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(prospectus.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => openEditModal(prospectus)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                            title="编辑"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => openAdaptCoursesModal(prospectus)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-3"
                            title="适配课程"
                          >
                            <i className="fas fa-link"></i>
                          </button>
                          <button 
                            onClick={() => handleDelete(prospectus)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            title="删除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
              <Empty />
            </div>
          )}
        </main>
      </div>

      {/* 上传简章模态框 */}
      {isUploadModalOpen && (
        <UploadProspectusModal
          isOpen={isUploadModalOpen}
          onClose={closeModal}
          onSuccess={fetchProspectuses}
        />
      )}

      {/* 编辑简章模态框 */}
      {isEditModalOpen && selectedProspectus && (
        <EditProspectusModal
          isOpen={isEditModalOpen}
          prospectus={selectedProspectus}
          onClose={closeModal}
          onSuccess={fetchProspectuses}
        />
      )}

      {/* 下载记录模态框 */}
      {isDownloadHistoryModalOpen && selectedProspectus && (
        <DownloadHistoryModal
          isOpen={isDownloadHistoryModalOpen}
          prospectus={selectedProspectus}
          onClose={closeModal}
        />
      )}

      {/* 适配课程模态框 */}
      {isAdaptCoursesModalOpen && selectedProspectus && (
        <AdaptCoursesModal
          isOpen={isAdaptCoursesModalOpen}
          prospectus={selectedProspectus}
          onClose={closeModal}
          onSuccess={fetchProspectuses}
        />
      )}
    </div>
  );
}

// ============================================
// 上传简章模态框组件
// ============================================
interface UploadProspectusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function UploadProspectusModal({ isOpen, onClose, onSuccess }: UploadProspectusModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // 验证文件类型
    if (file.type !== 'application/pdf') {
      toast.error('只能上传 PDF 文件');
      return;
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过 10MB');
      return;
    }

    setSelectedFile(file);
    // 如果名称为空，使用文件名（去掉扩展名）
    if (!name) {
      setName(file.name.replace('.pdf', ''));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('请选择要上传的文件');
      return;
    }

    if (!name.trim()) {
      toast.error('请输入简章名称');
      return;
    }

    try {
      setIsUploading(true);
      await prospectusService.uploadProspectus(selectedFile, {
        name: name.trim(),
        type: type.trim() || undefined,
        description: description.trim() || undefined
      });

      toast.success('简章上传成功');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">上传招商简章</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 文件上传区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                PDF 文件 <span className="text-red-500">*</span>
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {selectedFile ? (
                  <div className="space-y-2">
                    <FileText size={48} className="mx-auto text-blue-600 dark:text-blue-400" />
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                    >
                      移除文件
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={48} className="mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      拖拽 PDF 文件到此处，或
                    </p>
                    <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                      选择文件
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      仅支持 PDF 格式，最大 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 简章名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                简章名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：2024年春季培训招商简章"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* 简章类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                简章类型
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="例如：技术培训、管理培训"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* 简章描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                简章描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简要描述简章内容..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* 提示信息 */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                <i className="fas fa-info-circle mr-2"></i>
                上传后可以在编辑页面上传盖章版本的文件
              </p>
            </div>

            {/* 按钮 */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isUploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    上传中...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    上传简章
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 编辑简章模态框组件（占位符）
// ============================================
interface EditProspectusModalProps {
  isOpen: boolean;
  prospectus: Prospectus;
  onClose: () => void;
  onSuccess: () => void;
}

function EditProspectusModal({ isOpen, prospectus, onClose, onSuccess }: EditProspectusModalProps) {
  const [name, setName] = useState(prospectus.name);
  const [type, setType] = useState(prospectus.type || '');
  const [description, setDescription] = useState(prospectus.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingSealedFile, setIsUploadingSealedFile] = useState(false);
  const [selectedSealedFile, setSelectedSealedFile] = useState<File | null>(null);
  const [isReplacingFile, setIsReplacingFile] = useState(false);
  const [selectedReplaceFile, setSelectedReplaceFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('请输入简章名称');
      return;
    }

    try {
      setIsSaving(true);
      await prospectusService.updateProspectus(prospectus.id, {
        name: name.trim(),
        type: type.trim() || undefined,
        description: description.trim() || undefined
      });

      toast.success('简章信息已更新');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || '更新失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadSealedFile = async () => {
    if (!selectedSealedFile) {
      toast.error('请选择盖章文件');
      return;
    }

    try {
      setIsUploadingSealedFile(true);
      await prospectusService.uploadSealedVersion(prospectus.id, selectedSealedFile);
      toast.success('盖章文件上传成功');
      setSelectedSealedFile(null);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || '上传失败，请重试');
    } finally {
      setIsUploadingSealedFile(false);
    }
  };

  const handleDeleteSealedFile = async () => {
    if (!window.confirm('确定要删除盖章文件吗？')) {
      return;
    }

    try {
      await prospectusService.deleteSealedVersion(prospectus.id);
      toast.success('盖章文件已删除');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || '删除失败，请重试');
    }
  };

  const handleSealedFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (file.type !== 'application/pdf') {
        toast.error('只能上传 PDF 文件');
        return;
      }

      // 验证文件大小（10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error('文件大小不能超过 10MB');
        return;
      }

      setSelectedSealedFile(file);
    }
  };

  const handleReplaceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (file.type !== 'application/pdf') {
        toast.error('只能上传 PDF 文件');
        return;
      }

      // 验证文件大小（10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error('文件大小不能超过 10MB');
        return;
      }

      setSelectedReplaceFile(file);
    }
  };

  const handleReplaceFile = async () => {
    if (!selectedReplaceFile) {
      toast.error('请选择要替换的文件');
      return;
    }

    if (!window.confirm('确定要替换原始简章文件吗？此操作不可恢复。')) {
      return;
    }

    try {
      setIsReplacingFile(true);
      await prospectusService.replaceProspectusFile(prospectus.id, selectedReplaceFile);
      toast.success('文件替换成功');
      setSelectedReplaceFile(null);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || '替换失败，请重试');
    } finally {
      setIsReplacingFile(false);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">编辑简章</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* 基本信息编辑 */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">基本信息</h3>

            {/* 简章名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                简章名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* 简章类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                简章类型
              </label>
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* 简章描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                简章描述
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* 按钮组 */}
            <div className="flex justify-end gap-3">
              {/* 更新简章按钮 */}
              <label className="px-4 py-2 rounded-lg border-2 border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer flex items-center">
                <Upload size={16} className="mr-2" />
                更新简章
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleReplaceFileSelect}
                  className="hidden"
                />
              </label>
              
              {/* 保存更改按钮 */}
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存更改'}
              </button>
            </div>
          </form>

          {/* 分隔线 */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

          {/* 盖章文件管理 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">盖章文件</h3>

            {/* 当前盖章文件状态 */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {prospectus.has_sealed_version ? '已上传盖章文件' : '未上传盖章文件'}
                  </p>
                  {prospectus.has_sealed_version && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      文件大小: {formatFileSize(prospectus.sealed_file_size)}
                    </p>
                  )}
                </div>
                {prospectus.has_sealed_version && (
                  <button
                    onClick={handleDeleteSealedFile}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    删除盖章文件
                  </button>
                )}
              </div>
            </div>

            {/* 上传新的盖章文件 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {prospectus.has_sealed_version ? '替换盖章文件' : '上传盖章文件'}
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedSealedFile ? selectedSealedFile.name : '选择 PDF 文件'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleSealedFileSelect}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleUploadSealedFile}
                  disabled={!selectedSealedFile || isUploadingSealedFile}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isUploadingSealedFile ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      上传中...
                    </>
                  ) : (
                    <>
                      <Upload size={16} className="mr-2" />
                      上传
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                仅支持 PDF 格式，最大 10MB
              </p>
            </div>
          </div>

          {/* 文件替换提示 */}
          {selectedReplaceFile && (
            <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-1">
                    准备替换简章文件
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-400">
                    新文件: {selectedReplaceFile.name} ({formatFileSize(selectedReplaceFile.size)})
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-500 mt-2">
                    ⚠️ 替换后原文件将被删除，此操作不可恢复
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setSelectedReplaceFile(null)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleReplaceFile}
                    disabled={isReplacingFile}
                    className="px-3 py-1 text-sm bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors disabled:opacity-50"
                  >
                    {isReplacingFile ? '替换中...' : '确认替换'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 分隔线 */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

          {/* 文件信息 */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">统计信息</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">原始文件名</p>
                <p className="text-gray-800 dark:text-white font-medium">{prospectus.file_name}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">文件大小</p>
                <p className="text-gray-800 dark:text-white font-medium">{formatFileSize(prospectus.file_size)}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">上传时间</p>
                <p className="text-gray-800 dark:text-white font-medium">
                  {new Date(prospectus.uploaded_at).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">下载次数</p>
                <p className="text-gray-800 dark:text-white font-medium">{prospectus.download_count}</p>
              </div>
            </div>
          </div>

          {/* 关闭按钮 */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 下载记录模态框组件
// ============================================
interface DownloadHistoryModalProps {
  isOpen: boolean;
  prospectus: Prospectus;
  onClose: () => void;
}

function DownloadHistoryModal({ isOpen, prospectus, onClose }: DownloadHistoryModalProps) {
  const [downloadHistory, setDownloadHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedSessions, setRelatedSessions] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchDownloadHistory();
      fetchRelatedSessions();
    }
  }, [isOpen, prospectus.id]);

  const fetchDownloadHistory = async () => {
    try {
      setIsLoading(true);
      const history = await prospectusService.getDownloadHistory(prospectus.id);
      setDownloadHistory(history);
    } catch (error) {
      console.error('获取下载记录失败:', error);
      toast.error('获取下载记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedSessions = async () => {
    try {
      const sessions = await prospectusService.getRelatedTrainingSessions(prospectus.id);
      setRelatedSessions(sessions);
    } catch (error) {
      console.error('获取关联培训失败:', error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 统计信息
  const totalDownloads = downloadHistory.length;
  const uniqueUsers = new Set(downloadHistory.map(d => d.user_id)).size;
  const lastDownload = downloadHistory.length > 0 
    ? formatDate(downloadHistory[0].downloaded_at) 
    : '暂无下载';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">下载记录</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* 简章信息 */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              {prospectus.name}
            </h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">总下载次数</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalDownloads}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">下载人数</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{uniqueUsers}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">最近下载</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white mt-1">{lastDownload}</p>
              </div>
            </div>
          </div>

          {/* 关联培训场次 */}
          {relatedSessions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                关联培训场次 ({relatedSessions.length})
              </h3>
              <div className="space-y-2">
                {relatedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {session.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(session.date).toLocaleDateString('zh-CN')} · {session.status || '未知状态'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 下载记录列表 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              下载历史
            </h3>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
              </div>
            ) : downloadHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        下载时间
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        下载人
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        文件类型
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        关联培训
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {downloadHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                          {formatDate(record.downloaded_at)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-white">
                          {record.user_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            record.file_type === 'sealed'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {record.file_type === 'sealed' ? '盖章版' : '原始版'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {record.training_session_id ? `培训 #${record.training_session_id}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Download size={48} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 dark:text-gray-400">暂无下载记录</p>
              </div>
            )}
          </div>

          {/* 关闭按钮 */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================
// 适配课程模态框组件
// ============================================
interface AdaptCoursesModalProps {
  isOpen: boolean;
  prospectus: Prospectus;
  onClose: () => void;
  onSuccess: () => void;
}

function AdaptCoursesModal({ isOpen, prospectus, onClose, onSuccess }: AdaptCoursesModalProps) {
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<any[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTrainingSessions();
    }
  }, [isOpen]);

  // 获取所有培训场次
  const fetchTrainingSessions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setTrainingSessions(data || []);
      
      // 预选已关联的培训
      const alreadyLinked = (data || [])
        .filter((session: any) => session.prospectus_id === prospectus.id)
        .map((session: any) => session.id);
      setSelectedSessions(new Set(alreadyLinked));
    } catch (error) {
      console.error('获取培训列表失败:', error);
      toast.error('获取培训列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 筛选培训
  useEffect(() => {
    let result = [...trainingSessions];

    // 搜索筛选
    if (searchTerm) {
      result = result.filter((session: any) =>
        session.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.expert_name && session.expert_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 状态筛选
    if (statusFilter !== '全部') {
      result = result.filter((session: any) => session.status === statusFilter);
    }

    // 日期范围筛选
    if (startDate) {
      result = result.filter((session: any) => {
        const sessionDate = new Date(session.date);
        const filterStartDate = new Date(startDate);
        return sessionDate >= filterStartDate;
      });
    }

    if (endDate) {
      result = result.filter((session: any) => {
        const sessionDate = new Date(session.date);
        const filterEndDate = new Date(endDate);
        return sessionDate <= filterEndDate;
      });
    }

    setFilteredSessions(result);
  }, [trainingSessions, searchTerm, statusFilter, startDate, endDate]);

  // 切换选择
  const toggleSelection = (sessionId: number) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedSessions.size === filteredSessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(filteredSessions.map((s: any) => s.id)));
    }
  };

  // 保存适配
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // 获取所有培训的当前状态
      const { data: allSessions } = await supabase
        .from('training_sessions')
        .select('id, prospectus_id');

      if (!allSessions) throw new Error('获取培训数据失败');

      // 找出需要更新的培训
      const updates = allSessions.map((session: any) => {
        const shouldLink = selectedSessions.has(session.id);
        const isLinked = session.prospectus_id === prospectus.id;

        if (shouldLink && !isLinked) {
          // 需要关联
          return { id: session.id, prospectus_id: prospectus.id };
        } else if (!shouldLink && isLinked) {
          // 需要取消关联
          return { id: session.id, prospectus_id: null };
        }
        return null;
      }).filter(Boolean);

      // 批量更新
      for (const update of updates) {
        if (!update) continue;
        const { error } = await supabase
          .from('training_sessions')
          .update({ prospectus_id: update.prospectus_id } as any)
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success(`成功适配 ${selectedSessions.size} 个培训课程`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('保存失败:', error);
      toast.error(error.message || '保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">适配课程</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                为"{prospectus.name}"选择关联的培训课程
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* 搜索和筛选 */}
          <div className="mb-4 space-y-3">
            {/* 第一行：搜索和状态筛选 */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索培训名称或专家..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="全部">全部状态</option>
                <option value="upcoming">即将开始</option>
                <option value="ongoing">进行中</option>
                <option value="completed">已完成</option>
              </select>
            </div>

            {/* 第二行：日期范围筛选 */}
            <div className="flex gap-3 items-center">
              <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                课程时间：
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="开始日期"
              />
              <span className="text-gray-500 dark:text-gray-400">至</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="结束日期"
              />
              {(startDate || endDate) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  清除
                </button>
              )}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              已选择 <span className="font-bold">{selectedSessions.size}</span> 个培训课程
              {filteredSessions.length > 0 && ` / 共 ${filteredSessions.length} 个`}
            </p>
          </div>

          {/* 培训列表 */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4">
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedSessions.size === filteredSessions.length && filteredSessions.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        培训名称
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        专家
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        日期
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSessions.map((session: any) => (
                      <tr
                        key={session.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                        onClick={() => toggleSelection(session.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedSessions.has(session.id)}
                            onChange={() => toggleSelection(session.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-white">
                          {session.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {session.expert_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(session.date)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            session.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                              : session.status === 'upcoming'
                              ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                              : 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300'
                          }`}>
                            {session.status === 'completed' ? '已完成' : session.status === 'upcoming' ? '即将开始' : '进行中'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">没有找到培训课程</p>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  保存中...
                </>
              ) : (
                <>
                  <i className="fas fa-check mr-2"></i>
                  保存适配
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
