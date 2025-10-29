# Netlify 部署指南

## 📋 部署前检查清单

### ✅ 需要部署的文件
以下文件和目录是部署所必需的：

```
项目根目录/
├── src/                    # 源代码（必需）
├── public/                 # 静态资源（如果有）
├── index.html             # 入口 HTML（必需）
├── package.json           # 依赖配置（必需）
├── pnpm-lock.yaml         # 锁定文件（必需）
├── vite.config.ts         # Vite 配置（必需）
├── tsconfig.json          # TypeScript 配置（必需）
├── tailwind.config.js     # Tailwind 配置（必需）
├── postcss.config.js      # PostCSS 配置（必需）
└── .env.example           # 环境变量示例（参考用）
```

### ❌ 不需要部署的文件
以下文件不应该部署到生产环境：

```
├── node_modules/          # 依赖包（Netlify 会自动安装）
├── dist/                  # 构建产物（Netlify 会自动生成）
├── .env.local             # 本地环境变量（包含敏感信息）
├── database-backup/       # 数据库备份（本地使用）
├── scripts/               # 本地脚本（本地使用）
├── setup-test-users.js    # 测试脚本（本地使用）
├── .kiro/                 # IDE 配置（本地使用）
└── *.zip                  # 压缩文件
```

---

## 🚀 Netlify 部署步骤

### 1. 准备 Supabase 项目

在部署前，确保你的 Supabase 项目已经设置完成：

1. **创建 Supabase 项目**（如果还没有）
   - 访问 https://supabase.com
   - 创建新项目
   - 记录项目 URL 和 Anon Key

2. **执行数据库迁移**
   ```bash
   # 在 Supabase SQL Editor 中执行 supabase-setup.sql
   ```

3. **获取环境变量**
   - Project Settings → API
   - 复制 `Project URL`
   - 复制 `anon` `public` key

### 2. 配置 Netlify 项目

#### 方式 A: 通过 Git 仓库部署（推荐）

1. **推送代码到 Git 仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <你的仓库地址>
   git push -u origin main
   ```

2. **连接 Netlify**
   - 登录 https://app.netlify.com
   - 点击 "Add new site" → "Import an existing project"
   - 选择你的 Git 提供商（GitHub/GitLab/Bitbucket）
   - 授权并选择仓库

3. **配置构建设置**
   ```
   Build command: pnpm build
   Publish directory: dist/static
   ```

4. **配置环境变量**
   - 进入 Site settings → Environment variables
   - 添加以下变量：
     ```
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key-here
     ```

5. **部署**
   - 点击 "Deploy site"
   - 等待构建完成

#### 方式 B: 通过 Netlify CLI 部署

1. **安装 Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **登录 Netlify**
   ```bash
   netlify login
   ```

3. **初始化项目**
   ```bash
   netlify init
   ```

4. **配置环境变量**
   ```bash
   netlify env:set VITE_SUPABASE_URL "https://your-project-id.supabase.co"
   netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key-here"
   ```

5. **部署**
   ```bash
   netlify deploy --prod
   ```

### 3. 配置 Netlify 重定向规则

为了支持 React Router 的客户端路由，需要配置重定向规则。

创建 `netlify.toml` 文件（如果还没有）：

```toml
[build]
  command = "pnpm build"
  publish = "dist/static"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

---

## 🔍 功能完整性检查

### ✅ 当前已实现的功能

1. **用户认证系统**
   - ✅ 邮箱/手机号登录
   - ✅ 业务员自助注册
   - ✅ 密码加密存储
   - ✅ Session 持久化
   - ✅ 自动刷新 Token

2. **权限管理**
   - ✅ 基于角色的访问控制（RBAC）
   - ✅ 行级安全策略（RLS）
   - ✅ 管理员、业务员、专家三种角色
   - ✅ 数据隔离（业务员只能看自己的客户）

3. **客户管理**
   - ✅ 客户 CRUD 操作
   - ✅ 客户列表查询
   - ✅ 客户详情查看
   - ✅ 按业务员过滤

4. **培训管理**
   - ✅ 培训场次管理
   - ✅ 培训参与者管理
   - ✅ 培训绩效统计
   - ✅ 课程管理

