# 培训管理系统 - 完整项目文档

> 本文档提供项目的完整技术说明，可用于团队协作、项目迭代或作为开发其他类似项目的参考指南

---

## 📋 目录

1. [项目概述](#项目概述)
2. [技术栈](#技术栈)
3. [框架结构](#框架结构)
4. [数据处理](#数据处理)
5. [UI 设计规范](#ui-设计规范)
6. [功能模块](#功能模块)
7. [部署指南](#部署指南)
8. [开发指南](#开发指南)
9. [最佳实践](#最佳实践)
10. [故障排查](#故障排查)

---

## 项目概述

### 项目简介

培训管理系统是一个现代化的企业级 SaaS 应用，用于管理培训流程、客户信息、业务员绩效和专家资源。

### 核心特性

- ✅ **多角色权限管理**：管理员、业务员、专家三种角色
- ✅ **实时数据同步**：基于 Supabase 的实时数据库
- ✅ **响应式设计**：完美支持桌面端和移动端
- ✅ **数据导出**：支持 Excel 和 PDF 格式
- ✅ **通知系统**：实时通知和公告管理
- ✅ **数据可视化**：丰富的图表和统计分析

### 技术亮点

- 🚀 **现代化技术栈**：React 18 + TypeScript + Vite
- 🎨 **优雅的 UI**：Tailwind CSS + Framer Motion
- 🔐 **安全可靠**：Supabase Auth + RLS 策略
- 📱 **移动端优化**：响应式布局 + 触摸优化
- ⚡ **高性能**：代码分割 + 懒加载

---


## 技术栈

### 前端技术

#### 核心框架
```json
{
  "react": "^18.3.1",           // UI 框架
  "react-dom": "^18.3.1",       // DOM 渲染
  "react-router-dom": "^7.3.0", // 路由管理
  "typescript": "~5.7.2"        // 类型系统
}
```

#### 构建工具
```json
{
  "vite": "^6.2.0",                    // 构建工具
  "@vitejs/plugin-react": "^4.3.4",   // React 插件
  "vite-tsconfig-paths": "^5.1.4"     // 路径别名
}
```

#### UI 框架
```json
{
  "tailwindcss": "^3.4.17",      // CSS 框架
  "framer-motion": "^12.9.2",    // 动画库
  "lucide-react": "^0.344.0",    // 图标库
  "sonner": "^2.0.2"             // Toast 通知
}
```

#### 数据可视化
```json
{
  "recharts": "^2.15.1"          // 图表库
}
```

#### 数据处理
```json
{
  "xlsx": "^0.18.5",             // Excel 处理
  "xlsx-js-style": "^1.2.0",     // Excel 样式
  "papaparse": "^5.5.3",         // CSV 解析
  "jspdf": "^3.0.3",             // PDF 生成
  "jspdf-autotable": "^5.0.2",   // PDF 表格
  "file-saver": "^2.0.5"         // 文件下载
}
```

#### 后端服务
```json
{
  "@supabase/supabase-js": "^2.76.1"  // Supabase 客户端
}
```

#### 工具库
```json
{
  "date-fns": "^4.1.0",          // 日期处理
  "clsx": "^2.1.1",              // 类名合并
  "tailwind-merge": "^3.0.2",    // Tailwind 合并
  "zod": "^3.24.2"               // 数据验证
}
```

### 移动端支持

#### 响应式断点
```css
/* Tailwind 默认断点 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
2xl: 1536px /* 2K 屏幕 */
```

#### 移动端优化
- ✅ 触摸友好的按钮尺寸（最小 44x44px）
- ✅ 侧边栏滑动抽屉
- ✅ 透明遮罩层点击关闭
- ✅ 响应式表格（横向滚动）
- ✅ 移动端导航优化
- ✅ 触摸手势支持

### 浏览器兼容性

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ iOS Safari 14+
- ✅ Android Chrome 90+

---


## 框架结构

### 目录结构

```
training-management-system/
├── src/
│   ├── components/              # 可复用组件
│   │   ├── Announcements/       # 公告相关组件
│   │   ├── DataManagement/      # 数据管理组件
│   │   ├── Notifications/       # 通知相关组件
│   │   ├── Empty.tsx            # 空状态组件
│   │   └── Sidebar.tsx          # 侧边栏组件
│   │
│   ├── contexts/                # React Context
│   │   └── authContext.ts       # 认证上下文
│   │
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── useTheme.ts          # 主题切换
│   │   ├── useNotifications.ts  # 通知管理
│   │   └── useAnnouncements.ts  # 公告管理
│   │
│   ├── lib/                     # 工具库和服务
│   │   ├── supabase/            # Supabase 集成
│   │   │   ├── client.ts        # 客户端配置
│   │   │   ├── supabaseService.ts  # 服务层
│   │   │   ├── errorHandler.ts  # 错误处理
│   │   │   ├── types.ts         # 类型定义
│   │   │   └── index.ts         # 导出
│   │   │
│   │   ├── services/            # 业务服务
│   │   │   ├── salesTrackingService.ts
│   │   │   ├── notificationService.ts
│   │   │   ├── announcementService.ts
│   │   │   ├── dataManagementService.ts
│   │   │   └── accountCreationService.ts
│   │   │
│   │   ├── exporters/           # 数据导出
│   │   │   ├── fileExporter.ts
│   │   │   └── attendanceSheetExporter.ts
│   │   │
│   │   ├── parsers/             # 文件解析
│   │   │   └── fileParser.ts
│   │   │
│   │   ├── generators/          # 模板生成
│   │   │   └── templateGenerator.ts
│   │   │
│   │   ├── validators/          # 数据验证
│   │   │   └── dataValidator.ts
│   │   │
│   │   └── utils.ts             # 工具函数
│   │
│   ├── pages/                   # 页面组件
│   │   ├── Login.tsx            # 登录页
│   │   ├── Register.tsx         # 注册页
│   │   ├── Dashboard.tsx        # 仪表盘
│   │   ├── CustomerManagement.tsx
│   │   ├── TrainingPerformance.tsx
│   │   ├── SalesTracking.tsx
│   │   ├── ExpertManagement.tsx
│   │   ├── SalesPersonManagement.tsx
│   │   ├── DataManagement.tsx
│   │   ├── AnnouncementManagement.tsx
│   │   ├── NotificationCenter.tsx
│   │   ├── ProfileSettings.tsx
│   │   └── PermissionManagement.tsx
│   │
│   ├── types/                   # TypeScript 类型
│   │   ├── announcement.ts
│   │   ├── notification.ts
│   │   └── dataManagement.ts
│   │
│   ├── constants/               # 常量定义
│   │   └── dataManagement.ts
│   │
│   ├── App.tsx                  # 应用入口
│   ├── main.tsx                 # 渲染入口
│   ├── index.css                # 全局样式
│   └── vite-env.d.ts            # Vite 类型
│
├── public/                      # 静态资源
├── .kiro/                       # Kiro IDE 配置
├── database-backup/             # 数据库备份工具
├── scripts/                     # 脚本文件
│
├── index.html                   # HTML 入口
├── package.json                 # 依赖配置
├── pnpm-lock.yaml              # 锁定文件
├── vite.config.ts              # Vite 配置
├── tsconfig.json               # TS 配置
├── tailwind.config.js          # Tailwind 配置
├── postcss.config.js           # PostCSS 配置
├── netlify.toml                # Netlify 配置
├── .gitignore                  # Git 忽略
├── .env.example                # 环境变量示例
└── README.md                   # 项目说明
```

### 架构设计

#### 分层架构

```
┌─────────────────────────────────────┐
│         Presentation Layer          │
│    (Pages, Components, Hooks)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Business Logic Layer        │
│      (Services, Contexts)           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Data Access Layer           │
│    (Supabase Service, Types)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Database Layer              │
│         (Supabase)                  │
└─────────────────────────────────────┘
```

#### 数据流

```
User Action → Component → Service → Supabase → Database
                ↓                        ↓
            State Update ← Response ← Query Result
```

---


## 数据处理

### Supabase 配置

#### 环境变量

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**获取方式**：
1. 登录 Supabase 控制台
2. 进入项目设置：Project Settings → API
3. 复制 `Project URL` 和 `anon` `public` key

#### 客户端初始化

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'sb-training-auth',
    flowType: 'pkce',
  },
});
```

### 数据库结构

#### 核心表

```sql
-- 用户资料表
user_profiles (
  id UUID PRIMARY KEY,
  username TEXT,
  role TEXT,  -- 'admin' | 'salesperson' | 'expert'
  name TEXT,
  email TEXT,
  phone TEXT,
  department TEXT,
  status TEXT,  -- 'enabled' | 'disabled'
  work_status TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- 客户表
customers (
  id SERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  position TEXT,
  location TEXT,
  status TEXT,
  salesperson_id UUID,
  salesperson_name TEXT,
  follow_up_status TEXT,
  last_contact DATE,
  tags TEXT[],
  created_at TIMESTAMP
)

-- 培训场次表
training_sessions (
  id SERIAL PRIMARY KEY,
  name TEXT,
  date DATE,
  start_time TIME,
  end_time TIME,
  capacity INTEGER,
  participants INTEGER,
  expert_id INTEGER,
  expert_name TEXT,
  area TEXT,
  revenue DECIMAL,
  status TEXT,
  salesperson_id UUID,
  salesperson_name TEXT,
  course_id UUID,
  created_at TIMESTAMP
)

-- 培训参与者表
training_participants (
  id SERIAL PRIMARY KEY,
  training_session_id INTEGER,
  customer_id INTEGER,
  name TEXT,
  phone TEXT,
  email TEXT,
  registration_date DATE,
  payment_status TEXT,
  salesperson_name TEXT,
  created_at TIMESTAMP
)

-- 专家表
experts (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  name TEXT,
  title TEXT,
  field TEXT,
  experience TEXT,
  rating DECIMAL,
  courses TEXT[],
  location TEXT,
  available BOOLEAN,
  bio TEXT,
  past_sessions INTEGER,
  total_participants INTEGER,
  phone TEXT,
  created_at TIMESTAMP
)

-- 课程表
courses (
  id UUID PRIMARY KEY,
  name TEXT,
  description TEXT,
  duration INTEGER,
  price DECIMAL,
  category TEXT,
  expert_id INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- 权限表
permissions (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  category TEXT
)

-- 用户权限关联表
user_permissions (
  user_id UUID,
  permission_id TEXT,
  PRIMARY KEY (user_id, permission_id)
)

-- 通知表
notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID,
  type TEXT,
  title TEXT,
  message TEXT,
  read BOOLEAN,
  created_at TIMESTAMP
)

-- 公告表
announcements (
  id SERIAL PRIMARY KEY,
  title TEXT,
  content TEXT,
  type TEXT,
  priority TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID,
  created_at TIMESTAMP
)
```

### RLS 策略

#### 行级安全（Row Level Security）

```sql
-- 客户表 RLS
-- 管理员可以看所有客户
CREATE POLICY "admin_all_customers" ON customers
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'admin'
    )
  );

-- 业务员只能看自己的客户
CREATE POLICY "salesperson_own_customers" ON customers
  FOR ALL USING (
    salesperson_id = auth.uid()
  );

-- 培训场次 RLS
-- 管理员可以看所有培训
CREATE POLICY "admin_all_sessions" ON training_sessions
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE role = 'admin'
    )
  );

-- 业务员可以看所有培训（但只能修改自己的）
CREATE POLICY "salesperson_view_sessions" ON training_sessions
  FOR SELECT USING (true);

CREATE POLICY "salesperson_modify_own_sessions" ON training_sessions
  FOR INSERT, UPDATE, DELETE USING (
    salesperson_id = auth.uid()
  );
```

### 数据服务层

#### 服务封装

```typescript
// src/lib/supabase/supabaseService.ts
class SupabaseService {
  // 认证
  async signIn(emailOrPhone: string, password: string) { }
  async signOut() { }
  async getCurrentUser() { }
  
  // 客户管理
  async getCustomers() { }
  async addCustomer(customer) { }
  async updateCustomer(id, updates) { }
  async deleteCustomer(id) { }
  
  // 培训管理
  async getTrainingSessions() { }
  async addTrainingSession(session) { }
  async updateTrainingSession(id, updates) { }
  
  // 业务员管理
  async getSalespersons() { }
  async addSalesperson(salesperson) { }
  async updateSalesperson(id, updates) { }
  
  // 专家管理
  async getExperts() { }
  async addExpert(expert) { }
  
  // 权限管理
  async getPermissions() { }
  async getUserPermissions(userId) { }
  async updateUserPermissions(userId, permissionIds) { }
}
```

---


## UI 设计规范

> 详细的 UI 设计规范请参考 `UI_DESIGN_GUIDE.md`

### 设计原则

1. **一致性**：所有页面使用统一的设计语言
2. **响应式**：完美适配桌面端和移动端
3. **可访问性**：符合 WCAG 2.1 AA 标准
4. **性能优先**：优化加载速度和交互体验
5. **暗色模式**：全面支持暗色主题

### 核心组件

- **Sidebar**：侧边导航栏，支持权限控制
- **Empty**：空状态组件
- **NotificationBell**：通知铃铛
- **AnnouncementBanner**：公告横幅
- **FileUpload**：文件上传组件

---

## 功能模块

### 1. 认证系统

#### 登录功能
- 支持邮箱登录
- 支持手机号登录
- 密码加密存储
- Session 持久化
- 自动刷新 Token

#### 注册功能
- 业务员自助注册
- 邮箱和手机号验证
- 默认密码：123456
- 等待管理员审核

#### 权限控制
- 基于角色的访问控制（RBAC）
- 行级安全策略（RLS）
- 动态权限检查
- 路由守卫

### 2. 客户管理

#### 功能列表
- 客户列表查询（支持分页）
- 客户详情查看
- 客户添加/编辑/删除
- 客户搜索和筛选
- 客户标签管理
- 跟进状态追踪

#### 权限规则
- 管理员：查看所有客户
- 业务员：只能查看自己的客户

### 3. 培训管理

#### 培训场次
- 场次创建和编辑
- 专家分配
- 容量管理
- 状态追踪
- 收入统计

#### 参与者管理
- 添加参与者
- 报名状态管理
- 支付状态追踪
- 考勤记录

### 4. 销售追踪

#### 数据统计
- 销售额统计
- 成交客户数
- 转化率分析
- 业务员排名

#### 数据可视化
- 月度销售趋势图
- 部门销售分布图
- 转化率分布图
- 业绩排行榜

### 5. 数据管理

#### 数据导出
- Excel 导出（支持样式）
- PDF 导出（支持表格）
- CSV 导出
- 批量导出

#### 数据导入
- Excel 导入
- CSV 导入
- 数据验证
- 错误提示

#### 模板管理
- 模板下载
- 模板生成
- 自定义模板

### 6. 通知系统

#### 通知类型
- 系统通知
- 场景通知（培训提醒、审核通知等）
- 实时推送

#### 通知管理
- 通知列表
- 已读/未读状态
- 通知删除
- 通知历史

### 7. 公告系统

#### 公告管理
- 公告发布
- 公告编辑
- 公告删除
- 优先级设置

#### 公告展示
- 公告横幅
- 公告列表
- 公告详情
- 时间范围控制

---


## 部署指南

### 本地开发

#### 环境要求
- Node.js 18+
- pnpm 8+
- Git

#### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/lpx0007/training-management-system.git
cd training-management-system

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 Supabase 凭证

# 4. 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

### Supabase 配置

#### 1. 创建项目
1. 访问 https://supabase.com
2. 创建新项目
3. 记录项目 URL 和 Anon Key

#### 2. 执行数据库脚本
1. 打开 Supabase SQL Editor
2. 复制 `supabase-setup.sql` 内容
3. 执行脚本

#### 3. 配置环境变量
```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Netlify 部署

#### 方式 1：通过 GitHub 自动部署（推荐）

1. **推送代码到 GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **连接 Netlify**
- 登录 https://app.netlify.com
- 点击 "Add new site" → "Import an existing project"
- 选择 GitHub 并授权
- 选择仓库

3. **配置构建设置**
```
Build command: pnpm build
Publish directory: dist/static
```

4. **配置环境变量**
- Site settings → Environment variables
- 添加：
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

5. **部署**
- 点击 "Deploy site"
- 等待构建完成（约 2-3 分钟）

#### 方式 2：通过 Netlify CLI

```bash
# 1. 安装 CLI
npm install -g netlify-cli

# 2. 登录
netlify login

# 3. 初始化
netlify init

# 4. 配置环境变量
netlify env:set VITE_SUPABASE_URL "your-url"
netlify env:set VITE_SUPABASE_ANON_KEY "your-key"

# 5. 部署
netlify deploy --prod
```

### 构建优化

#### Vite 配置

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'ui': ['framer-motion', 'lucide-react', 'sonner'],
          'charts': ['recharts'],
          'excel-libs': ['xlsx', 'papaparse', 'file-saver'],
          'pdf-libs': ['jspdf', 'jspdf-autotable']
        }
      }
    }
  }
});
```

#### Netlify 配置

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "dist/static"
  
[build.environment]
  NODE_VERSION = "18"
  PNPM_VERSION = "8"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 性能优化

#### 1. 代码分割
- 路由懒加载
- 组件懒加载
- 第三方库分离

#### 2. 资源优化
- 图片压缩
- 字体优化
- CSS 压缩

#### 3. 缓存策略
- 静态资源长期缓存
- HTML 文件不缓存
- API 响应缓存

---


## 开发指南

### 开发流程

#### 1. 创建新功能

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发功能
# 3. 测试功能
# 4. 提交代码
git add .
git commit -m "feat: 添加新功能"

# 5. 推送到远程
git push origin feature/new-feature

# 6. 创建 Pull Request
# 7. 代码审查
# 8. 合并到 main
```

