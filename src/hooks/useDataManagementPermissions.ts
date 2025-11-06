import { useContext, useMemo } from 'react';
import { AuthContext } from '@/contexts/authContext';
import type { DataType } from '@/types/dataManagement';

/**
 * 数据管理权限 Hook
 * 根据用户的细分权限判断可以导入导出哪些数据模块
 */
export function useDataManagementPermissions() {
  const { permissions } = useContext(AuthContext);

  // 权限映射：数据类型 -> 导入导出权限
  const permissionMap: Record<DataType, { import: string; export: string }> = {
    customers: {
      import: 'customer_import',
      export: 'customer_export'
    },
    training_sessions: {
      import: 'training_import',
      export: 'training_export'
    },
    experts: {
      import: 'expert_import',
      export: 'expert_export'
    },
    salespersons: {
      import: 'salesperson_import',
      export: 'salesperson_export'
    },
    courses: {
      import: 'prospectus_import', // 课程暂时映射到简章权限
      export: 'prospectus_export'
    }
  };

  // 检查是否有权限导入某个数据类型
  const canImport = (dataType: DataType): boolean => {
    const requiredPermission = permissionMap[dataType]?.import;
    return requiredPermission ? permissions.includes(requiredPermission) : false;
  };

  // 检查是否有权限导出某个数据类型
  const canExport = (dataType: DataType): boolean => {
    const requiredPermission = permissionMap[dataType]?.export;
    return requiredPermission ? permissions.includes(requiredPermission) : false;
  };

  // 检查是否有权限下载模板
  const canDownloadTemplate = (): boolean => {
    return permissions.includes('data_download_template');
  };

  // 检查是否有权限查看历史
  const canViewHistory = (): boolean => {
    return permissions.includes('data_view_history');
  };

  // 获取用户可以访问的数据类型列表
  const availableDataTypes = useMemo(() => {
    const allDataTypes: DataType[] = ['customers', 'training_sessions', 'experts', 'salespersons', 'courses'];
    return allDataTypes.filter(dataType => {
      const importPerm = permissionMap[dataType]?.import;
      const exportPerm = permissionMap[dataType]?.export;
      return (importPerm && permissions.includes(importPerm)) || 
             (exportPerm && permissions.includes(exportPerm));
    });
  }, [permissions]);

  // 获取用户可以导入的数据类型列表
  const importableDataTypes = useMemo(() => {
    const allDataTypes: DataType[] = ['customers', 'training_sessions', 'experts', 'salespersons', 'courses'];
    return allDataTypes.filter(dataType => {
      const importPerm = permissionMap[dataType]?.import;
      return importPerm && permissions.includes(importPerm);
    });
  }, [permissions]);

  // 获取用户可以导出的数据类型列表
  const exportableDataTypes = useMemo(() => {
    const allDataTypes: DataType[] = ['customers', 'training_sessions', 'experts', 'salespersons', 'courses'];
    return allDataTypes.filter(dataType => {
      const exportPerm = permissionMap[dataType]?.export;
      return exportPerm && permissions.includes(exportPerm);
    });
  }, [permissions]);

  // 检查用户是否有任何导入导出权限
  const hasAnyPermission = useMemo(() => {
    return availableDataTypes.length > 0 || canDownloadTemplate() || canViewHistory();
  }, [availableDataTypes, permissions]);

  return {
    canImport,
    canExport,
    canDownloadTemplate,
    canViewHistory,
    availableDataTypes,
    importableDataTypes,
    exportableDataTypes,
    hasAnyPermission,
    permissionMap
  };
}
