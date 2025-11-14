/**
 * 课表服务
 * 提供课表的上传、下载、管理等功能
 */

// @ts-nocheck - 临时忽略类型检查，等待数据库类型修复
import { supabase } from './client';
import type { Schedule, ScheduleDownload, ScheduleCourse } from './types';

// 文件大小限制（10MB）
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 允许的文件类型
const ALLOWED_FILE_TYPES = ['application/pdf'];

/**
 * 生成唯一的文件名
 * 格式: timestamp_randomStr.ext (不包含原文件名，避免特殊字符问题)
 */
export function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'pdf';
  
  // 使用简单的文件名格式，避免特殊字符
  return `${timestamp}_${randomStr}.${extension}`;
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

class ScheduleService {
  /**
   * 上传课表
   */
  async uploadSchedule(
    file: File,
    metadata: {
      name: string;
      type?: string;
      description?: string;
    }
  ): Promise<Schedule> {
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
      const fileName = generateFileName(file.name);
      const filePath = getStoragePath(fileName);

      console.log('📤 准备上传课表文件:', {
        fileName,
        filePath,
        fileSize: file.size,
        fileType: file.type
      });

      // 上传文件到 Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('schedules')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ 课表文件上传失败:', uploadError);
        throw new Error(`文件上传失败: ${uploadError.message}`);
      }

      console.log('✅ 课表文件上传成功:', uploadData);

      // 保存元数据到数据库
      const { data, error: dbError } = await supabase
        .from('schedules')
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
        await supabase.storage.from('schedules').remove([filePath]);
        throw new Error(`保存课表信息失败: ${dbError.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('上传课表失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有课表列表
   */
  async getSchedules(): Promise<Schedule[]> {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`获取课表列表失败: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('获取课表列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取课表详情
   */
  async getScheduleById(id: number): Promise<Schedule | null> {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`获取课表详情失败: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('获取课表详情失败:', error);
      throw error;
    }
  }

  /**
   * 更新课表信息
   */
  async updateSchedule(
    id: number,
    updates: {
      name?: string;
      type?: string;
      description?: string;
    }
  ): Promise<Schedule> {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`更新课表信息失败: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('更新课表信息失败:', error);
      throw error;
    }
  }

  /**
   * 替换课表文件
   */
  async replaceScheduleFile(id: number, file: File): Promise<Schedule> {
    try {
      // 验证文件
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 获取课表信息
      const { data: schedule, error: fetchError } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !schedule) {
        throw new Error('课表不存在');
      }

      const scheduleData = schedule as any as Schedule;

      // 删除旧文件
      if (scheduleData.file_path) {
        await supabase.storage
          .from('schedules')
          .remove([scheduleData.file_path]);
      }

      // 生成新文件名和路径
      const fileName = generateFileName(file.name);
      const filePath = getStoragePath(fileName);

      console.log('📤 准备替换课表文件:', {
        oldPath: scheduleData.file_path,
        newPath: filePath,
        fileSize: file.size
      });

      // 上传新文件到 Storage
      const { error: uploadError } = await supabase.storage
        .from('schedules')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ 课表文件上传失败:', uploadError);
        throw new Error(`文件上传失败: ${uploadError.message}`);
      }

      console.log('✅ 课表文件上传成功');

      // 更新数据库
      const { data, error: updateError } = await supabase
        .from('schedules')
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
        await supabase.storage.from('schedules').remove([filePath]);
        throw new Error(`更新课表信息失败: ${updateError.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('替换课表文件失败:', error);
      throw error;
    }
  }

  /**
   * 删除课表
   */
  async deleteSchedule(id: number): Promise<boolean> {
    try {
      // 获取课表信息
      const { data: schedule, error: fetchError } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !schedule) {
        throw new Error('课表不存在');
      }

      const scheduleData = schedule as any as Schedule;

      // 检查是否有关联的培训场次
      const { data: sessions, error: sessionsError } = await supabase
        .from('training_sessions')
        .select('id')
        .eq('schedule_id', id);

      if (sessionsError) {
        throw new Error(`检查关联培训失败: ${sessionsError.message}`);
      }

      if (sessions && sessions.length > 0) {
        throw new Error(`该课表已关联 ${sessions.length} 个培训场次，无法删除`);
      }

      // 删除文件
      const { error: storageError } = await supabase.storage
        .from('schedules')
        .remove([scheduleData.file_path]);

      if (storageError) {
        console.error('删除课表文件失败:', storageError);
        // 继续删除数据库记录
      }

      // 删除数据库记录
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(`删除课表记录失败: ${deleteError.message}`);
      }

      return true;
    } catch (error: any) {
      console.error('删除课表失败:', error);
      throw error;
    }
  }

  /**
   * 下载课表文件
   */
  async downloadSchedule(
    scheduleId: number,
    trainingSessionId?: number
  ): Promise<string> {
    try {
      // 获取课表信息
      const schedule = await this.getScheduleById(scheduleId);
      if (!schedule) {
        throw new Error('课表不存在');
      }

      // 生成签名URL（有效期1小时，强制下载）
      const { data, error } = await supabase.storage
        .from('schedules')
        .createSignedUrl(schedule.file_path, 3600, {
          download: true  // 强制下载而不是预览
        });

      if (error || !data) {
        throw new Error(`生成下载链接失败: ${error?.message}`);
      }

      // 记录下载
      await this.recordDownload(scheduleId, trainingSessionId);

      // 更新下载次数
      await supabase
        .from('schedules')
        .update({ download_count: schedule.download_count + 1 } as any)
        .eq('id', scheduleId);

      return data.signedUrl;
    } catch (error: any) {
      console.error('下载课表失败:', error);
      throw error;
    }
  }

  /**
   * 记录下载
   */
  private async recordDownload(
    scheduleId: number,
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
        .from('schedule_downloads')
        .insert({
          schedule_id: scheduleId,
          user_id: user.id,
          user_name: profileData?.name || '未知用户',
          training_session_id: trainingSessionId || null
        } as any);
    } catch (error) {
      console.error('记录课表下载失败:', error);
      // 不抛出错误，不影响下载流程
    }
  }

  /**
   * 获取课表下载记录
   */
  async getDownloadHistory(scheduleId?: number): Promise<ScheduleDownload[]> {
    try {
      let query = supabase
        .from('schedule_downloads')
        .select(`
          *,
          training_sessions:training_session_id (
            name
          )
        `)
        .order('downloaded_at', { ascending: false });

      if (scheduleId) {
        query = query.eq('schedule_id', scheduleId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`获取课表下载记录失败: ${error.message}`);
      }

      // 处理关联数据，将培训名称提取到顶层
      const processedData = (data || []).map((record: any) => ({
        ...record,
        training_session_name: record.training_sessions?.name || null,
        training_sessions: undefined  // 移除嵌套对象
      }));

      return processedData;
    } catch (error: any) {
      console.error('获取课表下载记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取关联的培训场次
   */
  async getRelatedTrainingSessions(scheduleId: number) {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('id, name, date, status')
        .eq('schedule_id', scheduleId)
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

  /**
   * 添加课表与课程的关联
   */
  async addScheduleCourse(scheduleId: number, courseId: number): Promise<ScheduleCourse> {
    try {
      const { data, error } = await supabase
        .from('schedule_courses')
        .insert({
          schedule_id: scheduleId,
          course_id: courseId,
          created_by: null // 将由认证用户自动填写
        })
        .select()
        .single();

      if (error) {
        throw new Error(`添加课程关联失败: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('添加课程关联失败:', error);
      throw error;
    }
  }

