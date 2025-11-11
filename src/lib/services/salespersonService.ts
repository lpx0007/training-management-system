import { supabase } from '@/lib/supabase';

// 获取所有业务员列表
export async function getAllSalespersons() {
  try {
    // 查询所有业务员
    const { data: salespeople, error } = await supabase
      .from('user_profiles')
      .select('id, name, role, department_id')
      .eq('role', 'salesperson');
    
    if (error) {
      console.error('获取业务员列表失败:', error);
      return [];
    }
    
    // 获取部门信息
    const deptIds = [...new Set(salespeople?.map((sp: any) => sp.department_id).filter(Boolean))];
    let departmentsMap = new Map();
    
    if (deptIds.length > 0) {
      const { data: depts } = await supabase
        .from('departments')
        .select('id, name')
        .in('id', deptIds);
      
      depts?.forEach((d: any) => {
        departmentsMap.set(d.id, d.name);
      });
    }
    
    // 返回格式化的业务员列表
    return salespeople?.map((sp: any) => ({
      id: sp.id,
      name: sp.name,
      department: departmentsMap.get(sp.department_id) || '未分配部门'
    })) || [];
  } catch (error) {
    console.error('获取业务员列表失败:', error);
    return [];
  }
}

// 获取所有课程列表
export async function getAllCourses() {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, name')
      .eq('status', 'active')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('获取课程列表失败:', error);
      return [];
    }
    
    return courses || [];
  } catch (error) {
    console.error('获取课程列表失败:', error);
    return [];
  }
}
