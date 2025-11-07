import { supabase } from '@/lib/supabase';

// 获取月度业绩数据
export async function getMonthlyPerformance(
  timeRange: string = '本月',
  userRole?: string,
  userDepartmentId?: number,
  permissions?: string[]
) {
  try {
    // 根据时间范围设置查询日期
    let startDateStr: string, endDateStr: string;
    
    switch (timeRange) {
      case '本月':
        startDateStr = '2025-11-01';
        endDateStr = '2025-11-30';
        break;
      case '上月':
        startDateStr = '2025-10-01';
        endDateStr = '2025-10-31';
        break;
      case '本季度':
        startDateStr = '2025-10-01';
        endDateStr = '2025-12-31';
        break;
      case '本年':
        startDateStr = '2025-01-01';
        endDateStr = '2025-12-31';
        break;
      default:
        startDateStr = '2025-11-01';
        endDateStr = '2025-11-30';
    }

    // 第一步：查询参训人员数据（按报名日期筛选）
    const { data: participantsData, error: participantsError } = await supabase
      .from('training_participants')
      .select('*')
      .gte('registration_date', startDateStr)
      .lte('registration_date', endDateStr);

    if (participantsError) {
      console.error('获取参训数据失败:', participantsError);
      return { totalRevenue: 0, totalParticipants: 0, salesPersonData: [] };
    }
    
    console.log('✅ 获取到参训数据:', participantsData?.length, '条');
    if (participantsData && participantsData.length > 0) {
        const firstData: any = participantsData[0];
      console.log('📝 第一条参训数据样本:', {
        name: firstData.name,
        salesperson_name: firstData.salesperson_name,
        payment_amount: firstData.payment_amount,
        actual_price: firstData.actual_price
      });
    }
    
    // 第二步：获取所有相关的培训场次（仅用于显示培训名称）
    const sessionIds = [...new Set(participantsData?.map((p: any) => p.training_session_id).filter(Boolean))];
    console.log('📋 涉及的培训场次ID:', sessionIds);
    
    let sessionsMap = new Map();
    if (sessionIds.length > 0) {
      const { data: sessions } = await supabase
        .from('training_sessions')
        .select('id, name, training_mode, online_price, offline_price')
        .in('id', sessionIds);
      
      sessions?.forEach((s: any) => {
        sessionsMap.set(s.id, s);
      });
      console.log('✅ 获取到培训场次:', sessions?.length, '个');
    }
    
    const data = participantsData;

    // 第三步：从参训人员中提取所有业务员名称
    const salespersonNames = [...new Set(
      participantsData?.map((p: any) => p.salesperson_name).filter(Boolean)
    )];
    
    console.log('📋 涉及的业务员名称:', salespersonNames);
    console.log('📋 业务员名称数量:', salespersonNames.length);
    
    // 通过名称查询业务员信息（简化查询，不使用嵌套）
    let salespersonData = new Map();
    if (salespersonNames.length > 0) {
      const { data: allSalespeople, error: spError } = await supabase
        .from('user_profiles')
        .select('id, name, role, department_id')
        .in('name', salespersonNames); // 用名称查询
      
      console.log('✅ 查询到销售员:', allSalespeople?.length, '个');
      console.log('✅ 销售员详细信息:', JSON.stringify(allSalespeople));
      if (spError) {
        console.error('❌ 查询销售员失败:', spError);
        return { totalRevenue: 0, totalParticipants: 0, salesPersonData: [] };
      }
      
      // 如果查询到业务员，获取部门信息
      if (allSalespeople && allSalespeople.length > 0) {
        const deptIds = [...new Set(allSalespeople.map((sp: any) => sp.department_id).filter(Boolean))];
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
        
        (allSalespeople as any[]).forEach(sp => {
          console.log(`  💼 添加销售员: ${sp.name}, ID: ${sp.id}`);
          salespersonData.set(sp.name, {
            id: sp.id,
            name: sp.name,
            department: departmentsMap.get(sp.department_id) || '未分配部门',
            departmentId: sp.department_id // 保存部门ID用于数据过滤
          });
        });
      }
      
      console.log('📦 salespersonData Map size:', salespersonData.size);
      console.log('📦 salespersonData keys:', Array.from(salespersonData.keys()));
    }

    // 按业务员汇总数据
    const salesPersonMap = new Map();
    
    // 先初始化所有销售员（确保即使没有业绩的也能显示）
    salespersonData.forEach((info, name) => {
      salesPersonMap.set(name, {
        id: info.id,
        name: info.name,
        department: info.department,
        revenue: 0,
        participants: 0,
        sessions: new Set(),
        courses: new Set(),
        customerList: [] // 存储成交客户列表
      });
    });
    
    console.log('开始处理参与者数据，共', data?.length, '条记录');
    if (data && data.length > 0) {
      console.log('第一条数据样本:', JSON.stringify(data[0], null, 2));
    }
    
    data?.forEach((participant: any) => {
      // 使用participant表中的salesperson_name（这才是正确的业务员）
      const salespersonName = participant.salesperson_name;
      
      if (!salespersonName) {
        console.log('⚠️ 跳过：参训者没有业务员', participant.name);
        return;
      }
      
      // 从sessionsMap获取培训场次信息（仅用于显示培训名称）
      const sessionData = sessionsMap.get(participant.training_session_id);
      
      // 获取或创建销售员记录
      if (!salesPersonMap.has(salespersonName)) {
        const salespersonInfo = salespersonData.get(salespersonName);
        if (!salespersonInfo) {
          console.log('⚠️ 跳过：找不到销售员信息', salespersonName);
          return;
        }
        
        salesPersonMap.set(salespersonName, {
          id: salespersonInfo.id,
          name: salespersonInfo.name,
          department: salespersonInfo.department,
          revenue: 0,
          participants: 0,
          sessions: new Set(),
          courses: new Set()
        });
        console.log('✨ 创建新销售员记录:', salespersonInfo.name);
      }
      
      const person = salesPersonMap.get(salespersonName);
      
      // 从participant获取付款金额（直接使用payment_amount，与培训计划详情页一致）
      const revenue = Number(participant.payment_amount) || 0;
      
      console.log(`✅ 处理参与者 [${participant.name}]:`, {
        payment_amount: participant.payment_amount,
        actual_price: participant.actual_price,
        计算金额: revenue,
        所属培训: sessionData?.name || '未知培训',
        销售员: person.name
      });
      
      person.participants += 1;
      if (sessionData) {
        person.sessions.add(sessionData.id);
        person.courses.add(sessionData.name);
      }
      person.revenue += revenue;
      
      // 添加客户到列表（包含客户信息和参训信息）
      person.customerList.push({
        id: participant.id,
        name: participant.name,
        phone: participant.phone,
        company: participant.company || '',
        latestDate: participant.registration_date,
        courseName: sessionData?.name || '未知课程',
        amount: revenue
      });
      
      console.log(`📊 ${person.name}: 累计 ${person.participants} 个客户，总收入 ¥${person.revenue.toFixed(2)} (本次: ¥${revenue.toFixed(2)})`);
    });

    // 转换为数组
    let salesPersonData = Array.from(salesPersonMap.values()).map((person: any) => ({
      id: person.id,
      name: person.name,
      avatar: '/avatars/user.png', // 默认头像
      department: person.department,
      departmentId: salespersonData.get(person.name)?.departmentId, // 保存部门ID用于过滤
      revenue: person.revenue,
      completedCustomers: person.participants, // 成交次数（不去重）
      courseCount: person.courses.size,
      trend: 'up' as const, // 默认趋势
      completedCustomerList: person.customerList // 成交客户列表
    }));

    // 🔒 数据范围过滤：部门经理默认只能看本部门数据
    if (userRole === 'manager' && userDepartmentId && !permissions?.includes('performance_view_all_departments')) {
      console.log(`🔒 部门经理数据过滤: 仅显示部门ID=${userDepartmentId}的数据`);
      salesPersonData = salesPersonData.filter(person => person.departmentId === userDepartmentId);
    }

    // 计算总计
    const totalRevenue = salesPersonData.reduce((sum, person) => sum + person.revenue, 0);
    const totalParticipants = salesPersonData.reduce((sum, person) => sum + person.completedCustomers, 0);

    console.log('=====================================');
    console.log('📈 月度业绩数据汇总:');
    console.log(`   总收入: ¥${totalRevenue.toFixed(2)}`);
    console.log(`   总客户数: ${totalParticipants}人`);
    console.log(`   销售员数量: ${salesPersonData.length}人`);
    console.log('   详细数据:');
    salesPersonData.forEach(p => {
      console.log(`   - ${p.name}: ${p.completedCustomers}人, ¥${p.revenue.toFixed(2)}`);
    });
    console.log('=====================================');

    return {
      totalRevenue,
      totalParticipants,
      salesPersonData
    };
  } catch (error) {
    console.error('获取月度业绩失败:', error);
    return { totalRevenue: 0, totalParticipants: 0, salesPersonData: [] };
  }
}

