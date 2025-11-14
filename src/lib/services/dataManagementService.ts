import type { 
  DataType, 
  DuplicateStrategy, 
  ImportResult,
  ExportConfig,
  OperationRecord
} from '@/types/dataManagement';
import { CONFIG } from '@/constants/dataManagement';
import { supabase } from '@/lib/supabase/client';
import { convertToBoolean } from '@/lib/validators/dataValidator';

class DataManagementService {
  // 获取表名
  private static tableMap: Record<DataType, string> = {
    courses: 'courses',
    experts: 'experts',
    customers: 'customers',
    salespersons: 'user_profiles',
    training_sessions: 'training_sessions',
    salesperson_performance: 'salesperson_performance',
    course_sales_performance: 'course_sales_performance'
  };

  private getTableName(dataType: DataType): string {
    return DataManagementService.tableMap[dataType];
  }

  // 处理行数据（解析外键关联）
  async processRow(row: any, dataType: DataType): Promise<any> {
    const processed = { ...row };

    // 处理专家关联
    if (row.expert_name && !row.expert_id) {
      const expert = await this.findExpertByName(row.expert_name);
      if (expert) {
        processed.expert_id = expert.id;
      }
    }

    // 处理业务员关联
    if (row.salesperson_name && !row.salesperson_id) {
      const salesperson = await this.findSalespersonByName(row.salesperson_name);
      if (salesperson) {
        if (dataType === 'customers') {
          processed.salesperson_id = salesperson.user_id;
        } else if (dataType === 'training_sessions') {
          processed.salesperson_id = salesperson.id;
        }
        processed.salesperson_name = salesperson.name;
      }
    }

    // 处理标签（字符串转数组）
    if (row.tags && typeof row.tags === 'string') {
      processed.tags = row.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t);
    }

    // 处理课程列表（字符串转数组）
    if (row.courses && typeof row.courses === 'string') {
      processed.courses = row.courses.split(',').map((c: string) => c.trim()).filter((c: string) => c);
    }

    // 处理布尔值
    if (row.available !== undefined && row.available !== null && row.available !== '') {
      processed.available = convertToBoolean(row.available);
    }

    // 处理培训场次的默认值
    if (dataType === 'training_sessions') {
      // 如果没有结束日期，使用开始日期
      if (!processed.end_date && processed.date) {
        processed.end_date = processed.date;
      }
      // 设置默认容纳人数
      if (!processed.capacity) {
        processed.capacity = 30;
      }
      // 设置默认参训人数
      if (!processed.participants) {
        processed.participants = 0;
      }
    }

    // 处理业务员的默认状态
    if (dataType === 'salespersons' && !processed.status) {
      processed.status = 'pending';
    }

