# 📋 部署文件对比说明

本文档详细说明 Netlify 和 EdgeOne 部署所需的文件和配置。

---

## ✅ 简短回答

**是的，部署文件完全一样！** 

两个平台使用：
- ✅ 相同的源代码
- ✅ 相同的构建命令
- ✅ 相同的输出目录
- ✅ 相同的环境变量

**唯一的区别**：`netlify.toml` 文件只对 Netlify 有效，EdgeOne 会忽略它。

---

## 📊 详细对比

### 核心构建配置

| 配置项 | Netlify | EdgeOne | 是否相同 |
|--------|---------|---------|----------|
| **构建命令** | `pnpm build` | `pnpm build` | ✅ 完全相同 |
| **输出目录** | `dist/static` | `dist/static` | ✅ 完全相同 |
| **Node 版本** | 18 | 18 | ✅ 完全相同 |
| **包管理器** | pnpm | pnpm | ✅ 完全相同 |
| **环境变量** | VITE_* | VITE_* | ✅ 完全相同 |

### 源代码文件

所有源代码文件两个平台完全共享：

```
✅ src/                    # 所有源代码
✅ public/                 # 静态资源
✅ index.html              # HTML 入口
✅ package.json            # 依赖配置
✅ vite.config.ts          # Vite 配置
✅ tsconfig.json           # TypeScript 配置
✅ tailwind.config.js      # Tailwind 配置
✅ postcss.config.js       # PostCSS 配置
```

### 配置文件对比

#### 1. netlify.toml

**位置**: 项目根目录  
**作用**: Netlify 专用配置文件  
**EdgeOne 是否需要**: ❌ 不需要（EdgeOne 会忽略）

```toml
# netlify.toml - 只对 Netlify 有效
[build]
  command = "pnpm build"
  publish = "dist/static"
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**EdgeOne 处理方式**：
- EdgeOne 不读取 `netlify.toml`
- 在 EdgeOne 控制台手动配置这些设置
- 或者 EdgeOne 会自动识别 Vite 项目

#### 2. package.json

**位置**: 项目根目录  
**作用**: 定义构建脚本和依赖  
**两个平台**: ✅ 完全相同

```json
{
  "scripts": {
    "build": "vite build --outDir dist/static"
  }
}
```

#### 3. vite.config.ts

**位置**: 项目根目录  
**作用**: Vite 构建配置  
**两个平台**: ✅ 完全相同

```typescript
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
});
```

#### 4. .env.local

**位置**: 项目根目录（不提交到 Git）  
**作用**: 环境变量  
**两个平台**: ✅ 变量名相同，值可以相同或不同

```bash
# 两个平台都需要配置这些环境变量
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**配置位置**：
- **Netlify**: Site settings → Environment variables
- **EdgeOne**: 项目设置 → 环境变量

---

## 🔍 关键发现

### 1. netlify.toml 的作用

`netlify.toml` 文件包含的配置：

#### a) 构建配置
```toml
[build]
  command = "pnpm build"
  publish = "dist/static"
```

**EdgeOne 等效配置**：在控制台手动设置
- 构建命令：`pnpm build`
- 输出目录：`dist/static`

#### b) 路由重定向
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**作用**：支持 React Router 的客户端路由  
**EdgeOne 处理**：EdgeOne 会自动识别 SPA 应用并配置重定向

#### c) 安全头
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    # ... 其他安全头
```

**EdgeOne 处理**：EdgeOne 有自己的安全头配置界面

#### d) 缓存策略
```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

**EdgeOne 处理**：EdgeOne 有自己的缓存配置

### 2. 构建产物

两个平台的构建产物完全相同：

```
dist/static/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [其他资源]
└── [其他文件]
```

---

## 📝 实际部署对比

### Netlify 部署流程

```bash
# 1. 代码推送到 GitHub
git push origin main

# 2. Netlify 自动检测到推送

# 3. Netlify 读取 netlify.toml
#    - 构建命令: pnpm build
#    - 输出目录: dist/static
#    - 重定向规则
#    - 安全头

# 4. 执行构建
pnpm install
pnpm build

# 5. 部署 dist/static 目录

# 6. 应用配置（重定向、安全头等）
```

### EdgeOne 部署流程

```bash
# 1. 代码推送到 Gitee
git push gitee main

# 2. EdgeOne 自动检测到推送

# 3. EdgeOne 使用控制台配置
#    - 构建命令: pnpm build (手动配置)
#    - 输出目录: dist/static (手动配置)
#    - 框架: Vite (自动识别)

# 4. 执行构建
pnpm install
pnpm build

# 5. 部署 dist/static 目录

# 6. 应用 EdgeOne 的默认配置
```

---

## 🎯 关键结论

### 需要的文件（两个平台相同）

```
✅ src/                    # 源代码
✅ public/                 # 静态资源
✅ index.html              # HTML 入口
✅ package.json            # 依赖和脚本
✅ pnpm-lock.yaml          # 锁定文件
✅ vite.config.ts          # Vite 配置
✅ tsconfig.json           # TS 配置
✅ tailwind.config.js      # Tailwind 配置
✅ postcss.config.js       # PostCSS 配置
```

### 平台特定文件

```
📄 netlify.toml            # 只对 Netlify 有效
                           # EdgeOne 会忽略此文件
                           # 不影响 EdgeOne 部署
```

### 不需要的文件

