# 创建专家账号指南

由于 Supabase 的安全限制，无法通过 SQL 直接创建认证用户。需要通过以下两种方式之一创建专家账号：

## 方式一：使用 Supabase Dashboard（推荐）

### 步骤：

1. **登录 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择项目：training-management

2. **进入 Authentication 页面**
   - 左侧菜单点击 "Authentication"
   - 点击 "Users" 标签

3. **为每个专家创建账号**
   点击 "Add user" 按钮，依次创建以下账号：

#### 专家 1：张教授
- Email: `zhangprof@qq.com`
- Password: `expert123456`
- Auto Confirm User: ✅ 勾选

#### 专家 2：李博士
- Email: `lidr@qq.com`
- Password: `expert123456`
- Auto Confirm User: ✅ 勾选

#### 专家 3：李学士
- Email: `lixueshi@qq.com`
- Password: `expert123456`
- Auto Confirm User: ✅ 勾选

#### 专家 4：王老师
- Email: `wangteacher@qq.com`
- Password: `expert123456`
- Auto Confirm User: ✅ 勾选

#### 专家 5：刘专家
- Email: `liuexpert@qq.com`
- Password: `expert123456`
- Auto Confirm User: ✅ 勾选

#### 专家 6：陈导师
- Email: `chentutor@qq.com`
- Password: `expert123456`
- Auto Confirm User: ✅ 勾选

4. **创建用户资料并关联专家**

创建完认证用户后，在 SQL Editor 中执行以下 SQL：

```sql
-- 获取刚创建的用户 ID
SELECT id, email FROM auth.users WHERE email LIKE '%@qq.com' ORDER BY created_at DESC;

-- 然后为每个用户创建 user_profiles 和更新 experts 表
-- 注意：需要替换 'USER_ID_HERE' 为实际的用户 ID

-- 1. 张教授
DO $$
DECLARE
  user_id_var uuid := 'USER_ID_HERE'; -- 替换为实际 ID
BEGIN
  INSERT INTO user_profiles (id, username, role, name, email, phone, status)
  VALUES (user_id_var, 'zhangprof', 'expert', '张教授', 'zhangprof@qq.com', '13800138001', 'enabled');
  
  UPDATE experts SET user_id = user_id_var, email = 'zhangprof@qq.com', phone = '13800138001' WHERE id = 1;
END $$;

-- 2. 李博士
DO $$
DECLARE
  user_id_var uuid := 'USER_ID_HERE'; -- 替换为实际 ID
BEGIN
  INSERT INTO user_profiles (id, username, role, name, email, phone, status)
  VALUES (user_id_var, 'lidr', 'expert', '李博士', 'lidr@qq.com', '13800138002', 'enabled');
  
  UPDATE experts SET user_id = user_id_var, email = 'lidr@qq.com', phone = '13800138002' WHERE id = 12;
END $$;

-- 3. 李学士
DO $$
DECLARE
  user_id_var uuid := 'USER_ID_HERE'; -- 替换为实际 ID
BEGIN
  INSERT INTO user_profiles (id, username, role, name, email, phone, status)
  VALUES (user_id_var, 'lixueshi', 'expert', '李学士', 'lixueshi@qq.com', '13800138003', 'enabled');
  
  UPDATE experts SET user_id = user_id_var, email = 'lixueshi@qq.com', phone = '13800138003' WHERE id = 2;
END $$;

-- 4. 王老师
DO $$
DECLARE
  user_id_var uuid := 'USER_ID_HERE'; -- 替换为实际 ID
BEGIN
  INSERT INTO user_profiles (id, username, role, name, email, phone, status)
  VALUES (user_id_var, 'wangteacher', 'expert', '王老师', 'wangteacher@qq.com', '13800138004', 'enabled');
  
  UPDATE experts SET user_id = user_id_var, email = 'wangteacher@qq.com', phone = '13800138004' WHERE id = 3;
END $$;

-- 5. 刘专家
DO $$
DECLARE
  user_id_var uuid := 'USER_ID_HERE'; -- 替换为实际 ID
BEGIN
  INSERT INTO user_profiles (id, username, role, name, email, phone, status)
  VALUES (user_id_var, 'liuexpert', 'expert', '刘专家', 'liuexpert@qq.com', '13800138005', 'enabled');
  
  UPDATE experts SET user_id = user_id_var, email = 'liuexpert@qq.com', phone = '13800138005' WHERE id = 4;
END $$;

-- 6. 陈导师
DO $$
DECLARE
  user_id_var uuid := 'USER_ID_HERE'; -- 替换为实际 ID
BEGIN
  INSERT INTO user_profiles (id, username, role, name, email, phone, status)
  VALUES (user_id_var, 'chentutor', 'expert', '陈导师', 'chentutor@qq.com', '13800138006', 'enabled');
  
  UPDATE experts SET user_id = user_id_var, email = 'chentutor@qq.com', phone = '13800138006' WHERE id = 5;
END $$;
```

5. **验证创建结果**

```sql
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
```

## 方式二：使用注册页面

如果你的系统有注册功能，可以让每个专家自己注册：

1. 访问注册页面
2. 填写邮箱和密码
3. 管理员在后台将用户角色改为 'expert'
4. 关联到 experts 表

## 登录信息汇总

创建完成后，专家可以使用以下信息登录：

| 专家姓名 | 邮箱 | 密码 | 手机号 | 领域 |
|---------|------|------|--------|------|
| 张教授 | zhangprof@qq.com | expert123456 | 13800138001 | 前端开发 |
| 李博士 | lidr@qq.com | expert123456 | 13800138002 | 后端架构 |
| 李学士 | lixueshi@qq.com | expert123456 | 13800138003 | 后端架构 |
| 王老师 | wangteacher@qq.com | expert123456 | 13800138004 | 项目管理 |
| 刘专家 | liuexpert@qq.com | expert123456 | 13800138005 | 数据分析 |
| 陈导师 | chentutor@qq.com | expert123456 | 13800138006 | DevOps |

## 注意事项

1. ⚠️ 密码 `expert123456` 仅用于测试，生产环境应使用更强的密码
2. ✅ 创建后建议专家首次登录时修改密码
3. ✅ 确保勾选 "Auto Confirm User" 以跳过邮箱验证
4. ✅ 手机号可以根据实际情况修改