// 获取课程列表
export async function getCourseList() {
  try {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('获取课程列表失败:', error);
      return [];
    }

    return data?.map((course: any) => ({
      id: course.id,
      name: course.name
    })) || [];
  } catch (error) {
    console.error('获取课程列表失败:', error);
    return [];
  }
}

// 获取部门业绩汇总
export async function getDepartmentPerformance(timeRange: string = '本月') {
  try {
    const performanceData = await getMonthlyPerformance(timeRange);
    
    // 按部门汇总
    const departmentMap: { [key: string]: { name: string, revenue: number, participants: number, salesPersonCount: number } } = {};
    
    performanceData.salesPersonData.forEach(person => {
      const dept = person.department || '未分配部门';
      
      if (!departmentMap[dept]) {
        departmentMap[dept] = {
          name: dept,
          revenue: 0,
          participants: 0,
          salesPersonCount: 0
        };
      }
      
      const deptData = departmentMap[dept];
      deptData.revenue += person.revenue;
      deptData.participants += person.completedCustomers;
      deptData.salesPersonCount += 1;
    });

    return Object.values(departmentMap);
  } catch (error) {
    console.error('获取部门业绩失败:', error);
    return [];
  }
}

// 获取课程业绩明细
export async function getCoursePerformanceDetail(courseFilter: string = '全部', timeRange: string = '本月') {
  try {
    // 计算时间范围
    const now = new Date();
    let startDate: Date, endDate: Date;
    
    switch (timeRange) {
      case '本月':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case '上月':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    let query = supabase
      .from('training_sessions')
      .select(`
        id,
        name,
        date,
        end_date,
        area,
        training_mode,
        online_price,
        offline_price,
        training_participants(
          id,
          salesperson_name,
          participation_mode,
          actual_price,
          payment_amount
        )
      `)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: false });

    // 如果有课程筛选
    if (courseFilter !== '全部') {
      query = query.eq('name', courseFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('获取课程明细失败:', error);
      return [];
    }

    // 处理数据 - 按业务员分组
    const courseDetails = data?.map((session: any) => {
      const participants = session.training_participants || [];
      const onlineCount = participants.filter((p: any) => p.participation_mode === 'online').length;
      const offlineCount = participants.filter((p: any) => p.participation_mode === 'offline').length;
      const totalRevenue = participants.reduce((sum: number, p: any) => sum + (Number(p.payment_amount) || 0), 0);

      // 按业务员分组统计
      const salespersonStats = new Map();
      participants.forEach((p: any) => {
        const spName = p.salesperson_name || '未分配';
        if (!salespersonStats.has(spName)) {
          salespersonStats.set(spName, {
            name: spName,
            count: 0,
            revenue: 0
          });
        }
        const stats = salespersonStats.get(spName);
        stats.count += 1;
        stats.revenue += Number(p.payment_amount) || 0;
      });

      // 转换为数组并计算占比
      const salespersonList = Array.from(salespersonStats.values()).map(sp => ({
        name: sp.name,
        count: sp.count,
        revenue: sp.revenue,
        percentage: totalRevenue > 0 ? ((sp.revenue / totalRevenue) * 100).toFixed(1) : '0'
      }));

      return {
        id: session.id,
        courseName: session.name,
        sessionDate: session.date,
        endDate: session.end_date,
        area: session.area || '-',
        trainingMode: session.training_mode,
        onlinePrice: session.online_price || 0,
        offlinePrice: session.offline_price || 0,
        onlineParticipants: onlineCount,
        offlineParticipants: offlineCount,
        totalParticipants: participants.length,
        revenue: totalRevenue,
        status: new Date(session.date) < new Date() ? '已完成' : '进行中',
        salespersonList // 业务员明细列表
      };
    }) || [];

    return courseDetails;
  } catch (error) {
    console.error('获取课程明细失败:', error);
    return [];
  }
}

