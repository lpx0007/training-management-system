import supabaseService from '@/lib/supabase/supabaseService';
import { supabase } from '@/lib/supabase/client';

export interface SalesPersonData {
  id: number;
  name: string;
  avatar: string | null;
  department: string | null;
  revenue: number;
  completedCustomers: number;
  conversionRate: number;
  ranking?: number;
}

export interface MonthlySalesData {
  month: string;
  revenue: number;
  customers: number;
}

export interface DepartmentSalesData {
  name: string;
  value: number;
  color: string;
}

// Mock数据作为回退
const mockSalesPersons: SalesPersonData[] = [
  {
    id: 1,
    name: '张三',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang',
    department: '销售一部',
    revenue: 12000,
    completedCustomers: 8,
    conversionRate: 25,
    ranking: 3
  },
  {
    id: 2,
    name: '李四',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li',
    department: '销售二部',
    revenue: 18000,
    completedCustomers: 12,
    conversionRate: 35,
    ranking: 1
  },
  {
    id: 3,
    name: '王五',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang',
    department: '销售一部',
    revenue: 15000,
    completedCustomers: 10,
    conversionRate: 30,
    ranking: 2
  }
];

const mockMonthlyData: MonthlySalesData[] = [
  { month: '1月', revenue: 70000, customers: 45 },
  { month: '2月', revenue: 85000, customers: 52 },
  { month: '3月', revenue: 92000, customers: 58 },
  { month: '4月', revenue: 105000, customers: 65 },
  { month: '5月', revenue: 120000, customers: 72 },
  { month: '6月', revenue: 135000, customers: 80 }
];

const mockDepartmentData: DepartmentSalesData[] = [
  { name: '销售一部', value: 27000, color: '#3b82f6' },
  { name: '销售二部', value: 28000, color: '#10b981' },
  { name: '销售三部', value: 15000, color: '#f59e0b' }
];

/**
 * 获取业务员销售数据
 * 成交客户 = 实际参加了该业务员负责的已完成培训的客户
 */
