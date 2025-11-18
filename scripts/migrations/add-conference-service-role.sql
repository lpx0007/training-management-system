-- 添加会务客服角色
-- 创建日期: 2025-11-15
-- 说明: 添加 conference_service 角色到系统中

-- 1. 添加会务客服角色到 user_profiles 表的 role 字段检查约束（如果需要）
-- 注意: Supabase 的 user_profiles 表可能没有严格的 CHECK 约束，这取决于表设计
-- 如果有 role 字段的 CHECK 约束，需要修改它以包含 'conference_service'

-- 2. 为会务客服角色添加默认权限
-- 会务客服默认只有查看培训计划的权限

-- 创建触发器函数，为新注册的会务客服用户自动分配默认权限和菜单访问
CREATE OR REPLACE FUNCTION auto_assign_conference_service_permissions()
RETURNS TRIGGER AS $$
DECLARE
  perm_id INTEGER;
BEGIN
  -- 只处理会务客服角色
  IF NEW.role = 'conference_service' THEN
    
    -- 分配默认权限: training_view
    -- 先查找 training_view 权限的 ID
    SELECT id INTO perm_id
    FROM permissions
    WHERE code = 'training_view';
    
    IF perm_id IS NOT NULL THEN
      -- 插入权限（如果不存在）
      INSERT INTO user_permissions (user_id, permission_id)
      VALUES (NEW.id, perm_id)
      ON CONFLICT (user_id, permission_id) DO NOTHING;
    END IF;
    
    -- 分配默认菜单访问
    -- dashboard
    INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
    SELECT NEW.id, id, true
    FROM menu_features
    WHERE code = 'dashboard'
    ON CONFLICT (user_id, menu_feature_id) DO UPDATE SET enabled = true;
    
    -- training_management
    INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
    SELECT NEW.id, id, true
    FROM menu_features
    WHERE code = 'training_management'
    ON CONFLICT (user_id, menu_feature_id) DO UPDATE SET enabled = true;
    
    -- profile_settings
    INSERT INTO user_menu_access (user_id, menu_feature_id, enabled)
    SELECT NEW.id, id, true
    FROM menu_features
    WHERE code = 'profile_settings'
    ON CONFLICT (user_id, menu_feature_id) DO UPDATE SET enabled = true;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 如果触发器已存在，先删除
DROP TRIGGER IF EXISTS auto_assign_permissions_for_conference_service ON user_profiles;

-- 创建触发器
CREATE TRIGGER auto_assign_permissions_for_conference_service
AFTER INSERT ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION auto_assign_conference_service_permissions();

-- 同时更新现有的触发器，确保包含会务客服角色
-- 如果已有 auto_assign_default_permissions 触发器，需要更新它以支持 conference_service

-- 注意事项：
-- 1. 会务客服用户初始注册时应该以 'salesperson' 角色注册
-- 2. 管理员在员工管理页面将职位改为"会务客服"时，自动变更为 'conference_service' 角色
-- 3. 角色变更时，前端会自动调用权限更新函数，重新分配权限和菜单访问
-- 4. 会务客服只能查看培训计划，没有其他管理权限

-- 验证查询（可选）
-- 查看会务客服用户
-- SELECT id, username, name, role, position FROM user_profiles WHERE role = 'conference_service';

-- 查看会务客服用户的权限
-- SELECT up.name, p.name as permission_name
-- FROM user_profiles up
-- JOIN user_permissions uper ON up.id = uper.user_id
-- JOIN permissions p ON uper.permission_id = p.id
-- WHERE up.role = 'conference_service';

-- 查看会务客服用户的菜单访问
-- SELECT up.name, mf.name as menu_name, uma.enabled
-- FROM user_profiles up
-- JOIN user_menu_access uma ON up.id = uma.user_id
-- JOIN menu_features mf ON uma.menu_feature_id = mf.id
-- WHERE up.role = 'conference_service';