#### 2. 修复 Bug

```bash
# 1. 创建修复分支
git checkout -b fix/bug-description

# 2. 修复问题
# 3. 测试验证
# 4. 提交并推送
git add .
git commit -m "fix: 修复某某问题"
git push origin fix/bug-description
```

### 代码规范

#### 命名规范

```typescript
// 组件：PascalCase
export default function CustomerManagement() { }

// 函数：camelCase
function handleSubmit() { }

// 常量：UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';

// 类型：PascalCase
interface UserProfile { }
type UserRole = 'admin' | 'salesperson';

// 文件名：
// - 组件：PascalCase.tsx
// - 工具：camelCase.ts
// - 类型：camelCase.ts
```

#### TypeScript 规范

```typescript
// 1. 始终定义类型
interface Props {
  name: string;
  age?: number;
}

// 2. 使用类型推断
const count = 0; // 自动推断为 number

// 3. 避免使用 any
// ❌ 错误
const data: any = fetchData();

// ✅ 正确
const data: UserProfile = fetchData();

// 4. 使用联合类型
type Status = 'pending' | 'approved' | 'rejected';

// 5. 使用泛型
function getData<T>(id: string): Promise<T> { }
```

#### React 规范

```typescript
// 1. 使用函数组件
export default function MyComponent() { }

// 2. Props 解构
function MyComponent({ name, age }: Props) { }

// 3. 使用 Hooks
const [state, setState] = useState<Type>(initialValue);
const value = useContext(MyContext);
const memoizedValue = useMemo(() => compute(), [deps]);

// 4. 条件渲染
{isLoading ? <Loading /> : <Content />}
{items.length > 0 && <List items={items} />}

// 5. 列表渲染
{items.map(item => (
  <Item key={item.id} data={item} />
))}
```

