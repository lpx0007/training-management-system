import { useState } from 'react';
import { X, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface CustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[]) => void;
}

export default function CustomerImportModal({ isOpen, onClose, onImport }: CustomerImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  // 下载模板
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        '客户姓名': '张三',
        '手机号': '13021622000',
        '邮箱': 'zhangsan@example.com',
        '公司名称': '大风歌',
        '职位': '经理',
        '地区': '江苏',
        '部门': '人力资源部',
        '性别': '男',
        '住宿需求': '无特殊要求',
        '负责业务员': '张三',
        '客户状态': '潜在客户'
      },
      {
        '客户姓名': '李四',
        '手机号': '13021622001',
        '邮箱': 'lisi@example.com',
        '公司名称': '阿萨德发大发',
        '职位': '主管',
        '地区': '上海',
        '部门': '财务部',
        '性别': '女',
        '住宿需求': '需要单间',
        '负责业务员': '李四',
        '客户状态': '已成交'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '客户信息');
    XLSX.writeFile(wb, `客户导入模板_${new Date().toLocaleDateString('zh-CN')}.xlsx`);
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

    setIsImporting(true);
    
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
            return;
          }

          // 转换字段名
          const convertedData = jsonData.map((row: any) => ({
            name: row['客户姓名'] || '',
            phone: row['手机号'] || '',
            email: row['邮箱'] || '',
            company: row['公司名称'] || '',
            position: row['职位'] || '',
            location: row['地区'] || '',
            department: row['部门'] || '',
            gender: row['性别'] || '',
            accommodation_requirements: row['住宿需求'] || '',
            salesperson_name: row['负责业务员'] || '',
            status: row['客户状态'] || '潜在客户',
            tags: row['标签'] ? row['标签'].split(',').map((t: string) => t.trim()) : []
          }));

          // 验证必填字段
          const errors: string[] = [];
          convertedData.forEach((item: any, index: number) => {
            if (!item.name) {
              errors.push(`第${index + 2}行：客户姓名不能为空`);
            }
            if (!item.phone) {
              errors.push(`第${index + 2}行：手机号不能为空`);
            }
            if (!item.company) {
              errors.push(`第${index + 2}行：公司名称不能为空`);
            }
            if (!item.gender) {
              errors.push(`第${index + 2}行：性别不能为空`);
            }
          });

          if (errors.length > 0) {
            toast.error(`数据验证失败：\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? `\n...还有${errors.length - 3}个错误` : ''}`);
            return;
          }

          // 调用导入回调
          await onImport(convertedData);
          
          // 重置状态
          setFile(null);
          onClose();
        } catch (error) {
          console.error('解析文件失败:', error);
          toast.error('文件解析失败，请检查文件格式');
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败，请重试');
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              导入客户信息
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          {/* 说明 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">导入说明：</h3>
            <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• 支持Excel（.xlsx, .xls）和CSV格式文件</li>
              <li>• 必填字段：客户姓名、手机号、公司名称、性别</li>
              <li>• 如果手机号已存在，该条记录将被跳过</li>
              <li>• 负责业务员字段请填写已存在的业务员姓名</li>
              <li>• 建议先下载模板，按模板格式填写数据</li>
            </ul>
          </div>

          {/* 模板下载 */}
          <div className="mb-6">
            <button
              onClick={handleDownloadTemplate}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center gap-2"
            >
              <Download size={20} className="text-blue-600 dark:text-blue-400" />
              <span className="text-gray-700 dark:text-gray-300">下载导入模板</span>
            </button>
          </div>

          {/* 文件选择 */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20">
              <div className="text-center">
                <Upload size={48} className="mx-auto text-blue-500 dark:text-blue-400 mb-3" />
                <label className="block cursor-pointer">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">点击选择文件</span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    支持 Excel (.xlsx, .xls) 或 CSV 格式
                  </div>
                </label>
              </div>
              {file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                  <span>已选择：{file.name}</span>
                  <button
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              {isImporting ? '导入中...' : '开始导入'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
