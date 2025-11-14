/**
 * 权限常量定义
 * 定义系统中所有的权限ID、分类和默认配置
 */

import { UserRole } from '@/lib/supabase/types';

// 权限接口定义
export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

// 权限分类常量
export const PERMISSION_CATEGORIES: Record<string, PermissionCategory> = {
  CUSTOMER: {
    id: 'customer',
    name: '客户管理',
    description: '客户信息的查看、编辑和管理权限',
    permissions: [
      { id: 'customer_view', name: '查看客户', description: '查看客户基本信息' },
      { id: 'customer_view_all', name: '查看所有客户', description: '查看所有业务员的客户（跨业务员）' },
      { id: 'customer_add', name: '添加客户', description: '添加新客户到系统' },
      { id: 'customer_edit', name: '编辑客户', description: '编辑客户信息' },
      { id: 'customer_delete', name: '删除客户', description: '删除客户记录' },
    ]
  },
  TRAINING: {
    id: 'training',
    name: '培训管理',
    description: '培训场次的创建、编辑和参与者管理权限',
    permissions: [
      { id: 'training_view', name: '查看培训', description: '查看培训场次信息' },
      { id: 'training_add', name: '添加培训', description: '创建新的培训场次' },
      { id: 'training_edit', name: '编辑培训', description: '编辑培训场次信息' },
      { id: 'training_delete', name: '删除培训', description: '删除培训场次' },
      { id: 'training_add_participant', name: '添加培训参与者', description: '向培训中添加参与者' },
      { id: 'training_manage_participant', name: '管理培训参与者', description: '管理培训参与者信息' },
      { id: 'training_view_stats', name: '查看培训统计', description: '查看培训统计数据' },
      { id: 'training_export_participants', name: '导出参训人员', description: '导出培训场次的参训人员名单（含详细信息）' },
    ]
  },
  EXPERT: {
    id: 'expert',
    name: '专家管理',
    description: '专家信息的查看、编辑和管理权限',
    permissions: [
      { id: 'expert_view', name: '查看专家', description: '查看专家信息' },
      { id: 'expert_add', name: '添加专家', description: '添加新专家' },
      { id: 'expert_edit', name: '编辑专家', description: '编辑专家信息' },
      { id: 'expert_delete', name: '删除专家', description: '删除专家记录' },
      { id: 'expert_view_feedback', name: '查看专家反馈', description: '查看专家的反馈信息' },
      { id: 'expert_profile_edit', name: '编辑自己的专家资料', description: '专家编辑自己的资料' },
    ]
  },
  SALESPERSON: {
    id: 'salesperson',
    name: '业务员管理',
    description: '业务员信息的查看、编辑和绩效管理权限',
    permissions: [
      { id: 'salesperson_view', name: '查看业务员', description: '查看业务员信息' },
      { id: 'salesperson_add', name: '添加业务员', description: '添加新业务员' },
      { id: 'salesperson_edit', name: '编辑业务员', description: '编辑业务员信息' },
      { id: 'salesperson_delete', name: '删除业务员', description: '删除业务员记录' },
      { id: 'salesperson_view_performance', name: '查看业务员绩效', description: '查看业务员绩效数据' },
      { id: 'performance_view_all_departments', name: '查看所有部门业绩', description: '查看跨部门的业务员业绩数据（经理默认只能看本部门）' },
    ]
  },
  PROSPECTUS: {
    id: 'prospectus',
    name: '招商简章管理',
    description: '招商简章的上传、下载和管理权限',
    permissions: [
      { id: 'prospectus_view', name: '查看简章', description: '查看招商简章列表' },
      { id: 'prospectus_upload', name: '上传简章', description: '上传新的招商简章' },
      { id: 'prospectus_edit', name: '编辑简章', description: '编辑简章信息' },
      { id: 'prospectus_delete', name: '删除简章', description: '删除简章文件' },
      { id: 'prospectus_download', name: '下载简章', description: '下载简章文件' },
      { id: 'prospectus_manage_category', name: '管理简章分类', description: '管理简章分类' },
    ]
  },
  SCHEDULE: {
    id: 'schedule',
    name: '课表管理',
    description: '课表的上传、下载和管理权限',
    permissions: [
      { id: 'schedule_view', name: '查看课表', description: '查看课表列表' },
      { id: 'schedule_upload', name: '上传课表', description: '上传新的课表' },
      { id: 'schedule_edit', name: '编辑课表', description: '编辑课表信息' },
      { id: 'schedule_delete', name: '删除课表', description: '删除课表文件' },
      { id: 'schedule_download', name: '下载课表', description: '下载课表文件' },
      { id: 'schedule_manage_category', name: '管理课表分类', description: '管理课表分类' },
    ]
  },
  POSTER: {
    id: 'poster',
    name: '海报生成',
    description: '海报生成和管理权限',
    permissions: [
      { id: 'poster_generate', name: '生成海报', description: '生成培训海报' },
      { id: 'poster_view_history', name: '查看海报历史', description: '查看海报生成历史' },
      { id: 'poster_config_template', name: '配置海报模板', description: '配置海报生成模板' },
    ]
  },
  DATA: {
    id: 'data',
    name: '数据管理',
    description: '数据批量操作和管理权限',
    permissions: [
      // 客户数据导入导出
      { id: 'customer_import', name: '导入客户', description: '批量导入客户数据' },
      { id: 'customer_export', name: '导出客户', description: '导出客户数据' },
      // 培训数据导入导出
      { id: 'training_import', name: '导入培训班次', description: '批量导入培训班次数据' },
      { id: 'training_export', name: '导出培训班次', description: '导出培训班次数据' },
      // 专家数据导入导出
      { id: 'expert_import', name: '导入专家信息', description: '批量导入专家数据' },
      { id: 'expert_export', name: '导出专家信息', description: '导出专家数据' },
      // 业务员数据导入导出
      { id: 'salesperson_import', name: '导入业务员信息', description: '批量导入业务员数据' },
      { id: 'salesperson_export', name: '导出业务员信息', description: '导出业务员数据' },
      // 简章数据导入导出
      { id: 'prospectus_import', name: '导入简章信息', description: '批量导入简章元数据' },
      { id: 'prospectus_export', name: '导出简章信息', description: '导出简章元数据' },
      // 业绩数据导出
      { id: 'performance_export', name: '导出业绩数据', description: '导出业务员业绩和课程销售业绩数据（含明细）' },
      // 通用功能
      { id: 'data_download_template', name: '下载导入模板', description: '下载各类数据导入模板' },
      { id: 'data_view_history', name: '查看数据操作历史', description: '查看数据导入导出历史记录' },
    ]
  },
  SYSTEM: {
    id: 'system',
    name: '系统管理',
    description: '系统级管理权限',
    permissions: [
      { id: 'permission_manage', name: '管理权限', description: '管理用户权限' },
      { id: 'audit_log_view', name: '查看审计日志', description: '查看系统审计日志' },
      { id: 'system_config', name: '系统配置', description: '修改系统配置' },
      { id: 'user_account_manage', name: '用户账号管理', description: '管理用户账号状态' },
    ]
  }
};