### 状态管理

#### Context API

```typescript
// 1. 创建 Context
const MyContext = createContext<ContextType | undefined>(undefined);

// 2. 创建 Provider
export function MyProvider({ children }: Props) {
  const [state, setState] = useState<State>(initialState);
  
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
}

// 3. 使用 Context
const { state, setState } = useContext(MyContext);
```

#### 本地状态

```typescript
// 1. 简单状态
const [count, setCount] = useState(0);

// 2. 对象状态
const [user, setUser] = useState<User | null>(null);

// 3. 数组状态
const [items, setItems] = useState<Item[]>([]);

// 4. 更新状态
setCount(prev => prev + 1);
setUser({ ...user, name: 'New Name' });
setItems(prev => [...prev, newItem]);
```

### 错误处理

#### Try-Catch 模式

```typescript
async function fetchData() {
  try {
    const data = await supabaseService.getData();
    return data;
  } catch (error) {
    console.error('获取数据失败:', error);
    toast.error('操作失败，请重试');
    return null;
  }
}
```

#### 错误边界

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---


## 最佳实践

### 性能优化

#### 1. 代码分割

```typescript
// 路由懒加载
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CustomerManagement = lazy(() => import('./pages/CustomerManagement'));

// 使用
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

#### 2. 组件优化

```typescript
// 使用 memo 避免不必要的重渲染
const MemoizedComponent = memo(function Component({ data }: Props) {
  return <div>{data}</div>;
});

