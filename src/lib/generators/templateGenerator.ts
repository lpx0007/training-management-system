import * as XLSX from 'xlsx';
import type { DataType, TemplateConfig } from '@/types/dataManagement';
import { TEMPLATE_COLUMNS, EXAMPLE_DATA, FIELD_MAPPINGS } from '@/constants/dataManagement';

// 生成模板文件
export function generateTemplate(config: TemplateConfig): Blob {
  const wb = XLSX.utils.book_new();
  
  // 1. 创建数据工作表
  const dataSheet = createDataSheet(config.dataType, config.includeExamples);
  XLSX.utils.book_append_sheet(wb, dataSheet, '数据');
  
  // 2. 创建说明工作表
  if (config.includeInstructions) {
    const instructionSheet = createInstructionSheet(config.dataType);
    XLSX.utils.book_append_sheet(wb, instructionSheet, '填写说明');
  }
  
  // 3. 生成文件
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

// 创建数据工作表
function createDataSheet(dataType: DataType, includeExamples: boolean): XLSX.WorkSheet {
  const columns = TEMPLATE_COLUMNS[dataType];
  const headers = columns.map(col => col.label);
  
  // 创建表头
  const data: any[][] = [headers];
  
  // 添加示例数据
  if (includeExamples) {
    const examples = EXAMPLE_DATA[dataType];
    const exampleRows = examples.map(example => 
      columns.map(col => {
        const value = example[col.key];
        // 处理特殊类型
        if (col.key === 'available' && typeof value === 'string') {
          return value;
        }
        if (col.key === 'available' && typeof value === 'boolean') {
          return value ? '是' : '否';
        }
        if (Array.isArray(value)) {
          return value.join(',');
        }
        return value ?? '';
      })
    );
    data.push(...exampleRows);
  }
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // 设置列宽
  ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));
  
  // 设置表头样式（加粗）
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!ws[address]) continue;
    if (!ws[address].s) ws[address].s = {};
    ws[address].s.font = { bold: true };
  }
  
  return ws;
}

// 创建说明工作表
function createInstructionSheet(dataType: DataType): XLSX.WorkSheet {
  const instructions = getInstructions(dataType);
  const data = [
    ['字段名称', '是否必填', '数据类型', '填写说明', '示例'],
    ...instructions.map(inst => [
      inst.field,
      inst.required ? '是' : '否',
      inst.type,
      inst.description,
      inst.example
    ])
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 50 },
    { wch: 25 }
  ];
  
  // 设置表头样式
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!ws[address]) continue;
    if (!ws[address].s) ws[address].s = {};
    ws[address].s.font = { bold: true };
  }
  
  return ws;
}

