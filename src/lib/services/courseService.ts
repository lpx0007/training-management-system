import { supabase } from '../supabase/client';
import type { Course, CourseDB, CourseWithSessions, TrainingSessionFrontend } from '../supabase/types';
import { dbToFrontendCourse, dbToFrontendTrainingSession } from '../supabase/types';

class CourseService {
  // 获取所有课程
  async getAllCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('module', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    return (data || []).map((course: CourseDB) => dbToFrontendCourse(course));
  }

  // 按模块获取课程
  async getCoursesByModule(module: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('module', module)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return (data || []).map((course: CourseDB) => dbToFrontendCourse(course));
  }

  // 获取所有课程及其培训场次
  async getCoursesWithSessions(): Promise<CourseWithSessions[]> {
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        *,
        project_manager:user_profiles!project_manager_id(name)
      `)
      .order('module', { ascending: true })
      .order('name', { ascending: true });
    
    if (coursesError) throw coursesError;
    if (!courses) return [];
    
    // 获取所有培训场次
    const { data: sessions, error: sessionsError } = await supabase
      .from('training_sessions')
      .select('*')
      .order('date', { ascending: false });
    
    if (sessionsError) throw sessionsError;
    
    // 组合数据
    return courses.map((course: any) => {
      const courseSessions = sessions?.filter((s: any) => s.course_id === course.id) || [];
      const frontendCourse = dbToFrontendCourse(course as CourseDB);
      return {
        ...frontendCourse,
        projectManagerName: course.project_manager?.name || undefined,
        sessions: courseSessions.map((s: any) => dbToFrontendTrainingSession(s)),
        actualSessionCount: courseSessions.length,
        totalParticipants: courseSessions.reduce((sum, s: any) => sum + (s.participants || 0), 0),
        totalRevenue: courseSessions.reduce((sum, s: any) => sum + (s.revenue || 0), 0)
      };
    });
  }

  // 获取课程及其场次
  async getCourseWithSessions(courseId: number): Promise<CourseWithSessions> {
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (courseError) throw courseError;

    const { data: sessionsData, error: sessionsError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('course_id', courseId)
      .order('date', { ascending: true });
    
    if (sessionsError) throw sessionsError;

    const course = dbToFrontendCourse(courseData as CourseDB);
    const sessions = (sessionsData || []).map(dbToFrontendTrainingSession);
    
    return {
      ...course,
      sessions,
      actualSessionCount: sessions.length,
      totalParticipants: sessions.reduce((sum: number, s: TrainingSessionFrontend) => sum + (s.participants || 0), 0),
      totalRevenue: sessions.reduce((sum: number, s: TrainingSessionFrontend) => sum + (s.revenue || 0), 0),
    };
  }

  // 添加课程
  async addCourse(course: Omit<Course, 'id' | 'createdAt'>): Promise<Course> {
    const dbCourse: any = {
      module: course.module,
      name: course.name,
      code: course.code || null,
      duration_days: course.durationDays,
      sessions_per_year: course.sessionsPerYear,
      standard_fee: course.standardFee || null,
      online_price: course.onlinePrice || null,
      offline_price: course.offlinePrice || null,
      average_price: course.averagePrice || null,
      description: course.description || null,
      notes: course.notes || null,
      status: course.status || 'active'
    };
    
    const { data, error } = await supabase
      .from('courses')
      .insert(dbCourse)
      .select()
      .single();
    
    if (error) throw error;
    return dbToFrontendCourse(data);
  }

  // 创建课程（接受Course或CourseDB类型）
  async createCourse(courseData: Partial<Course> | Partial<CourseDB>): Promise<Course> {
    let dbData: Partial<CourseDB>;
    
    // 判断是否为CourseDB类型（snake_case）
    if ('duration_days' in courseData) {
      dbData = courseData as Partial<CourseDB>;
    } else {
      // Course类型（camelCase），需要转换
      const frontendData = courseData as Partial<Course>;
      dbData = {
        module: frontendData.module!,
        name: frontendData.name!,
        duration_days: frontendData.durationDays!,
        sessions_per_year: frontendData.sessionsPerYear!,
        standard_fee: frontendData.standardFee || null,
        online_price: frontendData.onlinePrice || null,
        offline_price: frontendData.offlinePrice || null,
        description: frontendData.description || null,
        notes: frontendData.notes || null,
        status: frontendData.status || 'active'
      };
    }
    
    // 移除code字段，将由系统自动生成
    delete dbData.code;
    
    // 插入课程数据
    const { data, error } = await supabase
      .from('courses')
      .insert(dbData as any)
      .select()
      .single();
    
    if (error) throw error;
    if (!data) throw new Error('Failed to create course');
    
    // 使用ID生成唯一编号
    const courseId = (data as any).id;
    const generatedCode = `C-${courseId.toString().padStart(4, '0')}`;
    
    // 更新课程编号
    const { data: updatedData, error: updateError } = await supabase
      .from('courses')
      .update({ code: generatedCode } as any)
      .eq('id', courseId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    if (!updatedData) throw new Error('Failed to update course code');
    
    return dbToFrontendCourse(updatedData as CourseDB);
  }

  // 更新课程（接受Course或CourseDB类型）
  async updateCourse(courseId: number, updates: Partial<Course> | Partial<CourseDB>): Promise<Course> {
    let dbUpdates: any = {};
    
    // 判断是否为CourseDB类型（snake_case）
    if ('duration_days' in updates) {
      // 直接使用CourseDB字段
      const dbData = updates as Partial<CourseDB>;
      if (dbData.module !== undefined) dbUpdates.module = dbData.module;
      if (dbData.name !== undefined) dbUpdates.name = dbData.name;
      if (dbData.code !== undefined) dbUpdates.code = dbData.code;
      if (dbData.duration_days !== undefined) dbUpdates.duration_days = dbData.duration_days;
      if (dbData.sessions_per_year !== undefined) dbUpdates.sessions_per_year = dbData.sessions_per_year;
      if (dbData.standard_fee !== undefined) dbUpdates.standard_fee = dbData.standard_fee;
      if (dbData.online_price !== undefined) dbUpdates.online_price = dbData.online_price;
      if (dbData.offline_price !== undefined) dbUpdates.offline_price = dbData.offline_price;
      if (dbData.average_price !== undefined) dbUpdates.average_price = dbData.average_price;
      if (dbData.description !== undefined) dbUpdates.description = dbData.description;
      if (dbData.notes !== undefined) dbUpdates.notes = dbData.notes;
      if (dbData.status !== undefined) dbUpdates.status = dbData.status;
    } else {
      // Course类型（camelCase），需要转换
      const frontendData = updates as Partial<Course>;
      if (frontendData.module !== undefined) dbUpdates.module = frontendData.module;
      if (frontendData.name !== undefined) dbUpdates.name = frontendData.name;
      if (frontendData.code !== undefined) dbUpdates.code = frontendData.code || null;
      if (frontendData.durationDays !== undefined) dbUpdates.duration_days = frontendData.durationDays;
      if (frontendData.sessionsPerYear !== undefined) dbUpdates.sessions_per_year = frontendData.sessionsPerYear;
      if (frontendData.standardFee !== undefined) dbUpdates.standard_fee = frontendData.standardFee || null;
      if (frontendData.onlinePrice !== undefined) dbUpdates.online_price = frontendData.onlinePrice || null;
      if (frontendData.offlinePrice !== undefined) dbUpdates.offline_price = frontendData.offlinePrice || null;
      if (frontendData.averagePrice !== undefined) dbUpdates.average_price = frontendData.averagePrice || null;
      if (frontendData.description !== undefined) dbUpdates.description = frontendData.description || null;
      if (frontendData.notes !== undefined) dbUpdates.notes = frontendData.notes || null;
      if (frontendData.status !== undefined) dbUpdates.status = frontendData.status;
    }
    
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('courses')
      .update(dbUpdates)
      .eq('id', courseId)
      .select()
      .single();
    
    if (error) throw error;
    return dbToFrontendCourse(data as CourseDB);
  }

  // 获取单个课程（返回CourseDB）
  async getCourseById(courseId: number): Promise<CourseDB> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    
    if (error) throw error;
    return data as CourseDB;
  }

  // 删除课程
  async deleteCourse(id: number): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // 获取模块列表
  async getModules(): Promise<string[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('module')
      .order('module');
    
    if (error) throw error;
    
    const modules = (data || []).map((d: { module: string }) => d.module);
    return [...new Set(modules)] as string[];
  }

  // 根据ID获取单个课程
  async getCourse(id: number): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return dbToFrontendCourse(data as CourseDB);
  }

  // 搜索课程
  async searchCourses(query: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .or(`name.ilike.%${query}%,module.ilike.%${query}%,code.ilike.%${query}%`)
      .order('module', { ascending: true })
      .order('name', { ascending: true });
    
    if (error) throw error;
    return (data || []).map((course: CourseDB) => dbToFrontendCourse(course));
  }
}

export default new CourseService();
