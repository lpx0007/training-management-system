import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import type { ExportConfig, DataType } from '@/types/dataManagement';
import { FIELD_MAPPINGS, DATA_TYPE_CONFIG } from '@/constants/dataManagement';

// 导出为 Excel
export function exportToExcel(data: any[], config: ExportConfig): Blob {
  // 1. 准备数据
  const mappedData = data.map(row => {
    const mappedRow: any = {};
    config.selectedFields.forEach(field => {
      const displayName = FIELD_MAPPINGS[config.dataType][field] || field;
      mappedRow[displayName] = formatValue(row[field], field);
    });
    return mappedRow;
  });
  
  // 2. 创建工作簿
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(mappedData);
  
  // 3. 设置列宽
  const colWidths = config.selectedFields.map(field => {
    const displayName = FIELD_MAPPINGS[config.dataType][field] || field;
    return { wch: Math.max(displayName.length, 15) };
  });
  ws['!cols'] = colWidths;
  
  // 4. 设置表头样式
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!ws[address]) continue;
    if (!ws[address].s) ws[address].s = {};
    ws[address].s.font = { bold: true };
  }
  
  // 5. 添加工作表
  XLSX.utils.book_append_sheet(wb, ws, '数据');
  
  // 6. 生成文件
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

// 导出为 CSV
export function exportToCSV(data: any[], config: ExportConfig): Blob {
  // 1. 准备数据
  const mappedData = data.map(row => {
    const mappedRow: any = {};
    config.selectedFields.forEach(field => {
      const displayName = FIELD_MAPPINGS[config.dataType][field] || field;
      mappedRow[displayName] = formatValue(row[field], field);
    });
    return mappedRow;
  });
  
  // 2. 转换为 CSV
  const csv = Papa.unparse(mappedData, {
    quotes: true,
    delimiter: ',',
    header: true
  });
  
  // 3. 添加 BOM 以支持中文
  const BOM = '\uFEFF';
  return new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
}

// 导出为 PDF
export function exportToPDF(data: any[], config: ExportConfig): Blob {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // 1. 添加页眉
  doc.setFontSize(16);
  const title = `${DATA_TYPE_CONFIG[config.dataType].label}数据导出`;
  doc.text(title, 14, 15);
  
  doc.setFontSize(10);
  const exportTime = `导出时间: ${new Date().toLocaleString('zh-CN')}`;
  doc.text(exportTime, 14, 22);
  
  // 2. 准备表格数据
  const headers = config.selectedFields.map(field => 
    FIELD_MAPPINGS[config.dataType][field] || field
  );
  
  const rows = data.map(row => 
    config.selectedFields.map(field => formatValue(row[field], field))
  );
  
  // 3. 生成表格
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    styles: { 
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica' // 使用默认字体，避免中文显示问题
    },
    headStyles: {
      fillColor: [66, 139, 202],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    didDrawPage: (data) => {
      // 添加页脚
      doc.setFontSize(8);
      const pageNumber = `第 ${data.pageNumber} 页`;
      doc.text(
        pageNumber,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
  });
  
  return doc.output('blob');
}

// 格式化值
function formatValue(value: any, field: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  // 布尔值
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  
  // 数组
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  // 日期时间
  if (field.includes('date') || field.includes('time') || field.includes('timestamp')) {
    if (value instanceof Date) {
      return value.toLocaleString('zh-CN');
    }
    return value.toString();
  }
  
  // 数字
  if (typeof value === 'number') {
    // 价格和销售额保留两位小数
    if (field === 'price' || field === 'revenue') {
      return value.toFixed(2);
    }
    // 评分保留两位小数
    if (field === 'rating') {
      return value.toFixed(2);
    }
    return value.toString();
  }
  
  return value.toString();
}

// 主导出函数
export async function exportData(data: any[], config: ExportConfig): Promise<void> {
  let blob: Blob;
  let extension: string;
  
  switch (config.format) {
    case 'excel':
      blob = exportToExcel(data, config);
      extension = 'xlsx';
      break;
    case 'csv':
      blob = exportToCSV(data, config);
      extension = 'csv';
      break;
    case 'pdf':
      blob = exportToPDF(data, config);
      extension = 'pdf';
      break;
    default:
      throw new Error(`不支持的导出格式: ${config.format}`);
  }
  
  // 生成文件名
  const fileName = generateFileName(config.dataType, extension);
  
  // 下载文件
  saveAs(blob, fileName);
}

// 生成文件名
function generateFileName(dataType: DataType, extension: string): string {
  const typeName = DATA_TYPE_CONFIG[dataType].label;
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .split('.')[0];
  
  return `${typeName}_${timestamp}.${extension}`;
}

// 导出错误报告
export function exportErrorReport(errors: any[]): void {
  const wb = XLSX.utils.book_new();
  
  const data = [
    ['行号', '列名', '错误类型', '错误信息', '当前值'],
    ...errors.map(error => [
      error.row || '-',
      error.column || '-',
      error.severity === 'error' ? '错误' : '警告',
      error.error,
      error.value || '-'
    ])
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 8 },
    { wch: 15 },
    { wch: 10 },
    { wch: 50 },
    { wch: 20 }
  ];
  
  // 设置表头样式
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + '1';
    if (!ws[address]) continue;
    if (!ws[address].s) ws[address].s = {};
    ws[address].s.font = { bold: true };
  }
  
  XLSX.utils.book_append_sheet(wb, ws, '错误报告');
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  
  const timestamp = new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .split('.')[0];
  
  saveAs(blob, `错误报告_${timestamp}.xlsx`);
}
