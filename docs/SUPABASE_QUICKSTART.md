# Supabase 迁移 - 快速开始指南

## 🚀 立即开始

按照以下步骤，你可以在 **30 分钟内**完成 Supabase 项目的基础设置。

---

## Step 1: 创建 Supabase 项目（5 分钟）

### 1.1 注册/登录 Supabase

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 使用 GitHub 账号登录（推荐）或邮箱注册

### 1.2 创建新项目

1. 点击 "New Project"
2. 填写项目信息：
   - **Organization**: 选择或创建组织
   - **Name**: `training-management`（培训管理系统）
   - **Database Password**: 设置一个强密码（**务必保存！**）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或最近的区域
   - **Pricing Plan**: 选择 `Free` 免费计划

3. 点击 "Create new project"
4. 等待 1-2 分钟，项目初始化完成

### 1.3 获取项目凭证

项目创建完成后：

1. 进入项目控制台
2. 点击左侧菜单 **Settings** → **API**
3. 找到并复制以下信息：

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ 重要：保存这些信息，稍后会用到！**

---

## Step 2: 配置数据库（10 分钟）

### 2.1 打开 SQL Editor

1. 在 Supabase 控制台左侧菜单
2. 点击 **SQL Editor**
3. 点击 **New query**

### 2.2 执行数据库脚本

1. 打开项目根目录的 `supabase-setup.sql` 文件
2. 复制**全部内容**
3. 粘贴到 SQL Editor 中
4. 点击右下角 **Run** 按钮
5. 等待执行完成（约 10-20 秒）

### 2.3 验证数据库

执行完成后，你应该看到：

```
✓ 12 个表已创建
✓ 索引已创建
✓ RLS 策略已启用
✓ 默认权限数据已插入
```

在左侧菜单点击 **Table Editor**，你应该能看到所有创建的表：
- user_profiles
- customers
- experts
- salespersons
- training_sessions
- courses
- permissions
- 等等...

---

## Step 3: 创建测试用户（5 分钟）

### 3.1 创建管理员账户

1. 在 Supabase 控制台左侧菜单
2. 点击 **Authentication** → **Users**
3. 点击 **Add user** → **Create new user**
4. 填写信息：
   - **Email**: `admin@example.com`
   - **Password**: `admin123456`（测试用，生产环境请使用强密码）
   - **Auto Confirm User**: ✅ 勾选
5. 点击 **Create user**
6. 复制生成的 **User UID**（类似：`a1b2c3d4-...`）

### 3.2 创建管理员资料

1. 回到 **SQL Editor**
2. 执行以下 SQL（替换 `USER_UID` 为上一步复制的 UID）：

```sql
-- 创建管理员资料
INSERT INTO public.user_profiles (id, username, role, name, department)
VALUES (
  'USER_UID',  -- 替换为实际的 User UID
  'admin',
  'admin',
  '系统管理员',
  '管理部'
);
```

### 3.3 创建业务员账户（可选）

重复上述步骤，创建业务员测试账户：

```sql
-- 1. 在 Authentication 中创建用户
-- Email: sales1@example.com
-- Password: sales123456

-- 2. 创建业务员资料
INSERT INTO public.user_profiles (id, username, role, name, department)
VALUES (
  'SALES_USER_UID',  -- 替换为业务员的 User UID
  'sales1',
  'salesperson',
  '张三',
  '销售部'
);

-- 3. 创建业务员详细信息
INSERT INTO public.salespersons (user_id, name, department, position, phone, email, join_date, status, team)
VALUES (
  'SALES_USER_UID',  -- 替换为业务员的 User UID
  '张三',
  '销售一部',
  '高级销售顾问',
  '138****1234',
  'sales1@example.com',
  '2023-01-15',
  'active',
  '北京团队'
);
```

---

## Step 4: 配置本地环境（5 分钟）

### 4.1 创建环境变量文件

在项目根目录：

```bash
# 复制示例文件
cp .env.example .env.local
```

### 4.2 填写 Supabase 凭证

编辑 `.env.local` 文件，填入 Step 1.3 中获取的凭证：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4.3 验证配置