export async function getSalesPersonsData(_timeRange: string = '本月'): Promise<SalesPersonData[]> {
  try {
    // 1. 获取业务员数据 (user_profiles表)
    const userProfiles = await supabaseService.getSalespersons();
    
    if (!userProfiles || userProfiles.length === 0) {
      console.log('没有找到业务员数据,使用Mock数据');
      return mockSalesPersons;
    }

    // 2. 获取salespersons表数据(包含department等信息)
    const { data: salespersonsTable } = await supabase
      .from('salespersons')
      .select('*');
    
    console.log('找到user_profiles数量:', userProfiles.length);
    console.log('找到salespersons数量:', salespersonsTable?.length || 0);
    
    // 3. 合并两个表的数据
    const salespersons = userProfiles.map((profile: any) => {
      const salespersonRecord = (salespersonsTable as any[] || []).find(
        (s: any) => s.user_id === profile.id
      ) as any;
      return {
        ...profile,
        salesperson_id: salespersonRecord?.id,  // salespersons表的id
        department: salespersonRecord?.department,
        avatar: salespersonRecord?.avatar
      };
    });
    
    console.log('合并后的业务员示例:', salespersons.slice(0, 1));

    // 4. 获取所有客户数据
    const allCustomers = await supabaseService.getCustomers();
    console.log('找到客户数量:', allCustomers.length);
    console.log('客户示例:', allCustomers.slice(0, 2).map((c: any) => ({
      id: c.id,
      name: c.name,
      salesperson_id: c.salesperson_id,
      salesperson_id_type: typeof c.salesperson_id,
      salesperson_name: c.salesperson_name
    })));

    // 5. 获取所有培训场次
    const allSessions = await supabaseService.getTrainingSessions();
    console.log('找到培训场次数量:', allSessions.length);

    // 6. 获取所有培训参与者记录
    const { data: allParticipants } = await supabase
      .from('training_participants')
      .select('*');
    console.log('找到培训参与者记录:', allParticipants?.length || 0);

    // 7. 为每个业务员计算数据
    const salesData = salespersons.map((salesperson: any) => {
      try {
        // 调试: 显示业务员信息
        console.log(`\n处理业务员: ${salesperson.name}`, {
          salesperson_id: salesperson.id,
          id_type: typeof salesperson.id
        });
        
        // 获取该业务员的客户
        // 注意: getSalespersons() 返回的是 user_profiles,所以 salesperson.id 就是 user_id
        const salespersonCustomers = allCustomers.filter(
          (c: any) => c.salesperson_id === salesperson.id
        );
        
        // 调试: 显示匹配结果
        console.log(`  匹配到 ${salespersonCustomers.length} 个客户`);
        if (salespersonCustomers.length > 0) {
          console.log(`  客户示例:`, salespersonCustomers.slice(0, 2).map((c: any) => ({
            id: c.id,
            name: c.name,
            salesperson_id: c.salesperson_id
          })));
        } else {
          // 显示为什么没匹配到
          const customersWithSameName = allCustomers.filter(
            (c: any) => c.salesperson_name === salesperson.name
          );
          if (customersWithSameName.length > 0) {
            console.log(`  ⚠️ 有 ${customersWithSameName.length} 个客户的 salesperson_name 是 "${salesperson.name}"`);
            console.log(`  但这些客户的 salesperson_id 是:`, 
              customersWithSameName.slice(0, 2).map((c: any) => c.salesperson_id)
            );
            console.log(`  而业务员的 user_id 是: ${salesperson.user_id}`);
          }
        }

        // 获取该业务员的客户ID集合
        const salespersonCustomerIds = new Set(
          salespersonCustomers.map((c: any) => c.id)
        );

        // 获取该业务员负责的已完成培训场次
        // 注意: training_sessions.salesperson_id 关联的是 salespersons.id
        const salespersonSessions = allSessions.filter(
          (s: any) => s.salesperson_id === salesperson.salesperson_id && s.status === '已完成'
        );

        // 计算成交客户数 = 该业务员的客户中,实际参加了任何已完成培训的唯一客户数
        // 关键: 通过 customer_id 关联,不依赖 salesperson_name
        
        // 调试: 显示参训记录筛选过程
        const relevantParticipants = (allParticipants || []).filter((p: any) => {
          const hasCustomerId = !!p.customer_id;
          const isMyCustomer = salespersonCustomerIds.has(p.customer_id);
          const session = allSessions.find((s: any) => s.id === p.training_session_id);
          const isCompleted = session && session.status === '已完成';
          
          if (hasCustomerId && isMyCustomer) {
            console.log(`    参训记录: customer_id=${p.customer_id}, training_id=${p.training_session_id}, 是我的客户=${isMyCustomer}, 培训已完成=${isCompleted}, 培训状态=${session?.status}`);
          }
          
          return hasCustomerId && isMyCustomer && isCompleted;
        });
        
        const participatedCustomerIds = new Set(
          relevantParticipants.map((p: any) => p.customer_id)
        );
        const completedCustomers = participatedCustomerIds.size;
        
        console.log(`  筛选后的参训记录数: ${relevantParticipants.length}`);
        console.log(`  成交客户ID: [${Array.from(participatedCustomerIds).join(', ')}]`);

        // 计算总销售额(只统计该业务员负责的已完成培训)
        const revenue = salespersonSessions.reduce((sum: number, session: any) => {
          return sum + (Number(session.revenue) || 0);
        }, 0);

        // 计算转化率 = 成交客户数 / 总客户数
        const totalCustomers = salespersonCustomers.length;
        const conversionRate = totalCustomers > 0 
          ? Math.round((completedCustomers / totalCustomers) * 100) 
          : 0;

        // 详细日志
        console.log(`业务员 ${salesperson.name}:`, {
          总客户数: totalCustomers,
          客户ID列表: Array.from(salespersonCustomerIds),
          成交客户数: completedCustomers,
          成交客户ID: Array.from(participatedCustomerIds),
          转化率: conversionRate + '%',
          销售额: revenue,
          已完成培训场次: salespersonSessions.length
        });

        return {
          id: salesperson.salesperson_id || salesperson.id,
          name: salesperson.name,
          avatar: salesperson.avatar || null,
          department: salesperson.department || '未分配',
          revenue,
          completedCustomers,
          conversionRate,
        };
      } catch (error) {
        console.error(`处理业务员 ${salesperson.name} 数据时出错:`, error);
        return null;
      }
    });

    // 过滤掉null值并按销售额排序
    const validSalesData = salesData
      .filter((data): data is SalesPersonData => data !== null)
      .sort((a, b) => b.revenue - a.revenue);

    // 添加排名
    const result = validSalesData.map((data, index) => ({
      ...data,
      ranking: index + 1,
    }));

    console.log('处理后的销售数据:', result);
    return result;
  } catch (error) {
    console.error('获取销售数据失败,使用Mock数据:', error);
    return mockSalesPersons;
  }
}

