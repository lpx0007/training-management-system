-- ============================================
-- Supabase 数据库备份 - 当前完整结构
-- 培训管理系统
-- 生成时间: 2025-01-27
-- ============================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. 用户资料表（扩展 auth.users）
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'salesperson', 'expert')),
  name TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' -- 用户状态: pending(待审核), active(已激活), rejected(已拒绝)
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 user_profiles 添加更新时间触发器
CREATE TRIGGER update_user_profiles_updated_at 
BEFORE UPDATE ON public.user_profiles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. 客户表
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  phone TEXT UNIQUE, -- 添加了唯一约束
  email TEXT,
  company TEXT,
  position TEXT,
  location TEXT,
  status TEXT,
  salesperson_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL ON UPDATE CASCADE,
  salesperson_name TEXT,
  follow_up_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact TIMESTAMPTZ,
  tags TEXT[]
);

-- 客户表索引
CREATE INDEX IF NOT EXISTS idx_customers_salesperson ON public.customers(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

-- ============================================
-- 3. 专家表
-- ============================================
CREATE TABLE IF NOT EXISTS public.experts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id),
  name TEXT NOT NULL,
  avatar TEXT,
  title TEXT,
  field TEXT,
  experience TEXT,
  rating DECIMAL(3, 2),
  courses TEXT[],
  location TEXT,
  available BOOLEAN DEFAULT true,
  bio TEXT,
  past_sessions INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  phone TEXT, -- 新增字段
  email TEXT  -- 新增字段
);

-- 专家表索引
CREATE INDEX IF NOT EXISTS idx_experts_user_id ON public.experts(user_id);
CREATE INDEX IF NOT EXISTS idx_experts_available ON public.experts(available);
CREATE INDEX IF NOT EXISTS idx_experts_phone ON public.experts(phone);
CREATE INDEX IF NOT EXISTS idx_experts_email ON public.experts(email);

-- 专家表唯一索引（部分索引，允许 NULL）
CREATE UNIQUE INDEX IF NOT EXISTS experts_phone_unique_idx 
ON experts (phone) 
WHERE phone IS NOT NULL AND phone != '';

CREATE UNIQUE INDEX IF NOT EXISTS experts_email_unique_idx 
ON experts (email) 
WHERE email IS NOT NULL AND email != '';

-- ============================================
-- 4. 业务员表
-- ============================================
CREATE TABLE IF NOT EXISTS public.salespersons (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id), -- 关联的 auth.users 用户ID
  name TEXT NOT NULL,
  avatar TEXT,
  department TEXT,
  position TEXT,
  phone TEXT UNIQUE, -- 添加了唯一约束
  email TEXT,
  join_date DATE,
  status TEXT, -- 业务员状态: pending(待审核), active(已激活), rejected(已拒绝)
  team TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 业务员表索引
CREATE INDEX IF NOT EXISTS idx_salespersons_user_id ON public.salespersons(user_id);
CREATE INDEX IF NOT EXISTS idx_salespersons_status ON public.salespersons(status);

-- 业务员表唯一索引（部分索引，允许 NULL）
CREATE UNIQUE INDEX IF NOT EXISTS salespersons_email_unique_idx 
ON salespersons (email) 
WHERE email IS NOT NULL AND email != '';

-- ============================================
-- 5. 业务员绩效表
-- ============================================
CREATE TABLE IF NOT EXISTS public.salesperson_performance (
  id SERIAL PRIMARY KEY,
  salesperson_id INTEGER REFERENCES public.salespersons(id) ON DELETE CASCADE,
  revenue DECIMAL(10, 2) DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  customers_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 绩效表索引
CREATE INDEX IF NOT EXISTS idx_performance_salesperson ON public.salesperson_performance(salesperson_id);

-- ============================================
-- 6. 课程表
-- ============================================
CREATE TABLE IF NOT EXISTS public.courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER,
  price DECIMAL(10, 2),
  category TEXT,
  expert_id INTEGER REFERENCES public.experts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 课程表触发器
CREATE TRIGGER update_courses_updated_at 
BEFORE UPDATE ON public.courses 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 课程表索引
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_expert ON public.courses(expert_id);

-- ============================================
-- 7. 培训场次表
-- ============================================
CREATE TABLE IF NOT EXISTS public.training_sessions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL, -- 培训开始日期
  start_time TIME,
  end_time TIME,
  end_date DATE, -- 培训结束日期
  capacity INTEGER DEFAULT 30, -- 培训容纳人数
  participants INTEGER DEFAULT 0,
  expert_id INTEGER REFERENCES public.experts(id) ON DELETE SET NULL ON UPDATE CASCADE,
  expert_name TEXT,
  area TEXT,
  revenue DECIMAL(10, 2),
  status TEXT,
  rating DECIMAL(3, 2),
  salesperson_id INTEGER REFERENCES public.salespersons(id) ON DELETE SET NULL ON UPDATE CASCADE,
  salesperson_name TEXT,
  course_id TEXT REFERENCES public.courses(id),
  course_description TEXT, -- 课程内容描述
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_training_date_range CHECK (end_date >= date)
);

