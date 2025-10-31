# 🚀 部署快速参考卡

一页纸快速了解 Netlify 和 EdgeOne 部署的所有关键信息。

---

## 📊 一图看懂

```
┌─────────────────────────────────────────────────────────────────┐
│                    你的项目代码仓库                              │
│                                                                 │
│  ✅ src/              ✅ package.json      ✅ vite.config.ts    │
│  ✅ public/           ✅ tsconfig.json     ✅ tailwind.config.js│
│  ✅ index.html        ⚠️  netlify.toml     ✅ .env.local        │
│                      (只对 Netlify 有效)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 代码同步
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │   GitHub 仓库     │       │   Gitee 仓库      │
    │                   │       │                   │
    │  自动同步 ✅      │       │  手动/自动同步 ✅ │
    └─────────┬─────────┘       └─────────┬─────────┘
              │                           │
              │ Webhook                   │ Webhook
              │                           │
              ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │     Netlify       │       │     EdgeOne       │
    │                   │       │                   │
    │  🌍 全球 CDN      │       │  🇨🇳 国内 CDN     │
    │  ⚡ 海外访问快    │       │  ⚡ 国内访问快    │
    │  📄 读取 toml     │       │  🎛️  控制台配置   │
    └───────────────────┘       └───────────────────┘
              │                           │
              │                           │
              ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │  构建产物相同！   │       │  构建产物相同！   │
    │                   │       │                   │
    │  dist/static/     │       │  dist/static/     │
    │  ├── index.html   │       │  ├── index.html   │
    │  └── assets/      │       │  └── assets/      │
    └───────────────────┘       └───────────────────┘
```

---

## ⚡ 核心配置对比

### 构建配置

| 配置项 | 值 | Netlify | EdgeOne |
|--------|-----|---------|---------|
| 构建命令 | `pnpm build` | ✅ netlify.toml | 🎛️ 控制台 |
| 输出目录 | `dist/static` | ✅ netlify.toml | 🎛️ 控制台 |
| Node 版本 | `18.x` | ✅ netlify.toml | 🎛️ 控制台 |
| 包管理器 | `pnpm` | ✅ netlify.toml | 🎛️ 控制台 |

### 环境变量

```bash
# 两个平台都需要配置（可以相同或不同）
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**配置位置**：
- **Netlify**: Site settings → Environment variables
- **EdgeOne**: 项目设置 → 环境变量

---

## 📝 部署命令速查

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 本地构建测试
pnpm build

# 预览构建产物
pnpm preview
```

### 代码推送

```bash
# 方式 1: 使用同步脚本（推荐）
.\scripts\sync-to-gitee.ps1 "提交信息"

# 方式 2: 手动推送
git add .
git commit -m "提交信息"
git push origin main    # 推送到 GitHub → Netlify
git push gitee main     # 推送到 Gitee → EdgeOne

# 方式 3: 使用别名
git config alias.pushall '!git push origin main && git push gitee main'
git pushall
```

---

## 🎯 关键问题速答

### ❓ 部署文件完全一样吗？

**✅ 是的！** 99% 相同，只有 `netlify.toml` 是 Netlify 专用的。

### ❓ netlify.toml 会影响 EdgeOne 吗？

**❌ 不会！** EdgeOne 完全忽略这个文件。

### ❓ 需要创建 edgeone.config.js 吗？

**❌ 不需要！** EdgeOne 在控制台配置，不使用配置文件。

### ❓ 环境变量必须相同吗？

**🤔 不必须！** 可以相同（数据统一）或不同（环境隔离）。

### ❓ 构建产物一样吗？

**✅ 完全一样！** 因为使用相同的构建命令。

---

## 🔧 首次部署清单

### Netlify 部署

- [ ] 代码已推送到 GitHub
- [ ] 连接 Netlify 账号
- [ ] 选择 GitHub 仓库
- [ ] 构建设置自动识别（或手动设置）
- [ ] 添加环境变量
- [ ] 点击部署
- [ ] 等待 2-3 分钟
- [ ] 访问测试

### EdgeOne 部署

