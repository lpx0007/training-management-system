import { useState, useEffect } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { Schedule } from '@/lib/supabase/types';

interface ScheduleEditModalProps {
  isOpen: boolean;
  schedule: Schedule | null;
  onClose: () => void;
  onUpdate: (id: number, updates: { name: string; type: string; description: string }) => Promise<void>;
  onReplaceFile?: (schedule: Schedule, file: File) => Promise<void>;
}

export default function ScheduleEditModal({ 
  isOpen, 
  schedule, 
  onClose, 
  onUpdate,
  onReplaceFile 
}: ScheduleEditModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showFileReplace, setShowFileReplace] = useState(false);

  useEffect(() => {
    if (schedule) {
      setName(schedule.name);
      setType(schedule.type || '');
      setDescription(schedule.description || '');
      setFile(null);
      setShowFileReplace(false);
    }
  }, [schedule]);

  const handleFileSelect = (selectedFile: File) => {
    // 验证文件类型
    if (!selectedFile.type.includes('pdf')) {
      toast.error('请选择PDF文件');
      return;
    }

    // 验证文件大小 (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过10MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!schedule) return;

    if (!name.trim()) {
      toast.error('请输入课表名称');
      return;
    }

    try {
      setIsUpdating(true);
      
      // 先更新基本信息
      await onUpdate(schedule.id, {
        name: name.trim(),
        type: type.trim() || '通用',
        description: description.trim()
      });

      // 如果有文件需要替换
      if (file && onReplaceFile) {
        await onReplaceFile(schedule, file);
      }

      handleClose();
      toast.success('课表更新成功');
    } catch (error) {
      console.error('更新失败:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    if (isUpdating) return;
    
    setName('');
    setType('');
    setDescription('');
    setFile(null);
    setIsDragOver(false);
    setShowFileReplace(false);
    onClose();
  };

  if (!isOpen || !schedule) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            编辑课表
          </h3>
          <button
            onClick={handleClose}
            disabled={isUpdating}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 当前文件信息 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              当前文件
            </label>
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {schedule.file_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {schedule.file_size ? `${(schedule.file_size / 1024 / 1024).toFixed(2)} MB` : '未知大小'}
                  </p>
                </div>
              </div>
              {onReplaceFile && (
                <button
                  type="button"
                  onClick={() => setShowFileReplace(!showFileReplace)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  {showFileReplace ? '取消替换' : '替换文件'}
                </button>
              )}
            </div>
          </div>

          {/* 文件替换区域 */}
          {showFileReplace && onReplaceFile && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                新文件
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : file
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {file ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-8 w-8 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      拖拽PDF文件到此处，或
                    </p>
                    <label className="mt-1 cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                        点击选择文件
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                      />
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      支持PDF格式，最大10MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 课表名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              课表名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入课表名称"
              required
            />
          </div>

          {/* 课表类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              课表类型
            </label>
            <input
              type="text"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="例如：基础课程、高级课程、专项培训"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="请输入课表描述信息（可选）"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUpdating}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 
                       hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isUpdating}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md 
                       transition-colors flex items-center space-x-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              <span>{isUpdating ? '更新中...' : '更新课表'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
