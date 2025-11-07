import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { Database, Download, Upload, FileText, CheckCircle, AlertTriangle, XCircle, Lock } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import FileUpload from '@/components/DataManagement/FileUpload';
import { toast } from 'sonner';
import type { DataType, ImportState, ExportState } from '@/types/dataManagement';
import { DATA_TYPE_CONFIG } from '@/constants/dataManagement';
import { parseFile } from '@/lib/parsers/fileParser';
import { validateData, checkDuplicates } from '@/lib/validators/dataValidator';
import { downloadTemplate } from '@/lib/generators/templateGenerator';
import { exportData } from '@/lib/exporters/fileExporter';
import dataManagementService from '@/lib/services/dataManagementService';
import { useDataManagementPermissions } from '@/hooks/useDataManagementPermissions';
import { supabase } from '@/lib/supabase/client';

export default function DataManagement() {
  const { user, permissions } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedDataType, setSelectedDataType] = useState<DataType | null>(null);
  
  // 获取权限信息
  const {
    canImport,
    canExport,
    canDownloadTemplate,
    availableDataTypes,
    hasAnyPermission
  } = useDataManagementPermissions();
  
  // 调试：输出权限信息
  useEffect(() => {
    console.log('=== DataManagement 权限调试 ===');
    console.log('用户:', user?.name, user?.role);
    console.log('权限数组:', permissions);
    console.log('权限数量:', permissions.length);
    console.log('可用数据类型:', availableDataTypes);
    console.log('hasAnyPermission:', hasAnyPermission);
  }, [user, permissions, availableDataTypes, hasAnyPermission]);
  
  // 初始化选中的数据类型
  useEffect(() => {
    if (availableDataTypes.length > 0 && !selectedDataType) {
      setSelectedDataType(availableDataTypes[0]);
    }
  }, [availableDataTypes]);
  
  // 导入状态
  const [importState, setImportState] = useState<ImportState>({
    uploadedFile: null,
    validationStatus: 'idle',
    validationResults: [],
    previewData: [],
    importProgress: 0,
    duplicateStrategy: 'skip',
    duplicates: [],
    newAccounts: []
  });
  
  // 导出状态
  const [exportState, setExportState] = useState<ExportState>({
    format: 'excel',
    range: 'all',
    dateRange: null,
    selectedFields: [],
    filters: {},
    exportProgress: 0
  });
  
  // 业务员业绩筛选
  const [performanceFilters, setPerformanceFilters] = useState({
    timeRange: '本月',
    department: '全部',
    salesperson: '全部'
  });
  
  // 课程销售业绩筛选
  const [courseSalesFilters, setCourseSalesFilters] = useState({
    course: '全部',
    timeRange: '本月'
  });
  
  // 动态加载的选项列表
  const [departments, setDepartments] = useState<Array<{id: number, name: string}>>([]);
  const [salespersons, setSalespersons] = useState<Array<{id: string, name: string}>>([]);
  const [courses, setCourses] = useState<Array<{id: number, name: string}>>([]);
  
  // 加载部门、业务员和课程列表
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // 加载部门列表
        const { data: deptData } = await supabase
          .from('departments')
          .select('id, name')
          .eq('status', 'active')
          .order('name');
        if (deptData) setDepartments(deptData);
        
        // 加载业务员列表
        const { data: spData } = await supabase
          .from('user_profiles')
          .select('id, name')
          .eq('role', 'salesperson')
          .order('name');
        if (spData) setSalespersons(spData);
        
        // 加载课程列表
        const { data: courseData } = await supabase
          .from('training_sessions')
          .select('id, name')
          .order('name');
        if (courseData) {
          // 去重课程名称
          const uniqueCourses: Array<{id: number, name: string}> = [];
          const seenNames = new Set<string>();
          courseData.forEach((c: any) => {
            if (!seenNames.has(c.name)) {
              seenNames.add(c.name);
              uniqueCourses.push({ id: c.id, name: c.name });
            }
          });
          setCourses(uniqueCourses);
        }
      } catch (error) {
        console.error('加载筛选选项失败:', error);
      }
    };
    
    loadOptions();
  }, []);

  // 处理文件上传
  const handleFileSelect = async (file: File) => {
    if (!selectedDataType) {
      toast.error('请先选择数据类型');
      return;
    }
    
    if (!canImport(selectedDataType)) {
      toast.error('您没有导入该数据类型的权限');
      return;
    }
    
    setImportState(prev => ({
      ...prev,
      uploadedFile: file,
      validationStatus: 'validating'
    }));

    try {
      // 解析文件
      const data = await parseFile(file, selectedDataType);
      
      // 验证数据
      const errors = await validateData(data, selectedDataType);
      
      // 检查重复
      const duplicates = await checkDuplicates(data, selectedDataType);
      
      setImportState(prev => ({
        ...prev,
        validationStatus: errors.filter(e => e.severity === 'error').length > 0 ? 'error' : 'success',
        validationResults: errors,
        previewData: data.slice(0, 50),
        duplicates
      }));
      
      if (errors.filter(e => e.severity === 'error').length === 0) {
        toast.success(`验证通过！共 ${data.length} 条数据`);
      } else {
        toast.error(`发现 ${errors.filter(e => e.severity === 'error').length} 个错误`);
      }
    } catch (error: any) {
      toast.error(error.message || '文件解析失败');
      setImportState(prev => ({
        ...prev,
        validationStatus: 'error'
      }));
    }
  };

  // 执行导入
  const handleImport = async () => {
    if (!selectedDataType) {
      toast.error('请先选择数据类型');
      return;
    }
    
    if (!canImport(selectedDataType)) {
      toast.error('您没有导入该数据类型的权限');
      return;
    }
    
    if (importState.previewData.length === 0) {
      toast.error('没有可导入的数据');
      return;
    }

    const hasErrors = importState.validationResults.some(r => r.severity === 'error');
    if (hasErrors) {
      toast.error('请先修复所有错误');
      return;
    }

    try {
      setImportState(prev => ({ ...prev, importProgress: 0 }));
      
      const result = await dataManagementService.importData(
        selectedDataType,
        importState.previewData,
        importState.duplicateStrategy
      );
      
      // 记录操作历史
      await dataManagementService.recordOperation({
        operation_type: 'import',
        data_type: selectedDataType,
        operator_id: user!.id,
        operator_name: user!.name,
        timestamp: new Date().toISOString(),
        record_count: importState.previewData.length,
        success_count: result.success,
        failed_count: result.failed,
        skipped_count: result.skipped,
        status: result.failed > 0 ? 'partial' : 'success',
        file_name: importState.uploadedFile?.name,
        file_size: importState.uploadedFile?.size,
        duration_ms: result.duration
      });
      
      toast.success(`导入完成！成功 ${result.success} 条，失败 ${result.failed} 条，跳过 ${result.skipped} 条`);
      
      // 重置状态
      setImportState({
        uploadedFile: null,
        validationStatus: 'idle',
        validationResults: [],
        previewData: [],
        importProgress: 0,
        duplicateStrategy: 'skip',
        duplicates: [],
        newAccounts: []
      });
    } catch (error: any) {
      toast.error(error.message || '导入失败');
    }
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    if (!selectedDataType) {
      toast.error('请先选择数据类型');
      return;
    }
    if (!canDownloadTemplate()) {
      toast.error('您没有下载模板的权限');
      return;
    }
    downloadTemplate(selectedDataType);
    toast.success('模板下载成功');
  };

  // 执行导出
  const handleExport = async () => {
    if (!selectedDataType) {
      toast.error('请先选择数据类型');
      return;
    }
    
    if (!canExport(selectedDataType)) {
      toast.error('您没有导出该数据类型的权限');
      return;
    }
    
    try {
      const selectedFields = exportState.selectedFields.length > 0 
        ? exportState.selectedFields 
        : dataManagementService.getExportableFields(selectedDataType);
      
      // 构建筛选条件
      let filters = exportState.filters;
      if (selectedDataType === 'salesperson_performance') {
        filters = { ...filters, ...performanceFilters };
      } else if (selectedDataType === 'course_sales_performance') {
        filters = { ...filters, ...courseSalesFilters };
      }
      
      const exportConfig = {
        dataType: selectedDataType,
        format: exportState.format,
        range: exportState.range,
        dateRange: exportState.dateRange || undefined,
        selectedFields,
        filters
      };
      
      // 传递用户信息以实现数据范围过滤
      const data = await dataManagementService.exportData(
        exportConfig,
        user?.id,
        user?.role,
        permissions
      );
      
      await exportData(data, exportConfig);
      
      // 记录操作历史
      await dataManagementService.recordOperation({
        operation_type: 'export',
        data_type: selectedDataType,
        operator_id: user!.id,
        operator_name: user!.name,
        timestamp: new Date().toISOString(),
        record_count: data.length,
        success_count: data.length,
        failed_count: 0,
        skipped_count: 0,
        status: 'success',
        duration_ms: 0
      });
      
      toast.success(`导出成功！共 ${data.length} 条数据`);
    } catch (error: any) {
      toast.error(error.message || '导出失败');
    }
  };

  // 如果用户没有任何权限，显示提示
  if (!hasAnyPermission) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          currentPath="/data-management"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Lock className="mx-auto text-gray-400 mb-4" size={64} />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
              没有访问权限
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              您没有数据管理的相关权限，请联系管理员授权
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentPath="/data-management"
      />

      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

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
              <Database className="mr-3 text-blue-600 dark:text-blue-400" size={24} />
              <div>
                <h1 className="text-xl font-semibold text-gray-800 dark:text-white">数据管理</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">批量导入或导出培训课程、专家、客户、业务员等信息</p>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* 标签页 */}
          <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('import')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'import'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Upload size={18} className="inline mr-2" />
              导入数据
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'export'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Download size={18} className="inline mr-2" />
              导出数据
            </button>
          </div>

          {/* 数据类型选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              数据类型
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                （根据您的权限显示可用的数据类型）
              </span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {availableDataTypes.map(type => {
                const hasImportPermission = canImport(type);
                const hasExportPermission = canExport(type);
                
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedDataType(type)}
                    className={`p-4 rounded-lg border-2 transition-all relative ${
                      selectedDataType === type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className="text-center">
                      <p className="font-medium text-gray-800 dark:text-white">
                        {DATA_TYPE_CONFIG[type].label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {DATA_TYPE_CONFIG[type].description}
                      </p>
                      {/* 权限标识 */}
                      <div className="flex items-center justify-center gap-1 mt-2">
                        {hasImportPermission && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                            导入
                          </span>
                        )}
                        {hasExportPermission && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                            导出
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {availableDataTypes.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Lock className="mx-auto mb-2" size={32} />
                <p>您没有任何数据类型的导入导出权限</p>
              </div>
            )}
          </div>

          {/* 导入标签页内容 */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              {/* 权限提示 */}
              {selectedDataType && !canImport(selectedDataType) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <div className="flex items-center">
                    <Lock className="text-yellow-600 dark:text-yellow-400 mr-3" size={20} />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-300">
                        您没有导入 {selectedDataType && DATA_TYPE_CONFIG[selectedDataType].label} 的权限
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                        请联系管理员授予相应权限，或选择其他有权限的数据类型
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 模板下载 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">下载导入模板</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      下载标准模板，按照格式填写数据后上传
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    disabled={!selectedDataType || !canDownloadTemplate()}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      selectedDataType && canDownloadTemplate()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <FileText size={18} className="mr-2" />
                    下载模板
                  </button>
                </div>
              </div>

              {/* 文件上传 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">上传文件</h3>
                {selectedDataType && canImport(selectedDataType) ? (
                  <FileUpload onFileSelect={handleFileSelect} />
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Lock className="mx-auto mb-2" size={32} />
                    <p>请先选择有导入权限的数据类型</p>
                  </div>
                )}
              </div>

              {/* 验证结果 */}
              {importState.validationStatus !== 'idle' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">验证结果</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">验证通过</p>
                        <p className="text-lg font-semibold text-gray-800 dark:text-white">
                          {importState.previewData.length - importState.validationResults.filter(r => r.severity === 'error').length}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">警告</p>
                        <p className="text-lg font-semibold text-gray-800 dark:text-white">
                          {importState.validationResults.filter(r => r.severity === 'warning').length}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <XCircle className="text-red-600 dark:text-red-400" size={24} />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">错误</p>
                        <p className="text-lg font-semibold text-gray-800 dark:text-white">
                          {importState.validationResults.filter(r => r.severity === 'error').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {importState.validationResults.length > 0 && (
                    <div className="max-h-60 overflow-y-auto">
                      {importState.validationResults.slice(0, 10).map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 mb-2 rounded-lg ${
                            result.severity === 'error'
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            行 {result.row} - {result.column}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{result.error}</p>
                        </div>
                      ))}
                      {importState.validationResults.length > 10 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                          还有 {importState.validationResults.length - 10} 个问题...
                        </p>
                      )}
                    </div>
                  )}

                  {importState.validationStatus === 'success' && (
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          重复数据处理策略
                        </label>
                        <select
                          value={importState.duplicateStrategy}
                          onChange={(e) => setImportState(prev => ({
                            ...prev,
                            duplicateStrategy: e.target.value as any
                          }))}
                          disabled={!selectedDataType || !canImport(selectedDataType)}
                          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="skip">跳过</option>
                          <option value="overwrite">覆盖</option>
                          <option value="keep_both">保留两者</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={handleImport}
                        disabled={!selectedDataType || !canImport(selectedDataType)}
                        className={`px-6 py-2.5 rounded-lg transition-colors ${
                          selectedDataType && canImport(selectedDataType)
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        确认导入
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 导出标签页内容 */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* 权限提示 */}
              {selectedDataType && !canExport(selectedDataType) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                  <div className="flex items-center">
                    <Lock className="text-yellow-600 dark:text-yellow-400 mr-3" size={20} />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-300">
                        您没有导出 {selectedDataType && DATA_TYPE_CONFIG[selectedDataType].label} 的权限
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                        请联系管理员授予相应权限，或选择其他有权限的数据类型
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">导出配置</h3>
                
                {/* 业务员业绩特殊筛选 */}
                {selectedDataType === 'salesperson_performance' && (
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
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        >
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
                        <select
                          value={performanceFilters.department}
                          onChange={(e) => setPerformanceFilters(prev => ({ ...prev, department: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        >
                          <option value="全部">全部部门</option>
                          {departments.map(dept => (
                            <option key={dept.id} value={dept.name}>{dept.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          业务员
                        </label>
                        <select
                          value={performanceFilters.salesperson}
                          onChange={(e) => setPerformanceFilters(prev => ({ ...prev, salesperson: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        >
                          <option value="全部">全部业务员</option>
                          {salespersons.map(sp => (
                            <option key={sp.id} value={sp.name}>{sp.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 课程销售业绩特殊筛选 */}
                {selectedDataType === 'course_sales_performance' && (
                  <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">课程筛选条件</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          课程
                        </label>
                        <select
                          value={courseSalesFilters.course}
                          onChange={(e) => setCourseSalesFilters(prev => ({ ...prev, course: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        >
                          <option value="全部">全部课程</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.name}>{course.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          时间范围
                        </label>
                        <select
                          value={courseSalesFilters.timeRange}
                          onChange={(e) => setCourseSalesFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                        >
                          <option value="本月">本月</option>
                          <option value="本季度">本季度</option>
                          <option value="本年度">本年度</option>
                          <option value="上月">上月</option>
                          <option value="上季度">上季度</option>
                          <option value="去年">去年</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      导出格式
                    </label>
                    <select
                      value={exportState.format}
                      onChange={(e) => setExportState(prev => ({
                        ...prev,
                        format: e.target.value as any
                      }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    >
                      <option value="excel">Excel (.xlsx)</option>
                      <option value="csv">CSV (.csv)</option>
                      <option value="pdf">PDF (.pdf)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      导出范围
                    </label>
                    <select
                      value={exportState.range}
                      onChange={(e) => setExportState(prev => ({
                        ...prev,
                        range: e.target.value as any
                      }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    >
                      <option value="all">全部数据</option>
                      <option value="filtered">筛选后数据</option>
                      <option value="custom">自定义范围</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleExport}
                    disabled={!selectedDataType || !canExport(selectedDataType)}
                    className={`px-6 py-2.5 rounded-lg flex items-center transition-colors ${
                      selectedDataType && canExport(selectedDataType)
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Download size={18} className="mr-2" />
                    导出数据
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
