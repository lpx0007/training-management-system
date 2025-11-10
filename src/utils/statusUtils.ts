/**
 * 培训状态管理工具
 * 统一管理整个系统中培训/课程状态的显示和颜色
 */

/**
 * 培训状态类型
 */
export type TrainingStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'planned';

/**
 * 状态配置接口
 */
interface StatusConfig {
  text: string;
  color: string;
  bgColor: string;
}

/**
 * 状态配置映射
 * 定义所有可能的状态及其显示文本和颜色
 */
const STATUS_CONFIG: Record<string, StatusConfig> = {
  // 标准状态
  'upcoming': {
    text: '即将开始',
    color: 'text-yellow-800 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/50'
  },
  'ongoing': {
    text: '进行中',
    color: 'text-blue-800 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50'
  },
  'completed': {
    text: '已完成',
    color: 'text-green-800 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/50'
  },
  'cancelled': {
    text: '已取消',
    color: 'text-gray-800 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-900/50'
  },
  'planned': {
    text: '计划中',
    color: 'text-purple-800 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50'
  },
  
  // 兼容旧数据 - 映射到标准状态
  '即将开始': {
    text: '即将开始',
    color: 'text-yellow-800 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/50'
  },
  '即将开展': {  // 不一致的状态，映射到"即将开始"
    text: '即将开始',
    color: 'text-yellow-800 dark:text-yellow-300',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/50'
  },
  '进行中': {
    text: '进行中',
    color: 'text-blue-800 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50'
  },
  '已完成': {
    text: '已完成',
    color: 'text-green-800 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/50'
  },
  '已取消': {
    text: '已取消',
    color: 'text-gray-800 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-900/50'
  },
  '计划中': {
    text: '计划中',
    color: 'text-purple-800 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50'
  },
  '期排中': {  // 不一致的状态，映射到"进行中"
    text: '进行中',
    color: 'text-blue-800 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50'
  }
};

/**
 * 获取状态显示文本
 * @param status 状态值
 * @returns 统一的状态显示文本
 */
export function getStatusText(status: string | null | undefined): string {
  if (!status) return '未知';
  const config = STATUS_CONFIG[status];
  return config ? config.text : '未知';
}

/**
 * 获取状态颜色类名
 * @param status 状态值
 * @returns Tailwind CSS 颜色类名
 */
export function getStatusColor(status: string | null | undefined): string {
  if (!status) return 'text-gray-800 dark:text-gray-300';
  const config = STATUS_CONFIG[status];
  return config ? config.color : 'text-gray-800 dark:text-gray-300';
}

/**
 * 获取状态背景色类名
 * @param status 状态值
 * @returns Tailwind CSS 背景色类名
 */
export function getStatusBgColor(status: string | null | undefined): string {
  if (!status) return 'bg-gray-100 dark:bg-gray-900/50';
  const config = STATUS_CONFIG[status];
  return config ? config.bgColor : 'bg-gray-100 dark:bg-gray-900/50';
}

/**
 * 获取状态完整类名（包含文本颜色和背景色）
 * @param status 状态值
 * @returns 完整的 Tailwind CSS 类名字符串
 */
export function getStatusClassName(status: string | null | undefined): string {
  if (!status) return 'bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300';
  const config = STATUS_CONFIG[status];
  if (!config) return 'bg-gray-100 dark:bg-gray-900/50 text-gray-800 dark:text-gray-300';
  return `${config.bgColor} ${config.color}`;
}

/**
 * 状态枚举（用于选择器等场景）
 */
export const STATUS_OPTIONS = [
  { value: 'upcoming', label: '即将开始' },
  { value: 'ongoing', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'planned', label: '计划中' }
];

/**
 * 筛选器状态选项（包含"全部"选项）
 */
export const FILTER_STATUS_OPTIONS = [
  { value: '全部', label: '全部' },
  ...STATUS_OPTIONS
];

/**
 * 状态值映射（用于筛选等场景）
 */
export const STATUS_MAP: Record<string, string> = {
  '即将开始': 'upcoming',
  '进行中': 'ongoing',
  '已完成': 'completed',
  '已取消': 'cancelled',
  '计划中': 'planned'
};

/**
 * 根据日期自动计算培训状态
 * @param startDate 开始日期
 * @param endDate 结束日期（可选）
 * @returns 计算后的状态值
 */
export function calculateTrainingStatus(startDate: string, endDate?: string): TrainingStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = endDate ? new Date(endDate) : new Date(startDate);
  end.setHours(0, 0, 0, 0);
  
  if (today < start) {
    return 'upcoming';
  } else if (today > end) {
    return 'completed';
  } else {
    return 'ongoing';
  }
}

/**
 * 标准化状态值
 * 将各种可能的状态值统一为标准格式
 * @param status 输入的状态值
 * @returns 标准化后的状态值
 */
export function normalizeStatus(status: string | null | undefined): TrainingStatus | null {
  if (!status) return null;
  
  // 直接匹配标准状态
  if (['upcoming', 'ongoing', 'completed', 'cancelled', 'planned'].includes(status)) {
    return status as TrainingStatus;
  }
  
  // 映射中文状态
  const mapping: Record<string, TrainingStatus> = {
    '即将开始': 'upcoming',
    '即将开展': 'upcoming',  // 不一致的状态
    '进行中': 'ongoing',
    '期排中': 'ongoing',  // 不一致的状态
    '已完成': 'completed',
    '已取消': 'cancelled',
    '计划中': 'planned'
  };
  
  return mapping[status] || null;
}