// 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

#### 3. 数据加载优化

```typescript
// 批量加载
const [data1, data2, data3] = await Promise.all([
  fetchData1(),
  fetchData2(),
  fetchData3()
]);

// 分页加载
const loadMore = async () => {
  const newData = await fetchData(page + 1);
  setData(prev => [...prev, ...newData]);
  setPage(prev => prev + 1);
};
```

### 安全实践

#### 1. 环境变量保护

```typescript
// ✅ 正确：使用 VITE_ 前缀
const apiUrl = import.meta.env.VITE_API_URL;

// ❌ 错误：直接暴露敏感信息
const apiKey = 'sk-1234567890';
```

#### 2. XSS 防护

```typescript
// ✅ 正确：React 自动转义
<div>{userInput}</div>

// ❌ 错误：使用 dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

#### 3. CSRF 防护

```typescript
// Supabase 自动处理 CSRF
// 使用 JWT token 进行认证
```

### 代码质量

#### 1. 类型安全

```typescript
// ✅ 正确：完整的类型定义
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> { }

// ❌ 错误：使用 any
function getUser(id: any): any { }
```

#### 2. 错误处理

```typescript
// ✅ 正确：完整的错误处理
try {
  const data = await fetchData();
  return data;
} catch (error) {
  const supabaseError = handleSupabaseError(error);
  logError(supabaseError, 'fetchData');
  throw supabaseError;
}

