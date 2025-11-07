// 数据管理功能类型定义

export type DataType = 'courses' | 'experts' | 'customers' | 'salespersons' | 'training_sessions' | 'salesperson_performance' | 'course_sales_performance';

export type ExportFormat = 'excel' | 'csv' | 'pdf';

export type ExportRange = 'all' | 'filtered' | 'custom';

export type DuplicateStrategy = 'skip' | 'overwrite' | 'keep_both';

export type OperationType = 'import' | 'export' | 'download_template';

export type OperationStatus = 'success' | 'partial' | 'failed';

export type ValidationSeverity = 'error' | 'warning';

export type ErrorType = 
  | 'validation_error'
  | 'duplicate_error'
  | 'foreign_key_error'
  | 'database_error'
  | 'file_error'
  | 'permission_error'
  | 'network_error';

// 验证结果
export interface ValidationResult {
  row: number;
  column: string;
  error: string;
  severity: ValidationSeverity;
  value?: any;
}

// 导入状态
export interface ImportState {
  uploadedFile: File | null;
  validationStatus: 'idle' | 'validating' | 'success' | 'error';
  validationResults: ValidationResult[];
  previewData: any[];
  importProgress: number;
  duplicateStrategy: DuplicateStrategy;
  duplicates: number[];
  newAccounts: number[];
}

// 导出状态
export interface ExportState {
  format: ExportFormat;
  range: ExportRange;
  dateRange: [Date, Date] | null;
  selectedFields: string[];
  filters: Record<string, any>;
  exportProgress: number;
}

// 导出配置
export interface ExportConfig {
  dataType: DataType;
  format: ExportFormat;
  range: ExportRange;
  dateRange?: [Date, Date];
  selectedFields: string[];
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 导入结果
export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  accountsCreated?: number;
  errors: ImportError[];
  duration: number;
}

// 导入错误
export interface ImportError {
  row: number;
  column?: string;
  error: string;
  value?: any;
}

// 数据管理错误
export interface DataManagementError {
  type: ErrorType;
  message: string;
  details?: any;
  row?: number;
  column?: string;
}

// 操作记录
export interface OperationRecord {
  id: number;
  operation_type: OperationType;
  data_type: DataType;
  operator_id: string;
  operator_name: string;
  timestamp: string;
  record_count: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  status: OperationStatus;
  error_details?: any;
  file_name?: string;
  file_size?: number;
  duration_ms?: number;
}

// 账号创建结果
export interface AccountCreationResult {
  success: boolean;
  userId?: string;
  username?: string;
  reason?: string;
}

// 批量账号创建结果
export interface BatchAccountCreationResult {
  results: AccountCreationResult[];
  summary: {
    created: number;
    skipped: number;
    failed: number;
  };
  message: string;
}

// 字段定义
export interface FieldDefinition {
  key: string;
  label: string;
  type: string;
  required: boolean;
  exportable: boolean;
}

// 列定义
export interface ColumnDefinition {
  key: string;
  label: string;
  required: boolean;
  width?: number;
  options?: string[];
}

// 模板配置
export interface TemplateConfig {
  dataType: DataType;
  includeExamples: boolean;
  includeInstructions: boolean;
}

// 模板数据类型
export interface CourseTemplate {
  id: string;
  name: string;
  description?: string;
  duration?: number;
  price?: number;
  category?: string;
  expert_id?: number;
}

export interface ExpertTemplate {
  name: string;
  title?: string;
  field?: string;
  experience?: string;
  rating?: number;
  courses?: string;
  location?: string;
  available?: boolean;
  bio?: string;
  past_sessions?: number;
  total_participants?: number;
  email?: string;
  phone?: string;
}

export interface CustomerTemplate {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  position?: string;
  location?: string;
  status?: string;
  salesperson_id?: string;
  salesperson_name?: string;
  follow_up_status?: string;
  last_contact?: string;
  tags?: string;
}

export interface SalespersonTemplate {
  name: string;
  phone: string;
  department?: string;
  position?: string;
  email?: string;
  join_date?: string;
  status?: string;
  team?: string;
}

export interface TrainingSessionTemplate {
  name: string;
  date: string;
  end_time: string;
  end_date?: string;
  start_time?: string;
  participants?: number;
  expert_id?: number;
  expert_name?: string;
  area?: string;
  revenue?: number;
  status?: string;
  rating?: number;
  salesperson_id?: number;
  salesperson_name?: string;
  course_id?: string;
  course_description?: string;
  capacity?: number;
}
