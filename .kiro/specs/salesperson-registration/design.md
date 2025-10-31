# 业务员注册功能设计文档

## Overview

本文档描述业务员自助注册功能的技术设计，包括前端页面、后端逻辑、数据库结构和安全考虑。

## Architecture

### 系统架构图

```
┌─────────────┐
│  登录页面    │
│  (Login)    │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌─────────────┐
│  注册页面    │  │  登录流程    │
│ (Register)  │  │             │
└──────┬──────┘  └──────┬──────┘
       │                │
       ▼                ▼
┌─────────────────────────┐
│   Supabase Auth         │
│   - signUp()            │
│   - signIn()            │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│   Database Trigger      │
│   handle_new_user()     │
└──────┬──────────────────┘
       │
       ├──────────┬──────────┐
       ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│user_     │ │salespersons│ │审核流程  │
│profiles  │ │           │ │         │
└──────────┘ └──────────┘ └──────────┘
```

## Components and Interfaces

### 1. 注册页面组件 (Register.tsx)

**职责：**
- 显示注册表单
- 验证用户输入
- 调用注册 API
- 处理注册结果

**接口：**
```typescript
interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  department?: string;
}

interface RegisterPageProps {
  // 无需 props，独立页面
}
```

**状态管理：**
```typescript
const [formData, setFormData] = useState<RegisterFormData>({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  department: ''
});
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
```

### 2. 登录页面更新 (Login.tsx)

**修改内容：**
- 添加"注册账号"链接
- 保持现有登录逻辑不变
- 添加状态检查逻辑

**关键代码：**
```typescript
// 登录后检查用户状态
const checkUserStatus = async (userId: string) => {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('status')
    .eq('id', userId)
    .single();
    
  if (profile?.status === 'pending') {
    throw new Error('账号审核中，请等待管理员审核');
  }
  if (profile?.status === 'rejected') {
    throw new Error('账号审核未通过，请联系管理员');
  }
};
```

### 3. 业务员管理页面更新 (SalesPersonManagement.tsx)

**新增功能：**
- 添加"待审核"筛选选项
- 显示待审核业务员列表
- 添加审核按钮（通过/拒绝）

**接口：**
```typescript
interface PendingSalesperson extends Salesperson {
  status: 'pending' | 'active' | 'rejected';
  registeredAt: string;
}

const approveSalesperson = async (id: number) => {
  await supabase
    .from('salespersons')
    .update({ status: 'active' })
    .eq('id', id);
    
  await supabase
    .from('user_profiles')
    .update({ status: 'active' })
    .eq('id', salesperson.user_id);
};
```

### 4. Supabase Service 扩展

**新增方法：**
```typescript
class SupabaseService {
  // 注册业务员
  async registerSalesperson(data: RegisterFormData): Promise<void> {
    // 1. 创建 Auth 用户
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          phone: data.phone,
          department: data.department
        }
      }
    });
    
    if (authError) throw authError;
    
    // 2. 创建 salespersons 记录（user_profiles 由 trigger 自动创建）
    const { error: spError } = await supabase
      .from('salespersons')
      .insert({
        user_id: authData.user!.id,
        name: data.name,
        phone: data.phone,
        department: data.department || '销售一部',
        position: '销售顾问',
        status: 'pending',
        join_date: new Date().toISOString().split('T')[0]
      });
      
    if (spError) throw spError;
  }
  
  // 审核业务员
  async approveSalesperson(salespersonId: number, userId: string): Promise<void> {
    // 更新两个表的状态
    await Promise.all([
      supabase.from('salespersons').update({ status: 'active' }).eq('id', salespersonId),
      supabase.from('user_profiles').update({ status: 'active' }).eq('id', userId)
    ]);
  }
  
  // 拒绝业务员
  async rejectSalesperson(salespersonId: number, userId: string): Promise<void> {
    await Promise.all([
      supabase.from('salespersons').update({ status: 'rejected' }).eq('id', salespersonId),
      supabase.from('user_profiles').update({ status: 'rejected' }).eq('id', userId)
    ]);
  }
}
```

## Data Models

### user_profiles 表更新