-- 培训场次表索引
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON public.training_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_training_sessions_expert ON public.training_sessions(expert_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_salesperson ON public.training_sessions(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON public.training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_course ON public.training_sessions(course_id);

-- ============================================
-- 8. 培训参与者表
-- ============================================
CREATE TABLE IF NOT EXISTS public.training_participants (
  id SERIAL PRIMARY KEY,
  training_session_id INTEGER REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES public.customers(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  registration_date DATE,
  payment_status TEXT,
  salesperson_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 参与者表索引
CREATE INDEX IF NOT EXISTS idx_participants_training ON public.training_participants(training_session_id);
CREATE INDEX IF NOT EXISTS idx_participants_customer ON public.training_participants(customer_id);

-- ============================================
-- 9. 客户培训历史表
-- ============================================
CREATE TABLE IF NOT EXISTS public.customer_training_history (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES public.customers(id) ON DELETE CASCADE,
  training_session_id INTEGER REFERENCES public.training_sessions(id),
  training_name TEXT,
  date DATE,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 培训历史表索引
CREATE INDEX IF NOT EXISTS idx_history_customer ON public.customer_training_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_history_training ON public.customer_training_history(training_session_id);

-- ============================================
-- 10. 权限表
-- ============================================
CREATE TABLE IF NOT EXISTS public.permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT
);

-- ============================================
-- 11. 用户权限关联表
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_permissions (
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  permission_id TEXT REFERENCES public.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, permission_id)
);

-- 用户权限表索引
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON public.user_permissions(user_id);

-- ============================================
-- 12. 专家反馈表
-- ============================================
CREATE TABLE IF NOT EXISTS public.expert_feedback (
  id SERIAL PRIMARY KEY,
  expert_id INTEGER REFERENCES public.experts(id) ON DELETE CASCADE,
  content TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 反馈表索引
CREATE INDEX IF NOT EXISTS idx_feedback_expert ON public.expert_feedback(expert_id);

-- ============================================
-- 13. 数据管理历史表
-- ============================================
CREATE TABLE IF NOT EXISTS public.data_management_history (
  id SERIAL PRIMARY KEY,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('import', 'export', 'download_template')),
  data_type TEXT NOT NULL CHECK (data_type IN ('courses', 'experts', 'customers', 'salespersons', 'training_sessions')),
  operator_id UUID NOT NULL REFERENCES public.user_profiles(id),
  operator_name TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  record_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  error_details JSONB,
  file_name TEXT,
  file_size INTEGER,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 数据管理历史表索引
CREATE INDEX IF NOT EXISTS idx_data_management_history_operator ON public.data_management_history(operator_id);
CREATE INDEX IF NOT EXISTS idx_data_management_history_timestamp ON public.data_management_history(timestamp DESC);

-- ============================================
-- 14. 审计日志表
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES public.user_profiles(id),
  user_name TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  status TEXT CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 审计日志表索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- ============================================
-- Row Level Security (RLS) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salespersons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salesperson_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_training_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_management_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- User Profiles 策略
-- ============================================

-- 用户可以查看自己的资料
CREATE POLICY "Users can view their own profile" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

-- 管理员可以查看所有资料
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 管理员可以更新所有资料
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- Customers 策略
-- ============================================

-- 管理员可以查看所有客户
CREATE POLICY "Admins can view all customers" ON public.customers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 业务员可以查看自己的客户
CREATE POLICY "Salespersons can view their own customers" ON public.customers
FOR SELECT USING (salesperson_id = auth.uid());

-- 管理员可以插入客户
CREATE POLICY "Admins can insert customers" ON public.customers
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 业务员可以插入自己的客户
CREATE POLICY "Salespersons can insert their own customers" ON public.customers
FOR INSERT WITH CHECK (salesperson_id = auth.uid());

-- 管理员可以更新所有客户
CREATE POLICY "Admins can update all customers" ON public.customers
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 业务员可以更新自己的客户
CREATE POLICY "Salespersons can update their own customers" ON public.customers
FOR UPDATE USING (salesperson_id = auth.uid())
WITH CHECK (salesperson_id = auth.uid());

-- 管理员可以删除客户
CREATE POLICY "Admins can delete customers" ON public.customers
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- Training Sessions 策略
-- ============================================

-- 管理员可以管理所有培训场次
CREATE POLICY "Admins can manage all training sessions" ON public.training_sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 业务员可以查看培训场次
CREATE POLICY "Salespersons can view training sessions" ON public.training_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'salesperson'
  )
);

-- 专家可以查看自己的培训场次
CREATE POLICY "Experts can view their own training sessions" ON public.training_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.experts
    WHERE user_id = auth.uid() AND id = expert_id
  )
);