// ❌ 错误：忽略错误
const data = await fetchData();
```

#### 3. 代码注释

```typescript
/**
 * 获取客户列表
 * @param salespersonId 业务员 ID（可选）
 * @returns 客户列表
 */
async function getCustomers(salespersonId?: string): Promise<Customer[]> {
  // 实现
}
```

---

## 故障排查

### 常见问题

#### 1. 环境变量未定义

**错误**：`VITE_SUPABASE_URL is not defined`

**原因**：
- 环境变量未配置
- 环境变量名称错误
- 未重新构建

**解决**：
1. 检查 `.env.local` 文件
2. 确认变量名以 `VITE_` 开头
3. 重启开发服务器

#### 2. Supabase 连接失败

**错误**：`Failed to fetch`

**原因**：
- Supabase URL 错误
- Anon Key 错误
- 网络问题
- Supabase 项目暂停

**解决**：
1. 验证环境变量
2. 检查 Supabase 项目状态
3. 测试网络连接

#### 3. 权限错误

**错误**：`Permission denied` 或 `RLS violation`

**原因**：
- RLS 策略未配置
- 用户角色不正确
- 未登录

**解决**：
1. 检查 RLS 策略
2. 验证用户角色
3. 确认已登录

#### 4. 404 错误

**错误**：`404 Not Found`

**原因**：
- 表名错误
- 路由配置错误
- 资源不存在

**解决**：
1. 检查表名是否正确
2. 验证路由配置
3. 确认资源存在

#### 5. 构建失败

**错误**：`Build failed`

**原因**：
- TypeScript 类型错误
- 依赖缺失
- 配置错误

**解决**：
1. 运行 `pnpm build` 查看详细错误
2. 修复类型错误
3. 安装缺失依赖

### 调试技巧

#### 1. 浏览器控制台

```javascript
// 查看 Supabase 连接状态
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// 查看当前用户
const user = await supabase.auth.getUser();
console.log('Current user:', user);

