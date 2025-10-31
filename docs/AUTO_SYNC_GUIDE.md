# 🔄 GitHub 到 Gitee 自动同步配置指南

本指南详细说明如何配置 GitHub Actions，实现 GitHub 更新时自动同步到 Gitee。

---

## 📋 目录

1. [同步方式对比](#同步方式对比)
2. [自动同步配置](#自动同步配置)
3. [验证和测试](#验证和测试)
4. [故障排查](#故障排查)
5. [其他同步方案](#其他同步方案)

---

## 同步方式对比

### ❌ 默认情况（不自动同步）

```
GitHub 更新 → ❌ Gitee 不会自动更新
```

**特点**：
- 需要手动推送到 Gitee
- 容易忘记同步
- 两个仓库可能不一致

### ✅ 自动同步（推荐）

```
GitHub 更新 → ✅ GitHub Actions 自动同步 → ✅ Gitee 自动更新 → ✅ EdgeOne 自动部署
```

**特点**：
- 完全自动化
- 保证两个仓库同步
- 一次推送，两个平台都部署

---

## 自动同步配置

### 方法 1：使用 GitHub Actions（推荐）⭐

#### 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│  开发者推送代码到 GitHub                                     │
│  git push origin main                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub 检测到推送                                           │
│  触发 GitHub Actions 工作流                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub Actions 执行同步任务                                 │
│  1. 检出代码                                                 │
│  2. 使用 SSH 密钥连接 Gitee                                  │
│  3. 推送代码到 Gitee                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Gitee 接收更新                                              │
│  触发 EdgeOne 自动部署                                       │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  EdgeOne 自动构建和部署                                      │
│  网站更新完成                                                │
└─────────────────────────────────────────────────────────────┘
```

#### 配置步骤

##### 步骤 1：生成 SSH 密钥对

在本地终端执行：

```bash
# 生成 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "github-actions@sync" -f gitee_deploy_key -N ""

# 会生成两个文件：
# gitee_deploy_key       (私钥 - 用于 GitHub)
# gitee_deploy_key.pub   (公钥 - 用于 Gitee)
```

**查看密钥内容**：

```bash
# Windows PowerShell
Get-Content gitee_deploy_key      # 私钥
Get-Content gitee_deploy_key.pub  # 公钥

# Linux/Mac
cat gitee_deploy_key      # 私钥
cat gitee_deploy_key.pub  # 公钥
```

##### 步骤 2：配置 Gitee 部署公钥

1. **登录 Gitee**
   - 访问：https://gitee.com

2. **进入仓库设置**
   - 打开你的仓库：`https://gitee.com/lpx007/training-management`
   - 点击 **管理** 或 **设置**

3. **添加部署公钥**
   - 左侧菜单：**部署公钥管理**
   - 点击 **添加部署公钥**

4. **填写信息**
   ```
   标题: GitHub Actions Auto Sync
   公钥: [粘贴 gitee_deploy_key.pub 的内容]
   ✅ 勾选: 允许推送
   ```

5. **保存**
   - 点击 **确定** 或 **添加**

**重要**：必须勾选 **允许推送**，否则无法同步！

##### 步骤 3：配置 GitHub Secret

1. **登录 GitHub**
   - 访问：https://github.com

2. **进入仓库设置**
   - 打开你的仓库：`https://github.com/lpx0007/training-management-system`
   - 点击 **Settings**（设置）

3. **添加 Secret**
   - 左侧菜单：**Secrets and variables** → **Actions**
   - 点击 **New repository secret**

4. **填写信息**
   ```
   Name: GITEE_PRIVATE_KEY
   Secret: [粘贴 gitee_deploy_key 的完整内容，包括开头和结尾]
   ```

   **私钥格式示例**：
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
   ... (中间很多行)
   -----END OPENSSH PRIVATE KEY-----
   ```

5. **保存**
   - 点击 **Add secret**

##### 步骤 4：验证工作流文件

确认 `.github/workflows/sync-to-gitee.yml` 文件存在且配置正确：

```yaml
name: Sync to Gitee

on:
  push:
    branches:
      - main
  workflow_dispatch:  # 允许手动触发

jobs:
  sync:
    runs-on: ubuntu-latest
    name: 同步代码到 Gitee
    
    steps:
      - name: 检出代码
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: 同步到 Gitee
        uses: wearerequired/git-mirror-action@v1
        env:
          SSH_PRIVATE_KEY: ${{ secrets.GITEE_PRIVATE_KEY }}
        with:
          source-repo: https://github.com/${{ github.repository }}.git
          destination-repo: git@gitee.com:lpx007/training-management.git

      - name: 同步成功通知
        if: success()
        run: |
          echo "✅ 成功同步到 Gitee"

      - name: 同步失败通知
        if: failure()
        run: |
          echo "❌ 同步到 Gitee 失败"
```

**重要配置项**：
- `destination-repo`: 确保是你的 Gitee 仓库地址
- `GITEE_PRIVATE_KEY`: 必须与 GitHub Secret 名称一致

##### 步骤 5：提交工作流文件

```bash
# 添加工作流文件
git add .github/workflows/sync-to-gitee.yml

# 提交
git commit -m "feat: 添加 GitHub 到 Gitee 自动同步"

# 推送到 GitHub
git push origin main
```

---

## 验证和测试

### 测试自动同步

#### 方法 1：推送代码测试

```bash
# 1. 修改一个文件（例如 README.md）
echo "测试自动同步" >> README.md

# 2. 提交并推送
git add README.md
git commit -m "test: 测试自动同步"
git push origin main

# 3. 观察 GitHub Actions
```

#### 方法 2：手动触发测试

1. 访问 GitHub 仓库
2. 点击 **Actions** 标签
3. 选择 **Sync to Gitee** 工作流
4. 点击 **Run workflow** → **Run workflow**
5. 等待执行完成

### 查看执行结果

1. **GitHub Actions 页面**
   - 访问：`https://github.com/your-username/training-management-system/actions`
   - 查看最新的工作流运行
   - 绿色 ✅ = 成功
   - 红色 ❌ = 失败

2. **查看详细日志**
   - 点击工作流运行记录
   - 查看每个步骤的输出
   - 如果失败，查看错误信息

3. **验证 Gitee**
   - 访问：`https://gitee.com/lpx007/training-management`
   - 检查代码是否已更新
   - 查看最新提交时间

4. **验证 EdgeOne**
   - 访问 EdgeOne 控制台
   - 查看是否触发了新的部署
   - 访问网站验证更新

---

## 故障排查

### 问题 1：同步失败 - Permission denied

**错误信息**：
```
Permission denied (publickey)
```

**原因**：
- SSH 密钥配置不正确
- Gitee 没有添加公钥
- 没有勾选"允许推送"

**解决方案**：
1. 检查 Gitee 部署公钥是否已添加
2. 确认勾选了"允许推送"
3. 检查 GitHub Secret 中的私钥是否完整
4. 重新生成密钥对并配置

### 问题 2：同步失败 - Repository not found

**错误信息**：
```
fatal: repository 'git@gitee.com:xxx/xxx.git' not found
```

**原因**：
- 仓库地址错误
- 仓库不存在
- 没有访问权限

**解决方案**：
1. 检查工作流文件中的 `destination-repo` 地址
2. 确认 Gitee 仓库已创建
3. 确认仓库地址格式正确：`git@gitee.com:username/repo.git`

### 问题 3：同步成功但 EdgeOne 没有部署

**原因**：
- EdgeOne 没有配置自动部署
- EdgeOne 部署失败

**解决方案**：
1. 检查 EdgeOne 控制台的部署设置
2. 确认已启用自动部署
3. 查看 EdgeOne 构建日志
4. 检查环境变量配置

### 问题 4：GitHub Actions 没有触发

**原因**：
- 工作流文件路径错误
- 工作流文件语法错误
- 分支名称不匹配

**解决方案**：
1. 确认文件路径：`.github/workflows/sync-to-gitee.yml`
2. 检查 YAML 语法是否正确
3. 确认推送的分支是 `main`
4. 查看 GitHub Actions 页面是否有错误提示

### 问题 5：部分文件没有同步

**原因**：
- `.gitignore` 排除了某些文件
- 文件太大被忽略

**解决方案**：
1. 检查 `.gitignore` 配置
2. 确认文件已提交到 GitHub
3. 使用 `git status` 检查文件状态

---

## 其他同步方案

### 方案 2：使用 Gitee 的强制同步功能

Gitee 提供了从 GitHub 强制同步的功能：

1. 登录 Gitee
2. 进入仓库页面
3. 点击 **管理** → **仓库镜像管理**
4. 添加 GitHub 仓库作为镜像源
5. 设置定时同步（每小时/每天）

**优点**：
- 无需配置 SSH 密钥
- Gitee 官方功能

**缺点**：
- 需要手动配置
- 同步频率有限制
- 可能有延迟

### 方案 3：使用本地脚本同步

使用我们提供的同步脚本：

```bash
# Windows
.\scripts\sync-to-gitee.ps1 "提交信息"

# Linux/Mac
./scripts/sync-to-gitee.sh "提交信息"
```

**优点**：
- 简单直接
- 完全控制

**缺点**：
- 需要手动执行
- 容易忘记

### 方案 4：使用 Git Hooks

在本地配置 Git Hooks，推送到 GitHub 时自动推送到 Gitee：

```bash
# 创建 post-commit hook
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash
git push gitee main
EOF

# 添加执行权限
chmod +x .git/hooks/post-commit
```

**优点**：
- 本地自动化
- 无需配置云服务

**缺点**：
- 只在本地有效
- 团队成员需要各自配置

---

## 最佳实践

### 1. 使用 GitHub Actions（推荐）

**原因**：
- ✅ 完全自动化
- ✅ 云端执行，不依赖本地
- ✅ 团队成员无需额外配置
- ✅ 有详细的执行日志
- ✅ 支持手动触发

### 2. 定期检查同步状态

```bash
# 检查两个仓库的最新提交
git log origin/main -1  # GitHub
git log gitee/main -1   # Gitee
```

### 3. 配置通知

在 GitHub Actions 中配置失败通知：

```yaml
- name: 发送通知
  if: failure()
  uses: actions/github-script@v6
  with:
    script: |
      github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: '同步到 Gitee 失败',
        body: '请检查同步配置'
      })
```

### 4. 保护密钥安全

- ✅ 不要将私钥提交到代码仓库
- ✅ 使用 GitHub Secrets 存储敏感信息
- ✅ 定期更换 SSH 密钥
- ✅ 限制密钥权限（只允许推送）

---

## 配置检查清单

### GitHub 配置

- [ ] `.github/workflows/sync-to-gitee.yml` 文件已创建
- [ ] 工作流文件中的仓库地址正确
- [ ] GitHub Secret `GITEE_PRIVATE_KEY` 已添加
- [ ] 私钥内容完整（包括开头和结尾）

### Gitee 配置

- [ ] Gitee 仓库已创建
- [ ] 部署公钥已添加
- [ ] ✅ 已勾选"允许推送"
- [ ] 公钥内容正确

### 测试验证

- [ ] 推送代码到 GitHub
- [ ] GitHub Actions 成功执行
- [ ] Gitee 仓库已更新
- [ ] EdgeOne 自动部署成功

---

## 常见问题

### Q1: 同步会覆盖 Gitee 的修改吗？

**A**: 是的。GitHub Actions 会强制同步，Gitee 上的独立修改会被覆盖。建议只在 GitHub 上修改代码。

### Q2: 可以双向同步吗？

**A**: 不建议。双向同步容易产生冲突。建议选择一个主仓库（GitHub），其他仓库作为镜像。

### Q3: 同步需要多长时间？

**A**: 通常 1-2 分钟。取决于代码量和网络状况。

### Q4: 会同步所有分支吗？

**A**: 默认只同步 `main` 分支。如需同步其他分支，修改工作流配置。

### Q5: 同步失败会影响 GitHub 吗？

**A**: 不会。同步失败只影响 Gitee，GitHub 不受影响。

---

## 总结

### ✅ 推荐配置

1. **使用 GitHub Actions 自动同步**
2. **配置 SSH 密钥认证**
3. **启用手动触发选项**
4. **配置失败通知**

### 🎯 最终效果

```
你只需要：
1. 在本地开发
2. 推送到 GitHub

然后：
✅ GitHub Actions 自动同步到 Gitee
✅ Netlify 自动部署（GitHub）
✅ EdgeOne 自动部署（Gitee）
✅ 两个平台都更新完成
```

**一次推送，两个平台自动部署！** 🚀

---

**文档版本**: v1.0.0  
**最后更新**: 2024-01-XX  
**维护者**: [项目维护者]
