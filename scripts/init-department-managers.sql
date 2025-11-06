-- ============================================
-- 初始化部门经理数据
-- ============================================
-- 功能: 创建部门、部门经理账号并分配业务员
-- 日期: 2025-11-06
-- ============================================

-- ============================================
-- PART 1: 执行基础表结构（来自upgrade-manager-role.sql）
-- ============================================

-- 创建部门表
CREATE TABLE IF NOT EXISTS public.departments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code VARCHAR(50) UNIQUE,
  manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  parent_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  level INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 部门表索引
CREATE INDEX IF NOT EXISTS idx_departments_manager ON public.departments(manager_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON public.departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_departments_status ON public.departments(status);

-- 创建团队成员关系表
CREATE TABLE IF NOT EXISTS public.team_members (
  id SERIAL PRIMARY KEY,
  manager_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  CONSTRAINT unique_manager_member UNIQUE(manager_id, member_id)
);

-- 团队成员表索引
CREATE INDEX IF NOT EXISTS idx_team_members_manager ON public.team_members(manager_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON public.team_members(member_id);
CREATE INDEX IF NOT EXISTS idx_team_members_dept ON public.team_members(department_id);

-- 在user_profiles表中添加department_id字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'department_id'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_user_profiles_department ON public.user_profiles(department_id);
  END IF;
END $$;

-- ============================================
-- PART 2: 创建manager角色（如果不存在）
-- ============================================

-- 添加manager角色到role枚举（如果需要）
DO $$
BEGIN
  -- 检查role枚举类型是否包含manager
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'manager' 
    AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'role'
    )
  ) THEN
    -- 重建role枚举类型，包含manager
    ALTER TYPE role RENAME TO role_old;
    CREATE TYPE role AS ENUM ('admin', 'salesperson', 'expert', 'manager');
    
    -- 更新现有数据
    ALTER TABLE user_profiles ALTER COLUMN role TYPE role USING role::text::role;
    
    -- 删除旧类型
    DROP TYPE role_old;
  END IF;
END $$;

-- ============================================
-- PART 3: 创建三个部门
-- ============================================

-- 插入三个销售部门
INSERT INTO public.departments (name, code, level, status)
VALUES 
  ('销售一部', 'SALES_DEPT_1', 1, 'active'),
  ('销售二部', 'SALES_DEPT_2', 1, 'active'),
  ('销售三部', 'SALES_DEPT_3', 1, 'active')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PART 4: 创建三个部门经理测试账号
-- ============================================

DO $$
DECLARE
  v_dept1_id INTEGER;
  v_dept2_id INTEGER;
  v_dept3_id INTEGER;
  v_manager1_id UUID;
  v_manager2_id UUID;
  v_manager3_id UUID;
