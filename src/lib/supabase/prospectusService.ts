/**
 * 招商简章服务
 * 提供招商简章的上传、下载、管理等功能
 */

import { supabase } from './client';
import type { Prospectus, ProspectusDownload } from './types';

// 文件大小限制（10MB）
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 允许的文件类型
const ALLOWED_FILE_TYPES = ['application/pdf'];

/**
 * 生成唯一的文件名
 * 格式: timestamp_randomStr.ext (不包含原文件名，避免特殊字符问题)
 */
export function generateFileName(originalName: string, type: 'original' | 'sealed'): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'pdf';
  const suffix = type === 'sealed' ? '_sealed' : '';
  
  // 使用简单的文件名格式，避免特殊字符
  return `${timestamp}_${randomStr}${suffix}.${extension}`;
}

/**
 * 生成存储路径
 * 格式: fileName (直接使用文件名，不使用子目录)
 */
export function getStoragePath(fileName: string): string {
  // 暂时不使用子目录，直接返回文件名
  // 这样可以避免路径问题
  return fileName;
}

/**
 * 验证文件
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // 检查文件类型
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: '文件格式不正确，请上传PDF文件' };
  }
  
  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '文件大小超过10MB限制' };
  }
  
  return { valid: true };
}

class ProspectusService {
  /**
   * 上传招商简章
   */
  async uploadProspectus(
    file: File,
    metadata: {
      name: string;
      type?: string;
      description?: string;
    }
  ): Promise<Prospectus> {
    try {
      // 验证文件
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 获取当前用户
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('用户未登录');
      }

      // 生成文件名和路径
      const fileName = generateFileName(file.name, 'original');
      const filePath = getStoragePath(fileName);

      console.log('📤 准备上传文件:', {
        fileName,
        filePath,
        fileSize: file.size,
        fileType: file.type
      });

      // 上传文件到 Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prospectuses')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ 文件上传失败:', uploadError);
        throw new Error(`文件上传失败: ${uploadError.message}`);
      }

      console.log('✅ 文件上传成功:', uploadData);

      // 保存元数据到数据库
      const { data, error: dbError } = await supabase
        .from('prospectuses')
        .insert({
          name: metadata.name,
          type: metadata.type || null,
          description: metadata.description || null,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          uploaded_by: user.id,
          status: 'active'
        } as any)
        .select()
        .single();

      if (dbError) {
        // 如果数据库插入失败，删除已上传的文件
        await supabase.storage.from('prospectuses').remove([filePath]);
        throw new Error(`保存简章信息失败: ${dbError.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('上传简章失败:', error);
      throw error;
    }
  }

  /**
   * 上传盖章文件
   */
  async uploadSealedVersion(prospectusId: number, file: File): Promise<Prospectus> {
    try {
      // 验证文件
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 获取简章信息
      const { data: prospectus, error: fetchError } = await supabase
        .from('prospectuses')
        .select('*')
        .eq('id', prospectusId)
        .single();

      if (fetchError || !prospectus) {
        throw new Error('简章不存在');
      }

      const prospectusData = prospectus as any as Prospectus;

      // 如果已有盖章文件，先删除
      if (prospectusData.sealed_file_path) {
        await supabase.storage
          .from('prospectuses')
          .remove([prospectusData.sealed_file_path]);
      }

      // 生成文件名和路径
      const fileName = generateFileName(file.name, 'sealed');
      const filePath = getStoragePath(fileName);

      // 上传文件到 Storage
      const { error: uploadError } = await supabase.storage
        .from('prospectuses')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`文件上传失败: ${uploadError.message}`);
      }

      // 更新数据库
      const { data, error: updateError } = await supabase
        .from('prospectuses')
        .update({
          sealed_file_name: file.name,
          sealed_file_path: filePath,
          sealed_file_size: file.size,
          has_sealed_version: true
        } as any)
        .eq('id', prospectusId)
        .select()
        .single();

      if (updateError) {
        // 如果数据库更新失败，删除已上传的文件
        await supabase.storage.from('prospectuses').remove([filePath]);
        throw new Error(`保存盖章文件信息失败: ${updateError.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('上传盖章文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有简章列表
   */
  async getProspectuses(): Promise<Prospectus[]> {
    try {
      const { data, error } = await supabase
        .from('prospectuses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`获取简章列表失败: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('获取简章列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取简章详情
   */
  async getProspectusById(id: number): Promise<Prospectus | null> {
    try {
      const { data, error } = await supabase
        .from('prospectuses')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`获取简章详情失败: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('获取简章详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新简章信息
   */
  async updateProspectus(
    id: number,
    updates: {
      name?: string;
      type?: string;
      description?: string;
    }
  ): Promise<Prospectus> {
    try {
      const { data, error } = await supabase
        .from('prospectuses')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`更新简章信息失败: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('更新简章信息失败:', error);
      throw error;
    }
  }

  /**
   * 替换原始简章文件
   */
  async replaceProspectusFile(id: number, file: File): Promise<Prospectus> {
    try {
      // 验证文件
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 获取简章信息
      const { data: prospectus, error: fetchError } = await supabase
        .from('prospectuses')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !prospectus) {
        throw new Error('简章不存在');
      }

      const prospectusData = prospectus as any as Prospectus;

      // 删除旧文件
      if (prospectusData.file_path) {
        await supabase.storage
          .from('prospectuses')
          .remove([prospectusData.file_path]);
      }

      // 生成新文件名和路径
      const fileName = generateFileName(file.name, 'original');
      const filePath = getStoragePath(fileName);

      console.log('📤 准备替换文件:', {
        oldPath: prospectusData.file_path,
        newPath: filePath,
        fileSize: file.size
      });

      // 上传新文件到 Storage
      const { error: uploadError } = await supabase.storage
        .from('prospectuses')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ 文件上传失败:', uploadError);
        throw new Error(`文件上传失败: ${uploadError.message}`);
      }

      console.log('✅ 文件上传成功');

      // 更新数据库
      const { data, error: updateError } = await supabase
        .from('prospectuses')
        .update({
          file_name: file.name,
          file_path: filePath,
          file_size: file.size
        } as any)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        // 如果数据库更新失败，删除新上传的文件
        await supabase.storage.from('prospectuses').remove([filePath]);
        throw new Error(`更新简章信息失败: ${updateError.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('替换文件失败:', error);
      throw error;
    }
  }

  /**
   * 删除简章
   */
  async deleteProspectus(id: number): Promise<boolean> {
    try {
      // 获取简章信息
      const { data: prospectus, error: fetchError } = await supabase
        .from('prospectuses')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !prospectus) {
        throw new Error('简章不存在');
      }

      const prospectusData = prospectus as any as Prospectus;

      // 检查是否有关联的培训场次
      const { data: sessions, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('prospectus_id', id);

      if (sessionsError) {
        throw new Error(`检查关联培训失败: ${sessionsError.message}`);
      }

      if (sessions && sessions.length > 0) {
        throw new Error(`该简章已关联 ${sessions.length} 个培训场次，无法删除`);
      }

      // 删除文件
      const filesToDelete = [prospectusData.file_path];
      if (prospectusData.sealed_file_path) {
        filesToDelete.push(prospectusData.sealed_file_path);
      }

      const { error: storageError } = await supabase.storage
        .from('prospectuses')
        .remove(filesToDelete);

      if (storageError) {
        console.error('删除文件失败:', storageError);
        // 继续删除数据库记录
      }

      // 删除数据库记录
      const { error: deleteError } = await supabase
        .from('prospectuses')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(`删除简章记录失败: ${deleteError.message}`);
      }

      return true;
    } catch (error: any) {
      console.error('删除简章失败:', error);
      throw error;
    }
  }

  /**
   * 删除盖章文件
   */
  async deleteSealedVersion(id: number): Promise<boolean> {
    try {
      // 获取简章信息
      const { data: prospectus, error: fetchError } = await supabase
        .from('prospectuses')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !prospectus) {
        throw new Error('简章不存在');
      }

      const prospectusData = prospectus as any as Prospectus;

      if (!prospectusData.sealed_file_path) {
        throw new Error('该简章没有盖章文件');
      }

      // 删除文件
      const { error: storageError } = await supabase.storage
        .from('prospectuses')
        .remove([prospectusData.sealed_file_path]);

      if (storageError) {
        console.error('删除盖章文件失败:', storageError);
      }

      // 更新数据库
      const { error: updateError } = await supabase
        .from('prospectuses')
        .update({
          sealed_file_name: null,
          sealed_file_path: null,
          sealed_file_size: null,
          has_sealed_version: false
        } as any)
        .eq('id', id);

      if (updateError) {
        throw new Error(`更新简章信息失败: ${updateError.message}`);
      }

      return true;
    } catch (error: any) {
      console.error('删除盖章文件失败:', error);
      throw error;
    }
  }

  /**
   * 下载简章文件
   */
  async downloadProspectus(
    prospectusId: number,
    preferSealed: boolean = true,
    trainingSessionId?: number
  ): Promise<string> {
    try {
      // 获取简章信息
      const prospectus = await this.getProspectusById(prospectusId);
      if (!prospectus) {
        throw new Error('简章不存在');
      }

      // 确定下载哪个文件
      let filePath: string;
      let fileType: 'original' | 'sealed';

      if (preferSealed && prospectus.has_sealed_version && prospectus.sealed_file_path) {
        filePath = prospectus.sealed_file_path;
        fileType = 'sealed';
      } else {
        filePath = prospectus.file_path;
        fileType = 'original';
      }

      // 生成签名URL（有效期1小时，强制下载）
      const { data, error } = await supabase.storage
        .from('prospectuses')
        .createSignedUrl(filePath, 3600, {
          download: true  // 强制下载而不是预览
        });

      if (error || !data) {
        throw new Error(`生成下载链接失败: ${error?.message}`);
      }

      // 记录下载
      await this.recordDownload(prospectusId, fileType, trainingSessionId);

      // 更新下载次数
      await supabase
        .from('prospectuses')
        .update({ download_count: prospectus.download_count + 1 } as any)
        .eq('id', prospectusId);

      return data.signedUrl;
    } catch (error: any) {
      console.error('下载简章失败:', error);
      throw error;
    }
  }

  /**
   * 记录下载
   */
  private async recordDownload(
    prospectusId: number,
    fileType: 'original' | 'sealed',
    trainingSessionId?: number
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // 获取用户信息
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      const profileData = profile as any;

      await supabase
        .from('prospectus_downloads')
        .insert({
          prospectus_id: prospectusId,
          user_id: user.id,
          user_name: profileData?.name || '未知用户',
          file_type: fileType,
          training_session_id: trainingSessionId || null
        } as any);
    } catch (error) {
      console.error('记录下载失败:', error);
      // 不抛出错误，不影响下载流程
    }
  }

  /**
   * 获取简章下载记录
   */
  async getDownloadHistory(prospectusId?: number): Promise<ProspectusDownload[]> {
    try {
      let query = supabase
        .from('prospectus_downloads')
        .select('*')
        .order('downloaded_at', { ascending: false });

      if (prospectusId) {
        query = query.eq('prospectus_id', prospectusId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`获取下载记录失败: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('获取下载记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取关联的培训场次
   */
  async getRelatedTrainingSessions(prospectusId: number) {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('id, name, date, status')
        .eq('prospectus_id', prospectusId)
        .order('date', { ascending: false });

      if (error) {
        throw new Error(`获取关联培训失败: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('获取关联培训失败:', error);
      throw error;
    }
  }
}

// 导出单例
const prospectusService = new ProspectusService();
export default prospectusService;
