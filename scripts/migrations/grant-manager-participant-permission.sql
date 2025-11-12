-- 为部门经理添加管理培训参与者权限
-- 部门经理可以管理自己部门业务员的培训参与者

-- 为所有部门经理用户添加 training_manage_participant 权限
INSERT INTO user_permissions (user_id, permission_id)
SELECT 
    up.id,
    'training_manage_participant'
FROM user_profiles up
WHERE up.role = 'manager'
  AND NOT EXISTS (
    SELECT 1 
    FROM user_permissions uperm
    WHERE uperm.user_id = up.id 
    AND uperm.permission_id = 'training_manage_participant'
  );

-- 验证结果
SELECT 
    up.name,
    up.role,
    up.department,
    COUNT(uperm.permission_id) as total_permissions,
    BOOL_OR(uperm.permission_id = 'training_manage_participant') as has_manage_participant
FROM user_profiles up
LEFT JOIN user_permissions uperm ON up.id = uperm.user_id
WHERE up.role = 'manager'
GROUP BY up.id, up.name, up.role, up.department
ORDER BY up.name;

-- 查看部门经理的培训相关权限
SELECT 
    up.name,
    up.department,
    STRING_AGG(uperm.permission_id, ', ' ORDER BY uperm.permission_id) as training_permissions
FROM user_profiles up
LEFT JOIN user_permissions uperm ON up.id = uperm.user_id
WHERE up.role = 'manager'
  AND uperm.permission_id LIKE 'training_%'
GROUP BY up.id, up.name, up.department
ORDER BY up.name;