  /**
   * 删除课表与课程的关联
   */
  async removeScheduleCourse(scheduleId: number, courseId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('schedule_courses')
        .delete()
        .eq('schedule_id', scheduleId)
        .eq('course_id', courseId);

      if (error) {
        throw new Error(`删除课程关联失败: ${error.message}`);
      }

      return true;
    } catch (error: any) {
      console.error('删除课程关联失败:', error);
      throw error;
    }
  }

  /**
   * 获取课表关联的课程列表
   */
  async getScheduleCourses(scheduleId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('schedule_courses')
        .select(`
          id,
          course_id,
          created_at,
          courses (
            id,
            name,
            code,
            module,
            description,
            duration_days,
            standard_fee,
            online_price,
            offline_price
          )
        `)
        .eq('schedule_id', scheduleId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`获取关联课程失败: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('获取关联课程失败:', error);
      throw error;
    }
  }

  /**
   * 获取课程关联的课表列表
   */
  async getCourseSchedules(courseId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('schedule_courses')
        .select(`
          id,
          schedule_id,
          created_at,
          schedules (
            id,
            name,
            type,
            description,
            file_name,
            status
          )
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`获取课程课表失败: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('获取课程课表失败:', error);
      throw error;
    }
  }

  /**
   * 批量设置课表关联的课程
   */
  async setScheduleCourses(scheduleId: number, courseIds: number[]): Promise<boolean> {
    try {
      // 首先删除现有关联
      await supabase
        .from('schedule_courses')
        .delete()
        .eq('schedule_id', scheduleId);

      // 如果有新的课程要关联
      if (courseIds.length > 0) {
        const insertData = courseIds.map(courseId => ({
          schedule_id: scheduleId,
          course_id: courseId,
          created_by: null
        }));

        const { error } = await supabase
          .from('schedule_courses')
          .insert(insertData);

        if (error) {
          throw new Error(`设置课程关联失败: ${error.message}`);
        }
      }

      return true;
    } catch (error: any) {
      console.error('设置课程关联失败:', error);
      throw error;
    }
  }
}

// 导出单例
const scheduleService = new ScheduleService();
export default scheduleService;
