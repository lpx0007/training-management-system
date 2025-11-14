import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';

interface AttendanceRecord {
  name: string;
  salespersonName: string;
  company: string;
  signature?: string;
}

interface AttendanceSheetConfig {
  courseName: string;
  date: string;
  endDate?: string;
  totalParticipants: number;
  participants: AttendanceRecord[];
}

/**
 * 导出全部签到表
 * 生成一个包含所有参训人员的签到表
 */
export const exportAllAttendanceSheet = (config: AttendanceSheetConfig): void => {
  try {
    const { courseName, date, endDate, totalParticipants, participants } = config;

    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 准备表头信息
    const dateRange = endDate && endDate !== date ? `${date} 至 ${endDate}` : date;
    const headerData = [
      ['签到表', '', '', ''], // 第一排：签到表标题
      [`${courseName}    ${dateRange}    ${totalParticipants}人`, '', '', ''], // 第二排：课程信息（不带字段标签）
      [], // 空行
      ['参训人', '单位/公司', '负责业务员', '签名'] // 表格列头
    ];

    // 准备数据行
    const dataRows = participants.map(p => [
      p.name,
      p.company || '',
      p.salespersonName || '',
      '' // 签名列留空
    ]);

    // 合并表头和数据
    const sheetData = [...headerData, ...dataRows];

    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 15 }, // 参训人
      { wch: 25 }, // 单位/公司
      { wch: 15 }, // 负责业务员
      { wch: 20 }  // 签名
    ];

    // 设置单元格合并
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // 第一排合并 A1:D1
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }  // 第二排合并 A2:D2
    ];

    // 设置单元格样式
    // 第一排：签到表标题 - 字号22，居中，加粗
    worksheet['A1'].s = {
      font: { sz: 22, bold: true, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    // 第二排：课程信息 - 字号12，居中
    worksheet['A2'].s = {
      font: { sz: 12, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'center' }
    };

    // 第四排：表头 - 加粗，居中
    ['A4', 'B4', 'C4', 'D4'].forEach(cell => {
      if (worksheet[cell]) {
        worksheet[cell].s = {
          font: { bold: true, name: 'Arial' },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        };
      }
    });

    // 设置行高
    worksheet['!rows'] = [
      { hpt: 30 }, // 第一排行高
      { hpt: 25 }, // 第二排行高
      { hpt: 15 }, // 空行
      { hpt: 20 }  // 表头行高
    ];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '签到表');

    // 生成文件并下载
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${courseName}_签到表_${date}.xlsx`);

    console.log('✅ 签到表导出成功');
  } catch (error) {
    console.error('❌ 导出签到表失败:', error);
    throw new Error('导出签到表失败');
  }
};

/**
 * 按业务员导出签到表
 * 为每个业务员生成一个独立的工作表
 */
export const exportAttendanceSheetBySalesperson = (config: AttendanceSheetConfig): void => {
  try {
    const { courseName, date, endDate, totalParticipants, participants } = config;

    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    // 按业务员分组
    const groupedBySalesperson = participants.reduce((acc, participant) => {
      const salesperson = participant.salespersonName || '未分配';
      if (!acc[salesperson]) {
        acc[salesperson] = [];
      }
      acc[salesperson].push(participant);
      return acc;
    }, {} as Record<string, AttendanceRecord[]>);

    // 为每个业务员创建一个工作表
    Object.entries(groupedBySalesperson).forEach(([salesperson, salespersonParticipants]) => {
      // 准备表头信息
      const dateRange = endDate && endDate !== date ? `${date} 至 ${endDate}` : date;
      const headerData = [
        ['签到表', '', '', ''], // 第一排：签到表标题
        [`${courseName}    ${dateRange}    ${totalParticipants}人    业务员：${salesperson}`, '', '', ''], // 第二排：课程信息+业务员（不带字段标签）
        [], // 空行
        ['参训人', '单位/公司', '负责业务员', '签名'] // 表格列头
      ];

      // 准备数据行
      const dataRows = salespersonParticipants.map(p => [
        p.name,
        p.company || '',
        p.salespersonName || '',
        '' // 签名列留空
      ]);

      // 合并表头和数据
      const sheetData = [...headerData, ...dataRows];

      // 创建工作表
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

      // 设置列宽
      worksheet['!cols'] = [
        { wch: 15 }, // 参训人
        { wch: 25 }, // 单位/公司
        { wch: 15 }, // 负责业务员
        { wch: 20 }  // 签名
      ];

      // 设置单元格合并
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // 第一排合并 A1:D1
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }  // 第二排合并 A2:D2
      ];

      // 设置单元格样式
      // 第一排：签到表标题 - 字号22，居中，加粗
      worksheet['A1'].s = {
        font: { sz: 22, bold: true, name: 'Arial' },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      // 第二排：课程信息 - 字号12，居中
      worksheet['A2'].s = {
        font: { sz: 12, name: 'Arial' },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      // 第四排：表头 - 加粗，居中
      ['A4', 'B4', 'C4', 'D4'].forEach(cell => {
        if (worksheet[cell]) {
          worksheet[cell].s = {
            font: { bold: true, name: 'Arial' },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            }
          };
        }
      });

      // 设置行高
      worksheet['!rows'] = [
        { hpt: 30 }, // 第一排行高
        { hpt: 25 }, // 第二排行高
        { hpt: 15 }, // 空行
        { hpt: 20 }  // 表头行高
      ];

      // 添加工作表到工作簿，使用业务员名称作为工作表名
      // Excel 工作表名称限制：最多 31 个字符，不能包含特殊字符
      const sheetName = salesperson.substring(0, 31).replace(/[:\\/?*\[\]]/g, '_');
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // 生成文件并下载
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${courseName}_签到表_按业务员_${date}.xlsx`);

    console.log('✅ 按业务员签到表导出成功');
  } catch (error) {
    console.error('❌ 导出按业务员签到表失败:', error);
    throw new Error('导出按业务员签到表失败');
  }
};
