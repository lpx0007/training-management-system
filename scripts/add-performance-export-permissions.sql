-- ================================================================
-- 添加业绩数据导出和跨部门查看权限
-- 创建日期: 2025-11-07
-- 说明: 为今天新增的功能添加对应的权限
-- ================================================================

-- 1. 添加新权限到 permissions 表
INSERT INTO public.permissions (code, name, description, category, display_order)
VALUES 
  -- 业绩数据导出权限
  ('performance_export', '导出业绩数据', '导出业务员业绩和课程销售业绩数据（含明细）', 'data', 120),
  
  -- 跨部门查看业绩权限
  ('performance_view_all_departments', '查看所有部门业绩', '查看跨部门的业务员业绩数据（经理默认只能看本部门）', 'salesperson', 74)
ON CONFLICT (code) DO NOTHING;

-- 2. 为所有管理员自动分配新权限
INSERT INTO public.user_permissions (user_id, permission_id)
SELECT 
  up.id,
  p.id
FROM 
  public.user_profiles up
  CROSS JOIN public.permissions p
WHERE 
  up.role = 'admin'
  AND p.code IN ('performance_export', 'performance_view_all_departments')
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_permissions uper 
    WHERE uper.user_id = up.id AND uper.permission_id = p.id
  );

-- 3. 为所有部门经理分配业绩导出权限（默认不分配跨部门查看权限）
INSERT INTO public.user_permissions (user_id, permission_id)
SELECT 
  up.id,
  p.id
FROM 
  public.user_profiles up
  CROSS JOIN public.permissions p
WHERE 
  up.role = 'manager'
  AND p.code = 'performance_export' -- 只分配导出权限，不分配跨部门查看权限
  AND NOT EXISTS (
    SELECT 1 
    FROM public.user_permissions uper 
    WHERE uper.user_id = up.id AND uper.permission_id = p.id
  );

-- 4. 验证权限是否添加成功
SELECT 
  code,
  name,
  description,
  category,
  display_order
FROM 
  public.permissions
WHERE 
  code IN ('performance_export', 'performance_view_all_departments')
ORDER BY 
  category, display_order;

-- 5. 查看权限分配情况统计
SELECT 
  p.code AS permission_code,
  p.name AS permission_name,
  up.role,
  COUNT(DISTINCT up.id) AS user_count
FROM 
  public.permissions p
  LEFT JOIN public.user_permissions uper ON p.id = uper.permission_id
  LEFT JOIN public.user_profiles up ON uper.user_id = up.id
WHERE 
  p.code IN ('performance_export', 'performance_view_all_departments')
GROUP BY 
  p.code, p.name, up.role
ORDER BY 
  p.code, up.role;

-- ================================================================
-- 说明：
-- 1. performance_export: 
--    - 允许导出业务员业绩和课程销售业绩数据（包含明细工作表）
--    - 默认分配给：admin, manager
--    - 在数据管理页面使用
--
-- 2. performance_view_all_departments:
--    - 允许经理查看所有部门的业绩数据（不限于本部门）
--    - 默认分配给：admin
--    - 默认不分配给：manager（需要管理员手动授权）
--    - 在销售追踪页面和数据导出时使用
--
-- 权限控制逻辑：
-- - 管理员 (admin): 拥有所有权限，可以查看和导出所有数据
-- - 部门经理 (manager): 
--   * 默认：只能查看和导出本部门的业绩数据
--   * 如果被授予 performance_view_all_departments 权限：可以查看所有部门数据
-- - 业务员 (salesperson): 无业绩导出权限
-- - 专家 (expert): 无业绩导出权限
-- ================================================================
