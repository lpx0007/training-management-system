/**
 * 权限守卫组件
 * 根据用户权限控制子组件的显示
 */

import { useContext, ReactNode } from 'react';
import { AuthContext } from '@/contexts/authContext';

interface PermissionGuardProps {
  /** 需要的权限（单个或多个） */
  permission: string | string[];
  /** 是否需要所有权限（默认 false，即任一权限即可） */
  requireAll?: boolean;
  /** 无权限时显示的内容（可选） */
  fallback?: ReactNode;
  /** 子组件 */
  children: ReactNode;
}

/**
 * 权限守卫组件
 * 
 * @example
 * // 单个权限
 * <PermissionGuard permission="customer_add">
 *   <Button>添加客户</Button>
 * </PermissionGuard>
 * 
 * @example
 * // 多个权限（任一）
 * <PermissionGuard permission={['customer_edit', 'customer_delete']}>
 *   <CustomerActions />
 * </PermissionGuard>
 * 
 * @example
 * // 多个权限（全部）
 * <PermissionGuard 
 *   permission={['customer_edit', 'customer_delete']} 
 *   requireAll={true}
 * >
 *   <AdvancedActions />
 * </PermissionGuard>
 * 
 * @example
 * // 带 fallback
 * <PermissionGuard 
 *   permission="customer_add"
 *   fallback={<div>您没有权限执行此操作</div>}
 * >
 *   <Button>添加客户</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  requireAll = false,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useContext(AuthContext);

  // 判断是否有权限
  let hasAccess = false;

  if (typeof permission === 'string') {
    // 单个权限
    hasAccess = hasPermission(permission);
  } else if (Array.isArray(permission)) {
    // 多个权限
    if (requireAll) {
      // 需要所有权限
      hasAccess = hasAllPermissions(permission);
    } else {
      // 需要任一权限
      hasAccess = hasAnyPermission(permission);
    }
  }

  // 如果有权限，显示子组件；否则显示 fallback
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

export default PermissionGuard;