-- ============================================
-- Courses 策略
-- ============================================

-- 所有人可以查看课程
CREATE POLICY "Anyone authenticated can view courses" ON public.courses
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 管理员可以管理课程
CREATE POLICY "Admins can manage courses" ON public.courses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- Experts 策略
-- ============================================

-- 所有人可以查看专家
CREATE POLICY "Anyone authenticated can view experts" ON public.experts
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 管理员可以管理专家
CREATE POLICY "Admins can manage experts" ON public.experts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 专家可以更新自己的信息
CREATE POLICY "Experts can update their own info" ON public.experts
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- Salespersons 策略
-- ============================================

-- 所有人可以查看业务员
CREATE POLICY "Anyone authenticated can view salespersons" ON public.salespersons
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 管理员可以管理业务员
CREATE POLICY "Admins can manage salespersons" ON public.salespersons
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- Permissions 策略
-- ============================================

-- 所有人可以查看权限列表
CREATE POLICY "Anyone authenticated can view permissions" ON public.permissions
FOR SELECT USING (auth.uid() IS NOT NULL);

-- 管理员可以管理权限
CREATE POLICY "Admins can manage permissions" ON public.permissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- User Permissions 策略
-- ============================================

-- 用户可以查看自己的权限
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
FOR SELECT USING (user_id = auth.uid());

-- 管理员可以查看所有权限
CREATE POLICY "Admins can view all user permissions" ON public.user_permissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 管理员可以管理用户权限
CREATE POLICY "Admins can manage user permissions" ON public.user_permissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- 其他表的基本策略
-- ============================================

-- Training Participants
CREATE POLICY "Admins can manage training participants" ON public.training_participants
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view training participants" ON public.training_participants
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Customer Training History
CREATE POLICY "Admins can manage customer training history" ON public.customer_training_history
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view customer training history" ON public.customer_training_history
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Salesperson Performance
CREATE POLICY "Admins can manage salesperson performance" ON public.salesperson_performance
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Users can view salesperson performance" ON public.salesperson_performance
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Expert Feedback
CREATE POLICY "Anyone can view expert feedback" ON public.expert_feedback
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage expert feedback" ON public.expert_feedback
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Data Management History
CREATE POLICY "Admins can view data management history" ON public.data_management_history
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert data management history" ON public.data_management_history
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Audit Logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "System can insert audit logs" ON public.audit_logs
FOR INSERT WITH CHECK (true);

-- ============================================
-- 插入默认权限数据
-- ============================================

INSERT INTO public.permissions (id, name, description, category)
VALUES 
  ('customer_view', '查看客户', '查看客户信息', '客户管理'),
  ('customer_edit', '编辑客户', '编辑客户信息', '客户管理'),
  ('customer_add', '添加客户', '添加新客户', '客户管理'),
  ('training_view', '查看培训', '查看培训计划和详情', '培训管理'),
  ('training_edit', '编辑培训', '编辑培训计划', '培训管理'),
  ('training_add', '添加培训', '添加新培训计划', '培训管理'),
  ('training_add_customer', '添加培训客户', '向培训中添加客户', '培训管理'),
  ('expert_view', '查看专家', '查看专家信息', '专家管理'),
  ('expert_edit', '编辑专家', '编辑专家信息', '专家管理'),
  ('expert_add', '添加专家', '添加新专家', '专家管理'),
  ('salesperson_view', '查看业务员', '查看业务员信息', '人员管理'),
  ('salesperson_edit', '编辑业务员', '编辑业务员信息', '人员管理'),
  ('salesperson_add', '添加业务员', '添加新业务员', '人员管理'),
  ('permission_manage', '管理权限', '管理用户权限', '系统管理'),
  ('course_manage', '管理课程', '管理培训课程', '系统管理'),
  ('data_export', '数据导出', '导出系统数据', '系统管理'),
  ('expert_profile_edit', '编辑专家资料', '编辑自己的专家资料', '个人管理')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 完成提示
-- ============================================

-- 显示创建的表
SELECT schemaname, tablename, tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 显示创建的索引数量
SELECT schemaname, COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY schemaname;

-- 显示 RLS 状态
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