    return processed;
  }

  // 检查重复数据
  async checkDuplicate(row: any, dataType: DataType): Promise<any | null> {
    const tableName = this.getTableName(dataType);

    try {
      switch (dataType) {
        case 'customers':
          const { data: customer } = await supabase
            .from(tableName)
            .select('*')
            .eq('phone', row.phone)
            .single();
          return customer;

        case 'salespersons':
          let query = supabase.from(tableName).select('*');
          if (row.phone) {
            const { data: byPhone } = await query.eq('phone', row.phone).single();
            if (byPhone) return byPhone;
          }
          if (row.email) {
            const { data: byEmail } = await query.eq('email', row.email).single();
            if (byEmail) return byEmail;
          }
          return null;

        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  // 导入数据
  async importData(
    dataType: DataType,
    data: any[],
    duplicateStrategy: DuplicateStrategy
  ): Promise<ImportResult> {
    const tableName = this.getTableName(dataType);
    const startTime = Date.now();
    const results: ImportResult = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      duration: 0
    };

    // 分批处理
    const batchSize = CONFIG.BATCH_SIZE;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      for (const row of batch) {
        const rowIndex = data.indexOf(row) + 2; // Excel 行号

        try {
          // 处理行数据
          const processedRow = await this.processRow(row, dataType);

          // 检查重复
          const duplicate = await this.checkDuplicate(processedRow, dataType);

          if (duplicate) {
            if (duplicateStrategy === 'skip') {
              results.skipped++;
              continue;
            } else if (duplicateStrategy === 'overwrite') {
              const { error } = await (supabase
                .from(tableName) as any)
                .update(processedRow)
                .eq('id', duplicate.id);

              if (error) {
                results.failed++;
                results.errors.push({
                  row: rowIndex,
                  error: error.message
                });
              } else {
                results.success++;
              }
              continue;
            }
            // keep_both 策略继续插入
          }

          // 插入数据
          const { error } = await supabase
            .from(tableName)
            .insert(processedRow as any);

          if (error) {
            results.failed++;
            results.errors.push({
              row: rowIndex,
              error: error.message
            });
          } else {
            results.success++;
          }
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: rowIndex,
            error: error.message || '未知错误'
          });
        }
      }
    }

    results.duration = Date.now() - startTime;
    return results;
  }

  // 导出数据（带权限和数据范围控制）
  async exportData(
    config: ExportConfig, 
    userId?: string, 
    userRole?: string,
    permissions?: string[]
  ): Promise<any[]> {
    // 特殊处理：业务员业绩导出
    if (config.dataType === 'salesperson_performance') {
      const { getMonthlyPerformance } = await import('./performanceService');
      
      const timeRange = config.filters?.timeRange || '本月';
      
      // 获取用户部门ID（仅用于经理数据范围过滤，管理员不受限制）
      let userDepartmentId: number | undefined;
      if (userRole === 'manager' && userId) {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('department_id')
          .eq('id', userId)
          .single();
        userDepartmentId = (userProfile as any)?.department_id;
      }
      
      // 调用业绩服务，传递用户信息（管理员不受任何数据范围限制）
      const performanceData = await getMonthlyPerformance(
        timeRange,
        userRole,
        userDepartmentId,
        permissions
      );
      
      let data = performanceData.salesPersonData || [];
      
      // 应用部门筛选
      if (config.filters?.department && config.filters.department !== '全部') {
        data = data.filter((item: any) => item.department === config.filters.department);
      }
      
      // 应用业务员筛选
      if (config.filters?.salesperson && config.filters.salesperson !== '全部') {
        data = data.filter((item: any) => item.name === config.filters.salesperson);
      }
      
      return data;
    }
    
    // 特殊处理：课程销售业绩导出
    if (config.dataType === 'course_sales_performance') {
      const { getCoursePerformanceDetail } = await import('./performanceService');
      const timeRange = config.filters?.timeRange || '本月';
      const course = config.filters?.course || '全部';
      const data = await getCoursePerformanceDetail(course, timeRange);
      
      return data;
    }
    
    const tableName = this.getTableName(config.dataType);
    
    // 特殊处理：客户信息导出（需要join业务员和部门信息）
    if (config.dataType === 'customers') {
      // 第一步：查询客户和业务员信息
      let query = supabase
        .from('customers')
        .select(`
          *,
          salesperson:user_profiles!customers_salesperson_id_fkey(
            id,
            name,
            department_id
          )
        `);

      // 数据范围过滤：业务员只能导出自己的数据
      if (userRole === 'salesperson') {
        const canViewAll = permissions?.includes('customer_view_all');
        if (!canViewAll && userId) {
          query = query.eq('salesperson_id', userId);
        }
      }

      // 应用部门筛选
      if (config.filters?.department && config.filters.department !== '全部') {
        // 先查询该部门的ID
        const { data: dept } = await supabase
          .from('departments')
          .select('id')
          .eq('name', config.filters.department)
          .single();
        
        if (dept) {
          // 查询该部门的所有业务员ID
          const { data: deptSalespersons } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('role', 'salesperson')
            .eq('department_id', (dept as any).id);
          
          if (deptSalespersons && deptSalespersons.length > 0) {
            const salespersonIds = deptSalespersons.map((s: any) => s.id);
            query = query.in('salesperson_id', salespersonIds);
          } else {
            // 该部门没有业务员，返回空数据
            return [];
          }
        } else {
          // 找不到该部门，返回空数据
          return [];
        }
      }

      // 应用业务员筛选
      if (config.filters?.salesperson && config.filters.salesperson !== '全部') {
        // 查询业务员ID
        const { data: salesperson } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('name', config.filters.salesperson)
          .eq('role', 'salesperson')
          .single();
        
        if (salesperson) {
          query = query.eq('salesperson_id', (salesperson as any).id);
        } else {
          // 找不到该业务员，返回空数据
          return [];
        }
      }

      // 应用日期范围
      if (config.dateRange && config.dateRange.length === 2) {
        query = query
          .gte('created_at', config.dateRange[0].toISOString())
          .lte('created_at', config.dateRange[1].toISOString());
      }

      // 应用排序
      if (config.sortBy) {
        query = query.order(config.sortBy, { 
          ascending: config.sortOrder === 'asc' 
        });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`导出失败: ${error.message}`);
      }

      // 第二步：获取所有唯一的部门ID
      const departmentIds = [...new Set(
        (data || [])
          .map((customer: any) => customer.salesperson?.department_id)
          .filter((id: any) => id !== null && id !== undefined)
      )];

      // 第三步：批量查询部门信息
      let departmentMap: Record<number, string> = {};
      if (departmentIds.length > 0) {
        const { data: departments } = await supabase
          .from('departments')
          .select('id, name')
          .in('id', departmentIds);
        
        if (departments) {
          departments.forEach((dept: any) => {
            departmentMap[dept.id] = dept.name;
          });
        }
      }

      // 第四步：格式化数据（展平业务员和部门信息）
      const formattedData = (data || []).map((customer: any) => ({
        ...customer,
        salesperson_name: customer.salesperson?.name || '',
        department_name: customer.salesperson?.department_id 
          ? departmentMap[customer.salesperson.department_id] || ''
          : '',
        salesperson: undefined, // 移除嵌套对象
      }));

      return formattedData;
    }

    // 特殊处理：培训场次导出（需要处理月份、地点、负责人筛选）
    if (config.dataType === 'training_sessions') {
      let query = supabase
        .from('training_sessions')
        .select('*');

      // 应用月份筛选（根据开始日期date字段）
      if (config.filters?.month && config.filters.month !== '全部') {
        const monthStr = config.filters.month; // 格式: "2025-11"
        const [year, month] = monthStr.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
        
        query = query
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);
      }

      // 应用地点筛选
      if (config.filters?.area && config.filters.area !== '全部') {
        query = query.eq('area', config.filters.area);
      }

      // 应用负责人筛选
      if (config.filters?.salesperson && config.filters.salesperson !== '全部') {
        // 查询业务员ID
        const { data: salesperson } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('name', config.filters.salesperson)
          .eq('role', 'salesperson')
          .single();
        
        if (salesperson) {
          query = query.eq('salesperson_id', (salesperson as any).id);
        } else {
          // 找不到该业务员，返回空数据
          return [];
        }
      }

      // 应用日期范围
      if (config.dateRange && config.dateRange.length === 2) {
        query = query
          .gte('date', config.dateRange[0].toISOString().split('T')[0])
          .lte('date', config.dateRange[1].toISOString().split('T')[0]);
      }

      // 应用排序
      if (config.sortBy) {
        query = query.order(config.sortBy, { 
          ascending: config.sortOrder === 'asc' 
        });
      } else {
        // 默认按日期倒序
        query = query.order('date', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`导出失败: ${error.message}`);
      }

      return data || [];
    }

    // 常规表的导出逻辑
    let query = supabase.from(tableName).select('*');

    // 应用筛选条件
    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '' && value !== '全部') {
          query = query.eq(key, value);
        }
      });
    }

    // 应用日期范围
    if (config.dateRange && config.dateRange.length === 2) {
      query = query
        .gte('created_at', config.dateRange[0].toISOString())
        .lte('created_at', config.dateRange[1].toISOString());
    }

    // 应用排序
    if (config.sortBy) {
      query = query.order(config.sortBy, { 
        ascending: config.sortOrder === 'asc' 
      });
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`导出失败: ${error.message}`);
    }

    return data || [];
  }

  // 记录操作历史
  async recordOperation(operation: Omit<OperationRecord, 'id'>): Promise<void> {
    try {
      await supabase
        .from('data_management_history')
        .insert(operation as any);
    } catch (error) {
      console.error('记录操作历史失败:', error);
    }
  }

  // 获取操作历史
  async getOperationHistory(limit: number = 20): Promise<OperationRecord[]> {
    const { data, error } = await supabase
      .from('data_management_history')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取操作历史失败:', error);
      return [];
    }

    return data || [];
  }

  // 辅助方法：通过姓名查找专家
  async findExpertByName(name: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('experts')
        .select('id, name')
        .eq('name', name)
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  // 辅助方法：通过姓名查找业务员
  async findSalespersonByName(name: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name, user_id')
        .eq('name', name)
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  // 获取可导出字段列表
  static getExportableFields(dataType: DataType): string[] {
    const fields: Record<DataType, string[]> = {
      courses: ['id', 'module', 'name', 'code', 'duration_days', 'sessions_per_year', 'standard_fee', 'online_price', 'offline_price', 'average_price', 'description', 'notes', 'status', 'created_at'],
      experts: ['id', 'name', 'phone', 'email', 'title', 'gender', 'field', 'experience', 'rating', 'courses', 'location', 'available', 'bio', 'past_sessions', 'total_participants', 'id_number', 'bank_card_number', 'hourly_rate', 'resume', 'created_at'],
      customers: ['id', 'name', 'phone', 'email', 'company', 'position', 'location', 'status', 'salesperson_name', 'follow_up_status', 'last_contact', 'tags', 'created_at'],
      salespersons: ['id', 'name', 'phone', 'email', 'department', 'position', 'join_date', 'status', 'team', 'created_at'],
      training_sessions: ['id', 'name', 'date', 'end_date', 'participants', 'expert_name', 'area', 'revenue', 'status', 'rating', 'salesperson_name', 'course_id', 'course_name', 'session_number', 'capacity', 'created_at'],
      salesperson_performance: ['id', 'name', 'department', 'completedCustomers', 'revenue', 'latestDate', 'completedCustomerList'],
      course_sales_performance: ['id', 'courseName', 'sessionDate', 'endDate', 'area', 'onlinePrice', 'offlinePrice', 'trainingMode', 'totalParticipants', 'onlineParticipants', 'offlineParticipants', 'revenue', 'status', 'salespersonList']
    };

    return fields[dataType] || [];
  }
}

export default new DataManagementService();

