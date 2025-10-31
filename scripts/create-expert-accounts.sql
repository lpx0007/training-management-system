-- 为现有专家创建登录账号
-- 注意：这个脚本需要在 Supabase Dashboard 的 SQL Editor 中执行
-- 因为需要调用 auth.users 表

-- 1. 张教授 - 前端开发
DO $$
DECLARE
  new_user_id uuid;
BEGIN
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
    recovery_token
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
    ''
  ) RETURNING id INTO new_user_id;

  -- 创建用户资料
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
  );

  -- 更新专家表关联
  UPDATE experts 
  SET user_id = new_user_id,
      email = 'zhangprof@qq.com',
      phone = '13800138001'
  WHERE id = 1;

  RAISE NOTICE '✅ 张教授账号创建成功';
END $$;

-- 2. 李博士 - 后端架构
DO $$
DECLARE
  new_user_id uuid;
BEGIN
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
    recovery_token
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
    ''
  ) RETURNING id INTO new_user_id;

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
  );

  UPDATE experts 
  SET user_id = new_user_id,
      email = 'lidr@qq.com',
      phone = '13800138002'
  WHERE id = 12;

  RAISE NOTICE '✅ 李博士账号创建成功';
END $$;

-- 3. 李学士 - 后端架构
DO $$
DECLARE
  new_user_id uuid;
BEGIN
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
    recovery_token
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
    ''
  ) RETURNING id INTO new_user_id;

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
  );

  UPDATE experts 
  SET user_id = new_user_id,
      email = 'lixueshi@qq.com',
      phone = '13800138003'
  WHERE id = 2;

  RAISE NOTICE '✅ 李学士账号创建成功';
END $$;

-- 4. 王老师 - 项目管理
DO $$
DECLARE
  new_user_id uuid;
BEGIN
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
    recovery_token
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
    ''
  ) RETURNING id INTO new_user_id;

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
  );

  UPDATE experts 
  SET user_id = new_user_id,
      email = 'wangteacher@qq.com',
      phone = '13800138004'
  WHERE id = 3;

  RAISE NOTICE '✅ 王老师账号创建成功';
END $$;

-- 5. 刘专家 - 数据分析
DO $$
DECLARE
  new_user_id uuid;
BEGIN
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
    recovery_token
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
    ''
  ) RETURNING id INTO new_user_id;

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
  );

  UPDATE experts 
  SET user_id = new_user_id,
      email = 'liuexpert@qq.com',
      phone = '13800138005'
  WHERE id = 4;

  RAISE NOTICE '✅ 刘专家账号创建成功';
END $$;

-- 6. 陈导师 - DevOps
DO $$
DECLARE
  new_user_id uuid;
BEGIN
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
    recovery_token
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
    ''
  ) RETURNING id INTO new_user_id;

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
  );

  UPDATE experts 
  SET user_id = new_user_id,
      email = 'chentutor@qq.com',
      phone = '13800138006'
  WHERE id = 5;

  RAISE NOTICE '✅ 陈导师账号创建成功';
END $$;

-- 验证创建结果
SELECT 
  up.name as 用户名,
  up.email as 邮箱,
  up.phone as 手机号,
  up.role as 角色,
  e.title as 职称,
  e.field as 领域
FROM user_profiles up
LEFT JOIN experts e ON e.user_id = up.id
WHERE up.role = 'expert'
ORDER BY up.created_at DESC;
