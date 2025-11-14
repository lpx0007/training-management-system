/**
 * 权限系统测试脚本
 * 验证新的 training_export_participants 权限是否正确配置
 */

import { getPermissionCategories, getRoleDefaultPermissions } from '../src/constants/permissions.ts';
import { getFeaturePermissions } from '../src/constants/featurePermissionMapping.ts';

console.log('🔍 权限系统测试开始...\n');

// 1. 测试权限定义
console.log('📋 1. 检查权限定义:');
const categories = getPermissionCategories();
const trainingCategory = categories.find(cat => cat.id === 'training');

if (trainingCategory) {
  const exportParticipantsPermission = trainingCategory.permissions.find(p => p.id === 'training_export_participants');
  
  if (exportParticipantsPermission) {
    console.log('✅ training_export_participants 权限已正确定义');
    console.log(`   权限名称: ${exportParticipantsPermission.name}`);
    console.log(`   权限描述: ${exportParticipantsPermission.description}`);
  } else {
    console.log('❌ training_export_participants 权限未找到');
  }
} else {
  console.log('❌ 培训权限类别未找到');
}

// 2. 测试角色默认权限
console.log('\n🎭 2. 检查角色默认权限:');

// 管理员权限
const adminPermissions = getRoleDefaultPermissions('admin');
if (adminPermissions.includes('training_export_participants')) {
  console.log('✅ 管理员角色包含 training_export_participants 权限');
} else {
  console.log('❌ 管理员角色缺少 training_export_participants 权限');
}

// 部门经理权限
const managerPermissions = getRoleDefaultPermissions('manager');
if (managerPermissions.includes('training_export_participants')) {
  console.log('✅ 部门经理角色包含 training_export_participants 权限');
} else {
  console.log('❌ 部门经理角色缺少 training_export_participants 权限');
}

// 业务员权限
const salespersonPermissions = getRoleDefaultPermissions('salesperson');
if (salespersonPermissions.includes('training_export_participants')) {
  console.log('⚠️  业务员角色包含 training_export_participants 权限（可能不正确）');
} else {
  console.log('✅ 业务员角色不包含 training_export_participants 权限（正确）');
}

// 专家权限
const expertPermissions = getRoleDefaultPermissions('expert');
if (expertPermissions.includes('training_export_participants')) {
  console.log('⚠️  专家角色包含 training_export_participants 权限（可能不正确）');
} else {
  console.log('✅ 专家角色不包含 training_export_participants 权限（正确）');
}

// 3. 测试功能映射
console.log('\n🗺️  3. 检查功能权限映射:');
try {
  const trainingFeaturePermissions = getFeaturePermissions('training_management');
  
  if (trainingFeaturePermissions.includes('training_export_participants')) {
    console.log('✅ training_management 功能映射包含 training_export_participants 权限');
  } else {
    console.log('❌ training_management 功能映射缺少 training_export_participants 权限');
  }
} catch (error) {
  console.log('❌ 获取功能权限映射失败:', error.message);
}

// 4. 权限完整性检查
console.log('\n🔧 4. 权限完整性检查:');

// 检查所有权限是否都有对应的定义
const allPermissions = categories.reduce((acc, cat) => {
  return acc.concat(cat.permissions.map(p => p.id));
}, []);

const missingInAdmin = adminPermissions.filter(p => !allPermissions.includes(p));
const missingInManager = managerPermissions.filter(p => !allPermissions.includes(p));

if (missingInAdmin.length > 0) {
  console.log('⚠️  管理员角色有未定义的权限:', missingInAdmin);
}

if (missingInManager.length > 0) {
  console.log('⚠️  部门经理角色有未定义的权限:', missingInManager);
}

if (missingInAdmin.length === 0 && missingInManager.length === 0) {
  console.log('✅ 所有角色权限都有对应定义');
}

// 5. 权限统计
console.log('\n📊 5. 权限统计:');
console.log(`总权限类别数: ${categories.length}`);
console.log(`总权限数: ${allPermissions.length}`);
console.log(`管理员权限数: ${adminPermissions.length}`);
console.log(`部门经理权限数: ${managerPermissions.length}`);
console.log(`业务员权限数: ${salespersonPermissions.length}`);
console.log(`专家权限数: ${expertPermissions.length}`);

console.log('\n🎉 权限系统测试完成!');