// 查看数据
const { data, error } = await supabase.from('customers').select('*');
console.log('Data:', data, 'Error:', error);
```

#### 2. React DevTools

- 查看组件树
- 检查 Props 和 State
- 分析性能

#### 3. Network 面板

- 查看 API 请求
- 检查响应状态
- 分析请求时间

---



## 数据库备份

### 备份工具

项目提供了自动化的数据库备份工具，位于 `database-backup/` 目录。

#### 功能特性

- ✅ 自动备份所有表数据
- ✅ 支持增量备份
- ✅ 生成 Markdown 文档
- ✅ 跨平台支持（Windows/Linux/Mac）
- ✅ 定时任务支持

#### 使用方法

```bash
# Windows
.\scripts\backup-database.ps1

# Linux/Mac
./scripts/backup-database.sh

# Node.js
node scripts/backup-database.js
```

#### 备份内容

- 所有表的数据（JSON 格式）
- 表结构说明
- 变更日志
- 快速开始指南

---


## 测试指南

### 测试账号

系统提供了测试账号用于开发和演示：

```javascript
// 管理员账号
{
  email: 'admin@example.com',
  password: '123456',
  role: 'admin'
}

// 业务员账号
{
  email: 'sales1@example.com',
  password: '123456',
  role: 'salesperson'
}

// 专家账号
{
  email: 'expert1@example.com',
  password: '123456',
  role: 'expert'
}
```

### 创建测试数据

```bash
# 运行测试数据脚本
node setup-test-users.js
node scripts/seed-announcements.js
```

### 测试流程

#### 1. 认证测试
- 登录功能
- 注册功能
- 权限验证
- Session 持久化

#### 2. 功能测试
- 客户管理 CRUD
- 培训管理 CRUD
- 数据导入导出
- 通知系统
- 公告系统

#### 3. 权限测试
- 管理员权限
- 业务员权限
- 专家权限
- RLS 策略

#### 4. 响应式测试
- 桌面端布局
- 平板端布局
- 移动端布局
- 触摸交互

---


## API 参考

### Supabase Service API

#### 认证相关

```typescript
// 登录
await supabaseService.signIn(emailOrPhone, password);

// 登出
await supabaseService.signOut();

// 获取当前用户
await supabaseService.getCurrentUser();

// 注册
await supabaseService.signUp(email, password, userData);
```

#### 客户管理

```typescript
// 获取客户列表
await supabaseService.getCustomers();

// 添加客户
await supabaseService.addCustomer(customerData);

// 更新客户
await supabaseService.updateCustomer(id, updates);

// 删除客户
await supabaseService.deleteCustomer(id);

// 搜索客户
await supabaseService.searchCustomers(keyword);
```

#### 培训管理

```typescript
// 获取培训场次
await supabaseService.getTrainingSessions();

// 添加培训场次
await supabaseService.addTrainingSession(sessionData);

// 更新培训场次
await supabaseService.updateTrainingSession(id, updates);

// 删除培训场次
await supabaseService.deleteTrainingSession(id);

// 获取参与者
await supabaseService.getTrainingParticipants(sessionId);

// 添加参与者
await supabaseService.addTrainingParticipant(participantData);
```

#### 业务员管理

```typescript
// 获取业务员列表
await supabaseService.getSalespersons();

// 添加业务员
await supabaseService.addSalesperson(salespersonData);

// 更新业务员
await supabaseService.updateSalesperson(id, updates);

// 删除业务员
await supabaseService.deleteSalesperson(id);
```

#### 专家管理

```typescript
// 获取专家列表
await supabaseService.getExperts();

// 添加专家
await supabaseService.addExpert(expertData);

// 更新专家
await supabaseService.updateExpert(id, updates);

// 删除专家
await supabaseService.deleteExpert(id);
```

#### 权限管理

```typescript
// 获取所有权限
await supabaseService.getPermissions();

// 获取用户权限
await supabaseService.getUserPermissions(userId);

