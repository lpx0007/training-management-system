/**
 * 权限系统验证工具
 * 用于检查和验证权限配置的一致性
 */

import { supabase } from '@/lib/supabase/client';
import { ROLE_DEFAULT_MENU_FEATURES } from '@/constants/menuFeatures';
import { ROLE_DEFAULT_PERMISSIONS } from '@/constants/permissions';

// 定义类型
interface UserProfile {
  id: string;
  name: string;
  role: string;
  username: string;
  department?: string;
}

interface MenuAccess {
  menu_feature_id: string;
}

interface UserPermission {
  permission_id: string;
}

export interface PermissionIssue {
  userId: string;
  userName: string;
  userRole: string;
  issueType: 'missing_menu' | 'extra_menu' | 'missing_permission' | 'extra_permission';
  details: string;
}

/**
 * 验证用户权限一致性
 * @param userId 用户ID
 * @returns 权限问题列表
 */
export async function validateUserPermissions(userId: string): Promise<PermissionIssue[]> {
  const issues: PermissionIssue[] = [];
  
  try {
    // 获取用户信息
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single() as { data: UserProfile | null; error: any };
    
    if (userError || !user) {
      throw new Error('用户不存在');
    }
    
    // 获取用户的菜单权限
    const { data: menuAccess, error: menuError } = await supabase
      .from('user_menu_access')
      .select('menu_feature_id')
      .eq('user_id', userId)
      .eq('enabled', true) as { data: MenuAccess[] | null; error: any };
    
    if (menuError) throw menuError;
    
    const userMenus = menuAccess?.map(m => m.menu_feature_id) || [];
    
    // 获取用户的操作权限
    const { data: permissions, error: permError } = await supabase
      .from('user_permissions')
      .select('permission_id')
      .eq('user_id', userId) as { data: UserPermission[] | null; error: any };
    
    if (permError) throw permError;
    
    const userPermissions = permissions?.map(p => p.permission_id) || [];
    
    // 获取角色的默认配置（暂时注释，将来可用于对比）
    // const defaultMenus = ROLE_DEFAULT_MENU_FEATURES[user.role as keyof typeof ROLE_DEFAULT_MENU_FEATURES] || [];
    // const defaultPermissions = ROLE_DEFAULT_PERMISSIONS[user.role as keyof typeof ROLE_DEFAULT_PERMISSIONS] || [];
    
    // 检查特殊规则
    if (user.role === 'manager') {
      // 部门经理不应该有course_management
      if (userMenus.includes('course_management')) {
        issues.push({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          issueType: 'extra_menu',
          details: '部门经理不应该有课程管理菜单权限'
        });
      }
      
      // 部门经理应该有sales_tracking和prospectus_management
      if (!userMenus.includes('sales_tracking')) {
        issues.push({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          issueType: 'missing_menu',
          details: '部门经理缺少销售追踪菜单权限'
        });
      }
      
      if (!userMenus.includes('prospectus_management')) {
        issues.push({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          issueType: 'missing_menu',
          details: '部门经理缺少招商简章菜单权限'
        });
      }
      
      // 部门经理应该有prospectus_view和prospectus_download权限
      if (!userPermissions.includes('prospectus_view')) {
        issues.push({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          issueType: 'missing_permission',
          details: '部门经理缺少查看简章权限'
        });
      }
      
      if (!userPermissions.includes('prospectus_download')) {
        issues.push({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          issueType: 'missing_permission',
          details: '部门经理缺少下载简章权限'
        });
      }
    }
    
    return issues;
  } catch (error) {
    console.error('验证用户权限失败:', error);
    return [];
  }
}

/**
 * 批量验证所有用户的权限
 * @returns 所有权限问题列表
 */
export async function validateAllUsersPermissions(): Promise<PermissionIssue[]> {
  const allIssues: PermissionIssue[] = [];
  
  try {
    // 获取所有用户
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('id');
    
    if (error) throw error;
    
    // 验证每个用户
    for (const user of users || []) {
      const issues = await validateUserPermissions(user.id);
      allIssues.push(...issues);
    }
    
    return allIssues;
  } catch (error) {
    console.error('批量验证权限失败:', error);
    return allIssues;
  }
}

/**
 * 自动修复权限问题
 * @param issue 权限问题
 * @returns 是否修复成功
 */
export async function fixPermissionIssue(issue: PermissionIssue): Promise<boolean> {
  try {
    switch (issue.issueType) {
      case 'missing_menu':
        // 添加缺失的菜单权限
        const menuId = extractMenuId(issue.details);
        if (menuId) {
          const { error } = await supabase
            .from('user_menu_access')
            .upsert({
              user_id: issue.userId,
              menu_feature_id: menuId,
              enabled: true
            }, { onConflict: 'user_id,menu_feature_id' });
          
          if (error) throw error;
          return true;
        }
        break;
        
      case 'extra_menu':
        // 删除多余的菜单权限
        const extraMenuId = extractMenuId(issue.details);
        if (extraMenuId) {
          const { error } = await supabase
            .from('user_menu_access')
            .delete()
            .eq('user_id', issue.userId)
            .eq('menu_feature_id', extraMenuId);
          
          if (error) throw error;
          return true;
        }
        break;
        
      case 'missing_permission':
        // 添加缺失的操作权限
        const permissionId = extractPermissionId(issue.details);
        if (permissionId) {
          const { error } = await supabase
            .from('user_permissions')
            .upsert({
              user_id: issue.userId,
              permission_id: permissionId
            }, { onConflict: 'user_id,permission_id' });
          
          if (error) throw error;
          return true;
        }
        break;
        
      case 'extra_permission':
        // 删除多余的操作权限
        const extraPermId = extractPermissionId(issue.details);
        if (extraPermId) {
          const { error } = await supabase
            .from('user_permissions')
            .delete()
            .eq('user_id', issue.userId)
            .eq('permission_id', extraPermId);
          
          if (error) throw error;
          return true;
        }
        break;
    }
    
    return false;
  } catch (error) {
    console.error('修复权限问题失败:', error);
    return false;
  }
}

/**
 * 从问题描述中提取菜单ID
 */
function extractMenuId(details: string): string | null {
  if (details.includes('销售追踪')) return 'sales_tracking';
  if (details.includes('招商简章')) return 'prospectus_management';
  if (details.includes('课程管理')) return 'course_management';
  return null;
}

/**
 * 从问题描述中提取权限ID
 */
function extractPermissionId(details: string): string | null {
  if (details.includes('查看简章')) return 'prospectus_view';
  if (details.includes('下载简章')) return 'prospectus_download';
  return null;
}

/**
 * 获取权限诊断报告
 */
export async function getPermissionDiagnosticReport(): Promise<{
  totalUsers: number;
  issueCount: number;
  issuesByType: Record<string, number>;
  issuesByRole: Record<string, number>;
  issues: PermissionIssue[];
}> {
  const issues = await validateAllUsersPermissions();
  
  const issuesByType: Record<string, number> = {};
  const issuesByRole: Record<string, number> = {};
  
  issues.forEach(issue => {
    issuesByType[issue.issueType] = (issuesByType[issue.issueType] || 0) + 1;
    issuesByRole[issue.userRole] = (issuesByRole[issue.userRole] || 0) + 1;
  });
  
  // 获取总用户数
  const { count } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true });
  
  return {
    totalUsers: count || 0,
    issueCount: issues.length,
    issuesByType,
    issuesByRole,
    issues
  };
}
