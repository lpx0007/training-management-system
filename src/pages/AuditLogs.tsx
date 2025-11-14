import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { History, Trash2, RotateCcw, Database, Calendar, Users, AlertCircle, CheckCircle, Shield, Edit, User, Clock, Download, Menu } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';
import type { TrainingSessionFrontend } from '@/lib/supabase/types';
import trainingSessionService from '@/lib/services/trainingSessionService';
import auditService from '@/lib/services/auditService';

interface SoftDeletedSession extends TrainingSessionFrontend {
  deletedAt: string;
  deletedBy: string | null;
  deletedByName: string | null;
  deleteReason: string | null;
}

interface BackupSession {
  backupId: number;
  originalId: number;
  name: string;
  date: string;
  endDate: string;
  participants: number;
  deletedAt: string;
  deletedByName: string;
  deleteReason: string;
  canRestore: boolean;
}


type TabType = 'operations' | 'soft_deleted' | 'backup';

export default function AuditLogs() {
  const { user } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('operations');
  const [softDeletedSessions, setSoftDeletedSessions] = useState<SoftDeletedSession[]>([]);
  const [backupSessions, setBackupSessions] = useState<BackupSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      if (activeTab === 'operations') {
        // 加载审计日志
        const result = await auditService.getAuditLogs({
          page: 1,
          pageSize: 50
        });
        setAuditLogs(result.logs);
      } else if (activeTab === 'soft_deleted') {
        // 加载软删除的培训
        const { data, error } = await supabase
          .from('training_sessions')
          .select('*')
          .not('deleted_at', 'is', null)
          .order('deleted_at', { ascending: false });

        if (error) throw error;

        const sessions: SoftDeletedSession[] = (data || []).map((session: any) => ({
          id: session.id,
          name: session.name,
          date: session.date,
          endDate: session.end_date,
          participants: session.participants || 0,
          deletedAt: session.deleted_at,
          deletedBy: session.deleted_by,
          deletedByName: session.deleted_by_name,
          deleteReason: session.delete_reason,
          area: session.area,
          expert: session.expert,
          salespersonName: session.salesperson_name,
        } as any));

        setSoftDeletedSessions(sessions);
      } else if (activeTab === 'backup') {
        // 加载备份的培训
        const { data, error } = await supabase
          .from('training_sessions_backup')
          .select('*')
          .eq('can_restore', true)
          .order('deleted_at', { ascending: false });

        if (error) throw error;

        const backups: BackupSession[] = (data || []).map((backup: any) => ({
          backupId: backup.backup_id,
          originalId: backup.original_id,
          name: backup.name,
          date: backup.date,
          endDate: backup.end_date,
          participants: backup.participants || 0,
          deletedAt: backup.deleted_at,
          deletedByName: backup.deleted_by_name,
          deleteReason: backup.delete_reason,
          canRestore: backup.can_restore,
        }));

        setBackupSessions(backups);
      }
    } catch (error: any) {
      console.error('加载失败:', error);
      toast.error('加载失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 恢复软删除的培训
  const handleRestoreSoftDeleted = async (sessionId: number) => {
    if (!confirm('确认要恢复这个培训吗？恢复后将重新出现在培训列表中。')) {
      return;
    }

    try {
      await trainingSessionService.restoreSoftDeleted(sessionId);
      toast.success('培训已恢复成功！');
      loadData();
    } catch (error: any) {
      console.error('恢复失败:', error);
      toast.error(error.message || '恢复失败，请重试');
    }
  };

  // 永久删除软删除的培训
  const handlePermanentDelete = async (sessionId: number) => {
    if (!confirm('确认要永久删除这个培训吗？\n\n此操作将：\n1. 彻底删除培训记录\n2. 删除所有参训记录\n3. 数据将备份到数据库\n\n此操作不可撤销！')) {
      return;
    }

    try {
      if (!user) throw new Error('用户未登录');

      await trainingSessionService.deleteSession(sessionId, {
        deleteType: 'hard',
        reason: '从回收站永久删除',
        userId: user.id,
        userName: user.name || '系统管理员'
      });

      toast.success('培训已永久删除，数据已备份');
      loadData();
    } catch (error: any) {
      console.error('删除失败:', error);
      toast.error(error.message || '删除失败，请重试');
    }
  };

  // 从备份恢复培训（一键恢复）
  const handleRestoreFromBackup = async (backupId: number, backupName: string) => {
    if (!confirm(`确认要从备份恢复这个培训吗？\n\n培训名称：${backupName}\n\n此操作将：\n1. 恢复培训记录到主表\n2. 恢复所有参训记录\n3. 使用新的培训ID\n4. 标记此备份为已恢复\n\n确认恢复？`)) {
      return;
    }

    try {
      const result = await trainingSessionService.restoreFromBackup(backupId);
      toast.success(`培训恢复成功！新的培训ID: ${result.sessionId}`);
      loadData();
    } catch (error: any) {
      console.error('恢复失败:', error);
      toast.error(error.message || '恢复失败，请重试');
    }
  };

  // 导出审计日志
  const handleExportAuditLogs = () => {
    try {
      // 准备导出数据，只包含简化信息
      const exportData = auditLogs.map((log, index) => ({
        '序号': index + 1,
        '操作人': log.user_name,
        '操作时间': new Date(log.created_at).toLocaleString('zh-CN'),
        '操作类型': log.action === 'update_participant' ? '修改参训人员' : log.action,
        '操作描述': log.details?.description || '',
        '状态': log.status === 'success' ? '成功' : '失败'
      }));

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // 设置列宽
      const colWidths = [
        { wch: 8 },  // 序号
        { wch: 15 }, // 操作人
        { wch: 20 }, // 操作时间
        { wch: 15 }, // 操作类型
        { wch: 50 }, // 操作描述
        { wch: 10 }  // 状态
      ];
      ws['!cols'] = colWidths;

      // 添加工作表
      XLSX.utils.book_append_sheet(wb, ws, '审计日志');

      // 生成文件名
      const fileName = `审计日志_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;

      // 导出文件
      XLSX.writeFile(wb, fileName);
      
      toast.success(`审计日志已导出: ${fileName}`);
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败，请重试');
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
        {/* 顶部标题栏 */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg"
              >
                <Menu size={24} />
              </button>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <History className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">审计日志</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                  查看系统关键操作记录、删除记录和备份数据
                </p>
              </div>
            </div>
            
            {/* 导出按钮 - 只在关键操作标签页显示 */}
            {activeTab === 'operations' && auditLogs.length > 0 && (
              <button
                onClick={handleExportAuditLogs}
                className="inline-flex items-center px-2 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download size={16} className="sm:mr-2" />
                <span className="hidden sm:inline">导出审计日志</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('operations')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'operations'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield size={18} />
                <span>关键操作</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('soft_deleted')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'soft_deleted'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <RotateCcw size={18} />
                <span>已删除培训（可恢复）</span>
                {softDeletedSessions.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs rounded-full">
                    {softDeletedSessions.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'backup'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Database size={18} />
                <span>备份数据</span>
                {backupSessions.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300 text-xs rounded-full">
                    {backupSessions.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500 dark:text-gray-400">加载中...</div>
            </div>
          ) : activeTab === 'operations' ? (
            // 审计日志列表
            <div className="space-y-4">
              {auditLogs.length === 0 ? (
                <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 300px)' }}>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
                      <Shield className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">关键操作日志</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">记录系统关键操作、数据修改等操作</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">目前没有审计数据</p>
                  </div>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex items-center space-x-2">
                            {log.action === 'update_participant' ? (
                              <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            )}
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                              {log.action === 'update_participant' ? '修改参训人员' : log.action}
                            </h3>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            log.status === 'success' 
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                          }`}>
                            {log.status === 'success' ? '成功' : '失败'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <User size={16} className="mr-2 text-gray-400" />
                            操作人: {log.user_name}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Clock size={16} className="mr-2 text-gray-400" />
                            时间: {new Date(log.created_at).toLocaleString('zh-CN')}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Database size={16} className="mr-2 text-gray-400" />
                            资源: {log.resource_type} #{log.resource_id}
                          </div>
                        </div>

                        {log.details && (
                          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-800 dark:text-white mb-2">操作详情</h4>
                            {log.details.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                {log.details.description}
                              </p>
                            )}
                            {log.details.changed_fields && log.details.changed_fields.length > 0 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                <strong>修改字段:</strong> {log.details.changed_fields.join(', ')}
                              </div>
                            )}
                            {log.details.old_values && log.details.new_values && (
                              <div className="mt-2 space-y-1">
                                {Object.keys(log.details.new_values).map((key) => {
                                  if (log.details.old_values[key] !== log.details.new_values[key]) {
                                    return (
                                      <div key={key} className="text-xs text-gray-600 dark:text-gray-300">
                                        <span className="font-medium">{key}:</span> 
                                        <span className="text-red-600 dark:text-red-400 ml-1">
                                          {JSON.stringify(log.details.old_values[key])}
                                        </span>
                                        <span className="mx-1">→</span>
                                        <span className="text-green-600 dark:text-green-400">
                                          {JSON.stringify(log.details.new_values[key])}
                                        </span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'soft_deleted' ? (
            // 软删除列表
            <div className="space-y-4">
              {softDeletedSessions.length === 0 ? (
                <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 300px)' }}>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                      <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">没有已删除的培训</h3>
                    <p className="text-gray-600 dark:text-gray-400">所有培训都处于正常状态</p>
                  </div>
                </div>
              ) : (
                softDeletedSessions.map((session) => (
                  <div key={session.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{session.name}</h3>
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs rounded-full">
                            临时删除
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Calendar size={16} className="mr-2 text-gray-400" />
                            培训日期: {session.date} {session.endDate && session.endDate !== session.date && `至 ${session.endDate}`}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Users size={16} className="mr-2 text-gray-400" />
                            参训人数: {session.participants}人
                          </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                          <div className="flex items-start">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-sm text-red-800 dark:text-red-300">
                                <strong>删除时间:</strong> {new Date(session.deletedAt).toLocaleString('zh-CN')}
                              </div>
                              <div className="text-sm text-red-800 dark:text-red-300">
                                <strong>删除人:</strong> {session.deletedByName || '未知'}
                              </div>
                              {session.deleteReason && (
                                <div className="text-sm text-red-800 dark:text-red-300 mt-1">
                                  <strong>删除原因:</strong> {session.deleteReason}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => handleRestoreSoftDeleted(session.id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 whitespace-nowrap"
                        >
                          <RotateCcw size={16} />
                          <span>恢复</span>
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(session.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2 whitespace-nowrap"
                        >
                          <Trash2 size={16} />
                          <span>永久删除</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // 备份列表
            <div className="space-y-4">
              {backupSessions.length === 0 ? (
                <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 300px)' }}>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6">
                      <Database className="w-10 h-10 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">没有备份数据</h3>
                    <p className="text-gray-600 dark:text-gray-400">暂无彻底删除的培训备份</p>
                  </div>
                </div>
              ) : (
                backupSessions.map((backup) => (
                  <div key={backup.backupId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{backup.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            backup.canRestore 
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                            {backup.canRestore ? '可恢复' : '已恢复'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Calendar size={16} className="mr-2 text-gray-400" />
                            培训日期: {backup.date} {backup.endDate && backup.endDate !== backup.date && `至 ${backup.endDate}`}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <Users size={16} className="mr-2 text-gray-400" />
                            参训人数: {backup.participants}人
                          </div>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 mb-3">
                          <div className="flex items-start">
                            <Database className="w-4 h-4 text-orange-600 dark:text-orange-400 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-sm text-orange-800 dark:text-orange-300">
                                <strong>备份ID:</strong> #{backup.backupId} | <strong>原始ID:</strong> #{backup.originalId}
                              </div>
                              <div className="text-sm text-orange-800 dark:text-orange-300">
                                <strong>删除时间:</strong> {new Date(backup.deletedAt).toLocaleString('zh-CN')}
                              </div>
                              <div className="text-sm text-orange-800 dark:text-orange-300">
                                <strong>删除人:</strong> {backup.deletedByName || '未知'}
                              </div>
                              {backup.deleteReason && (
                                <div className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                                  <strong>删除原因:</strong> {backup.deleteReason}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {backup.canRestore && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <p className="text-xs text-blue-800 dark:text-blue-300">
                              💡 <strong>一键恢复:</strong> 点击右侧"恢复"按钮可一键恢复此培训的所有数据
                            </p>
                            <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
                              恢复后将使用新的培训ID，不影响现有数据
                            </p>
                          </div>
                        )}
                        
                        {!backup.canRestore && (
                          <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              ℹ️ 此备份已被恢复，如需再次恢复请联系系统管理员
                            </p>
                          </div>
                        )}
                      </div>

                      {backup.canRestore && (
                        <div className="ml-4">
                          <button
                            onClick={() => handleRestoreFromBackup(backup.backupId, backup.name)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 whitespace-nowrap"
                          >
                            <RotateCcw size={16} />
                            <span>恢复</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