5. **业务员管理**
   - ✅ 业务员注册审核
   - ✅ 业务员信息管理
   - ✅ 业务员状态管理
   - ✅ 业务员删除（级联删除）

6. **专家管理**
   - ✅ 专家信息管理
   - ✅ 专家课程关联

7. **数据导出**
   - ✅ Excel 导出
   - ✅ PDF 导出
   - ✅ 模板下载

8. **通知系统**
   - ✅ 系统通知
   - ✅ 场景通知
   - ✅ 通知历史

9. **公告系统**
   - ✅ 公告发布
   - ✅ 公告管理
   - ✅ 公告横幅

### ⚠️ 需要注意的限制

1. **邮件功能**
   - ❌ 邮箱验证功能已禁用（注册后直接可用）
   - 💡 如需启用，需配置 Supabase Email Provider

2. **文件上传**
   - ⚠️ 当前使用 Supabase Storage
   - 💡 需要配置 Storage Bucket 和权限策略

3. **实时功能**
   - ⚠️ Realtime 订阅已实现但需要 Supabase 项目启用
   - 💡 免费计划有连接数限制

---

## 🔗 Supabase 连接检查

### 环境变量验证

部署后，系统会自动验证环境变量：

```typescript
// src/lib/supabase/client.ts 中的验证逻辑
function validateEnv() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('缺少环境变量: VITE_SUPABASE_URL');
  }

  if (!supabaseAnonKey) {
    throw new Error('缺少环境变量: VITE_SUPABASE_ANON_KEY');
  }

  // URL 格式验证
  if (!supabaseUrl.startsWith('https://')) {
    throw new Error('VITE_SUPABASE_URL 格式错误');
  }

  // Key 长度验证
  if (supabaseAnonKey.length < 100) {
    throw new Error('VITE_SUPABASE_ANON_KEY 格式错误');
  }

  return { supabaseUrl, supabaseAnonKey };
}
```

### 连接测试

部署后，打开浏览器控制台，应该看到：

```
✅ Supabase 客户端已初始化
📍 Project URL: https://xxxxx.supabase.co
🔑 Anon Key: eyJhbGciOiJIUzI1NiI...
```

如果看到错误，检查：
1. 环境变量是否正确配置
2. Supabase 项目是否正常运行
3. 网络连接是否正常

---

## 🎯 优化建议

### 1. 性能优化

#### 代码分割
当前配置已实现基础代码分割：

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'excel-libs': ['xlsx', 'papaparse'],
        'pdf-libs': ['jspdf', 'jspdf-autotable']
      }
    }
  }
}
```

**建议增强**：
```typescript
manualChunks: {
  'vendor': ['react', 'react-dom', 'react-router-dom'],
  'supabase': ['@supabase/supabase-js'],
  'ui': ['framer-motion', 'lucide-react', 'sonner'],
  'charts': ['recharts'],
  'excel-libs': ['xlsx', 'papaparse', 'file-saver'],
  'pdf-libs': ['jspdf', 'jspdf-autotable']
}
```

#### 图片优化
```bash
# 添加图片压缩插件
pnpm add -D vite-plugin-imagemin
```

#### 懒加载路由
```typescript
// 建议改造 App.tsx 中的路由
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CustomerManagement = lazy(() => import('./pages/CustomerManagement'));
// ... 其他页面
```

### 2. 安全优化

#### 环境变量保护
```typescript
// 添加环境变量白名单检查
const allowedEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
Object.keys(import.meta.env).forEach(key => {
  if (key.startsWith('VITE_') && !allowedEnvVars.includes(key)) {
    console.warn(`未知的环境变量: ${key}`);
  }
});
```

#### CSP 配置
在 `netlify.toml` 中添加：

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdnjs.cloudflare.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

### 3. 监控和日志

#### 添加错误追踪
```bash
# 推荐使用 Sentry
pnpm add @sentry/react
```

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "your-sentry-dsn",
    environment: "production",
    tracesSampleRate: 0.1,
  });
}
```