```
❌ edgeone.config.js       # EdgeOne 不需要配置文件
❌ vercel.json             # 不使用 Vercel
❌ .netlifyignore          # 可选
```

---

## 💡 最佳实践

### 1. 保留 netlify.toml

**建议**：保留 `netlify.toml` 文件

**原因**：
- ✅ 不影响 EdgeOne 部署（EdgeOne 会忽略）
- ✅ 为 Netlify 提供完整配置
- ✅ 便于维护和文档化
- ✅ 其他开发者可以了解 Netlify 配置

### 2. 环境变量管理

**策略 A：使用相同的值**（推荐）

```bash
# Netlify 和 EdgeOne 都配置相同的值
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**优点**：
- ✅ 数据统一
- ✅ 管理简单
- ✅ 用户体验一致

**策略 B：使用不同的值**

```bash
# Netlify（海外）
VITE_SUPABASE_URL=https://project-global.supabase.co

# EdgeOne（国内）
VITE_SUPABASE_URL=https://project-cn.supabase.co
```

**优点**：
- ✅ 环境隔离
- ✅ 可以独立测试

### 3. 配置同步

虽然 `netlify.toml` 对 EdgeOne 无效，但可以参考它来配置 EdgeOne：

| netlify.toml 配置 | EdgeOne 控制台配置 |
|-------------------|-------------------|
| `command = "pnpm build"` | 构建命令：`pnpm build` |
| `publish = "dist/static"` | 输出目录：`dist/static` |
| `NODE_VERSION = "18"` | Node 版本：18.x |
| 重定向规则 | 自动识别 SPA |
| 安全头 | 在控制台配置 |
| 缓存策略 | 在控制台配置 |

---

## 🔧 EdgeOne 特定配置

虽然 EdgeOne 不需要配置文件，但你可以在控制台配置以下内容：

### 1. 基础配置

```yaml
框架预设: Vite
构建命令: pnpm build
输出目录: dist/static
Node 版本: 18.x
包管理器: pnpm
```

### 2. 环境变量

```bash
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
```

### 3. 路由配置（可选）

EdgeOne 通常会自动识别 SPA 应用，但如果需要手动配置：

```
/* → /index.html (200)
```

### 4. 缓存配置（可选）

```
/assets/* → 缓存 1 年
/*.html → 不缓存
```

---

## 📋 部署检查清单

### 文件检查

- [ ] 所有源代码文件已提交
- [ ] `package.json` 包含正确的构建脚本
- [ ] `vite.config.ts` 配置正确
- [ ] `netlify.toml` 存在（为 Netlify 准备）
- [ ] `.gitignore` 排除了 `node_modules` 和 `.env.local`

### Netlify 配置检查

- [ ] `netlify.toml` 配置正确
- [ ] 环境变量已在控制台配置
- [ ] 构建命令：`pnpm build`
- [ ] 输出目录：`dist/static`

### EdgeOne 配置检查

- [ ] 控制台构建命令：`pnpm build`
- [ ] 控制台输出目录：`dist/static`
- [ ] 环境变量已在控制台配置
- [ ] Node 版本：18.x
- [ ] 包管理器：pnpm

### 构建测试

- [ ] 本地构建成功：`pnpm build`
- [ ] 构建产物在 `dist/static` 目录
- [ ] 本地预览正常：`pnpm preview`

---

## 🎓 常见问题

### Q1: netlify.toml 会影响 EdgeOne 吗？

**A**: 不会。EdgeOne 完全忽略 `netlify.toml` 文件。

### Q2: 需要创建 edgeone.config.js 吗？

**A**: 不需要。EdgeOne 不使用配置文件，所有配置在控制台完成。

### Q3: 两个平台的构建产物一样吗？

**A**: 完全一样。因为使用相同的构建命令和配置。

### Q4: 可以删除 netlify.toml 吗？

**A**: 可以，但不建议。保留它不会影响 EdgeOne，且便于 Netlify 部署。

### Q5: 环境变量必须相同吗？

**A**: 不必须。可以根据需要使用相同或不同的值。

### Q6: 如何确保两个平台配置一致？

**A**: 参考 `netlify.toml` 的配置，在 EdgeOne 控制台手动设置相同的值。

### Q7: 构建失败怎么办？

**A**: 
1. 检查构建命令是否正确
2. 检查输出目录是否正确
3. 检查 Node 版本是否匹配
4. 查看构建日志获取详细错误

---

## 📚 相关文档

- [EdgeOne 部署指南](./EDGEONE_DEPLOYMENT.md)
- [多平台部署对比](./DEPLOYMENT_COMPARISON.md)
- [项目完整文档](./PROJECT_DOCUMENTATION.md)

---

## 🎯 快速总结

### ✅ 相同的部分（99%）

- 所有源代码文件
- 所有配置文件（除了 netlify.toml）
- 构建命令和输出目录
- 环境变量名称
- 构建产物

### ⚠️ 不同的部分（1%）

- `netlify.toml` 只对 Netlify 有效
- EdgeOne 在控制台配置，不使用配置文件
- 环境变量的值可以选择相同或不同

### 💡 结论

**你可以使用完全相同的代码仓库部署到两个平台，无需任何修改！**

只需要：
1. 将代码同步到 Gitee
2. 在 EdgeOne 控制台配置构建设置
3. 配置环境变量

就这么简单！🎉

---

**文档版本**: v1.0.0  
**最后更新**: 2024-01-XX  
**维护者**: [项目维护者]
