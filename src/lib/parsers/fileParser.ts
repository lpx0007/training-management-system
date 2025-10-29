import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { DataType } from '@/types/dataManagement';
import { TEMPLATE_COLUMNS } from '@/constants/dataManagement';

// 解析 Excel 文件
export async function parseExcelFile(file: File, dataType: DataType): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // 读取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 转换为 JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false,
          defval: ''
        });
        
        // 映射列名
        const mappedData = mapColumnNames(jsonData, dataType);
        
        resolve(mappedData);
      } catch (error) {
        reject(new Error(`解析 Excel 文件失败: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    
    reader.readAsBinaryString(file);
  });
}

// 解析 CSV 文件
export async function parseCSVFile(file: File, dataType: DataType): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          // 映射列名
          const mappedData = mapColumnNames(results.data, dataType);
          resolve(mappedData);
        } catch (error) {
          reject(new Error(`解析 CSV 文件失败: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`解析 CSV 文件失败: ${error.message}`));
      }
    });
  });
}

// 主解析函数
export async function parseFile(file: File, dataType: DataType): Promise<any[]> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcelFile(file, dataType);
  } else if (fileName.endsWith('.csv')) {
    return parseCSVFile(file, dataType);
  } else {
    throw new Error('不支持的文件格式，请上传 .xlsx 或 .csv 文件');
  }
}

// 映射列名（从显示名称到数据库字段名）
function mapColumnNames(data: any[], dataType: DataType): any[] {
  const columns = TEMPLATE_COLUMNS[dataType];
  
  // 创建映射表：显示名称 -> 字段名
  const columnMap = new Map<string, string>();
  columns.forEach(col => {
    columnMap.set(col.label, col.key);
  });
  
  return data.map(row => {
    const mappedRow: any = {};
    
    Object.keys(row).forEach(key => {
      const fieldKey = columnMap.get(key) || key;
      let value = row[key];
      
      // 处理空值
      if (value === '' || value === null || value === undefined) {
        value = null;
      } else {
        // 类型转换
        value = convertValue(value, fieldKey, dataType);
      }
      
      mappedRow[fieldKey] = value;
    });
    
    return mappedRow;
  });
}

// 值类型转换
function convertValue(value: any, fieldKey: string, dataType: DataType): any {
  // 数字字段
  const numberFields = ['duration', 'price', 'rating', 'past_sessions', 'total_participants', 
                        'participants', 'revenue', 'capacity', 'expert_id', 'salesperson_id'];
  
  if (numberFields.includes(fieldKey)) {
    const num = Number(value);
    return isNaN(num) ? value : num;
  }
  
  // 布尔字段
  if (fieldKey === 'available') {
    const str = value.toString().toLowerCase();
    if (['true', '是', '1', 'yes'].includes(str)) return true;
    if (['false', '否', '0', 'no'].includes(str)) return false;
    return value;
  }
  
  // 数组字段（逗号分隔）
  if (['courses', 'tags'].includes(fieldKey) && typeof value === 'string') {
    return value.split(',').map(v => v.trim()).filter(v => v);
  }
  
  // 日期字段 - 保持字符串格式
  const dateFields = ['join_date', 'last_contact', 'date', 'end_date'];
  if (dateFields.includes(fieldKey) && value) {
    // 如果是 Excel 日期数字，转换为日期字符串
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    return value.toString();
  }
  
  // 时间字段 - 保持字符串格式
  const timeFields = ['start_time', 'end_time'];
  if (timeFields.includes(fieldKey) && value) {
    // 如果是 Excel 时间数字，转换为时间字符串
    if (typeof value === 'number') {
      const hours = Math.floor(value * 24);
      const minutes = Math.floor((value * 24 * 60) % 60);
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    return value.toString();
  }
  
  // 默认返回字符串
  return value.toString().trim();
}

// 验证文件
export function validateFile(file: File): { valid: boolean; error?: string } {
  // 检查文件类型
  const fileName = file.name.toLowerCase();
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: '文件格式不支持，请上传 .xlsx 或 .csv 文件'
    };
  }
  
  // 检查文件大小（10MB）
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '文件大小超过限制（最大 10MB）'
    };
  }
  
  return { valid: true };
}

// 获取文件信息
export function getFileInfo(file: File): {
  name: string;
  size: number;
  sizeText: string;
  type: string;
} {
  const sizeInKB = file.size / 1024;
  const sizeInMB = sizeInKB / 1024;
  
  let sizeText: string;
  if (sizeInMB >= 1) {
    sizeText = `${sizeInMB.toFixed(2)} MB`;
  } else {
    sizeText = `${sizeInKB.toFixed(2)} KB`;
  }
  
  return {
    name: file.name,
    size: file.size,
    sizeText,
    type: file.type || 'unknown'
  };
}