```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 可能的状态值：'pending', 'active', 'rejected'
```

### salespersons 表更新

```sql
ALTER TABLE salespersons 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 为现有记录设置默认值
UPDATE salespersons SET status = 'active' WHERE status IS NULL;
```

### 数据库触发器

```sql
-- 创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 插入 user_profiles 记录
  INSERT INTO public.user_profiles (
    id,
    username,
    name,
    role,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'salesperson',
    'pending'  -- 新注册用户默认待审核
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户创建
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Error Handling

### 注册错误处理

```typescript
try {
  await registerSalesperson(formData);
  toast.success('注册成功！请等待管理员审核');
  navigate('/login');
} catch (error: any) {
  if (error.message.includes('already registered')) {
    setErrors({ email: '该邮箱已被注册' });
  } else if (error.message.includes('invalid email')) {
    setErrors({ email: '邮箱格式不正确' });
  } else if (error.message.includes('weak password')) {
    setErrors({ password: '密码强度不足，至少需要6个字符' });
  } else {
    toast.error('注册失败：' + error.message);
  }
}
```

### 登录错误处理（关键：避免卡住）

```typescript
try {
  // 1. 先进行 Supabase Auth 登录
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (authError) throw authError;
  
  // 2. 检查用户状态（使用 timeout 避免卡住）
  const statusCheck = Promise.race([
    checkUserStatus(authData.user.id),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('状态检查超时')), 5000)
    )
  ]);
  
  await statusCheck;
  
  // 3. 状态正常，继续登录流程
  // ...
  
} catch (error: any) {
  // 如果是状态问题，登出用户
  if (error.message.includes('审核')) {
    await supabase.auth.signOut();
  }
  toast.error(error.message);
}
```

## Testing Strategy

### 单元测试

1. **注册表单验证测试**
   - 测试必填字段验证
   - 测试邮箱格式验证
   - 测试密码强度验证
   - 测试密码确认匹配

2. **注册 API 测试**
   - 测试成功注册流程
   - 测试重复邮箱注册
   - 测试无效数据注册

3. **审核功能测试**
   - 测试通过审核
   - 测试拒绝审核
   - 测试批量审核

### 集成测试

1. **完整注册流程测试**
   - 用户注册 → 创建记录 → 触发器执行 → 状态检查

2. **登录限制测试**
   - 待审核用户登录被拒绝
   - 已拒绝用户登录被拒绝
   - 已通过用户正常登录

3. **审核流程测试**
   - 管理员查看待审核列表
   - 管理员审核通过
   - 用户可以正常登录

### 安全测试

1. **SQL 注入测试**
2. **XSS 攻击测试**
3. **权限绕过测试**
4. **并发注册测试**

## Security Considerations

### 1. 密码安全
- 使用 Supabase Auth 的密码加密
- 最小密码长度：6个字符
- 建议使用强密码（包含大小写字母、数字、特殊字符）

### 2. 邮箱验证
- Supabase 可选配置邮箱验证
- 防止恶意注册

### 3. 权限控制
- RLS 策略确保用户只能访问自己的数据
- 管理员权限检查

### 4. 防止暴力注册
- 添加注册频率限制（可选）
- 添加验证码（可选）

## Performance Considerations

### 1. 数据库索引
```sql
-- 为 status 字段添加索引，加速筛选
CREATE INDEX IF NOT EXISTS idx_salespersons_status ON salespersons(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
```

### 2. 查询优化
- 待审核列表使用分页
- 缓存部门列表等静态数据

### 3. 触发器性能
- 触发器使用 SECURITY DEFINER 避免权限问题
- 错误处理不阻塞用户创建

## Deployment Notes

### 数据库迁移步骤

1. 添加 status 字段
2. 创建触发器函数
3. 创建触发器
4. 添加索引
5. 更新现有数据

### 回滚计划

如果出现问题：
1. 删除触发器
2. 删除触发器函数
3. 恢复原有登录逻辑
4. 回滚数据库更改

### 监控指标

- 注册成功率
- 审核通过率
- 登录失败率（按原因分类）
- 触发器执行时间