/**
 * 获取月度销售趋势数据
 * 成交客户 = 该月参加了已完成培训的客户
 */
export async function getMonthlySalesData(): Promise<MonthlySalesData[]> {
  try {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    const currentYear = new Date().getFullYear();
    
    // 获取所有培训场次
    const allSessions = await supabaseService.getTrainingSessions();
    
    // 获取所有培训参与者记录
    const { data: allParticipants } = await supabase
      .from('training_participants')
      .select('*');
    
    const monthlyData = months.map((month, index) => {
      const monthNum = index + 1;
      const startDate = new Date(currentYear, monthNum - 1, 1);
      const endDate = new Date(currentYear, monthNum, 1);

      // 筛选该月的已完成培训场次
      const monthSessions = allSessions.filter((s: any) => {
        if (s.status !== '已完成' || !s.date) return false;
        const sessionDate = new Date(s.date);
        return sessionDate >= startDate && sessionDate < endDate;
      });

      const revenue = monthSessions.reduce((sum: number, s: any) => {
        return sum + (Number(s.revenue) || 0);
      }, 0);

      // 获取这些培训场次的ID
      const sessionIds = monthSessions.map((s: any) => s.id);

      // 计算该月成交客户数 = 参加了这些培训的唯一客户数
      const monthCustomerIds = new Set(
        (allParticipants || [])
          .filter((p: any) => sessionIds.includes(p.training_session_id) && p.customer_id)
          .map((p: any) => p.customer_id)
      );

      return {
        month,
        revenue,
        customers: monthCustomerIds.size,
      };
    });

    console.log('月度数据:', monthlyData);
    return monthlyData;
  } catch (error) {
    console.error('获取月度数据失败,使用Mock数据:', error);
    return mockMonthlyData;
  }
}

/**
 * 获取部门销售分布数据
 */
export async function getDepartmentSalesData(): Promise<DepartmentSalesData[]> {
  try {
    const salespersons = await supabaseService.getSalespersons();
    const allSessions = await supabaseService.getTrainingSessions();

    if (!salespersons || salespersons.length === 0) {
      console.log('没有业务员数据,使用Mock数据');
      return mockDepartmentData;
    }

    // 按部门分组统计
    const departmentMap = new Map<string, number>();

    salespersons.forEach((salesperson: any) => {
      // 获取该业务员的培训场次
      const salespersonSessions = allSessions.filter(
        (s: any) => s.salesperson_id === salesperson.id && s.status === '已完成'
      );

      const revenue = salespersonSessions.reduce((sum: number, s: any) => {
        return sum + (Number(s.revenue) || 0);
      }, 0);

      const dept = salesperson.department || '未分配';
      departmentMap.set(dept, (departmentMap.get(dept) || 0) + revenue);
    });

    // 转换为数组格式
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    const result = Array.from(departmentMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value);

    console.log('部门数据:', result);
    return result;
  } catch (error) {
    console.error('获取部门数据失败,使用Mock数据:', error);
    return mockDepartmentData;
  }
}

/**
 * 获取转化率分布数据
 */
export async function getConversionRateDistribution() {
  try {
    const salesData = await getSalesPersonsData();
    
    const distribution = {
      low: 0,    // 20%以下
      medium: 0, // 20-30%
      high: 0,   // 30%以上
    };

    salesData.forEach(data => {
      if (data.conversionRate < 20) {
        distribution.low++;
      } else if (data.conversionRate < 30) {
        distribution.medium++;
      } else {
        distribution.high++;
      }
    });

    return [
      { name: '20%以下', value: distribution.low },
      { name: '20-30%', value: distribution.medium },
      { name: '30%以上', value: distribution.high },
    ];
  } catch (error) {
    console.error('获取转化率分布失败,使用默认数据:', error);
    return [
      { name: '20%以下', value: 0 },
      { name: '20-30%', value: 1 },
      { name: '30%以上', value: 2 },
    ];
  }
}