// 获取所有权限列表
export const getAllPermissions = (): Permission[] => {
  return Object.values(PERMISSION_CATEGORIES).flatMap(category => category.permissions);
};

// 获取权限分类列表
export const getPermissionCategories = (): PermissionCategory[] => {
  return Object.values(PERMISSION_CATEGORIES);
};

// 根据ID获取权限信息
export const getPermissionById = (id: string): Permission | undefined => {
  return getAllPermissions().find(p => p.id === id);
};

// 角色默认权限模板
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  admin: getAllPermissions().map(p => p.id), // 管理员拥有所有权限
  salesperson: [
    // 业务员基础权限
    'customer_view',
    'customer_add',
    'customer_edit',
    'customer_import',
    'customer_export',
    'training_view',
    'training_add_participant',
    'expert_view',
    'prospectus_view',
    'prospectus_download',
    'data_download_template',
  ],
  expert: [
    // 专家基础权限
    'training_view',
    'expert_view',
    'expert_profile_edit',
    'prospectus_view',
  ],
  manager: [
    // 部门经理权限（客户管理）
    'customer_view',
    'customer_view_all',
    'customer_add',
    'customer_edit',
    'customer_delete',      // 删除客户
    'customer_export',
    // 培训管理
    'training_view',
    'training_manage_participant',  // 管理培训参与者
    'training_view_stats',
    'training_export',
    'training_export_participants', // 导出参训人员
    // 业务员管理
    'salesperson_view',
    'salesperson_add',
    'salesperson_edit',
    'salesperson_view_performance',
    // 招商简章
    'prospectus_view',      // 查看简章
    'prospectus_download',  // 下载简章
    // 数据管理
    'performance_export', // 可以导出业绩数据
    'data_view_history',
    // 注意：performance_view_all_departments 需要管理员手动分配
  ]
};

// 获取角色默认权限
export const getRoleDefaultPermissions = (role: UserRole): string[] => {
  return ROLE_DEFAULT_PERMISSIONS[role] || [];
};
