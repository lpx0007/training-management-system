# 🚀 EdgeOne 直接部署 GitHub 仓库指南

EdgeOne 支持直接连接 GitHub 仓库，无需通过 Gitee 中转。

---

## 📋 部署架构

### 简化架构（推荐）

```
GitHub 仓库（唯一代码源）
    ├── Webhook → Netlify 部署（海外 CDN）
    └── Webhook → EdgeOne 部署（国内 CDN）
```

**优点**：
- ✅ 只维护一个代码仓库
- ✅ 无需配置同步
- ✅ 自动部署到两个平台
- ✅ 配置简单

---

## 🚀 部署步骤

### 步骤 1：准备工作

确保：
- ✅ GitHub 仓库已创建
- ✅ 代码已推送到 GitHub
- ✅ Netlify 已部署成功
- ✅ 腾讯云账号已注册

### 步骤 2：访问 EdgeOne 控制台

1. 登录腾讯云：https://cloud.tencent.com
2. 搜索 "EdgeOne"
3. 进入 EdgeOne Pages 服务
4. 点击 "新建站点" 或 "创建项目"

### 步骤 3：连接 GitHub 仓库

1. **选择代码源**
   - 选择 **GitHub**（不是 Gitee）

2. **授权 GitHub**
   - 点击 "授权 GitHub"
   - 在弹出窗口中登录 GitHub
   - 授权 EdgeOne 访问你的仓库

3. **选择仓库**
   - 从列表中选择：`training-management-system`
   - 或输入仓库 URL

4. **选择分支**
   - 选择：`main`

### 步骤 4：配置构建设置

```yaml
项目名称: training-management-system
框架预设: Vite
构建命令: pnpm build
输出目录: dist/static
Node 版本: 18.x
包管理器: pnpm
```

**详细配置**：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 构建命令 | `pnpm build` | 与 Netlify 相同 |
| 输出目录 | `dist/static` | 构建产物目录 |
| Node 版本 | `18.x` | 推荐 18 或更高 |
| 包管理器 | `pnpm` | 必须指定 |
| 安装命令 | `pnpm install` | 通常自动识别 |

### 步骤 5：配置环境变量

添加以下环境变量：

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**注意**：
- 可以与 Netlify 使用相同的值
- 也可以使用不同的 Supabase 项目

### 步骤 6：部署

1. 检查所有配置
2. 点击 "部署" 或 "创建"
3. 等待构建完成（2-5 分钟）
4. 访问生成的域名测试

---

## ✅ 验证部署

### 1. 检查构建状态

在 EdgeOne 控制台：
- 查看构建日志
- 确认构建成功
- 记录部署域名

### 2. 访问网站

```
EdgeOne 默认域名: https://your-site.edgeone.app
```

### 3. 功能测试

- [ ] 页面正常加载
- [ ] 登录功能正常
- [ ] 数据加载正常
- [ ] 环境变量生效

---

## 🔄 自动部署

### 工作流程

```
1. 本地开发完成
   ↓
2. 推送到 GitHub
   git push origin main
   ↓
3. GitHub Webhook 触发
   ↓
4. Netlify 自动部署（海外）
   EdgeOne 自动部署（国内）
   ↓
5. 完成！
```

### 触发条件

EdgeOne 会在以下情况自动部署：
- ✅ 推送到 `main` 分支
- ✅ 合并 Pull Request
- ✅ 手动触发部署

---

## 🌐 域名配置

### 使用智能 DNS（推荐）

配置智能 DNS 解析，根据用户地域自动选择：

```
training.example.com
├── 国内线路 → EdgeOne
└── 海外线路 → Netlify
```

**配置步骤**：

1. 在 DNS 服务商添加两条 CNAME 记录
2. 记录 1：
   - 主机记录：`@` 或 `training`
   - 记录类型：`CNAME`
   - 线路类型：**国内**
   - 记录值：EdgeOne 域名
3. 记录 2：
   - 主机记录：`@` 或 `training`
   - 记录类型：`CNAME`
   - 线路类型：**海外**
   - 记录值：Netlify 域名

---

## 🆚 对比：GitHub vs Gitee

### 使用 GitHub（当前方案）