// 获取填写说明
function getInstructions(dataType: DataType): InstructionRow[] {
  const columns = TEMPLATE_COLUMNS[dataType];
  
  const instructionMap: Record<DataType, Record<string, Partial<InstructionRow>>> = {
    courses: {
      id: { description: '课程的唯一标识符，不能重复', example: 'COURSE001' },
      name: { description: '课程的名称', example: '前端开发进阶' },
      description: { description: '课程的详细描述', example: 'React + TypeScript 实战' },
      duration: { description: '课程时长，单位为小时', example: '16' },
      price: { description: '课程价格，单位为元', example: '3000' },
      category: { description: '课程分类：技术培训、管理培训、销售培训、其他', example: '技术培训' },
      expert_id: { description: '授课专家的ID，需要在专家表中存在', example: '1' }
    },
    experts: {
      name: { description: '专家的姓名（必填）', example: '张教授' },
      email: { description: '专家邮箱（必填），用于创建登录账号', example: 'zhang@example.com' },
      phone: { description: '专家手机号（必填），11位数字，用于创建登录账号', example: '13800138000' },
      title: { description: '专家的职称', example: '高级工程师' },
      field: { description: '专家的专业领域', example: '前端开发' },
      experience: { description: '专家的工作经验描述', example: '10年' },
      rating: { description: '专家评分，范围 0.00-5.00', example: '4.8' },
      courses: { description: '专家授课的课程列表，多个课程用逗号分隔', example: 'React,Vue,Angular' },
      location: { description: '专家所在地区', example: '北京' },
      available: { description: '专家是否可用：是/否', example: '是' },
      bio: { description: '专家的个人简介', example: '资深前端专家' }
    },
    customers: {
      name: { description: '客户的姓名', example: '李明' },
      phone: { description: '客户的手机号，11位数字或带国际区号', example: '13812345678' },
      email: { description: '客户的邮箱地址', example: 'liming@company.com' },
      company: { description: '客户所在公司名称', example: '科技公司A' },
      position: { description: '客户的职位', example: '技术总监' },
      location: { description: '客户所在地区', example: '北京' },
      status: { description: '客户状态：潜在客户、意向客户、成交客户、流失客户', example: '意向客户' },
      salesperson_name: { description: '负责业务员的姓名', example: '张三' },
      follow_up_status: { description: '跟进状态：待跟进、跟进中、已成交、已放弃', example: '跟进中' },
      last_contact: { description: '最后联系时间，格式 YYYY-MM-DD', example: '2025-10-20' },
      tags: { description: '客户标签，多个标签用逗号分隔', example: 'VIP,技术' }
    },
    salespersons: {
      name: { description: '业务员的姓名（必填）', example: '张三' },
      phone: { description: '业务员的手机号（必填），11位数字，用于创建登录账号', example: '13600136000' },
      email: { description: '业务员的邮箱地址（必填），用于创建登录账号', example: 'zhangsan@company.com' },
      department: { description: '业务员所在部门', example: '销售部' },
      position: { description: '业务员的职位', example: '销售经理' },
      join_date: { description: '入职日期，格式 YYYY-MM-DD', example: '2023-01-15' },
      status: { description: '业务员状态：pending（待审核）、active（已激活）、rejected（已拒绝）', example: 'active' },
      team: { description: '业务员所属团队', example: 'A组' }
    },
    training_sessions: {
      name: { description: '培训场次的名称', example: '前端开发进阶班' },
      date: { description: '培训开始日期，格式 YYYY-MM-DD', example: '2025-11-01' },
      end_time: { description: '培训结束时间，格式 HH:MM', example: '17:00' },
      end_date: { description: '培训结束日期，格式 YYYY-MM-DD，默认与开始日期相同', example: '2025-11-01' },
      start_time: { description: '培训开始时间，格式 HH:MM', example: '09:00' },
      participants: { description: '参训人数', example: '30' },
      expert_name: { description: '授课专家的姓名', example: '张教授' },
      area: { description: '培训举办地区', example: '北京' },
      revenue: { description: '培训销售额，单位为元', example: '90000' },
      status: { description: '培训状态：计划中、进行中、已完成、已取消', example: '计划中' },
      rating: { description: '培训评分，范围 0.00-5.00', example: '4.5' },
      salesperson_name: { description: '负责业务员的姓名', example: '张三' },
      course_id: { description: '关联的课程ID', example: 'COURSE001' },
      course_description: { description: '课程内容描述', example: 'React实战' },
      capacity: { description: '培训容纳人数，默认30', example: '40' }
    }
  };
  
  return columns.map(col => ({
    field: col.label,
    required: col.required,
    type: getFieldType(col.key, dataType),
    description: instructionMap[dataType][col.key]?.description || '',
    example: instructionMap[dataType][col.key]?.example || ''
  }));
}

// 获取字段类型
function getFieldType(fieldKey: string, dataType: DataType): string {
  const numberFields = ['duration', 'price', 'rating', 'past_sessions', 'total_participants', 
                        'participants', 'revenue', 'capacity', 'expert_id', 'salesperson_id'];
  const dateFields = ['join_date', 'last_contact', 'date', 'end_date'];
  const timeFields = ['start_time', 'end_time'];
  const booleanFields = ['available'];
  
  if (numberFields.includes(fieldKey)) return '数字';
  if (dateFields.includes(fieldKey)) return '日期';
  if (timeFields.includes(fieldKey)) return '时间';
  if (booleanFields.includes(fieldKey)) return '布尔值';
  
  return '文本';
}

// 下载模板文件
export function downloadTemplate(dataType: DataType, fileName?: string): void {
  const config: TemplateConfig = {
    dataType,
    includeExamples: true,
    includeInstructions: true
  };
  
  const blob = generateTemplate(config);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || `${getDataTypeName(dataType)}_模板_${getDateString()}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 获取数据类型名称
function getDataTypeName(dataType: DataType): string {
  const names: Record<DataType, string> = {
    courses: '培训课程',
    experts: '专家信息',
    customers: '客户信息',
    salespersons: '业务员信息',
    training_sessions: '培训场次'
  };
  return names[dataType];
}

// 获取日期字符串
function getDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// 类型定义
interface InstructionRow {
  field: string;
  required: boolean;
  type: string;
  description: string;
  example: string;
}
