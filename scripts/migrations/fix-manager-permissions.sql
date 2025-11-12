-- 修复部门经理权限问题
-- 1. 允许部门经理查看招商简章
-- 2. 添加部门经理的客户删除权限

-- ============================
-- 1. 添加部门经理查看招商简章的 RLS 策略
-- ============================

-- 创建策略：部门经理可以查看所有招商简章
CREATE POLICY "Managers can view all prospectuses" ON prospectuses
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'manager'
        )
    );

-- ============================
-- 2. 为所有部门经理添加客户删除权限
-- ============================

-- 首先确保 customer_delete 权限存在
INSERT INTO permissions (id, name, description, category)
VALUES ('customer_delete', '删除客户', '删除客户记录', '客户管理')
ON CONFLICT (id) DO NOTHING;

-- 为所有部门经理添加 customer_delete 权限
INSERT INTO user_permissions (user_id, permission_id)
SELECT 
    up.id as user_id,
    'customer_delete' as permission_id
FROM user_profiles up
WHERE up.role = 'manager'
    AND NOT EXISTS (
        SELECT 1 FROM user_permissions ump
        WHERE ump.user_id = up.id
        AND ump.permission_id = 'customer_delete'
    );

-- ============================
-- 3. 更新部门经理的默认权限模板（供后续新用户使用）
-- ============================

-- 添加到部门经理默认权限列表的注释说明
COMMENT ON TABLE user_permissions IS 
'用户权限表。部门经理默认权限包括：
- 客户管理：customer_view, customer_view_all, customer_add, customer_edit, customer_delete, customer_export
- 培训管理：training_view, training_view_stats, training_export
- 业务员管理：salesperson_view, salesperson_add, salesperson_edit, salesperson_view_performance
- 招商简章：prospectus_view, prospectus_download
- 数据管理：performance_export, data_view_history';

-- ============================
-- 4. 验证修复结果
-- ============================

-- 查看部门经理的权限数量
SELECT 
    up.name,
    up.role,
    COUNT(DISTINCT ump.permission_id) as permission_count,
    string_agg(ump.permission_id, ', ' ORDER BY ump.permission_id) as permissions
FROM user_profiles up
LEFT JOIN user_permissions ump ON up.id = ump.user_id
WHERE up.role = 'manager'
GROUP BY up.id, up.name, up.role;

-- 查看招商简章的 RLS 策略
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies
WHERE tablename = 'prospectuses'
ORDER BY policyname;