BEGIN
  -- 获取部门ID
  SELECT id INTO v_dept1_id FROM departments WHERE code = 'SALES_DEPT_1';
  SELECT id INTO v_dept2_id FROM departments WHERE code = 'SALES_DEPT_2';
  SELECT id INTO v_dept3_id FROM departments WHERE code = 'SALES_DEPT_3';
  
  -- 创建部门经理1 - 张经理
  INSERT INTO auth.users (id, email, email_confirmed_at, encrypted_password, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'manager1@qq.com',
    NOW(),
    crypt('Manager123!', gen_salt('bf')),
    '{"provider":"email","providers":["email"]}',
    '{"name":"张经理"}'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_manager1_id;
  
  IF v_manager1_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (id, name, email, phone, role, department_id)
    VALUES (
      v_manager1_id,
      '张经理',
      'manager1@qq.com',
      '13800138001',
      'manager',
      v_dept1_id
    );
    
    -- 更新部门的manager_id
    UPDATE departments SET manager_id = v_manager1_id WHERE id = v_dept1_id;
  ELSE
    -- 如果用户已存在，获取其ID并更新
    SELECT id INTO v_manager1_id FROM auth.users WHERE email = 'manager1@qq.com';
    UPDATE public.user_profiles SET role = 'manager', department_id = v_dept1_id WHERE id = v_manager1_id;
    UPDATE departments SET manager_id = v_manager1_id WHERE id = v_dept1_id;
  END IF;
  
  -- 创建部门经理2 - 李经理
  INSERT INTO auth.users (id, email, email_confirmed_at, encrypted_password, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'manager2@qq.com',
    NOW(),
    crypt('Manager123!', gen_salt('bf')),
    '{"provider":"email","providers":["email"]}',
    '{"name":"李经理"}'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_manager2_id;
  
  IF v_manager2_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (id, name, email, phone, role, department_id)
    VALUES (
      v_manager2_id,
      '李经理',
      'manager2@qq.com',
      '13800138002',
      'manager',
      v_dept2_id
    );
    
    UPDATE departments SET manager_id = v_manager2_id WHERE id = v_dept2_id;
  ELSE
    SELECT id INTO v_manager2_id FROM auth.users WHERE email = 'manager2@qq.com';
    UPDATE public.user_profiles SET role = 'manager', department_id = v_dept2_id WHERE id = v_manager2_id;
    UPDATE departments SET manager_id = v_manager2_id WHERE id = v_dept2_id;
  END IF;
  
  -- 创建部门经理3 - 王经理
  INSERT INTO auth.users (id, email, email_confirmed_at, encrypted_password, raw_app_meta_data, raw_user_meta_data)
  VALUES (
    gen_random_uuid(),
    'manager3@qq.com',
    NOW(),
    crypt('Manager123!', gen_salt('bf')),
    '{"provider":"email","providers":["email"]}',
    '{"name":"王经理"}'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_manager3_id;
  
  IF v_manager3_id IS NOT NULL THEN
    INSERT INTO public.user_profiles (id, name, email, phone, role, department_id)
    VALUES (
      v_manager3_id,
      '王经理',
      'manager3@qq.com',
      '13800138003',
      'manager',
      v_dept3_id
    );
    
    UPDATE departments SET manager_id = v_manager3_id WHERE id = v_dept3_id;
  ELSE
    SELECT id INTO v_manager3_id FROM auth.users WHERE email = 'manager3@qq.com';
    UPDATE public.user_profiles SET role = 'manager', department_id = v_dept3_id WHERE id = v_manager3_id;
    UPDATE departments SET manager_id = v_manager3_id WHERE id = v_dept3_id;
  END IF;
  
  -- 输出创建结果
  RAISE NOTICE '✅ 部门经理创建完成:';
  RAISE NOTICE '  销售一部 - 张经理: manager1@qq.com';
  RAISE NOTICE '  销售二部 - 李经理: manager2@qq.com';
  RAISE NOTICE '  销售三部 - 王经理: manager3@qq.com';
  RAISE NOTICE '  默认密码: Manager123!';
END $$;

-- ============================================
-- PART 5: 分配现有业务员到部门
-- ============================================

DO $$
DECLARE
  v_dept1_id INTEGER;
  v_dept2_id INTEGER;
  v_dept3_id INTEGER;
  v_manager1_id UUID;
  v_manager2_id UUID;
  v_manager3_id UUID;
  v_salesperson RECORD;
  v_dept_counter INTEGER := 0;
  v_assigned_dept_id INTEGER;
  v_assigned_manager_id UUID;
BEGIN
  -- 获取部门和经理ID
  SELECT id, manager_id INTO v_dept1_id, v_manager1_id FROM departments WHERE code = 'SALES_DEPT_1';
  SELECT id, manager_id INTO v_dept2_id, v_manager2_id FROM departments WHERE code = 'SALES_DEPT_2';
  SELECT id, manager_id INTO v_dept3_id, v_manager3_id FROM departments WHERE code = 'SALES_DEPT_3';
  
  -- 循环分配业务员
  FOR v_salesperson IN 
    SELECT id, name 
    FROM user_profiles 
    WHERE role = 'salesperson' 
    AND department_id IS NULL
    ORDER BY created_at
  LOOP
    -- 轮流分配到三个部门
    v_dept_counter := v_dept_counter + 1;
    
    IF v_dept_counter % 3 = 1 THEN
      v_assigned_dept_id := v_dept1_id;
      v_assigned_manager_id := v_manager1_id;
    ELSIF v_dept_counter % 3 = 2 THEN
      v_assigned_dept_id := v_dept2_id;
      v_assigned_manager_id := v_manager2_id;
    ELSE
      v_assigned_dept_id := v_dept3_id;
      v_assigned_manager_id := v_manager3_id;
    END IF;
    
    -- 更新业务员的部门
    UPDATE user_profiles 
    SET department_id = v_assigned_dept_id
    WHERE id = v_salesperson.id;
    
    -- 创建团队成员关系
    INSERT INTO team_members (manager_id, member_id, department_id)
    VALUES (v_assigned_manager_id, v_salesperson.id, v_assigned_dept_id)
    ON CONFLICT (manager_id, member_id) DO NOTHING;
    
    RAISE NOTICE '  分配业务员 % 到部门 %', v_salesperson.name, v_assigned_dept_id;
  END LOOP;
  
  RAISE NOTICE '✅ 业务员部门分配完成，共分配 % 人', v_dept_counter;
END $$;

-- ============================================
-- PART 6: 为部门经理分配默认权限
-- ============================================

DO $$
DECLARE
  v_manager_id UUID;
BEGIN
  -- 为所有manager角色分配权限
  FOR v_manager_id IN 
    SELECT id FROM user_profiles WHERE role = 'manager'
  LOOP
    -- 分配功能权限
    INSERT INTO user_permissions (user_id, permission_code)
    VALUES 
      (v_manager_id, 'customer_view'),
      (v_manager_id, 'customer_export'),
      (v_manager_id, 'training_view'),
      (v_manager_id, 'training_export'),
      (v_manager_id, 'salesperson_view'),
      (v_manager_id, 'salesperson_manage'),
      (v_manager_id, 'performance_view'),
      (v_manager_id, 'performance_export'),
      (v_manager_id, 'team_view'),
      (v_manager_id, 'team_manage')
    ON CONFLICT (user_id, permission_code) DO NOTHING;
    
    -- 分配功能面板访问权限
    INSERT INTO user_menu_access (user_id, menu_code)
    VALUES 
      (v_manager_id, 'dashboard'),
      (v_manager_id, 'customer_management'),
      (v_manager_id, 'training_management'),
      (v_manager_id, 'team_management'),
      (v_manager_id, 'performance_statistics'),
      (v_manager_id, 'data_management'),
      (v_manager_id, 'profile_settings')
    ON CONFLICT (user_id, menu_code) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE '✅ 部门经理权限分配完成';
END $$;

-- ============================================
-- PART 7: 在training_sessions表添加manager_id字段
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'training_sessions' 
    AND column_name = 'manager_id'
  ) THEN
    ALTER TABLE public.training_sessions 
    ADD COLUMN manager_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_training_sessions_manager ON public.training_sessions(manager_id);
    
    COMMENT ON COLUMN public.training_sessions.manager_id IS '负责的部门经理ID';
  END IF;
END $$;

-- ============================================
-- PART 8: 创建统计视图（部门经理看到部门数据）
-- ============================================

-- 部门客户视图
CREATE OR REPLACE VIEW department_customers AS
SELECT 
  c.*,
  up.department_id,
  d.name as department_name,
  d.manager_id
FROM customers c
JOIN user_profiles up ON c.salesperson_id = up.id
LEFT JOIN departments d ON up.department_id = d.id;

-- 部门业绩视图
CREATE OR REPLACE VIEW department_performance AS
SELECT 
  tp.training_session_id,
  tp.payment_amount,
  tp.payment_status,
  up.department_id,
  d.name as department_name,
  d.manager_id,
  DATE_TRUNC('month', tp.registration_date) as month
FROM training_participants tp
LEFT JOIN customers c ON tp.customer_id = c.id
LEFT JOIN user_profiles up ON c.salesperson_id = up.id
LEFT JOIN departments d ON up.department_id = d.id
WHERE tp.payment_status = '已支付';

-- ============================================
-- 输出汇总信息
-- ============================================

DO $$
DECLARE
  v_dept_count INTEGER;
  v_manager_count INTEGER;
  v_assigned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_dept_count FROM departments WHERE status = 'active';
  SELECT COUNT(*) INTO v_manager_count FROM user_profiles WHERE role = 'manager';
  SELECT COUNT(*) INTO v_assigned_count FROM user_profiles WHERE role = 'salesperson' AND department_id IS NOT NULL;
  
  RAISE NOTICE '';
  RAISE NOTICE '======================================';
  RAISE NOTICE '🎉 部门经理系统初始化完成！';
  RAISE NOTICE '======================================';
  RAISE NOTICE '📊 初始化统计:';
  RAISE NOTICE '  - 创建部门数: %', v_dept_count;
  RAISE NOTICE '  - 部门经理数: %', v_manager_count;
  RAISE NOTICE '  - 已分配业务员: %', v_assigned_count;
  RAISE NOTICE '';
  RAISE NOTICE '👤 部门经理账号:';
  RAISE NOTICE '  销售一部: manager1@qq.com';
  RAISE NOTICE '  销售二部: manager2@qq.com';
  RAISE NOTICE '  销售三部: manager3@qq.com';
  RAISE NOTICE '  默认密码: Manager123!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ 请立即修改默认密码！';
  RAISE NOTICE '======================================';
END $$;
