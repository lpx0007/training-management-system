import { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [parseResult, setParseResult] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 下载模板
  const handleDownloadTemplate = () => {
    const template = [
      {
        '课程代码': 'CRS001',
        '课程名称': '企业数字化转型实战',
        '模块分类': '数字化转型',
        '授课专家': '张教授',
        '标准价格': 50000,
        '培训天数': 3,
        '培训期数(每年)': 4,
        '培训人数(每期)': 30,
        '培训模式': '线下',
        '培训地点': '北京',
        '课程状态': '启用',
        '课程描述': '帮助企业理解和实施数字化转型战略'
      },
      {
        '课程代码': 'CRS002',
        '课程名称': '企业IPO财务规范',
        '模块分类': '财务管理',
        '授课专家': '李教授',
        '标准价格': 38000,
        '培训天数': 2,
        '培训期数(每年)': 6,
        '培训人数(每期)': 25,
        '培训模式': '线下',
        '培训地点': '上海',
        '课程状态': '启用',
        '课程描述': '企业IPO前的财务规范和准备'
      }
    ];

    // 创建工作簿
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '课程模板');

    // 设置列宽
    ws['!cols'] = [
      { wch: 12 }, // 课程代码
      { wch: 25 }, // 课程名称
      { wch: 15 }, // 模块分类
      { wch: 12 }, // 授课专家
      { wch: 12 }, // 标准价格
      { wch: 10 }, // 培训天数
      { wch: 14 }, // 培训期数
      { wch: 14 }, // 培训人数
      { wch: 10 }, // 培训模式
      { wch: 12 }, // 培训地点
      { wch: 10 }, // 课程状态
      { wch: 40 }, // 课程描述
    ];

    // 下载文件
    XLSX.writeFile(wb, '课程导入模板.xlsx');
    toast.success('模板已下载');
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
          selectedFile.type !== 'application/vnd.ms-excel') {
        toast.error('请选择Excel文件(.xlsx或.xls)');
        return;
      }
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  // 解析文件
  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // 验证数据
        const validationErrors: string[] = [];
        const validCourses: any[] = [];

        jsonData.forEach((row: any, index: number) => {
          const rowErrors: string[] = [];
          
          // 必填字段验证
          if (!row['课程名称']) {
            rowErrors.push(`第${index + 2}行: 课程名称不能为空`);
          }
          if (!row['模块分类']) {
            rowErrors.push(`第${index + 2}行: 模块分类不能为空`);
          }
          if (!row['标准价格'] || isNaN(Number(row['标准价格']))) {
            rowErrors.push(`第${index + 2}行: 标准价格必须是数字`);
          }
          if (!row['培训天数'] || isNaN(Number(row['培训天数']))) {
            rowErrors.push(`第${index + 2}行: 培训天数必须是数字`);
          }

          if (rowErrors.length === 0) {
            validCourses.push({
              code: row['课程代码'] || '',
              name: row['课程名称'],
              module: row['模块分类'],
              instructor: row['授课专家'] || '',
              standardPrice: Number(row['标准价格']),
              durationDays: Number(row['培训天数']),
              sessionsPerYear: Number(row['培训期数(每年)']) || 1,
              participantsPerSession: Number(row['培训人数(每期)']) || 30,
              trainingMode: row['培训模式'] === '线上' ? 'online' : 
                            row['培训模式'] === '线下' ? 'offline' : 
                            row['培训模式'] === '混合' ? 'hybrid' : 'offline',
              location: row['培训地点'] || '',
              status: row['课程状态'] === '停用' ? 'inactive' : 'active',
              description: row['课程描述'] || '',
            });
          } else {
            validationErrors.push(...rowErrors);
          }
        });

        setErrors(validationErrors);
        setParseResult({
          total: jsonData.length,
          valid: validCourses.length,
          courses: validCourses
        });

        if (validationErrors.length > 0) {
          toast.warning(`发现${validationErrors.length}个错误，请检查`);
        } else {
          toast.success(`成功解析${validCourses.length}条课程数据`);
        }
      } catch (error) {
        console.error('解析文件失败:', error);
        toast.error('文件解析失败，请检查文件格式');
        setErrors(['文件解析失败，请确保文件格式正确']);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 处理导入
  const handleImport = async () => {
    if (!parseResult || parseResult.courses.length === 0) {
      toast.error('没有可导入的有效数据');
      return;
    }

    if (errors.length > 0) {
      toast.error('请先修正所有错误');
      return;
    }

    setImporting(true);
    try {
      await onImport(parseResult.courses);
      toast.success(`成功导入${parseResult.courses.length}个课程`);
      handleClose();
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  // 关闭模态框
  const handleClose = () => {
    setFile(null);
    setParseResult(null);
    setErrors([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">导入课程</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* 步骤说明 */}
          <div className="mb-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">下载模板</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  下载Excel模板，按照模板格式填写课程信息
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <Download size={18} />
                  下载模板
                </button>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">2</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">上传文件</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  选择填写好的Excel文件进行上传
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                >
                  <Upload size={18} />
                  选择文件
                </button>
                {file && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    已选择: {file.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 解析结果 */}
          {parseResult && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">解析结果</h3>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">总数据条数</span>
                  <span className="font-medium text-gray-900 dark:text-white">{parseResult.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">有效数据</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{parseResult.valid}</span>
                </div>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {errors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle size={20} className="text-red-500" />
                数据错误
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-40 overflow-y-auto">
                {errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-600 dark:text-red-400 mb-1">
                    {error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 成功预览 */}
          {parseResult && parseResult.courses.length > 0 && errors.length === 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" />
                待导入数据预览
              </h3>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-600 dark:text-green-400">
                  共{parseResult.courses.length}条数据准备就绪，点击导入按钮开始导入
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            disabled={!parseResult || parseResult.courses.length === 0 || errors.length > 0 || importing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? '导入中...' : '开始导入'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseImportModal;