// 计算环比增长
export async function calculateGrowthRate(currentMonth: number, lastMonth: number): Promise<number> {
  if (lastMonth === 0) return 100;
  return ((currentMonth - lastMonth) / lastMonth) * 100;
}

// 获取销售榜单前10
export async function getTopPerformers(timeRange: string = '本月', role?: string, department?: string): Promise<any[]> {
  const performanceData = await getMonthlyPerformance(timeRange);
  const departmentData = await getDepartmentPerformance(timeRange);
  
  // 找出业绩最高的部门
  const topDepartment = departmentData.reduce((top: any, dept: any) => {
    return dept.revenue > (top?.revenue || 0) ? dept : top;
  }, null);

  // 找出业绩最高的员工
  let topSalesperson = performanceData.salesPersonData.reduce((top: any, person: any) => {
    return person.revenue > (top?.revenue || 0) ? person : top;
  }, null);

  // 如果是部门经理，只看本部门的
  if (role === 'manager' && department) {
    const deptSalespeople = performanceData.salesPersonData.filter(p => p.department === department);
    topSalesperson = deptSalespeople.reduce((top: any, person: any) => {
      return person.revenue > (top?.revenue || 0) ? person : top;
    }, null);
  }

  return [{
    topDepartment: topDepartment?.name || '暂无',
    topDepartmentRevenue: topDepartment?.revenue || 0,
    topDepartmentPercent: performanceData.totalRevenue > 0 
      ? ((topDepartment?.revenue || 0) / performanceData.totalRevenue * 100).toFixed(0)
      : 0,
    topSalesperson: topSalesperson?.name || '暂无',
    topSalespersonRevenue: topSalesperson?.revenue || 0,
    topSalespersonPercent: performanceData.totalRevenue > 0
      ? ((topSalesperson?.revenue || 0) / performanceData.totalRevenue * 100).toFixed(0)
      : 0
  }];
}
