-- ============================================
-- 批量创建专家账号（完整版）
-- 包括：认证用户 + 用户资料 + 关联专家表
-- ============================================

-- 1. 张教授 - 前端开发
DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  -- 检查邮箱是否已存在
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'zhangprof@qq.com';
  
  IF existing_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  张教授的邮箱已存在，使用现有账号: %', existing_user_id;
    new_user_id := existing_user_id;
  ELSE
    -- 创建认证用户
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'zhangprof@qq.com',
      crypt('expert123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO new_user_id;
    
    RAISE NOTICE '✅ 创建认证用户成功: %', new_user_id;
  END IF;

  -- 创建或更新用户资料
  INSERT INTO user_profiles (
    id,
    username,
    role,
    name,
    email,
    phone,
    status
  ) VALUES (
    new_user_id,
    'zhangprof',
    'expert',
    '张教授',
    'zhangprof@qq.com',
    '13800138001',
    'enabled'
  ) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

  -- 更新专家表关联（只更新第一个匹配的记录）
  UPDATE experts 
  SET user_id = new_user_id,
      email = 'zhangprof@qq.com',
      phone = '13800138001'
  WHERE id = (
    SELECT id FROM experts 
    WHERE name = '张教授' AND user_id IS NULL 
    LIMIT 1
  );

  RAISE NOTICE '✅ 张教授账号创建完成';
END $$;

-- 2. 李博士 - 后端架构
DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'lidr@qq.com';
  
  IF existing_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  李博士的邮箱已存在，使用现有账号: %', existing_user_id;
    new_user_id := existing_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'lidr@qq.com',
      crypt('expert123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO new_user_id;
    
    RAISE NOTICE '✅ 创建认证用户成功: %', new_user_id;
  END IF;

  INSERT INTO user_profiles (
    id,
    username,
    role,
    name,
    email,
    phone,
    status
  ) VALUES (
    new_user_id,
    'lidr',
    'expert',
    '李博士',
    'lidr@qq.com',
    '13800138002',
    'enabled'
  ) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

  UPDATE experts 
  SET user_id = new_user_id,
      email = 'lidr@qq.com',
      phone = '13800138002'
  WHERE id = (
    SELECT id FROM experts 
    WHERE name = '李博士' AND user_id IS NULL 
    LIMIT 1
  );

  RAISE NOTICE '✅ 李博士账号创建完成';
END $$;

-- 3. 李学士 - 后端架构
DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'lixueshi@qq.com';
  
  IF existing_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  李学士的邮箱已存在，使用现有账号: %', existing_user_id;
    new_user_id := existing_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'lixueshi@qq.com',
      crypt('expert123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO new_user_id;
    
    RAISE NOTICE '✅ 创建认证用户成功: %', new_user_id;
  END IF;

  INSERT INTO user_profiles (
    id,
    username,
    role,
    name,
    email,
    phone,
    status
  ) VALUES (
    new_user_id,
    'lixueshi',
    'expert',
    '李学士',
    'lixueshi@qq.com',
    '13800138003',
    'enabled'
  ) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

  UPDATE experts 
  SET user_id = new_user_id,
      email = 'lixueshi@qq.com',
      phone = '13800138003'
  WHERE id = (
    SELECT id FROM experts 
    WHERE name = '李学士' AND user_id IS NULL 
    LIMIT 1
  );

  RAISE NOTICE '✅ 李学士账号创建完成';
END $$;

-- 4. 王老师 - 项目管理
DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'wangteacher@qq.com';
  
  IF existing_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  王老师的邮箱已存在，使用现有账号: %', existing_user_id;
    new_user_id := existing_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'wangteacher@qq.com',
      crypt('expert123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO new_user_id;
    
    RAISE NOTICE '✅ 创建认证用户成功: %', new_user_id;
  END IF;

  INSERT INTO user_profiles (
    id,
    username,
    role,
    name,
    email,
    phone,
    status
  ) VALUES (
    new_user_id,
    'wangteacher',
    'expert',
    '王老师',
    'wangteacher@qq.com',
    '13800138004',
    'enabled'
  ) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

  UPDATE experts 
  SET user_id = new_user_id,
      email = 'wangteacher@qq.com',
      phone = '13800138004'
  WHERE id = (
    SELECT id FROM experts 
    WHERE name = '王老师' AND user_id IS NULL 
    LIMIT 1
  );

  RAISE NOTICE '✅ 王老师账号创建完成';
END $$;

-- 5. 刘专家 - 数据分析
DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'liuexpert@qq.com';
  
  IF existing_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  刘专家的邮箱已存在，使用现有账号: %', existing_user_id;
    new_user_id := existing_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'liuexpert@qq.com',
      crypt('expert123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO new_user_id;
    
    RAISE NOTICE '✅ 创建认证用户成功: %', new_user_id;
  END IF;

  INSERT INTO user_profiles (
    id,
    username,
    role,
    name,
    email,
    phone,
    status
  ) VALUES (
    new_user_id,
    'liuexpert',
    'expert',
    '刘专家',
    'liuexpert@qq.com',
    '13800138005',
    'enabled'
  ) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

  UPDATE experts 
  SET user_id = new_user_id,
      email = 'liuexpert@qq.com',
      phone = '13800138005'
  WHERE id = (
    SELECT id FROM experts 
    WHERE name = '刘专家' AND user_id IS NULL 
    LIMIT 1
  );

  RAISE NOTICE '✅ 刘专家账号创建完成';
END $$;

-- 6. 陈导师 - DevOps
DO $$
DECLARE
  new_user_id uuid;
  existing_user_id uuid;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'chentutor@qq.com';
  
  IF existing_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  陈导师的邮箱已存在，使用现有账号: %', existing_user_id;
    new_user_id := existing_user_id;
  ELSE
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'chentutor@qq.com',
      crypt('expert123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO new_user_id;
    
    RAISE NOTICE '✅ 创建认证用户成功: %', new_user_id;
  END IF;

  INSERT INTO user_profiles (
    id,
    username,
    role,
    name,
    email,
    phone,
    status
  ) VALUES (
    new_user_id,
    'chentutor',
    'expert',
    '陈导师',
    'chentutor@qq.com',
    '13800138006',
    'enabled'
  ) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

  UPDATE experts 
  SET user_id = new_user_id,
      email = 'chentutor@qq.com',
      phone = '13800138006'
  WHERE id = (
    SELECT id FROM experts 
    WHERE name = '陈导师' AND user_id IS NULL 
    LIMIT 1
  );

  RAISE NOTICE '✅ 陈导师账号创建完成';
END $$;

-- ============================================
-- 验证创建结果
-- ============================================

SELECT 
  '=== 专家账号创建完成 ===' as message;

SELECT 
  up.name as 专家姓名,
  up.email as 邮箱,
  up.phone as 手机号,
  up.role as 角色,
  e.title as 职称,
  e.field as 领域,
  CASE 
    WHEN e.user_id IS NOT NULL THEN '✅ 已关联'
    ELSE '❌ 未关联'
  END as 关联状态
FROM user_profiles up
LEFT JOIN experts e ON e.user_id = up.id
WHERE up.role = 'expert'
ORDER BY up.created_at DESC;

SELECT 
  '=== 登录信息 ===' as message;

SELECT 
  name as 姓名,
  email as 邮箱,
  '密码: expert123456' as 密码
FROM user_profiles
WHERE role = 'expert'
ORDER BY created_at DESC;
