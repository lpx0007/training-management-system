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
    console.log('📋 获取到的部门ID列表:', deptIds);
    let departmentsMap = new Map();
    
    if (deptIds.length > 0) {
      const { data: depts, error: deptsError } = await supabase
        .from('departments')
        .select('id, name')
        .in('id', deptIds);
      
      if (deptsError) {
        console.error('获取部门信息失败:', deptsError);
      }
      
      console.log('📋 查询到的部门信息:', depts);
      depts?.forEach((d: any) => {
        // 确保ID是数字类型
        const deptId = typeof d.id === 'string' ? parseInt(d.id) : d.id;
        departmentsMap.set(deptId, d.name);
        console.log(`  部门映射: ${deptId} (type: ${typeof deptId}) -> ${d.name}`);
      });
    }
    
    // 返回格式化的业务员列表
    const result = salespeople?.map((sp: any) => {
      // 确保department_id是数字类型进行查找
      const deptId = typeof sp.department_id === 'string' ? parseInt(sp.department_id) : sp.department_id;
      const dept = departmentsMap.get(deptId) || '未分配部门';
      console.log(`  业务员 ${sp.name} (ID:${sp.id}, dept_id:${sp.department_id}, type:${typeof sp.department_id}) -> 查找key:${deptId} -> 部门:${dept}`);
      return {
        id: sp.id,
        name: sp.name,
        department: dept
      };
    }) || [];
    
    console.log('📋 最终返回的业务员列表:', result);
    return result;
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
