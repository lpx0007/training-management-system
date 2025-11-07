/**
 * 功能面板与权限的映射关系
 * 定义每个功能面板实际使用的权限（而不是按权限ID前缀简单匹配）
 */

export interface FeaturePermissionMapping {
  featureId: string;
  permissions: string[];
  description: string;
}

/**
 * 功能面板权限映射
 * 
 * 设计原则：
 * 1. 按实际使用场景组织权限
 * 2. 跨功能的权限应该出现在使用它的功能面板中
 * 3. 例如：培训计划中可以下载招商简章，所以 prospectus_download 应该在培训计划中
 */
export const FEATURE_PERMISSION_MAPPINGS: FeaturePermissionMapping[] = [
  {
    featureId: 'dashboard',
    permissions: [],
    description: '仪表盘无需特定权限，所有用户均可访问'
  },
  {
    featureId: 'customer_management',
    permissions: [
      'customer_view',
      'customer_view_all',
      'customer_add',
      'customer_edit',
      'customer_delete',
      'customer_import',
      'customer_export',
    ],
    description: '客户管理页面的所有操作权限'
  },
  {
    featureId: 'training_management',
    permissions: [
      'training_view',
      'training_add',
      'training_edit',
      'training_delete',
      'training_add_participant',
      'training_manage_participant',
      'training_view_stats',
      'training_import',
      'training_export',
      // 跨功能权限：培训详情中可以下载招商简章
      'prospectus_download',
      // 跨功能权限：培训详情中可以查看专家信息
      'expert_view',
    ],
    description: '培训计划页面的所有操作权限，包括下载招商简章和查看专家信息'
  },
  {
    featureId: 'expert_management',
    permissions: [
      'expert_view',
      'expert_add',
      'expert_edit',
      'expert_delete',
      'expert_view_feedback',
      'expert_profile_edit',
      'expert_import',
      'expert_export',
    ],
    description: '专家管理页面的所有操作权限'
  },
  {
    featureId: 'salesperson_management',
    permissions: [
      'salesperson_view',
      'salesperson_add',
      'salesperson_edit',
      'salesperson_delete',
      'salesperson_view_performance',
      'performance_view_all_departments',
      'salesperson_import',
      'salesperson_export',
    ],
    description: '业务员管理页面的所有操作权限'
  },
  {
    featureId: 'prospectus_management',
    permissions: [
      'prospectus_view',
      'prospectus_upload',
      'prospectus_edit',
      'prospectus_delete',
      'prospectus_download',
      'prospectus_manage_category',
      'prospectus_import',
      'prospectus_export',
    ],
    description: '招商简章管理页面的所有操作权限（管理员专用）'
  },
  {
    featureId: 'poster_generator',
    permissions: [
      'poster_generate',
      'poster_view_history',
      'poster_config_template',
    ],
    description: '海报生成页面的所有操作权限'
  },
  {
    featureId: 'data_management',
    permissions: [
      // 各模块的导入导出权限
      'customer_import',
      'customer_export',
      'training_import',
      'training_export',
      'expert_import',
      'expert_export',
      'salesperson_import',
      'salesperson_export',
      'prospectus_import',
      'prospectus_export',
      // 业绩数据导出权限
      'performance_export',
      // 通用数据管理权限
      'data_download_template',
      'data_view_history',
    ],
    description: '数据管理页面的所有操作权限，根据用户拥有的细分权限显示对应的导入导出选项'
  },
  {
    featureId: 'sales_tracking',
    permissions: [
      'salesperson_view_performance',
      'performance_view_all_departments',
      // 跨功能权限：销售追踪需要查看客户数据
      'customer_view',
      'customer_view_all',
    ],
    description: '销售追踪页面的所有操作权限'
  },
  {
    featureId: 'permission_management',
    permissions: [
      'permission_manage',
      // 跨功能权限：权限管理需要查看用户信息
      'salesperson_view',
    ],
    description: '权限管理页面的所有操作权限'
  },
  {
    featureId: 'audit_logs',
    permissions: [
      'audit_log_view',
    ],
    description: '审计日志页面的所有操作权限'
  },
  {
    featureId: 'profile_settings',
    permissions: [],
    description: '个人设置无需特定权限，所有用户均可访问'
  },
];

/**
 * 根据功能面板ID获取相关权限
 */
export const getFeaturePermissions = (featureId: string): string[] => {
  const mapping = FEATURE_PERMISSION_MAPPINGS.find(m => m.featureId === featureId);
  return mapping ? mapping.permissions : [];
};

/**
 * 根据功能面板ID获取权限说明
 */
export const getFeaturePermissionDescription = (featureId: string): string => {
  const mapping = FEATURE_PERMISSION_MAPPINGS.find(m => m.featureId === featureId);
  return mapping ? mapping.description : '';
};

/**
 * 获取某个权限被哪些功能面板使用
 */
export const getPermissionUsedByFeatures = (permissionId: string): string[] => {
  return FEATURE_PERMISSION_MAPPINGS
    .filter(m => m.permissions.includes(permissionId))
    .map(m => m.featureId);
};

/**
 * 检查功能面板是否有权限定义
 */
export const featureHasPermissions = (featureId: string): boolean => {
  const permissions = getFeaturePermissions(featureId);
  return permissions.length > 0;
};
