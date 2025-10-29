import type { DataType, ValidationResult } from '@/types/dataManagement';
import { supabase } from '@/lib/supabase/client';

// 通用验证函数

// 验证手机号
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const phoneRegex = /^1[3-9]\d{9}$|^\+\d{1,3}\d{10,14}$/;
  return phoneRegex.test(phone.toString().trim());
}

// 验证邮箱
export function validateEmail(email: string): boolean {
  if (!email) return true; // 邮箱可选
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toString().trim());
}

// 验证日期格式 YYYY-MM-DD
export function validateDate(date: string): boolean {
  if (!date) return true; // 日期可选
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
}

// 验证时间格式 HH:MM
export function validateTime(time: string): boolean {
  if (!time) return true; // 时间可选
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

// 验证数字范围
export function validateNumberRange(value: any, min?: number, max?: number): boolean {
  if (value === null || value === undefined || value === '') return true;
  const num = Number(value);
  if (isNaN(num)) return false;
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  return true;
}

// 验证评分 (0-5)
export function validateRating(rating: any): boolean {
  return validateNumberRange(rating, 0, 5);
}

// 验证正整数
export function validatePositiveInteger(value: any): boolean {
  if (value === null || value === undefined || value === '') return true;
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

// 验证非负数
export function validateNonNegative(value: any): boolean {
  if (value === null || value === undefined || value === '') return true;
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

// 验证布尔值
export function validateBoolean(value: any): boolean {
  if (value === null || value === undefined || value === '') return true;
  const str = value.toString().toLowerCase();
  return ['true', 'false', '是', '否', '1', '0', 'yes', 'no'].includes(str);
}

// 转换布尔值
export function convertToBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  const str = value.toString().toLowerCase();
  return ['true', '是', '1', 'yes'].includes(str);
}

// 数据类型特定验证器

// 验证培训课程
export async function validateCourse(row: any, rowIndex: number): Promise<ValidationResult[]> {
  const errors: ValidationResult[] = [];
  
  // 必填字段验证
  if (!row.id) {
    errors.push({
      row: rowIndex,
      column: 'id',
      error: '课程ID为必填项',
      severity: 'error'
    });
  }
  
  if (!row.name) {
    errors.push({
      row: rowIndex,
      column: 'name',
      error: '课程名称为必填项',
      severity: 'error'
    });
  }
  
  // 时长验证
  if (row.duration && !validatePositiveInteger(row.duration)) {
    errors.push({
      row: rowIndex,
      column: 'duration',
      error: '时长必须是正整数',
      severity: 'error',
      value: row.duration
    });
  }
  
  // 价格验证
  if (row.price && !validateNonNegative(row.price)) {
    errors.push({
      row: rowIndex,
      column: 'price',
      error: '价格必须是非负数',
      severity: 'error',
      value: row.price
    });
  }
  
  // 课程分类验证
  const validCategories = ['技术培训', '管理培训', '销售培训', '其他'];
  if (row.category && !validCategories.includes(row.category)) {
    errors.push({
      row: rowIndex,
      column: 'category',
      error: `课程分类必须是以下之一: ${validCategories.join(', ')}`,
      severity: 'error',
      value: row.category
    });
  }
  
  // 专家ID验证（如果提供）
  if (row.expert_id) {
    const expertExists = await checkExpertExists(row.expert_id);
    if (!expertExists) {
      errors.push({
        row: rowIndex,
        column: 'expert_id',
        error: `专家ID ${row.expert_id} 不存在`,
        severity: 'error',
        value: row.expert_id
      });
    }
  }
  
  return errors;
}

// 验证专家信息
export async function validateExpert(
  row: any, 
  rowIndex: number, 
  allData?: any[]
): Promise<ValidationResult[]> {
  const errors: ValidationResult[] = [];
  
  // 必填字段验证
  if (!row.name) {
    errors.push({
      row: rowIndex,
      column: 'name',
      error: '专家姓名为必填项',
      severity: 'error'
    });
  }
  
  // 评分验证
  if (row.rating && !validateRating(row.rating)) {
    errors.push({
      row: rowIndex,
      column: 'rating',
      error: '评分必须在 0.00 到 5.00 之间',
      severity: 'error',
      value: row.rating
    });
  }
  
  // 是否可用验证
  if (row.available !== undefined && row.available !== '' && !validateBoolean(row.available)) {
    errors.push({
      row: rowIndex,
      column: 'available',
      error: '是否可用必须是布尔值（是/否）',
      severity: 'error',
      value: row.available
    });
  }
  
  // 邮箱验证
  if (row.email && !validateEmail(row.email)) {
    errors.push({
      row: rowIndex,
      column: 'email',
      error: '邮箱格式不正确',
      severity: 'error',
      value: row.email
    });
  } else if (row.email) {
    // 检查与数据库中现有数据的重复
    const emailExists = await checkExpertEmailExists(row.email);
    if (emailExists) {
      errors.push({
        row: rowIndex,
        column: 'email',
        error: '该邮箱已被其他专家使用',
        severity: 'error',
        value: row.email
      });
    }
    
    // 检查当前批次数据内部的重复
    if (allData) {
      const duplicateEmailRows = allData
        .map((r, idx) => ({ row: r, index: idx }))
        .filter(({ row: r, index }) => 
          index < allData.indexOf(row) && r.email && r.email === row.email
        );
      
      if (duplicateEmailRows.length > 0) {
        const duplicateRowNumbers = duplicateEmailRows.map(({ index }) => index + 2).join(', ');
        errors.push({
          row: rowIndex,
          column: 'email',
          error: `该邮箱在当前文件中重复（另见第 ${duplicateRowNumbers} 行）`,
          severity: 'error',
          value: row.email
        });
      }
    }
  }
  
  // 手机号验证
  if (row.phone && !validatePhone(row.phone)) {
    errors.push({
      row: rowIndex,
      column: 'phone',
      error: '手机号格式不正确（应为11位数字或带国际区号）',
      severity: 'error',
      value: row.phone
    });
  } else if (row.phone) {
    // 检查与数据库中现有数据的重复
    const phoneExists = await checkExpertPhoneExists(row.phone);
    if (phoneExists) {
      errors.push({
        row: rowIndex,
        column: 'phone',
        error: '该手机号已被其他专家使用',
        severity: 'error',
        value: row.phone
      });
    }
    
    // 检查当前批次数据内部的重复
    if (allData) {
      const duplicatePhoneRows = allData
        .map((r, idx) => ({ row: r, index: idx }))
        .filter(({ row: r, index }) => 
          index < allData.indexOf(row) && r.phone && r.phone === row.phone
        );
      
      if (duplicatePhoneRows.length > 0) {
        const duplicateRowNumbers = duplicatePhoneRows.map(({ index }) => index + 2).join(', ');
        errors.push({
          row: rowIndex,
          column: 'phone',
          error: `该手机号在当前文件中重复（另见第 ${duplicateRowNumbers} 行）`,
          severity: 'error',
          value: row.phone
        });
      }
    }
  }
  
  // 至少提供邮箱或手机号之一（用于创建账号）
  if (!row.email && !row.phone) {
    errors.push({
      row: rowIndex,
      column: 'email',
      error: '邮箱和手机号至少需要提供一个（用于创建登录账号）',
      severity: 'warning'
    });
  }
  
  // 历史授课场次验证
  if (row.past_sessions && !validateNonNegative(row.past_sessions)) {
    errors.push({
      row: rowIndex,
      column: 'past_sessions',
      error: '历史授课场次必须是非负整数',
      severity: 'error',
      value: row.past_sessions
    });
  }
  
  // 累计参训人数验证
  if (row.total_participants && !validateNonNegative(row.total_participants)) {
    errors.push({
      row: rowIndex,
      column: 'total_participants',
      error: '累计参训人数必须是非负整数',
      severity: 'error',
      value: row.total_participants
    });
  }
  
  return errors;
}

// 验证客户信息
export async function validateCustomer(
  row: any, 
  rowIndex: number, 
  allData?: any[]
): Promise<ValidationResult[]> {
  const errors: ValidationResult[] = [];
  
  // 必填字段验证
  if (!row.name) {
    errors.push({
      row: rowIndex,
      column: 'name',
      error: '客户姓名为必填项',
      severity: 'error'
    });
  }
  
  if (!row.phone) {
    errors.push({
      row: rowIndex,
      column: 'phone',
      error: '手机号为必填项',
      severity: 'error'
    });
  } else if (!validatePhone(row.phone)) {
    errors.push({
      row: rowIndex,
      column: 'phone',
      error: '手机号格式不正确（应为11位数字或带国际区号）',
      severity: 'error',
      value: row.phone
    });
  } else {
    // 检查与数据库中现有数据的重复
    const phoneExists = await checkCustomerPhoneExists(row.phone);
    if (phoneExists) {
      errors.push({
        row: rowIndex,
        column: 'phone',
        error: '该手机号已被其他客户使用',
        severity: 'error',
        value: row.phone
      });
    }
    
    // 检查当前批次数据内部的重复
    if (allData) {
      const duplicatePhoneRows = allData
        .map((r, idx) => ({ row: r, index: idx }))
        .filter(({ row: r, index }) => 
          index < allData.indexOf(row) && r.phone === row.phone
        );
      
      if (duplicatePhoneRows.length > 0) {
        const duplicateRowNumbers = duplicatePhoneRows.map(({ index }) => index + 2).join(', ');
        errors.push({
          row: rowIndex,
          column: 'phone',
          error: `该手机号在当前文件中重复（另见第 ${duplicateRowNumbers} 行）`,
          severity: 'error',
          value: row.phone
        });
      }
    }
  }
  
  // 邮箱验证
  if (row.email && !validateEmail(row.email)) {
    errors.push({
      row: rowIndex,
      column: 'email',
      error: '邮箱格式不正确',
      severity: 'error',
      value: row.email
    });
  } else if (row.email) {
    // 检查当前批次数据内部的重复
    if (allData) {
      const duplicateEmailRows = allData
        .map((r, idx) => ({ row: r, index: idx }))
        .filter(({ row: r, index }) => 
          index < allData.indexOf(row) && r.email && r.email === row.email
        );
      
      if (duplicateEmailRows.length > 0) {
        const duplicateRowNumbers = duplicateEmailRows.map(({ index }) => index + 2).join(', ');
        errors.push({
          row: rowIndex,
          column: 'email',
          error: `该邮箱在当前文件中重复（另见第 ${duplicateRowNumbers} 行）`,
          severity: 'warning',
          value: row.email
        });
      }
    }
  }
  
  // 客户状态验证
  const validStatuses = ['潜在客户', '意向客户', '成交客户', '流失客户'];
  if (row.status && !validStatuses.includes(row.status)) {
    errors.push({
      row: rowIndex,
      column: 'status',
      error: `客户状态必须是以下之一: ${validStatuses.join(', ')}`,
      severity: 'error',
      value: row.status
    });
  }
  
  // 跟进状态验证
  const validFollowUpStatuses = ['待跟进', '跟进中', '已成交', '已放弃'];
  if (row.follow_up_status && !validFollowUpStatuses.includes(row.follow_up_status)) {
    errors.push({
      row: rowIndex,
      column: 'follow_up_status',
      error: `跟进状态必须是以下之一: ${validFollowUpStatuses.join(', ')}`,
      severity: 'error',
      value: row.follow_up_status
    });
  }
  
  // 最后联系时间验证
  if (row.last_contact && !validateDate(row.last_contact)) {
    errors.push({
      row: rowIndex,
      column: 'last_contact',
      error: '最后联系时间格式不正确（应为 YYYY-MM-DD）',
      severity: 'error',
      value: row.last_contact
    });
  }
  
  // 业务员验证（至少提供一个）
  if (!row.salesperson_id && !row.salesperson_name) {
    errors.push({
      row: rowIndex,
      column: 'salesperson_name',
      error: '负责业务员ID和姓名至少需要提供一个',
      severity: 'warning'
    });
  }
  
  // 如果提供了业务员姓名，验证是否存在
  if (row.salesperson_name) {
    const salespersonExists = await checkSalespersonExistsByName(row.salesperson_name);
    if (!salespersonExists) {
      errors.push({
        row: rowIndex,
        column: 'salesperson_name',
        error: `业务员 ${row.salesperson_name} 不存在`,
        severity: 'error',
        value: row.salesperson_name
      });
    }
  }
  
  return errors;
}

// 验证业务员信息
export async function validateSalesperson(
  row: any, 
  rowIndex: number, 
  allData?: any[]
): Promise<ValidationResult[]> {
  const errors: ValidationResult[] = [];
  
  // 必填字段验证
  if (!row.name) {
    errors.push({
      row: rowIndex,
      column: 'name',
      error: '业务员姓名为必填项',
      severity: 'error'
    });
  }
  
  if (!row.phone) {
    errors.push({
      row: rowIndex,
      column: 'phone',
      error: '手机号为必填项',
      severity: 'error'
    });
  } else if (!validatePhone(row.phone)) {
    errors.push({
      row: rowIndex,
      column: 'phone',
      error: '手机号格式不正确（应为11位数字或带国际区号）',
      severity: 'error',
      value: row.phone
    });
  } else {
    // 检查与数据库中现有数据的重复
    const phoneExists = await checkSalespersonPhoneExists(row.phone);
    if (phoneExists) {
      errors.push({
        row: rowIndex,
        column: 'phone',
        error: '该手机号已被其他业务员使用',
        severity: 'error',
        value: row.phone
      });
    }
    
    // 检查当前批次数据内部的重复
    if (allData) {
      const duplicatePhoneRows = allData
        .map((r, idx) => ({ row: r, index: idx }))
        .filter(({ row: r, index }) => 
          index < allData.indexOf(row) && r.phone === row.phone
        );
      
      if (duplicatePhoneRows.length > 0) {
        const duplicateRowNumbers = duplicatePhoneRows.map(({ index }) => index + 2).join(', ');
        errors.push({
          row: rowIndex,
          column: 'phone',
          error: `该手机号在当前文件中重复（另见第 ${duplicateRowNumbers} 行）`,
          severity: 'error',
          value: row.phone
        });
      }
    }
  }
  
  // ✅ 邮箱验证（必填）
  if (!row.email) {
    errors.push({
      row: rowIndex,
      column: 'email',
      error: '邮箱为必填项',
      severity: 'error'
    });
  } else if (!validateEmail(row.email)) {
    errors.push({
      row: rowIndex,
      column: 'email',
      error: '邮箱格式不正确',
      severity: 'error',
      value: row.email
    });
  } else {
    // 检查与数据库中现有数据的重复
    const emailExists = await checkSalespersonEmailExists(row.email);
    if (emailExists) {
      errors.push({
        row: rowIndex,
        column: 'email',
        error: '该邮箱已被其他业务员使用',
        severity: 'error',
        value: row.email
      });
    }
    
    // 检查当前批次数据内部的重复
    if (allData) {
      const duplicateEmailRows = allData
        .map((r, idx) => ({ row: r, index: idx }))
        .filter(({ row: r, index }) => 
          index < allData.indexOf(row) && r.email && r.email === row.email
        );
      
      if (duplicateEmailRows.length > 0) {
        const duplicateRowNumbers = duplicateEmailRows.map(({ index }) => index + 2).join(', ');
        errors.push({
          row: rowIndex,
          column: 'email',
          error: `该邮箱在当前文件中重复（另见第 ${duplicateRowNumbers} 行）`,
          severity: 'error',
          value: row.email
        });
      }
    }
  }
  
  // 入职日期验证
  if (row.join_date && !validateDate(row.join_date)) {
    errors.push({
      row: rowIndex,
      column: 'join_date',
      error: '入职日期格式不正确（应为 YYYY-MM-DD）',
      severity: 'error',
      value: row.join_date
    });
  }
  
  // 状态验证
  const validStatuses = ['pending', 'active', 'rejected'];
  if (row.status && !validStatuses.includes(row.status)) {
    errors.push({
      row: rowIndex,
      column: 'status',
      error: `状态必须是以下之一: ${validStatuses.join(', ')}`,
      severity: 'error',
      value: row.status
    });
  }
  
  // 至少提供邮箱或手机号之一（用于创建账号）
  if (!row.email && !row.phone) {
    errors.push({
      row: rowIndex,
      column: 'email',
      error: '邮箱和手机号至少需要提供一个（用于创建登录账号）',
      severity: 'warning'
    });
  }
  
  return errors;
}

// 验证培训场次
export async function validateTrainingSession(row: any, rowIndex: number): Promise<ValidationResult[]> {
  const errors: ValidationResult[] = [];
  
  // 必填字段验证
  if (!row.name) {
    errors.push({
      row: rowIndex,
      column: 'name',
      error: '培训名称为必填项',
      severity: 'error'
    });
  }
  
  if (!row.date) {
    errors.push({
      row: rowIndex,
      column: 'date',
      error: '开始日期为必填项',
      severity: 'error'
    });
  } else if (!validateDate(row.date)) {
    errors.push({
      row: rowIndex,
      column: 'date',
      error: '开始日期格式不正确（应为 YYYY-MM-DD）',
      severity: 'error',
      value: row.date
    });
  }
  
  if (!row.end_time) {
    errors.push({
      row: rowIndex,
      column: 'end_time',
      error: '结束时间为必填项',
      severity: 'error'
    });
  } else if (!validateTime(row.end_time)) {
    errors.push({
      row: rowIndex,
      column: 'end_time',
      error: '结束时间格式不正确（应为 HH:MM）',
      severity: 'error',
      value: row.end_time
    });
  }
  
  // 结束日期验证
  if (row.end_date) {
    if (!validateDate(row.end_date)) {
      errors.push({
        row: rowIndex,
        column: 'end_date',
        error: '结束日期格式不正确（应为 YYYY-MM-DD）',
        severity: 'error',
        value: row.end_date
      });
    } else if (row.date && new Date(row.end_date) < new Date(row.date)) {
      errors.push({
        row: rowIndex,
        column: 'end_date',
        error: '结束日期不能早于开始日期',
        severity: 'error',
        value: row.end_date
      });
    }
  }
  
  // 开始时间验证
  if (row.start_time && !validateTime(row.start_time)) {
    errors.push({
      row: rowIndex,
      column: 'start_time',
      error: '开始时间格式不正确（应为 HH:MM）',
      severity: 'error',
      value: row.start_time
    });
  }
  
  // 参训人数验证
  if (row.participants && !validateNonNegative(row.participants)) {
    errors.push({
      row: rowIndex,
      column: 'participants',
      error: '参训人数必须是非负整数',
      severity: 'error',
      value: row.participants
    });
  }
  
  // 销售额验证
  if (row.revenue && !validateNonNegative(row.revenue)) {
    errors.push({
      row: rowIndex,
      column: 'revenue',
      error: '销售额必须是非负数',
      severity: 'error',
      value: row.revenue
    });
  }
  
  // 状态验证
  const validStatuses = ['计划中', '进行中', '已完成', '已取消'];
  if (row.status && !validStatuses.includes(row.status)) {
    errors.push({
      row: rowIndex,
      column: 'status',
      error: `状态必须是以下之一: ${validStatuses.join(', ')}`,
      severity: 'error',
      value: row.status
    });
  }
  
  // 评分验证
  if (row.rating && !validateRating(row.rating)) {
    errors.push({
      row: rowIndex,
      column: 'rating',
      error: '评分必须在 0.00 到 5.00 之间',
      severity: 'error',
      value: row.rating
    });
  }
  
  // 容纳人数验证
  if (row.capacity && !validatePositiveInteger(row.capacity)) {
    errors.push({
      row: rowIndex,
      column: 'capacity',
      error: '容纳人数必须是正整数',
      severity: 'error',
      value: row.capacity
    });
  }
  
  // 专家验证（至少提供一个）
  if (!row.expert_id && !row.expert_name) {
    errors.push({
      row: rowIndex,
      column: 'expert_name',
      error: '专家ID和姓名至少需要提供一个',
      severity: 'warning'
    });
  }
  
  // 如果提供了专家姓名，验证是否存在
  if (row.expert_name) {
    const expertExists = await checkExpertExistsByName(row.expert_name);
    if (!expertExists) {
      errors.push({
        row: rowIndex,
        column: 'expert_name',
        error: `专家 ${row.expert_name} 不存在`,
        severity: 'error',
        value: row.expert_name
      });
    }
  }
  
  // 业务员验证（至少提供一个）
  if (!row.salesperson_id && !row.salesperson_name) {
    errors.push({
      row: rowIndex,
      column: 'salesperson_name',
      error: '负责业务员ID和姓名至少需要提供一个',
      severity: 'warning'
    });
  }
  
  // 如果提供了业务员姓名，验证是否存在
  if (row.salesperson_name) {
    const salespersonExists = await checkSalespersonExistsByName(row.salesperson_name);
    if (!salespersonExists) {
      errors.push({
        row: rowIndex,
        column: 'salesperson_name',
        error: `业务员 ${row.salesperson_name} 不存在`,
        severity: 'error',
        value: row.salesperson_name
      });
    }
  }
  
  // 课程ID验证
  if (row.course_id) {
    const courseExists = await checkCourseExists(row.course_id);
    if (!courseExists) {
      errors.push({
        row: rowIndex,
        column: 'course_id',
        error: `课程ID ${row.course_id} 不存在`,
        severity: 'warning',
        value: row.course_id
      });
    }
  }
  
  return errors;
}

// 辅助函数：检查专家是否存在
async function checkExpertExists(expertId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('id')
      .eq('id', expertId)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

// 辅助函数：通过姓名检查专家是否存在
async function checkExpertExistsByName(name: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('id')
      .eq('name', name)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

// 辅助函数：通过姓名检查业务员是否存在
async function checkSalespersonExistsByName(name: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('name', name)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

// 辅助函数：检查课程是否存在
async function checkCourseExists(courseId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

// 主验证函数
export async function validateData(
  data: any[],
  dataType: DataType
): Promise<ValidationResult[]> {
  const allErrors: ValidationResult[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowIndex = i + 2; // Excel 行号（从2开始，因为第1行是表头）
    
    let errors: ValidationResult[] = [];
    
    switch (dataType) {
      case 'courses':
        errors = await validateCourse(row, rowIndex);
        break;
      case 'experts':
        errors = await validateExpert(row, rowIndex, data);
        break;
      case 'customers':
        errors = await validateCustomer(row, rowIndex, data);
        break;
      case 'salespersons':
        errors = await validateSalesperson(row, rowIndex, data);
        break;
      case 'training_sessions':
        errors = await validateTrainingSession(row, rowIndex);
        break;
    }
    
    allErrors.push(...errors);
  }
  
  return allErrors;
}

// 检查重复数据
export async function checkDuplicates(
  data: any[],
  dataType: DataType
): Promise<number[]> {
  const duplicateIndices: number[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    let isDuplicate = false;
    
    try {
      switch (dataType) {
        case 'courses':
          isDuplicate = await checkCourseDuplicate(row.id);
          break;
        case 'experts':
          // 专家允许同名，不检查重复
          break;
        case 'customers':
          isDuplicate = await checkCustomerDuplicate(row.phone);
          break;
        case 'salespersons':
          isDuplicate = await checkSalespersonDuplicate(row.phone, row.email);
          break;
        case 'training_sessions':
          // 培训场次允许同名同日期，不检查重复
          break;
      }
      
      if (isDuplicate) {
        duplicateIndices.push(i);
      }
    } catch (error) {
      console.error(`检查重复数据失败 (行 ${i + 2}):`, error);
    }
  }
  
  return duplicateIndices;
}

// 检查课程重复
async function checkCourseDuplicate(courseId: string): Promise<boolean> {
  const { data } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .single();
  
  return !!data;
}

// 检查客户重复
async function checkCustomerDuplicate(phone: string): Promise<boolean> {
  const { data } = await supabase
    .from('customers')
    .select('id')
    .eq('phone', phone)
    .single();
  
  return !!data;
}

// 检查业务员重复
async function checkSalespersonDuplicate(phone: string, email?: string): Promise<boolean> {
  if (phone) {
    const phoneExists = await checkSalespersonPhoneExists(phone);
    if (phoneExists) return true;
  }
  
  if (email) {
    const emailExists = await checkSalespersonEmailExists(email);
    if (emailExists) return true;
  }
  
  return false;
}

// 检查业务员手机号是否存在
async function checkSalespersonPhoneExists(phone: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

// 检查业务员邮箱是否存在
async function checkSalespersonEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

// 检查专家手机号是否存在
async function checkExpertPhoneExists(phone: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

// 检查专家邮箱是否存在
async function checkExpertEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('experts')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

// 检查客户手机号是否存在
async function checkCustomerPhoneExists(phone: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    
    return !error && !!data;
  } catch {
    return false;
  }
}