#### 性能监控
```typescript
// 添加 Web Vitals 监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // 发送到分析服务
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 4. 数据库优化

#### 索引优化
```sql
-- 在 Supabase SQL Editor 中执行
-- 为常用查询字段添加索引
CREATE INDEX IF NOT EXISTS idx_customers_salesperson ON customers(salesperson_name);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(date);
CREATE INDEX IF NOT EXISTS idx_training_participants_session ON training_participants(training_session_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
```

#### 查询优化
```typescript
// 使用 select 指定需要的字段，避免查询所有字段
const { data } = await supabase
  .from('customers')
  .select('id, name, company, phone') // 只查询需要的字段
  .eq('salesperson_name', name);
```

### 5. 缓存策略

#### 添加 Service Worker
```bash
pnpm add -D vite-plugin-pwa
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});
```

---

## 🐛 常见问题排查

### 1. 构建失败

**问题**: `pnpm: command not found`
**解决**: 在 Netlify 构建设置中添加：
```toml
[build.environment]
  NPM_FLAGS = "--version"
```
或使用 npm：
```toml
[build]
  command = "npm run build"
```

**问题**: TypeScript 类型错误
**解决**: 检查 `tsconfig.json` 配置，确保所有类型定义正确

### 2. 运行时错误

**问题**: 白屏或 "Failed to fetch"
**解决**: 
1. 检查浏览器控制台错误
2. 验证环境变量是否正确
3. 检查 Supabase 项目状态

**问题**: 路由 404 错误
**解决**: 确保 `netlify.toml` 中的重定向规则已配置

### 3. Supabase 连接问题

**问题**: "Invalid API key"
**解决**: 
1. 确认使用的是 `anon` key，不是 `service_role` key
2. 检查 key 是否完整复制

**问题**: "Permission denied"
**解决**: 
1. 检查 RLS 策略是否正确
2. 确认用户已登录
3. 验证用户角色权限

### 4. 性能问题

**问题**: 首次加载慢
**解决**: 
1. 启用代码分割
2. 使用懒加载
3. 优化图片资源
4. 启用 CDN

---

## 📊 部署后验证清单

部署完成后，逐项验证以下功能：

### 基础功能
- [ ] 页面正常加载，无白屏
- [ ] 路由跳转正常
- [ ] 样式显示正确
- [ ] 图标和字体加载正常

### 认证功能
- [ ] 登录功能正常（邮箱）
- [ ] 登录功能正常（手机号）
- [ ] 注册功能正常
- [ ] 登出功能正常
- [ ] Session 持久化正常

### 数据功能
- [ ] 客户列表加载正常
- [ ] 客户添加/编辑/删除正常
- [ ] 培训场次管理正常
- [ ] 业务员管理正常
- [ ] 专家管理正常

### 权限功能
- [ ] 管理员可以看到所有数据
- [ ] 业务员只能看到自己的客户
- [ ] 未授权访问被正确拦截

### 导出功能
- [ ] Excel 导出正常
- [ ] PDF 导出正常
- [ ] 模板下载正常

### 性能指标
- [ ] 首次加载时间 < 3秒
- [ ] 页面切换流畅
- [ ] 无明显卡顿

---

## 🎉 部署完成

恭喜！你的培训管理系统已成功部署到 Netlify。

### 下一步

1. **配置自定义域名**（可选）
   - Site settings → Domain management
   - 添加自定义域名
   - 配置 DNS 记录

2. **启用 HTTPS**（自动）
   - Netlify 自动提供免费 SSL 证书
   - 强制 HTTPS 重定向

3. **设置部署通知**
   - Site settings → Build & deploy → Deploy notifications
   - 配置邮件或 Slack 通知

4. **监控和分析**
   - 启用 Netlify Analytics
   - 集成 Google Analytics（可选）

5. **持续优化**
   - 定期检查性能指标
   - 根据用户反馈优化功能
   - 保持依赖包更新

---

## 📞 技术支持

如遇到问题，可以：
1. 查看 Netlify 构建日志
2. 检查浏览器控制台错误
3. 查看 Supabase 日志
4. 参考本文档的常见问题部分

祝部署顺利！🚀