```bash
# 检查文件是否存在
ls -la .env.local

# 确保 .env.local 在 .gitignore 中
cat .gitignore | grep ".env.local"
```

---

## Step 5: 测试连接（5 分钟）

### 5.1 安装 Supabase 客户端

```bash
pnpm add @supabase/supabase-js
```

### 5.2 创建测试脚本

创建 `test-supabase.js` 文件：

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 测试 Supabase 连接...\n');
  
  // 测试 1: 查询权限表
  console.log('测试 1: 查询权限表');
  const { data: permissions, error: permError } = await supabase
    .from('permissions')
    .select('*')
    .limit(5);
  
  if (permError) {
    console.error('❌ 错误:', permError.message);
  } else {
    console.log('✅ 成功! 找到', permissions.length, '条权限记录');
  }
  
  // 测试 2: 测试认证
  console.log('\n测试 2: 测试用户认证');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@example.com',
    password: 'admin123456'
  });
  
  if (authError) {
    console.error('❌ 认证失败:', authError.message);
  } else {
    console.log('✅ 认证成功!');
    console.log('用户 ID:', authData.user.id);
    console.log('用户邮箱:', authData.user.email);
    
    // 测试 3: 查询用户资料
    console.log('\n测试 3: 查询用户资料');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ 错误:', profileError.message);
    } else {
      console.log('✅ 成功!');
      console.log('用户名:', profile.username);
      console.log('角色:', profile.role);
      console.log('姓名:', profile.name);
    }
    
    // 登出
    await supabase.auth.signOut();
  }
  
  console.log('\n✨ 所有测试完成!');
}

testConnection();
```

### 5.3 运行测试

```bash
node test-supabase.js
```

**预期输出：**
```
🔍 测试 Supabase 连接...

测试 1: 查询权限表
✅ 成功! 找到 5 条权限记录

测试 2: 测试用户认证
✅ 认证成功!
用户 ID: a1b2c3d4-...
用户邮箱: admin@example.com

测试 3: 查询用户资料
✅ 成功!
用户名: admin
角色: admin
姓名: 系统管理员

✨ 所有测试完成!
```

---

## ✅ 完成检查清单

在继续下一步之前，确保：

- [ ] Supabase 项目已创建
- [ ] 数据库表已创建（12 个表）
- [ ] RLS 策略已启用
- [ ] 测试用户已创建（至少管理员）
- [ ] `.env.local` 文件已配置
- [ ] Supabase 连接测试通过

---

## 🎯 下一步

现在你已经完成了 Supabase 的基础设置！

**接下来可以：**

1. **开始代码迁移** - 按照 `.kiro/specs/supabase-migration/tasks.md` 执行
2. **查看详细文档** - 阅读 `.kiro/specs/supabase-migration/` 下的所有文档
3. **开始 Phase 2** - 创建 Supabase 服务层代码

---

## 🆘 常见问题

### Q1: 数据库脚本执行失败

**A:** 检查以下几点：
- 确保复制了完整的 SQL 脚本
- 检查是否有语法错误
- 查看 SQL Editor 底部的错误信息
- 尝试分段执行（先创建表，再创建索引，最后创建 RLS 策略）

### Q2: 无法创建用户

**A:** 
- 确保勾选了 "Auto Confirm User"
- 检查邮箱格式是否正确
- 密码至少 6 位

### Q3: 测试连接失败

**A:**
- 检查 `.env.local` 中的 URL 和 Key 是否正确
- 确保 URL 以 `https://` 开头
- 确保 Key 是完整的（很长的字符串）
- 检查网络连接

### Q4: RLS 策略导致无法查询数据

**A:**
- 确保已登录（有 auth.uid()）
- 检查用户角色是否正确
- 在 Supabase 控制台的 Table Editor 中可以直接查看数据（绕过 RLS）

---

## 📚 相关资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase JavaScript 客户端](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)
- [项目完整文档](.kiro/specs/supabase-migration/README.md)

---

**🎉 恭喜！你已经完成了 Supabase 的基础设置！**

现在可以开始代码迁移了。祝你顺利！