// 更新用户权限
await supabaseService.updateUserPermissions(userId, permissionIds);
```

#### 通知管理

```typescript
// 获取通知列表
await notificationService.getNotifications(userId);

// 标记已读
await notificationService.markAsRead(notificationId);

// 删除通知
await notificationService.deleteNotification(notificationId);

// 创建通知
await notificationService.createNotification(notificationData);
```

#### 公告管理

```typescript
// 获取公告列表
await announcementService.getAnnouncements();

// 获取活动公告
await announcementService.getActiveAnnouncements();

// 创建公告
await announcementService.createAnnouncement(announcementData);

// 更新公告
await announcementService.updateAnnouncement(id, updates);

// 删除公告
await announcementService.deleteAnnouncement(id);
```

---


## 扩展开发

### 添加新页面

#### 1. 创建页面组件

```typescript
// src/pages/NewFeature.tsx
import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { supabaseService } from '../lib/supabase';

export default function NewFeature() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await supabaseService.getNewFeatureData();
      setData(result);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              新功能
            </h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {loading ? (
            <div>加载中...</div>
          ) : (
            <div>
              {/* 功能内容 */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
```

#### 2. 添加路由

```typescript
// src/App.tsx
import NewFeature from './pages/NewFeature';

// 在 Routes 中添加
<Route 
  path="/new-feature" 
  element={
    <ProtectedRoute>
      <NewFeature />
    </ProtectedRoute>
  } 
/>
```

#### 3. 添加侧边栏菜单

```typescript
// src/components/Sidebar.tsx
const menuItems = [
  // ... 现有菜单
  {
    name: '新功能',
    icon: Star,
    path: '/new-feature',
    permission: 'view_new_feature'
  }
];
```

### 添加新数据表

#### 1. 创建数据库表

```sql
-- 在 Supabase SQL Editor 中执行
CREATE TABLE new_feature_data (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE new_feature_data ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "用户可以查看自己的数据" ON new_feature_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的数据" ON new_feature_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的数据" ON new_feature_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的数据" ON new_feature_data
  FOR DELETE USING (auth.uid() = user_id);
```

#### 2. 添加类型定义

```typescript
// src/lib/supabase/types.ts
export interface NewFeatureData {
  id: number;
  name: string;
  description?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

#### 3. 扩展服务层

```typescript
// src/lib/supabase/supabaseService.ts
class SupabaseService {
  // ... 现有方法

  async getNewFeatureData(): Promise<NewFeatureData[]> {
    const { data, error } = await supabase
      .from('new_feature_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new SupabaseError('获取数据失败', error);
    }

    return data || [];
  }

  async addNewFeatureData(item: Omit<NewFeatureData, 'id' | 'created_at' | 'updated_at'>): Promise<NewFeatureData> {
    const { data, error } = await supabase
      .from('new_feature_data')
      .insert([item])
      .select()
      .single();

    if (error) {
      throw new SupabaseError('添加数据失败', error);
    }

    return data;
  }

  async updateNewFeatureData(id: number, updates: Partial<NewFeatureData>): Promise<NewFeatureData> {
    const { data, error } = await supabase
      .from('new_feature_data')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new SupabaseError('更新数据失败', error);
    }

    return data;
  }

  async deleteNewFeatureData(id: number): Promise<void> {
    const { error } = await supabase
      .from('new_feature_data')
      .delete()
      .eq('id', id);

    if (error) {
      throw new SupabaseError('删除数据失败', error);
    }
  }
}
```

### 添加新权限

#### 1. 在数据库中添加权限

```sql
-- 添加新权限
INSERT INTO permissions (id, name, description, category)
VALUES 
  ('view_new_feature', '查看新功能', '允许查看新功能页面', 'feature'),
  ('manage_new_feature', '管理新功能', '允许管理新功能数据', 'feature');

-- 为管理员角色添加权限
INSERT INTO user_permissions (user_id, permission_id)
SELECT id, 'view_new_feature' FROM user_profiles WHERE role = 'admin';

INSERT INTO user_permissions (user_id, permission_id)
SELECT id, 'manage_new_feature' FROM user_profiles WHERE role = 'admin';
```

#### 2. 在代码中使用权限

```typescript
// 检查权限
const hasPermission = userPermissions.includes('view_new_feature');

// 条件渲染
{hasPermission && <NewFeatureButton />}

// 路由守卫
<ProtectedRoute requiredPermission="view_new_feature">
  <NewFeature />
</ProtectedRoute>
```

---


## 维护指南

### 日常维护

#### 1. 数据库维护

```sql
-- 清理过期数据
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 清理过期公告
DELETE FROM announcements 
WHERE end_date < CURRENT_DATE - INTERVAL '7 days';

-- 更新统计信息
ANALYZE customers;
ANALYZE training_sessions;
```

#### 2. 日志监控

- 检查 Supabase 日志
- 监控错误率
- 分析性能指标
- 查看用户活动

#### 3. 备份策略

- 每日自动备份数据库
- 每周完整备份
- 保留最近 30 天的备份
- 定期测试恢复流程

### 更新升级

#### 1. 依赖更新

```bash
# 检查过期依赖
pnpm outdated

# 更新依赖
pnpm update

# 更新主要版本
pnpm update --latest
```

#### 2. 数据库迁移

```sql
-- 创建迁移脚本
-- migrations/001_add_new_column.sql
ALTER TABLE customers 
ADD COLUMN new_field TEXT;

-- 执行迁移
-- 在 Supabase SQL Editor 中执行
```

#### 3. 版本发布

```bash
# 1. 更新版本号
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# 2. 创建标签
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1

# 3. 部署到生产环境
git push origin main
```

---


## 团队协作

### Git 工作流

#### 分支策略

```
main          # 生产环境
  ├── develop # 开发环境
  │   ├── feature/xxx  # 功能分支
  │   ├── fix/xxx      # 修复分支
  │   └── refactor/xxx # 重构分支
```

#### 提交规范

```bash
# 功能
git commit -m "feat: 添加客户导出功能"

# 修复
git commit -m "fix: 修复登录页面样式问题"

# 文档
git commit -m "docs: 更新 README"

# 样式
git commit -m "style: 格式化代码"

# 重构
git commit -m "refactor: 重构客户管理模块"

# 性能
git commit -m "perf: 优化列表加载性能"

# 测试
git commit -m "test: 添加单元测试"

# 构建
git commit -m "build: 更新依赖版本"
```

### 代码审查

#### 审查清单

- [ ] 代码符合规范
- [ ] 类型定义完整
- [ ] 错误处理完善
- [ ] 性能优化合理
- [ ] 安全性考虑
- [ ] 测试覆盖充分
- [ ] 文档更新完整

#### 审查流程

1. 创建 Pull Request
2. 自动化测试
3. 代码审查
4. 修改反馈
5. 批准合并
6. 删除分支

---


## 常见问题 FAQ

### Q1: 如何重置密码？

**A**: 目前系统不支持自助重置密码，请联系管理员重置。

### Q2: 如何修改用户角色？

**A**: 只有管理员可以修改用户角色，在"业务员管理"或"专家管理"页面进行操作。

### Q3: 为什么看不到某些菜单？

**A**: 菜单显示基于用户权限，如果没有相应权限则不会显示。

### Q4: 如何导出数据？

**A**: 在"数据管理"页面选择要导出的数据类型，点击"导出"按钮。

### Q5: 移动端如何使用？

**A**: 系统完全支持移动端，使用手机浏览器访问即可。侧边栏会自动变为抽屉式。

### Q6: 如何添加新用户？

**A**: 
- 业务员：通过注册页面自助注册，等待管理员审核
- 专家：由管理员在"专家管理"页面添加
- 管理员：需要在数据库中手动设置角色

### Q7: 数据多久备份一次？

**A**: 建议每天备份一次，使用提供的备份脚本。

### Q8: 如何查看系统日志？

**A**: 登录 Supabase 控制台，在 Logs 页面查看。

### Q9: 如何联系技术支持？

**A**: 请通过 GitHub Issues 提交问题，或联系项目维护者。

### Q10: 系统支持多少并发用户？

**A**: 取决于 Supabase 套餐，免费套餐支持约 500 个并发连接。

---


## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。

---


## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: 添加某某功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---


## 联系方式

- **项目地址**: https://github.com/lpx0007/training-management-system
- **问题反馈**: https://github.com/lpx0007/training-management-system/issues
- **邮箱**: [项目维护者邮箱]

---


## 更新日志

### v1.0.0 (2024-01-XX)

#### 新功能
- ✅ 完整的认证系统
- ✅ 客户管理模块
- ✅ 培训管理模块
- ✅ 销售追踪模块
- ✅ 数据管理模块
- ✅ 通知系统
- ✅ 公告系统
- ✅ 权限管理
- ✅ 响应式设计
- ✅ 数据导出功能

#### 技术栈
- React 18.3.1
- TypeScript 5.7.2
- Vite 6.2.0
- Tailwind CSS 3.4.17
- Supabase 2.76.1

#### 部署
- Netlify 自动部署
- Supabase 后端服务

---


## 致谢

感谢以下开源项目：

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [Lucide Icons](https://lucide.dev/)
- [Recharts](https://recharts.org/)

---

**文档版本**: v1.0.0  
**最后更新**: 2024-01-XX  
**维护者**: [项目维护者]

---

> 💡 **提示**: 本文档会持续更新，请定期查看最新版本。如有任何问题或建议，欢迎提交 Issue 或 Pull Request。
