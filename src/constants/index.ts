/**
 * 常量定义统一导出
 */

// 权限相关
export {
  PERMISSION_CATEGORIES,
  ROLE_DEFAULT_PERMISSIONS,
  getAllPermissions,
  getPermissionCategories,
  getPermissionById,
  getRoleDefaultPermissions,
  type Permission,
  type PermissionCategory,
} from './permissions';

// 功能面板相关
export {
  MENU_FEATURES,
  ROLE_DEFAULT_MENU_FEATURES,
  getMenuFeatureById,
  getMenuFeatureByPath,
  getRoleDefaultMenuFeatures,
  menuFeatureRequiresPermissions,
  type MenuFeature,
} from './menuFeatures';
