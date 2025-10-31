import { useState, useRef } from 'react';
import { Camera, X, Loader2, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { validateImageFile, readFileAsDataURL, generateDefaultAvatar } from '@/utils/imageUtils';
import storageService, { AvatarType } from '@/lib/supabase/storageService';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  userName: string;
  userId: string | number;
  type: AvatarType;
  onUploadSuccess: (thumbnailUrl: string, originalUrl: string) => void;
  size?: number;
  editable?: boolean;
}

export default function AvatarUpload({
  currentAvatar,
  userName,
  userId,
  type,
  onUploadSuccess,
  size = 120,
  editable = true,
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取显示的头像 URL
  const getDisplayAvatar = () => {
    if (preview) return preview;
    if (currentAvatar) return currentAvatar;
    return generateDefaultAvatar(userName, size * 2);
  };

  // 获取原图 URL
  const getOriginalAvatar = () => {
    if (currentAvatar && currentAvatar.includes('_thumb_')) {
      return storageService.getOriginalUrl(currentAvatar);
    }
    return currentAvatar || generateDefaultAvatar(userName, 800);
  };

  // 处理文件选择
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件
    const validation = validateImageFile(file, 3 * 1024 * 1024);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      // 显示预览
      const dataUrl = await readFileAsDataURL(file);
      setPreview(dataUrl);

      // 上传
      setUploading(true);
      const { thumbnailUrl, originalUrl } = await storageService.uploadAvatar(
        file,
        userId,
        type
      );

      toast.success('头像上传成功');
      setPreview(null);
      onUploadSuccess(thumbnailUrl, originalUrl);
    } catch (error: any) {
      console.error('上传失败:', error);
      toast.error(error.message || '头像上传失败');
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 点击上传
  const handleClick = () => {
    if (editable && !uploading) {
      fileInputRef.current?.click();
    }
  };

  // 查看原图
  const handleViewOriginal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentAvatar) {
      setShowOriginal(true);
    }
  };

  return (
    <>
      <div className="relative inline-block">
        <div
          className={`relative rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ${
            editable ? 'cursor-pointer' : ''
          }`}
          style={{ width: size, height: size }}
          onClick={handleClick}
        >
          <img
            src={getDisplayAvatar()}
            alt={userName}
            className="w-full h-full object-cover"
          />

          {/* 上传遮罩 */}
          {editable && !uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all flex items-center justify-center group">
              <Camera
                size={size / 3}
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )}

          {/* 上传中 */}
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Loader2 size={size / 3} className="text-white animate-spin" />
            </div>
          )}
        </div>

        {/* 查看原图按钮 */}
        {currentAvatar && !uploading && (
          <button
            onClick={handleViewOriginal}
            className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-lg transition-colors"
            title="查看原图"
          >
            <ZoomIn size={16} />
          </button>
        )}

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={!editable || uploading}
        />
      </div>

      {/* 原图查看模态框 */}
      {showOriginal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setShowOriginal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowOriginal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={32} />
            </button>
            <img
              src={getOriginalAvatar()}
              alt={`${userName} 原图`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