**优点**：
- ✅ 只需一个代码仓库
- ✅ 无需同步配置
- ✅ 配置更简单
- ✅ 维护成本低

**可能的问题**：
- ⚠️ EdgeOne 连接 GitHub 可能较慢
- ⚠️ 构建时拉取代码有延迟

### 使用 Gitee（备选方案）

**优点**：
- ✅ EdgeOne 连接更快（国内）
- ✅ 构建速度可能更快

**缺点**：
- ❌ 需要维护两个仓库
- ❌ 需要配置同步
- ❌ 配置更复杂

---

## 🔧 故障排查

### 问题 1：连接 GitHub 失败

**错误**：无法连接到 GitHub

**解决方案**：
1. 检查网络连接
2. 重新授权 GitHub
3. 确认仓库访问权限
4. 如果持续失败，考虑使用 Gitee 方案

### 问题 2：构建失败

**错误**：构建命令执行失败

**解决方案**：
1. 检查构建命令：`pnpm build`
2. 检查输出目录：`dist/static`
3. 检查 Node 版本：18.x
4. 查看构建日志获取详细错误

### 问题 3：环境变量未生效

**错误**：`VITE_SUPABASE_URL is not defined`

**解决方案**：
1. 确认环境变量已添加
2. 变量名必须以 `VITE_` 开头
3. 重新部署

### 问题 4：构建很慢

**现象**：构建时间超过 10 分钟

**可能原因**：
- EdgeOne 从 GitHub 拉取代码较慢
- 网络延迟

**解决方案**：
- 考虑使用 Gitee 作为镜像
- 参考 [EdgeOne 部署指南](./EDGEONE_DEPLOYMENT.md)

---

## 💡 最佳实践

### 1. 监控部署状态

- 配置 EdgeOne 部署通知
- 使用 UptimeRobot 监控网站可用性
- 定期检查两个平台的部署状态

### 2. 环境变量管理

```bash
# 推荐：两个平台使用相同的环境变量
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 或者：使用不同的 Supabase 项目
# Netlify: project-global.supabase.co
# EdgeOne: project-cn.supabase.co
```

### 3. 部署验证

每次部署后检查：
- [ ] Netlify 部署成功
- [ ] EdgeOne 部署成功
- [ ] 两个平台功能正常
- [ ] 无错误日志

---

## 📊 性能对比

### EdgeOne 连接 GitHub vs Gitee

| 指标 | GitHub | Gitee |
|------|--------|-------|
| 配置复杂度 | ⭐⭐⭐⭐⭐ 简单 | ⭐⭐⭐ 中等 |
| 维护成本 | ⭐⭐⭐⭐⭐ 低 | ⭐⭐⭐ 中等 |
| 连接速度 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 快 |
| 构建速度 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐ 快 |
| 可靠性 | ⭐⭐⭐⭐ 高 | ⭐⭐⭐⭐ 高 |

---

## 🎯 推荐方案

### 优先尝试：EdgeOne 直接连接 GitHub

**理由**：
1. 配置最简单
2. 维护成本最低
3. 只需一个代码仓库

### 如果遇到问题：使用 Gitee 镜像

**切换条件**：
- EdgeOne 连接 GitHub 经常失败
- 构建时间过长（>10 分钟）
- 需要更快的构建速度

**切换方法**：
参考 [EdgeOne 部署指南](./EDGEONE_DEPLOYMENT.md)

---

## 📚 相关文档

- [EdgeOne 部署指南（Gitee 方案）](./EDGEONE_DEPLOYMENT.md)
- [多平台部署对比](./DEPLOYMENT_COMPARISON.md)
- [部署快速参考](./DEPLOYMENT_QUICK_REFERENCE.md)

---

## 🎉 总结

使用 EdgeOne 直接连接 GitHub 是最简单的方案：

1. ✅ 只需维护一个 GitHub 仓库
2. ✅ 无需配置 Gitee 和同步
3. ✅ 自动部署到两个平台
4. ✅ 配置简单，维护方便

**一次推送，两个平台自动部署！** 🚀

---

**文档版本**: v1.0.0  
**最后更新**: 2024-01-XX  
**维护者**: [项目维护者]
