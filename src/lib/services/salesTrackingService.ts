import supabaseService from '@/lib/supabase/supabaseService';
import { supabase } from '@/lib/supabase/client';

export interface CompletedCustomer {
  id: number;
  name: string;
  company?: string | null;
  latestDate: string;
  participationCount: number;
}

export interface SalesPersonData {
  id: number;
  name: string;
  avatar: string | null;
  department: string | null;
  revenue: number;
  completedCustomers: number;
  conversionRate: number;
  ranking?: number;
  completedCustomerList?: CompletedCustomer[];
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

/**
 * 获取业务员销售数据
 * 核心逻辑: training_participants.customer_id → customers.salesperson_id → user_profiles.id
 * 不考虑培训负责人,只看客户归属
 * 不去重: 一个客户参加多次培训算多次成交
 */
export async function getSalesPersonsData(timeRange: string = '本月'): Promise<SalesPersonData[]> {
  try {
    console.log('=== 开始加载销售追踪数据 ===');
    
    // 1. 获取user_profiles (业务员)
    const userProfiles = await supabaseService.getSalespersons();
    if (!userProfiles || userProfiles.length === 0) {
      console.log('没有找到业务员');
      return [];
    }
    
    // 2. 直接使用 user_profiles 数据（salespersons 表已废弃）
    const salespersons = userProfiles.map((profile: any) => {
      return {
        ...profile,
        salesperson_id: profile.id, // 使用 user_profiles 的 id
        department: profile.department,
        avatar: profile.avatar
      };
    });
    
    // 4. 获取所有客户
    const allCustomers = await supabaseService.getCustomers();
    
    // 5. 获取所有培训场次
    const allSessions = await supabaseService.getTrainingSessions();
    
    // 6. 获取所有参训记录
    const { data: allParticipants } = await supabase
      .from('training_participants')
      .select('*');
    
    console.log(`数据加载完成: ${salespersons.length}个业务员, ${allCustomers.length}个客户, ${allParticipants?.length || 0}条参训记录`);
    
    // 7. 创建客户ID到业务员ID的映射
    const customerToSalesperson = new Map<number, string>();
    allCustomers.forEach((customer: any) => {
      if (customer.id && customer.salesperson_id) {
        customerToSalesperson.set(customer.id, customer.salesperson_id);
      }
    });
    
    // 8. 计算时间范围
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    
    switch (timeRange) {
      case '本月':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '上月':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case '本季度':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case '上季度':
        const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
        startDate = new Date(now.getFullYear(), lastQuarter * 3, 1);
        endDate = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0);
        break;
      case '本年':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    console.log(`时间范围: ${timeRange}, ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    
    // 9. 按业务员统计参训数据
    const salespersonParticipantCount = new Map<string, number>(); // 成交次数(不去重)
    const salespersonUniqueCustomers = new Map<string, Set<number>>(); // 成交客户(去重,用于转化率)
    
    (allParticipants || []).forEach((participant: any) => {
      if (!participant.customer_id) return;
      
      // 时间筛选: 使用 registration_date
      if (participant.registration_date) {
        const regDate = new Date(participant.registration_date);
        if (regDate < startDate || regDate > endDate) return;
      }
      
      const salespersonId = customerToSalesperson.get(participant.customer_id);
      if (!salespersonId) return;
      
      // 成交次数: 不去重,直接累加
      const currentCount = salespersonParticipantCount.get(salespersonId) || 0;
      salespersonParticipantCount.set(salespersonId, currentCount + 1);
      
      // 成交客户: 去重,用Set存储唯一客户ID
      if (!salespersonUniqueCustomers.has(salespersonId)) {
        salespersonUniqueCustomers.set(salespersonId, new Set());
      }
      salespersonUniqueCustomers.get(salespersonId)!.add(participant.customer_id);
    });
    
    console.log('参训统计:', Array.from(salespersonParticipantCount.entries()).map(([id, count]) => ({
      salesperson_id: id,
      participation_count: count,
      unique_customers: salespersonUniqueCustomers.get(id)?.size || 0
    })));
    
    // 10. 为每个业务员计算数据
    const salesData = salespersons.map((salesperson: any) => {
      // 总客户数
      const totalCustomers = allCustomers.filter(
        (c: any) => c.salesperson_id === salesperson.id
      ).length;
      
      // 成交次数(参训次数,不去重)
      const completedCustomers = salespersonParticipantCount.get(salesperson.id) || 0;
      
      // 成交客户数(去重,用于计算转化率)
      const uniqueCustomerIds = salespersonUniqueCustomers.get(salesperson.id) || new Set();
      const uniqueCustomers = uniqueCustomerIds.size;
      
      // 成交客户详情列表
      const completedCustomerList: CompletedCustomer[] = Array.from(uniqueCustomerIds).map((customerId: number) => {
        const customer = allCustomers.find((c: any) => c.id === customerId);
        
        // 统计该客户的参训次数和最新日期
        const customerParticipations = (allParticipants || []).filter((p: any) => {
          if (p.customer_id !== customerId) return false;
          if (p.registration_date) {
            const regDate = new Date(p.registration_date);
            if (regDate < startDate || regDate > endDate) return false;
          }
          return true;
        });
        
        const participationCount = customerParticipations.length;
        const latestDate = customerParticipations.reduce((latest: string, p: any) => {
          if (!p.registration_date) return latest;
          return p.registration_date > latest ? p.registration_date : latest;
        }, '');
        
        return {
          id: customerId,
          name: customer?.name || `客户${customerId}`,
          company: customer?.company,
          latestDate,
          participationCount
        };
      }).sort((a, b) => b.latestDate.localeCompare(a.latestDate));
      
      // 销售额(该业务员负责的已完成培训)
      const revenue = allSessions
        .filter((s: any) => s.salesperson_id === salesperson.salesperson_id && s.status === '已完成')
        .reduce((sum: number, s: any) => sum + (Number(s.revenue) || 0), 0);
      
      // 转化率 = 成交客户数(去重) / 总客户数
      const conversionRate = totalCustomers > 0 
        ? Math.round((uniqueCustomers / totalCustomers) * 100) 
        : 0;
      
      console.log(`${salesperson.name}: 总客户${totalCustomers}, 成交次数${completedCustomers}, 成交客户${uniqueCustomers}, 转化率${conversionRate}%`);
      
      return {
        id: salesperson.salesperson_id || salesperson.id,
        name: salesperson.name,
        avatar: salesperson.avatar || null,
        department: salesperson.department || '未分配',
        revenue,
        completedCustomers,
        conversionRate,
        completedCustomerList
      };
    });
    
    // 排序并添加排名
    const sorted = salesData.sort((a, b) => b.revenue - a.revenue);
    return sorted.map((data, index) => ({ ...data, ranking: index + 1 }));
    
  } catch (error) {
    console.error('获取销售数据失败:', error);
    return [];
  }
}

/**
 * 获取月度销售趋势数据
 */
export async function getMonthlySalesData(): Promise<MonthlySalesData[]> {
  try {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    const currentYear = new Date().getFullYear();
    
    const allSessions = await supabaseService.getTrainingSessions();
    const { data: allParticipants } = await supabase
      .from('training_participants')
      .select('*');
    
    const monthlyData = months.map((month, index) => {
      const monthNum = index + 1;
      const startDate = new Date(currentYear, monthNum - 1, 1);
      const endDate = new Date(currentYear, monthNum, 1);

      const monthSessions = allSessions.filter((s: any) => {
        if (s.status !== '已完成' || !s.date) return false;
        const sessionDate = new Date(s.date);
        return sessionDate >= startDate && sessionDate < endDate;
      });

      const revenue = monthSessions.reduce((sum: number, s: any) => {
        return sum + (Number(s.revenue) || 0);
      }, 0);

      const sessionIds = monthSessions.map((s: any) => s.id);
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

    return monthlyData;
  } catch (error) {
    console.error('获取月度数据失败:', error);
    return [];
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
      return [];
    }

    const departmentMap = new Map<string, number>();

    salespersons.forEach((salesperson: any) => {
      const salespersonSessions = allSessions.filter(
        (s: any) => s.salesperson_id === salesperson.id && s.status === '已完成'
      );

      const revenue = salespersonSessions.reduce((sum: number, s: any) => {
        return sum + (Number(s.revenue) || 0);
      }, 0);

      const dept = salesperson.department || '未分配';
      departmentMap.set(dept, (departmentMap.get(dept) || 0) + revenue);
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    return Array.from(departmentMap.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  } catch (error) {
    console.error('获取部门数据失败:', error);
    return [];
  }
}

/**
 * 获取转化率分布数据
 */
export async function getConversionRateDistribution() {
  try {
    const salesData = await getSalesPersonsData();
    
    const distribution = {
      low: 0,
      medium: 0,
      high: 0,
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
    console.error('获取转化率分布失败:', error);
    return [];
  }
}
