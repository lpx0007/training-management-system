# 🚀 EdgeOne 部署指南

本指南介绍如何将项目部署到腾讯云 EdgeOne Pages，通过 Gitee 仓库进行自动部署。

---

## 📋 目录

1. [部署概述](#部署概述)
2. [前置准备](#前置准备)
3. [Gitee 仓库配置](#gitee-仓库配置)
4. [EdgeOne 部署步骤](#edgeone-部署步骤)
5. [环境变量配置](#环境变量配置)
6. [多平台部署说明](#多平台部署说明)
7. [常见问题](#常见问题)

---

## 部署概述

### 什么是 EdgeOne Pages？

EdgeOne Pages 是腾讯云提供的静态网站托管服务，具有以下特点：

- ✅ **国内访问优化**：CDN 节点覆盖全国，访问速度快
- ✅ **自动部署**：支持 Git 仓库自动部署
- ✅ **免费 HTTPS**：自动配置 SSL 证书
- ✅ **自定义域名**：支持绑定自定义域名
- ✅ **构建优化**：支持多种前端框架

### 多平台部署优势

同时部署到 Netlify 和 EdgeOne 的好处：

1. **地域优化**
   - Netlify：海外用户访问更快
   - EdgeOne：国内用户访问更快

2. **高可用性**
   - 一个平台故障时，另一个仍可用
   - 提供备份访问方案

3. **灵活切换**
   - 可以根据用户地域智能切换
   - 便于 A/B 测试

4. **无冲突**
   - 两个平台独立部署
   - 使用相同的代码仓库
   - 环境变量可以相同或不同

---

## 前置准备

### 1. 注册账号

- **Gitee 账号**：https://gitee.com
- **腾讯云账号**：https://cloud.tencent.com
- **EdgeOne 服务**：https://console.cloud.tencent.com/edgeone

### 2. 确认项目状态

确保你的项目：
- ✅ 已经在 GitHub 上有仓库
- ✅ 已经在 Netlify 上成功部署
- ✅ 构建配置正确（`pnpm build`）
- ✅ 环境变量已配置

---

## Gitee 仓库配置

### 方式 1：从 GitHub 导入（推荐）

#### 步骤 1：登录 Gitee

访问 https://gitee.com 并登录

#### 步骤 2：导入 GitHub 仓库

1. 点击右上角 `+` → `从 GitHub/GitLab 导入仓库`
2. 授权 Gitee 访问你的 GitHub 账号
3. 选择要导入的仓库：`training-management-system`
4. 设置 Gitee 仓库信息：
   - **仓库名称**：`training-management-system`
   - **路径**：自动生成或自定义
   - **是否开源**：根据需要选择
5. 点击 `导入` 按钮

#### 步骤 3：设置自动同步（可选）

如果希望 GitHub 和 Gitee 保持同步：

1. 在 GitHub 仓库中添加 Gitee 作为远程仓库：

```bash
# 添加 Gitee 远程仓库
git remote add gitee https://gitee.com/your-username/training-management-system.git

# 查看远程仓库
git remote -v

# 输出示例：
# origin    https://github.com/lpx0007/training-management-system.git (fetch)
# origin    https://github.com/lpx0007/training-management-system.git (push)
# gitee     https://gitee.com/your-username/training-management-system.git (fetch)
# gitee     https://gitee.com/your-username/training-management-system.git (push)
```

2. 推送代码到 Gitee：

```bash
# 推送到 Gitee
git push gitee main

# 或者同时推送到两个平台
git push origin main
git push gitee main
```

3. 设置自动同步脚本（可选）：

创建 `.github/workflows/sync-to-gitee.yml`：

```yaml
name: Sync to Gitee

on:
  push:
    branches:
      - main

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync to Gitee
        uses: wearerequired/git-mirror-action@v1
        env:
          SSH_PRIVATE_KEY: ${{ secrets.GITEE_PRIVATE_KEY }}
        with:
          source-repo: https://github.com/lpx0007/training-management-system.git
          destination-repo: git@gitee.com:your-username/training-management-system.git
```

### 方式 2：手动创建并推送

如果不想导入，也可以手动创建：

```bash
# 1. 在 Gitee 上创建新仓库（通过网页）

# 2. 添加 Gitee 远程仓库
git remote add gitee https://gitee.com/your-username/training-management-system.git

# 3. 推送代码
git push gitee main
```

---

## EdgeOne 部署步骤

### 步骤 1：访问 EdgeOne 控制台

1. 登录腾讯云控制台
2. 搜索并进入 "EdgeOne"
3. 选择 "Pages" 服务

### 步骤 2：创建新站点

1. 点击 `新建站点` 或 `创建项目`
2. 选择 `从 Git 仓库导入`

### 步骤 3：连接 Gitee 仓库

1. **授权 Gitee**
   - 选择 "Gitee" 作为代码源
   - 点击 "授权" 按钮
   - 在弹出窗口中登录 Gitee 并授权

2. **选择仓库**
   - 从列表中选择 `training-management-system`
   - 或者输入仓库 URL

3. **配置分支**
   - 选择要部署的分支：`main`

### 步骤 4：配置构建设置

在构建配置页面填写：

```yaml
# 项目名称
项目名称: training-management-system

# 框架预设
框架预设: Vite

# 构建命令
构建命令: pnpm build

# 输出目录
输出目录: dist/static

# 安装命令（如果需要）
安装命令: pnpm install

# Node.js 版本
Node 版本: 18.x

# 包管理器
包管理器: pnpm
```

**重要配置说明**：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 构建命令 | `pnpm build` | 与 Netlify 相同 |
| 输出目录 | `dist/static` | 与 Netlify 相同 |
| Node 版本 | `18.x` | 推荐使用 18 或更高 |
| 包管理器 | `pnpm` | 必须指定 pnpm |

### 步骤 5：配置环境变量

在 "环境变量" 部分添加：

```bash
# Supabase 配置
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**注意**：
- 环境变量名必须以 `VITE_` 开头
- 可以与 Netlify 使用相同的值
- 也可以使用不同的 Supabase 项目（如果需要隔离环境）

### 步骤 6：部署

1. 检查所有配置
2. 点击 `部署` 或 `创建` 按钮
3. 等待构建完成（通常 2-5 分钟）

### 步骤 7：查看部署结果

部署成功后：
- 会生成一个默认域名：`xxx.edgeone.app`
- 可以通过这个域名访问你的应用
- 可以在控制台查看构建日志

---

## 环境变量配置

### 环境变量管理

EdgeOne 支持多种环境变量配置方式：

#### 1. 通过控制台配置（推荐）

```
项目设置 → 环境变量 → 添加变量
```

#### 2. 通过配置文件

创建 `edgeone.config.js`（可选）：

```javascript
export default {
  build: {
    command: 'pnpm build',
    output: 'dist/static',
  },
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  },
};
```

### 环境隔离策略

如果需要区分不同平台的环境：

#### 方案 1：使用相同的 Supabase 项目

```bash
# Netlify 和 EdgeOne 使用相同的环境变量
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**优点**：
- 数据统一
- 管理简单
- 成本低

**适用场景**：
- 生产环境
- 数据需要同步

#### 方案 2：使用不同的 Supabase 项目

```bash
# Netlify（海外用户）
VITE_SUPABASE_URL=https://project-1.supabase.co
VITE_SUPABASE_ANON_KEY=key-1

# EdgeOne（国内用户）
VITE_SUPABASE_URL=https://project-2.supabase.co
VITE_SUPABASE_ANON_KEY=key-2
```

**优点**：
- 环境隔离
- 可以独立测试
- 数据分离

**适用场景**：
- 测试环境
- 需要数据隔离

---

## 多平台部署说明

### 部署架构

```
GitHub 仓库 (主仓库)
    ├── 自动部署 → Netlify (海外访问)
    └── 同步到 → Gitee 仓库
                    └── 自动部署 → EdgeOne (国内访问)
```

### 工作流程

1. **开发阶段**
   ```bash
   # 本地开发
   git add .
   git commit -m "feat: 新功能"
   git push origin main
   ```

2. **自动部署**
   - GitHub 推送触发 Netlify 自动部署
   - 同时推送到 Gitee（如果配置了同步）
   - Gitee 推送触发 EdgeOne 自动部署

3. **访问应用**
   - 海外用户：访问 Netlify 域名
   - 国内用户：访问 EdgeOne 域名

### 同步策略

#### 自动同步（推荐）

使用 GitHub Actions 自动同步到 Gitee：

```yaml
# .github/workflows/sync-to-gitee.yml
name: Sync to Gitee

on:
  push:
    branches: [main]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Mirror to Gitee
        uses: wearerequired/git-mirror-action@v1
        env:
          SSH_PRIVATE_KEY: ${{ secrets.GITEE_PRIVATE_KEY }}
        with:
          source-repo: https://github.com/lpx0007/training-management-system.git
          destination-repo: git@gitee.com:your-username/training-management-system.git
```

#### 手动同步

```bash
# 推送到两个平台
git push origin main    # 推送到 GitHub
git push gitee main     # 推送到 Gitee

# 或者创建别名
git config alias.pushall '!git push origin main && git push gitee main'

# 使用别名
git pushall
```

### 域名配置

#### 智能 DNS 解析（推荐）

使用 DNS 服务商的智能解析功能：

```
training.example.com
├── 国内线路 → EdgeOne 域名
└── 海外线路 → Netlify 域名
```

**配置步骤**：
1. 在 DNS 服务商添加两条 CNAME 记录
2. 设置线路类型：
   - 记录 1：线路类型 = 国内，指向 EdgeOne
   - 记录 2：线路类型 = 海外，指向 Netlify

#### 独立域名

也可以使用不同的域名：

```
# 国内访问
cn.training.example.com → EdgeOne

# 海外访问
global.training.example.com → Netlify
```

---

## 常见问题

### Q1: EdgeOne 和 Netlify 会冲突吗？

**A**: 不会冲突。它们是完全独立的部署平台，互不影响。

### Q2: 需要维护两份代码吗？

**A**: 不需要。使用同一个代码仓库，通过 Git 同步即可。

### Q3: 环境变量需要配置两次吗？

**A**: 是的，需要在两个平台分别配置。但可以使用相同的值。

### Q4: 如何选择访问哪个平台？

**A**: 
- 方案 1：使用智能 DNS 自动分流
- 方案 2：提供两个不同的域名让用户选择
- 方案 3：在应用中检测用户地域并重定向

### Q5: 构建失败怎么办？

**A**: 检查以下几点：
1. 构建命令是否正确：`pnpm build`
2. 输出目录是否正确：`dist/static`
3. Node.js 版本是否匹配：18.x
4. 环境变量是否配置
5. 查看构建日志获取详细错误信息

### Q6: 如何回滚部署？

**A**: 
- EdgeOne 控制台 → 部署历史 → 选择历史版本 → 回滚
- 或者在 Git 中回滚代码并重新推送

### Q7: 可以只部署到 EdgeOne 吗？

**A**: 可以。如果只需要国内访问，可以只使用 EdgeOne。

### Q8: Gitee 仓库需要公开吗？

**A**: 不需要。EdgeOne 支持私有仓库部署。

### Q9: 部署费用如何？

**A**: 
- EdgeOne Pages 提供免费额度
- 超出免费额度后按量计费
- 具体价格查看腾讯云官网

### Q10: 如何监控两个平台的状态？

**A**: 
- 使用监控服务（如 UptimeRobot）
- 配置告警通知
- 定期检查部署状态

---

## 部署检查清单

### 部署前

- [ ] GitHub 仓库代码已更新
- [ ] 本地构建测试通过
- [ ] Netlify 部署正常运行
- [ ] Gitee 账号已注册
- [ ] 腾讯云账号已注册

### Gitee 配置

- [ ] 从 GitHub 导入仓库成功
- [ ] 仓库代码完整
- [ ] 配置了自动同步（可选）

### EdgeOne 配置

- [ ] 连接 Gitee 仓库成功
- [ ] 构建命令配置正确
- [ ] 输出目录配置正确
- [ ] 环境变量已添加
- [ ] Node.js 版本正确

### 部署后

- [ ] 构建成功
- [ ] 网站可以访问
- [ ] 功能测试通过
- [ ] 环境变量生效
- [ ] 配置自定义域名（可选）

---

## 推荐配置

### 最佳实践配置

```yaml
# EdgeOne 构建配置
框架: Vite
构建命令: pnpm build
输出目录: dist/static
Node 版本: 18.x
包管理器: pnpm

# 环境变量
VITE_SUPABASE_URL: [你的 Supabase URL]
VITE_SUPABASE_ANON_KEY: [你的 Supabase Key]

# 自动部署
分支: main
自动部署: 开启
```

### 性能优化建议

1. **启用 CDN 加速**
   - EdgeOne 自动提供 CDN
   - 配置缓存策略

2. **配置缓存规则**
   ```
   /assets/* - 缓存 1 年
   /*.html - 不缓存
   ```

3. **启用 Gzip 压缩**
   - EdgeOne 默认启用

4. **配置 HTTP/2**
   - EdgeOne 默认支持

---

## 相关文档

- [项目完整文档](./PROJECT_DOCUMENTATION.md)
- [Supabase 快速入门](./SUPABASE_QUICKSTART.md)
- [EdgeOne 官方文档](https://cloud.tencent.com/document/product/1552)
- [Gitee 帮助文档](https://gitee.com/help)

---

## 技术支持

如有问题，可以：
- 查看 EdgeOne 控制台的构建日志
- 参考腾讯云文档
- 提交 Issue 到项目仓库
- 联系项目维护者

---

**文档版本**: v1.0.0  
**最后更新**: 2024-01-XX  
**适用平台**: EdgeOne Pages  
**维护者**: [项目维护者]