- [ ] 代码已同步到 Gitee
- [ ] 连接 EdgeOne 账号
- [ ] 选择 Gitee 仓库
- [ ] 手动配置构建设置：
  - [ ] 构建命令：`pnpm build`
  - [ ] 输出目录：`dist/static`
  - [ ] Node 版本：18.x
  - [ ] 包管理器：pnpm
- [ ] 添加环境变量
- [ ] 点击部署
- [ ] 等待 2-5 分钟
- [ ] 访问测试

---

## 🌐 访问地址

### 默认域名

```
Netlify:  https://your-site-name.netlify.app
EdgeOne:  https://your-site-name.edgeone.app
```

### 自定义域名（可选）

```
方案 1: 智能 DNS
training.example.com
├── 国内 → EdgeOne
└── 海外 → Netlify

方案 2: 独立域名
cn.training.example.com → EdgeOne
global.training.example.com → Netlify
```

---

## 📊 性能对比

| 指标 | Netlify | EdgeOne |
|------|---------|---------|
| 国内访问速度 | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| 海外访问速度 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 构建速度 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 部署速度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 配置难度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| 文档质量 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🚨 常见错误

### 错误 1: 构建失败

```
❌ Error: Command failed: pnpm build
```

**解决方案**：
1. 检查构建命令是否正确
2. 检查 Node 版本是否匹配
3. 查看构建日志

### 错误 2: 环境变量未定义

```
❌ Error: VITE_SUPABASE_URL is not defined
```

**解决方案**：
1. 在平台控制台添加环境变量
2. 确保变量名以 `VITE_` 开头
3. 重新部署

### 错误 3: 404 错误

```
❌ 404 Not Found
```

**解决方案**：
1. 检查输出目录是否正确：`dist/static`
2. 确认 SPA 重定向已配置
3. 检查路由配置

### 错误 4: 页面空白

```
❌ 页面显示空白
```

**解决方案**：
1. 打开浏览器控制台查看错误
2. 检查环境变量是否配置
3. 检查 Supabase 连接

---

## 💡 专业提示

### 提示 1: 使用同步脚本

```powershell
# 一键推送到两个平台
.\scripts\sync-to-gitee.ps1 "feat: 添加新功能"
```

### 提示 2: 配置 Git 别名

```bash
git config alias.pushall '!git push origin main && git push gitee main'
git pushall
```

### 提示 3: 监控部署状态

使用 UptimeRobot 监控两个域名的可用性。

### 提示 4: 定期备份

```bash
# 定期备份数据库
node scripts/backup-database.js
```

### 提示 5: 查看构建日志

部署失败时，第一时间查看构建日志获取详细错误信息。

---

## 📚 延伸阅读

- **详细对比**: [部署文件对比说明](./DEPLOYMENT_FILES_COMPARISON.md)
- **EdgeOne 指南**: [EdgeOne 部署指南](./EDGEONE_DEPLOYMENT.md)
- **平台对比**: [多平台部署对比](./DEPLOYMENT_COMPARISON.md)
- **完整文档**: [项目完整文档](./PROJECT_DOCUMENTATION.md)

---

## 🎓 学习路径

### 新手路径

```
1. 阅读本文档（5 分钟）
   ↓
2. 部署到 Netlify（15 分钟）
   ↓
3. 测试访问
   ↓
4. 部署到 EdgeOne（20 分钟）
   ↓
5. 对比两个平台的访问速度
```

### 进阶路径

```
1. 配置智能 DNS（30 分钟）
   ↓
2. 设置自动同步（20 分钟）
   ↓
3. 配置监控告警（15 分钟）
   ↓
4. 优化性能（持续）
```

---

## 📞 获取帮助

### 遇到问题？

1. **查看文档**: 先查看相关文档
2. **查看日志**: 检查构建日志
3. **搜索问题**: 在 GitHub Issues 搜索
4. **提交 Issue**: 描述问题并附上日志
5. **联系维护者**: 紧急问题联系项目维护者

### 有建议？

欢迎提交 Pull Request 改进文档！

---

**快速参考卡版本**: v1.0.0  
**最后更新**: 2024-01-XX  
**打印友好**: ✅ 可以打印此页作为参考

---

> 💡 **提示**: 将此页加入书签，随时查阅！
