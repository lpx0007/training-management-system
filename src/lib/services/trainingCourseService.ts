import { supabase } from '@/lib/supabase';

// 获取指定时间范围内的培训课程列表
export async function getTrainingCoursesByTimeRange(year?: string, month?: string) {
  try {
    let query = supabase
      .from('training_sessions')
      .select('id, name, date, end_date')
      .order('date', { ascending: false });
    
    // 根据年月筛选
    if (year && month) {
      // 筛选特定年月
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
      
      query = query
        .gte('date', startDate)
        .lte('date', endDate);
    } else if (year) {
      // 只筛选年份
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      query = query
        .gte('date', startDate)
        .lte('date', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('获取培训课程列表失败:', error);
      return [];
    }
    
    // 去重并返回唯一的课程名称列表
    const uniqueCourses = new Map();
    data?.forEach((session: any) => {
      if (!uniqueCourses.has(session.name)) {
        uniqueCourses.set(session.name, {
          name: session.name,
          sessions: []
        });
      }
      uniqueCourses.get(session.name).sessions.push({
        id: session.id,
        date: session.date,
        end_date: session.end_date
      });
    });
    
    return Array.from(uniqueCourses.values());
  } catch (error) {
    console.error('获取培训课程列表失败:', error);
    return [];
  }
}

// 获取可用的年份列表
export async function getAvailableYears() {
  try {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('date')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('获取年份列表失败:', error);
      return [];
    }
    
    // 提取唯一的年份
    const years = new Set<string>();
    data?.forEach((session: any) => {
      const year = new Date(session.date).getFullYear().toString();
      years.add(year);
    });
    
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  } catch (error) {
    console.error('获取年份列表失败:', error);
    return [];
  }
}
