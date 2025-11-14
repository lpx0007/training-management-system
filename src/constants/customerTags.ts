// 客户标签常量定义
export const CUSTOMER_TAGS = [
  'A+成交客户',
  'A高意向',
  'B待跟进', 
  'C低意向',
  'D不考虑'
] as const;

export type CustomerTag = typeof CUSTOMER_TAGS[number];

// 标签显示配置
export const TAG_CONFIG = {
  'A+成交客户': {
    color: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300',
    priority: 5
  },
  'A高意向': {
    color: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300', 
    priority: 4
  },
  'B待跟进': {
    color: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300',
    priority: 3
  },
  'C低意向': {
    color: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300',
    priority: 2
  },
  'D不考虑': {
    color: 'bg-slate-100 dark:bg-slate-900/50 text-slate-800 dark:text-slate-300',
    priority: 1
  }
} as const;
