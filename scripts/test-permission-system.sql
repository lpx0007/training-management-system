-- ============================================
-- 权限管理系统测试脚本
-- ============================================
-- 用途：验证权限管理系统是否正确安装和配置
-- 使用：在 Supabase Dashboard 的 SQL Editor 中执行
-- ============================================

-- 1. 验证表结构
SELECT '=== 1. 验证表结构 ===' as test_section;

SELECT 
  'menu_features' as table_name,
  COUNT(*) as record_count,
  '应该是 12' as expected
FROM menu_features
UNION ALL
SELECT 
  'permissions' as table_name,
  COUNT(*) as record_count,
  '应该是 42' as expected
FROM permissions
UNION ALL
SELECT 
  'user_permissions' as table_name,
  COUNT(*) as record_count,
  '应该 > 0' as expected
FROM user_permissions
UNION ALL
SELECT 
  'user_menu_access' as table_name,
  COUNT(*) as record_count,
  '应该 > 0' as expected
FROM user_menu_access;

-- 2. 验证权限分类
SELECT '=== 2. 验证权限分类 ===' as test_section;

SELECT 
  category,
  COUNT(*) as permission_count
FROM permissions
GROUP BY category
ORDER BY category;

-- 3. 验证功能面板
SELECT '=== 3. 验证功能面板 ===' as test_section;

SELECT 
  id,
  name,
  path,
  array_length(required_permissions, 1) as required_permissions_count,
  display_order
FROM menu_features
ORDER BY display_order;

-- 4. 验证用户权限分配
SELECT '=== 4. 验证用户权限分配 ===' as test_section;

SELECT 
  up.role,
  COUNT(DISTINCT up.id) as user_count,
  ROUND(AVG(perm_count.count), 2) as avg_permissions,
  ROUND(AVG(menu_count.count), 2) as avg_menu_access
FROM user_profiles up
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM user_permissions
  GROUP BY user_id
) perm_count ON up.id = perm_count.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM user_menu_access
  WHERE enabled = true
  GROUP BY user_id
) menu_count ON up.id = menu_count.user_id
GROUP BY up.role
ORDER BY up.role;

-- 5. 验证管理员权限（应该有所有权限）
SELECT '=== 5. 验证管理员权限 ===' as test_section;

SELECT 
  up.name,
  up.role,
  COUNT(DISTINCT uper.permission_id) as permission_count,
  COUNT(DISTINCT uma.menu_feature_id) as menu_access_count,
  CASE 
    WHEN COUNT(DISTINCT uper.permission_id) = 42 THEN '✅ 正确'
    ELSE '❌ 错误：应该有 42 个权限'
  END as permission_status,
  CASE 
    WHEN COUNT(DISTINCT uma.menu_feature_id) = 12 THEN '✅ 正确'
    ELSE '❌ 错误：应该有 12 个功能面板'
  END as menu_status
FROM user_profiles up
LEFT JOIN user_permissions uper ON up.id = uper.user_id
LEFT JOIN user_menu_access uma ON up.id = uma.user_id
WHERE up.role = 'admin'
GROUP BY up.id, up.name, up.role;

-- 6. 验证业务员权限（应该有默认权限）
SELECT '=== 6. 验证业务员权限 ===' as test_section;

SELECT 
  up.name,
  up.role,
  COUNT(DISTINCT uper.permission_id) as permission_count,
  COUNT(DISTINCT uma.menu_feature_id) as menu_access_count,
  CASE 
    WHEN COUNT(DISTINCT uper.permission_id) >= 7 THEN '✅ 正确'
    ELSE '❌ 错误：应该至少有 7 个权限'
  END as permission_status,
  CASE 
    WHEN COUNT(DISTINCT uma.menu_feature_id) >= 6 THEN '✅ 正确'
    ELSE '❌ 错误：应该至少有 6 个功能面板'
  END as menu_status
FROM user_profiles up
LEFT JOIN user_permissions uper ON up.id = uper.user_id
LEFT JOIN user_menu_access uma ON up.id = uma.user_id
WHERE up.role = 'salesperson'
GROUP BY up.id, up.name, up.role
LIMIT 5;

-- 7. 验证专家权限（应该有默认权限）
SELECT '=== 7. 验证专家权限 ===' as test_section;

SELECT 
  up.name,
  up.role,
  COUNT(DISTINCT uper.permission_id) as permission_count,
  COUNT(DISTINCT uma.menu_feature_id) as menu_access_count,
  CASE 
    WHEN COUNT(DISTINCT uper.permission_id) >= 4 THEN '✅ 正确'
    ELSE '❌ 错误：应该至少有 4 个权限'
  END as permission_status,
  CASE 
    WHEN COUNT(DISTINCT uma.menu_feature_id) >= 5 THEN '✅ 正确'
    ELSE '❌ 错误：应该至少有 5 个功能面板'
  END as menu_status
FROM user_profiles up
LEFT JOIN user_permissions uper ON up.id = uper.user_id
LEFT JOIN user_menu_access uma ON up.id = uma.user_id
WHERE up.role = 'expert'
GROUP BY up.id, up.name, up.role
LIMIT 5;

-- 8. 验证 RLS 策略
SELECT '=== 8. 验证 RLS 策略 ===' as test_section;

SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN cmd = 'SELECT' THEN '查询'
    WHEN cmd = 'INSERT' THEN '插入'
    WHEN cmd = 'UPDATE' THEN '更新'
    WHEN cmd = 'DELETE' THEN '删除'
    WHEN cmd = '*' THEN '所有操作'
    ELSE cmd
  END as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('menu_features', 'user_menu_access')
ORDER BY tablename, policyname;

-- 9. 检查是否有用户没有权限
SELECT '=== 9. 检查是否有用户没有权限 ===' as test_section;

SELECT 
  up.name,
  up.role,
  up.status,
  COALESCE(perm_count.count, 0) as permission_count,
  COALESCE(menu_count.count, 0) as menu_access_count,
  CASE 
    WHEN COALESCE(perm_count.count, 0) = 0 THEN '⚠️ 警告：没有权限'
    ELSE '✅ 正常'
  END as status
FROM user_profiles up
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM user_permissions
  GROUP BY user_id
) perm_count ON up.id = perm_count.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as count
  FROM user_menu_access
  WHERE enabled = true
  GROUP BY user_id
) menu_count ON up.id = menu_count.user_id
WHERE COALESCE(perm_count.count, 0) = 0
   OR COALESCE(menu_count.count, 0) = 0;

-- 10. 总结
SELECT '=== 10. 测试总结 ===' as test_section;

SELECT 
  '功能面板总数' as item,
  COUNT(*)::text as value,
  '应该是 12' as expected
FROM menu_features
UNION ALL
SELECT 
  '权限总数' as item,
  COUNT(*)::text as value,
  '应该是 42' as expected
FROM permissions
UNION ALL
SELECT 
  '用户总数' as item,
  COUNT(*)::text as value,
  '-' as expected
FROM user_profiles
UNION ALL
SELECT 
  '已分配权限记录数' as item,
  COUNT(*)::text as value,
  '应该 > 0' as expected
FROM user_permissions
UNION ALL
SELECT 
  '已分配功能面板记录数' as item,
  COUNT(*)::text as value,
  '应该 > 0' as expected
FROM user_menu_access;

-- ============================================
-- 测试完成
-- ============================================
-- 如果所有测试都显示 ✅，说明权限管理系统安装成功！
-- 如果有 ❌ 或 ⚠️，请检查相应的问题
-- ============================================
