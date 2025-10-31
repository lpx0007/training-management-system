/**
 * Supabase Storage 服务
 * 封装头像上传、删除等操作
 */

import { supabase } from './client';
import { compressImage, createThumbnail } from '@/utils/imageUtils';

export type AvatarType = 'user' | 'expert' | 'customer';

class StorageService {
  private readonly BUCKET_NAME = 'avatars';

  /**
   * 上传头像（包含原图和缩略图）
   * @param file 图片文件
   * @param id 用户/专家/客户 ID
   * @param type 头像类型
   * @returns 头像 URL（缩略图）
   */
  async uploadAvatar(
    file: File,
    id: string | number,
    type: AvatarType
  ): Promise<{ thumbnailUrl: string; originalUrl: string }> {
    try {
      const folder = this.getFolderName(type);
      const timestamp = Date.now();
      
      // 生成文件路径
      const thumbnailPath = `${folder}/${id}_thumb_${timestamp}.jpg`;
      const originalPath = `${folder}/${id}_original_${timestamp}.jpg`;

      // 删除旧头像
      await this.deleteOldAvatars(id, type);

      // 创建缩略图（200x200，用于列表显示）
      const thumbnailBlob = await createThumbnail(file, 200);
      
      // 压缩原图（800x800，用于详情查看）
      const originalBlob = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.9,
      });

      // 上传缩略图
      const { error: thumbError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(thumbnailPath, thumbnailBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (thumbError) throw thumbError;

      // 上传原图
      const { error: originalError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(originalPath, originalBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (originalError) throw originalError;

      // 获取公开 URL
      const { data: thumbData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(thumbnailPath);

      const { data: originalData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(originalPath);

      return {
        thumbnailUrl: thumbData.publicUrl,
        originalUrl: originalData.publicUrl,
      };
    } catch (error) {
      console.error('上传头像失败:', error);
      throw new Error('头像上传失败，请重试');
    }
  }

  /**
   * 删除旧头像
   * @param id 用户/专家/客户 ID
   * @param type 头像类型
   */
  private async deleteOldAvatars(
    id: string | number,
    type: AvatarType
  ): Promise<void> {
    try {
      const folder = this.getFolderName(type);
      
      // 列出该用户的所有头像文件
      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(folder, {
          search: `${id}_`,
        });

      if (error || !files || files.length === 0) return;

      // 删除所有旧文件
      const filePaths = files.map(file => `${folder}/${file.name}`);
      await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);
    } catch (error) {
      console.error('删除旧头像失败:', error);
      // 不抛出错误，允许继续上传
    }
  }

  /**
   * 删除头像
   * @param avatarUrl 头像 URL
   */
  async deleteAvatar(avatarUrl: string): Promise<void> {
    try {
      // 从 URL 中提取文件路径
      const url = new URL(avatarUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf(this.BUCKET_NAME);
      
      if (bucketIndex === -1) {
        throw new Error('无效的头像 URL');
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/');
      
      // 删除缩略图和原图
      const folder = filePath.split('/')[0];
      const fileName = filePath.split('/')[1];
      const idPart = fileName.split('_')[0];
      
      // 查找并删除所有相关文件
      const { data: files } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(folder, {
          search: `${idPart}_`,
        });

      if (files && files.length > 0) {
        const filePaths = files.map(file => `${folder}/${file.name}`);
        await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filePaths);
      }
    } catch (error) {
      console.error('删除头像失败:', error);
      throw new Error('头像删除失败');
    }
  }

  /**
   * 获取文件夹名称
   */
  private getFolderName(type: AvatarType): string {
    switch (type) {
      case 'user':
        return 'users';
      case 'expert':
        return 'experts';
      case 'customer':
        return 'customers';
      default:
        return 'users';
    }
  }

  /**
   * 从缩略图 URL 获取原图 URL
   */
  getOriginalUrl(thumbnailUrl: string): string {
    return thumbnailUrl.replace('_thumb_', '_original_');
  }
}

export const storageService = new StorageService();
export default storageService;
