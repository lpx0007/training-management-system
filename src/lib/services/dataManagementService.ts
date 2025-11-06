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
  private getTableName(dataType: DataType): string {
    const tableMap: Record<DataType, string> = {
      courses: 'courses',
      experts: 'experts',
      customers: 'customers',
      salespersons: 'salespersons',
      training_sessions: 'training_sessions'
    };
    return tableMap[dataType];
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
        case 'courses':
          const { data: course } = await supabase
            .from(tableName)
            .select('*')
            .eq('id', row.id)
            .single();
          return course;

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
    const tableName = this.getTableName(config.dataType);
    let query = supabase.from(tableName).select('*');

    // 数据范围过滤：业务员只能导出自己的数据
    if (config.dataType === 'customers' && userRole === 'salesperson') {
      // 检查是否有查看所有客户的权限
      const canViewAll = permissions?.includes('customer_view_all');
      
      if (!canViewAll && userId) {
        // 只能导出自己负责的客户
        query = query.eq('salesperson_id', userId);
      }
    }

    // 应用筛选条件
    if (config.filters) {
      Object.entries(config.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
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
  getExportableFields(dataType: DataType): string[] {
    
    // 根据数据类型返回可导出字段
    const fieldMap: Record<DataType, string[]> = {
      courses: ['id', 'name', 'description', 'duration', 'price', 'category', 'expert_id', 'created_at'],
      experts: ['id', 'name', 'title', 'field', 'experience', 'rating', 'courses', 'location', 'available', 'bio', 'past_sessions', 'total_participants', 'created_at'],
      customers: ['id', 'name', 'phone', 'email', 'company', 'position', 'location', 'status', 'salesperson_name', 'follow_up_status', 'last_contact', 'tags', 'created_at'],
      salespersons: ['id', 'name', 'phone', 'email', 'department', 'position', 'join_date', 'status', 'team', 'created_at'],
      training_sessions: ['id', 'name', 'date', 'end_date', 'start_time', 'end_time', 'participants', 'expert_name', 'area', 'revenue', 'status', 'rating', 'salesperson_name', 'course_id', 'capacity', 'created_at']
    };

    return fieldMap[dataType] || [];
  }
}

export default new DataManagementService();

