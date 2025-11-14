-- 修复管理员权限问题
-- 确保管理员拥有所有权限，特别是缺失的两个权限

-- 查询当前管理员用户
DO $$
DECLARE
    admin_user_id UUID;
    missing_permissions TEXT[] := ARRAY[
        'training_add_participant',
        'training_export_participants'
    ];
    perm TEXT;
BEGIN
    -- 查找管理员用户
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'lpx.007@qq.com' AND raw_user_meta_data->>'role' = 'admin'
    LIMIT 1;
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE '未找到管理员用户 lpx.007@qq.com';
        RETURN;
    END IF;
    
    RAISE NOTICE '找到管理员用户: %', admin_user_id;
    
    -- 检查并添加缺失的权限
    FOREACH perm IN ARRAY missing_permissions
    LOOP
        -- 检查权限是否已存在
        IF NOT EXISTS (
            SELECT 1 FROM user_permissions 
            WHERE user_id = admin_user_id AND permission_id = perm
        ) THEN
            -- 添加缺失的权限
            INSERT INTO user_permissions (user_id, permission_id, granted_at, granted_by)
            VALUES (admin_user_id, perm, NOW(), admin_user_id);
            
            RAISE NOTICE '已添加权限: %', perm;
        ELSE
            RAISE NOTICE '权限已存在: %', perm;
        END IF;
    END LOOP;
    
    -- 验证管理员权限总数
    DECLARE
        perm_count INTEGER;
    BEGIN
        SELECT COUNT(*) INTO perm_count 
        FROM user_permissions 
        WHERE user_id = admin_user_id;
        
        RAISE NOTICE '管理员当前权限总数: %', perm_count;
        
        -- 如果权限数不足51个，说明还有其他缺失
        IF perm_count < 51 THEN
            RAISE NOTICE '警告：管理员权限数量不足51个，可能还有其他权限缺失';
        END IF;
    END;
    
END $$;

-- 查询验证结果
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as role,
    COUNT(up.permission_id) as permission_count
FROM auth.users u
LEFT JOIN user_permissions up ON u.id = up.user_id
WHERE u.email = 'lpx.007@qq.com'
GROUP BY u.id, u.email, u.raw_user_meta_data->>'role';

-- 显示管理员缺失的权限（如果有）
WITH all_permissions AS (
    SELECT unnest(ARRAY[
        'customer_view', 'customer_view_all', 'customer_add', 'customer_edit', 'customer_delete',
        'training_view', 'training_add', 'training_edit', 'training_delete', 
        'training_add_participant', 'training_manage_participant', 'training_view_stats', 'training_export_participants',
        'expert_view', 'expert_add', 'expert_edit', 'expert_delete', 'expert_view_feedback', 'expert_profile_edit',
        'salesperson_view', 'salesperson_add', 'salesperson_edit', 'salesperson_delete', 
        'salesperson_view_performance', 'performance_view_all_departments',
        'prospectus_view', 'prospectus_upload', 'prospectus_edit', 'prospectus_delete', 
        'prospectus_download', 'prospectus_manage_category',
        'poster_generate', 'poster_view_history', 'poster_config_template',
        'customer_import', 'customer_export', 'training_import', 'training_export',
        'expert_import', 'expert_export', 'salesperson_import', 'salesperson_export',
        'prospectus_import', 'prospectus_export', 'performance_export',
        'data_download_template', 'data_view_history',
        'permission_manage', 'audit_log_view', 'system_config', 'user_account_manage'
    ]) AS permission_id
),
admin_user AS (
    SELECT id as user_id 
    FROM auth.users 
    WHERE email = 'lpx.007@qq.com' AND raw_user_meta_data->>'role' = 'admin'
    LIMIT 1
)
SELECT 
    ap.permission_id,
    'MISSING' as status
FROM all_permissions ap
CROSS JOIN admin_user au
WHERE NOT EXISTS (
    SELECT 1 FROM user_permissions up 
    WHERE up.user_id = au.user_id AND up.permission_id = ap.permission_id
);
