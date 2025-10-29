import { useCallback, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { validateFile, getFileInfo } from '@/lib/parsers/fileParser';
import { toast } from 'sonner';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number;
  disabled?: boolean;
}

export default function FileUpload({
  onFileSelect,
  acceptedFormats = ['.xlsx', '.csv'],
  maxSize = 10,
  disabled = false
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    const validation = validateFile(file);
    
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
    toast.success('文件上传成功');
  };

  const handleRemove = () => {
    setSelectedFile(null);
  };

  const fileInfo = selectedFile ? getFileInfo(selectedFile) : null;

  return (
    <div className="w-full">
      {!selectedFile ? (
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${isDragging 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInput}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <Upload 
            size={48} 
            className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
          />
          
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            拖拽文件到此处或点击上传
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            支持格式: {acceptedFormats.join(', ')}
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            最大大小: {maxSize}MB
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-green-500 dark:border-green-600 rounded-lg p-4 bg-green-50 dark:bg-green-900/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText size={32} className="text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-gray-800 dark:text-white">
                  {fileInfo?.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {fileInfo?.sizeText}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleRemove}
              className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
