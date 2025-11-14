/**
 * 功能面板（导航菜单）常量定义
 * 定义系统中所有的功能面板及其访问权限要求
 */

import { UserRole } from '@/lib/supabase/types';

// 功能面板接口定义
export interface MenuFeature {
  id: string;
  name: string;
  path: string;
  icon: string;
  description: string;
  requiredPermissions: string[]; // 该功能面板需要的基础权限（任一即可）
  displayOrder: number;
}

// 功能面板定义
export const MENU_FEATURES: MenuFeature[] = [
  {
    id: 'dashboard',
    name: '仪表盘',
    path: '/dashboard',
    icon: 'chart-line',
    description: '查看系统概览和统计数据',
    requiredPermissions: [], // 所有角色都可访问
    displayOrder: 1
  },
  {
    id: 'course_management',
    name: '课程管理',
    path: '/course-management',
    icon: 'calendar',
    description: '管理培训课程信息',
    requiredPermissions: ['training_view'],
    displayOrder: 2
  },
  {
    id: 'training_management',
    name: '培训计划',
    path: '/training-management',
    icon: 'calendar',
    description: '管理培训场次和参与者',
    requiredPermissions: ['training_view'],
    displayOrder: 3
  },
  {
    id: 'sales_tracking',
    name: '销售追踪',
    path: '/sales-tracking',
    icon: 'chart-bar',
    description: '查看销售数据和绩效',
    requiredPermissions: ['salesperson_view_performance'],
    displayOrder: 4
  },
  {
    id: 'salesperson_management',
    name: '业务员管理',
    path: '/salesperson-management',
    icon: 'user-friends',
    description: '管理业务员信息和绩效',
    requiredPermissions: ['salesperson_view'],
    displayOrder: 5
  },
  {
    id: 'customer_management',
    name: '客户管理',
    path: '/customer-management',
    icon: 'users',
    description: '管理客户信息和跟进记录',
    requiredPermissions: ['customer_view'],
    displayOrder: 6
  },
  {
    id: 'expert_management',
    name: '专家管理',
    path: '/expert-management',
    icon: 'user-tie',
    description: '管理专家信息和课程',
    requiredPermissions: ['expert_view'],
    displayOrder: 7
  },
  {
    id: 'prospectus_management',
    name: '招商简章',
    path: '/prospectus-management',
    icon: 'file-alt',
    description: '管理招商简章文件',
    requiredPermissions: ['prospectus_view'],
    displayOrder: 8
  },
  {
    id: 'schedule_management',
    name: '课表管理',
    path: '/schedule-management',
    icon: 'calendar',
    description: '管理课表文件',
    requiredPermissions: ['schedule_view'],
    displayOrder: 9
  },
  {
    id: 'poster_generator',
    name: '海报生成',
    path: '/poster-generator',
    icon: 'image',
    description: '生成培训宣传海报',
    requiredPermissions: ['poster_generate'],
    displayOrder: 10
  },
  {
    id: 'announcement_management',
    name: '公告管理',
    path: '/announcement-management',
    icon: 'bullhorn',
    description: '发布和管理系统公告',
    requiredPermissions: [], // 由路由层面的角色控制（仅管理员）
    displayOrder: 10
  },
  {
    id: 'permission_management',
    name: '权限管理',
    path: '/permission-management',
    icon: 'shield-alt',
    description: '管理用户权限',
    requiredPermissions: ['permission_manage'],
    displayOrder: 11
  },
  {
    id: 'audit_logs',
    name: '审计日志',
    path: '/audit-logs',
    icon: 'history',
    description: '查看系统操作日志',
    requiredPermissions: ['audit_log_view'],
    displayOrder: 12
  },
  {
    id: 'profile_settings',
    name: '个人设置',
    path: '/profile-settings',
    icon: 'cog',
    description: '管理个人资料和偏好',
    requiredPermissions: [], // 所有角色都可访问
    displayOrder: 13
  }
];

// 根据ID获取功能面板
export const getMenuFeatureById = (id: string): MenuFeature | undefined => {
  return MENU_FEATURES.find(f => f.id === id);
};

// 根据路径获取功能面板
export const getMenuFeatureByPath = (path: string): MenuFeature | undefined => {
  return MENU_FEATURES.find(f => f.path === path);
};

// 角色默认可访问的功能面板
export const ROLE_DEFAULT_MENU_FEATURES: Record<UserRole, string[]> = {
  admin: MENU_FEATURES.map(f => f.id), // 管理员可访问所有功能面板
  salesperson: [
    // 业务员默认功能面板
    'dashboard',
    'customer_management',
    'training_management',
    'course_management',
    'expert_management',
    'prospectus_management',
    'profile_settings',
  ],
  expert: [
    // 专家默认功能面板
    'dashboard',
    'training_management',
    'expert_management',
    'prospectus_management',
    'profile_settings',
  ],
  manager: [
    // 部门经理默认功能面板
    'dashboard',
    'customer_management',
    'training_management',
    'salesperson_management',
    'sales_tracking',
    'profile_settings',
  ]
};

// 获取角色默认功能面板
export const getRoleDefaultMenuFeatures = (role: UserRole): string[] => {
  return ROLE_DEFAULT_MENU_FEATURES[role] || [];
};

// 检查功能面板是否需要权限
export const menuFeatureRequiresPermissions = (featureId: string): boolean => {
  const feature = getMenuFeatureById(featureId);
  return feature ? feature.requiredPermissions.length > 0 : false;
};
