import { useState } from 'react';
import { X, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface CourseImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (courses: any[]) => Promise<void>;
}

const CourseImportModal = ({ isOpen, onClose, onImport }: CourseImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  // 下载模板
  const handleDownloadTemplate = () => {
    const template = [
      {
        '模块*': '数字化转型',
        '课程名称*': '企业数字化转型实战',
        '每期天数*': 3,
        '期数*': 4,
        '线上费用*': 3600,
        '线下费用*': 5000,
        '课程代码': 'CRS001',
        '课程描述': '帮助企业理解和实施数字化转型战略',
        '状态': '启用'
      },
      {
        '模块*': '财务管理',
        '课程名称*': '企业IPO财务规范',
        '每期天数*': 2,
        '期数*': 6,
        '线上费用*': 2800,
        '线下费用*': 3800,
        '课程代码': 'CRS002',
        '课程描述': '企业IPO前的财务规范和准备',
        '状态': '启用'
      },
      {
        '模块*': '战略规划',
        '课程名称*': 'AI认证培训班',
        '每期天数*': 5,
        '期数*': 3,
        '线上费用*': 4800,
        '线下费用*': 6800,
        '课程代码': 'CRS003',
        '课程描述': '深入学习人工智能技术及其应用',
        '状态': '启用'
      }
    ];

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '课程信息');

    // 设置列宽
    ws['!cols'] = [
      { wch: 15 }, // 模块*
      { wch: 25 }, // 课程名称*
      { wch: 12 }, // 每期天数*
      { wch: 10 }, // 期数*
      { wch: 12 }, // 线上费用*
      { wch: 12 }, // 线下费用*
      { wch: 12 }, // 课程代码
      { wch: 40 }, // 课程描述
      { wch: 10 }, // 状态
    ];

    // 下载文件
    const date = new Date().toLocaleDateString('zh-CN');
    XLSX.writeFile(wb, `课程导入模板_${date}.xlsx`);
    toast.success('模板下载成功');
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        toast.error('请选择Excel或CSV文件');
        return;
      }
      setFile(selectedFile);
    }
  };


  // 处理导入
  const handleImport = async () => {
    if (!file) {
      toast.error('请选择要导入的文件');
      return;
    }

    setImporting(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (jsonData.length === 0) {
            toast.error('文件中没有数据');
            setImporting(false);
            return;
          }

          // 验证并转换数据
          const errors: string[] = [];
          const validCourses: any[] = [];

          jsonData.forEach((row: any, index: number) => {
            const rowNum = index + 2;
            
            // 必填字段验证
            if (!row['模块*'] && !row['模块']) {
              errors.push(`第${rowNum}行: 模块不能为空`);
            }
            if (!row['课程名称*'] && !row['课程名称']) {
              errors.push(`第${rowNum}行: 课程名称不能为空`);
            }
            if (!row['每期天数*'] && !row['每期天数']) {
              errors.push(`第${rowNum}行: 每期天数不能为空`);
            }
            if (!row['期数*'] && !row['期数']) {
              errors.push(`第${rowNum}行: 期数不能为空`);
            }
            if (!row['线上费用*'] && !row['线上费用']) {
              errors.push(`第${rowNum}行: 线上费用不能为空`);
            }
            if (!row['线下费用*'] && !row['线下费用']) {
              errors.push(`第${rowNum}行: 线下费用不能为空`);
            }

            // 如果没有错误，转换数据
            if (errors.length === 0) {
              validCourses.push({
                module: row['模块*'] || row['模块'],
                name: row['课程名称*'] || row['课程名称'],
                duration_days: Number(row['每期天数*'] || row['每期天数']),
                sessions_per_year: Number(row['期数*'] || row['期数']),
                online_price: Number(row['线上费用*'] || row['线上费用']),
                offline_price: Number(row['线下费用*'] || row['线下费用']),
                code: row['课程代码'] || '',
                description: row['课程描述'] || '',
                status: row['状态'] === '停用' ? 'inactive' : 'active',
                // 计算平均价格
                average_price: (Number(row['线上费用*'] || row['线上费用']) + Number(row['线下费用*'] || row['线下费用'])) / 2
              });
            }
          });

          if (errors.length > 0) {
            toast.error(`发现${errors.length}个错误，请修正后重试`);
            console.error('验证错误:', errors);
            setImporting(false);
            return;
          }

          // 调用导入函数
          await onImport(validCourses);
          toast.success(`成功导入${validCourses.length}个课程`);
          handleClose();
        } catch (error) {
          console.error('导入失败:', error);
          toast.error('导入失败，请检查文件格式');
        } finally {
          setImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('读取文件失败:', error);
      toast.error('读取文件失败');
      setImporting(false);
    }
  };

  // 关闭模态框
  const handleClose = () => {
    setFile(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">导入课程</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 space-y-4">
          {/* 下载模板 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">1. 下载模板</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              下载Excel模板，按照模板格式填写课程信息
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Download size={20} />
              下载模板
            </button>
          </div>

          {/* 上传文件 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">2. 上传文件</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              选择填写好的Excel文件进行上传
            </p>
            <label className="w-full cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-full px-4 py-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                <div className="flex flex-col items-center">
                  <FileSpreadsheet className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-2" />
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {file ? file.name : '选择文件'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    支持 .xlsx, .xls, .csv 格式
                  </span>
                </div>
              </div>
            </label>
          </div>

          {/* 必填字段说明 */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              <strong>必填字段：</strong>
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <li>• 模块 - 课程所属模块分类</li>
              <li>• 课程名称 - 课程的完整名称</li>
              <li>• 每期天数 - 每期培训的天数</li>
              <li>• 期数 - 每年计划开设的期数</li>
              <li>• 线上费用 - 线上参训的单价</li>
              <li>• 线下费用 - 线下参训的单价</li>
            </ul>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? '导入中...' : '开始导入'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseImportModal;
