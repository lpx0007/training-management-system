# 开发服务器管理工具使用指南

## 📦 批处理文件说明

### 1. `start-dev.bat` ⭐ 快速启动
**功能**: 启动开发服务器
**使用**: 双击运行
**停止**: 按 Ctrl+C

```
特点:
✓ 自动检查环境 (Node.js, pnpm)
✓ 一键启动
✓ 显示服务器地址
✓ 纯英文界面,避免编码问题
```

---

### 2. `stop-dev.bat` 🛑 快速关闭
**功能**: 关闭正在运行的开发服务器
**使用**: 双击运行

```
特点:
✓ 自动查找3000端口进程
✓ 强制关闭进程
✓ 清理端口占用
```

**何时使用**:
- 端口被占用无法启动
- 服务器窗口关闭但进程仍在运行
- 需要快速关闭服务器

---

### 3. `manage-dev.bat` 🎯 全能管理工具
**功能**: 一站式服务器管理面板
**使用**: 双击运行，选择菜单选项

```
菜单选项:
[1] Start/Restart Server  - 启动或重启服务器
[2] Stop Server           - 关闭服务器
[3] Check Status          - 查看详细状态
[4] Open in Browser       - 在浏览器打开
[0] Exit                  - 退出
```

```
特点:
✓ 实时显示服务器状态
✓ 彩色界面
✓ 新窗口启动服务器
✓ 一键在浏览器打开
```

---

## 🚀 快速开始

### 方式一: 简单快速 (推荐新手)
```
1. 双击 start-dev.bat
2. 等待服务器启动
3. 浏览器访问 http://localhost:3000
4. 开发完成后按 Ctrl+C
```

### 方式二: 全功能管理 (推荐老手)
```
1. 双击 manage-dev.bat
2. 选择 [1] Start Server
3. 选择 [4] Open in Browser
4. 需要关闭时选择 [2] Stop Server
```

### 方式三: PowerShell命令 (最灵活)
```powershell
# 启动
pnpm run dev

# 停止
Ctrl+C

# 查看端口
netstat -ano | findstr :3000

# 强制关闭进程
taskkill /F /PID [进程ID]
```

---

## 💡 使用技巧

### 技巧1: 创建桌面快捷方式
```
1. 右键 start-dev.bat
2. 发送到 → 桌面快捷方式
3. 下次双击桌面图标即可
```

### 技巧2: 固定到任务栏
```
1. 右键 start-dev.bat
2. 创建快捷方式
3. 右键快捷方式 → 固定到任务栏
```

### 技巧3: 批处理文件在PowerShell中运行
```powershell
# 方式1: 直接运行
.\start-dev.bat

# 方式2: 使用cmd执行
cmd /c start-dev.bat

# 方式3: 直接用命令 (推荐)
pnpm run dev
```

---

## ⚠️ 常见问题

### Q1: "pnpm not found"
**原因**: pnpm未安装或未配置环境变量
**解决**:
```powershell
npm install -g pnpm
```

### Q2: 端口被占用
**症状**: `EADDRINUSE: address already in use :::3000`
**解决**:
```
1. 双击 stop-dev.bat
2. 或在manage-dev.bat中选择 [2] Stop Server
3. 重新启动服务器
```

### Q3: 批处理文件双击没反应
**原因**: 可能被安全软件阻止
**解决**:
```
1. 右键 → 以管理员身份运行
2. 或在PowerShell中运行: .\start-dev.bat
3. 或直接用命令: pnpm run dev
```

### Q4: 中文乱码
**原因**: 新版本已使用纯英文界面
**说明**: 如果仍有问题,直接在PowerShell中运行:
```powershell
pnpm run dev
```

---

## 📝 开发流程建议

### 日常开发流程
```
1. 双击 start-dev.bat 或运行 pnpm run dev
2. 等待启动完成 (通常10-30秒)
3. 浏览器访问 http://localhost:3000
4. 开始编码
5. 保存文件 (自动热更新)
6. 浏览器查看效果
7. 完成后按 Ctrl+C 关闭
```

### 多人协作开发
```
启动后会显示两个地址:
- Local:   http://localhost:3000      (本机访问)
- Network: http://192.168.x.x:3000    (局域网访问)

团队成员可使用Network地址在同一网络内访问
```

---

## 🔧 高级配置

### 修改端口
编辑 `vite.config.ts`:
```typescript
server: {
  port: 3001,  // 修改为其他端口
  host: true,
}
```

然后相应修改批处理文件中的端口号:
- 搜索 `:3000`
- 替换为新端口 (如 `:3001`)

### 自动打开浏览器
修改 `package.json`:
```json
"dev": "vite --host --port 3000 --open"
```

---

## 📊 文件对比

| 文件 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| start-dev.bat | 简单快速 | 当前窗口运行 | 日常开发 |
| stop-dev.bat | 快速关闭 | 单一功能 | 端口清理 |
| manage-dev.bat | 功能全面 | 略复杂 | 频繁管理 |
| PowerShell命令 | 最灵活 | 需记命令 | 高级用户 |

---

## 🎯 推荐配置

### 初学者
```
主要使用: start-dev.bat
辅助工具: stop-dev.bat
```

### 进阶用户
```
主要使用: manage-dev.bat
备用方案: PowerShell命令
```

### 高级用户
```
主要使用: PowerShell命令
辅助工具: manage-dev.bat (查看状态)
```

---

## 📌 快速命令参考

### PowerShell 常用命令
```powershell
# 启动开发服务器
pnpm run dev

# 构建生产版本
pnpm run build

# 预览构建结果
pnpm run preview

# 安装依赖
pnpm install

# 查看端口占用
netstat -ano | findstr :3000

# 结束进程
taskkill /F /PID [进程ID]

# 清理依赖重装
Remove-Item -Recurse -Force node_modules
pnpm install
```

---

## 🎊 总结

### 最简单的方式
```
双击 start-dev.bat → 等待启动 → 开始开发
```

### 最可靠的方式
```
PowerShell中运行: pnpm run dev
```

### 最全面的方式
```
使用 manage-dev.bat 管理所有操作
```

---

## 🔗 相关文档

- 项目README: `README.md`
- 开发环境配置: `docs/开发环境就绪.md`
- 部署说明: `netlify.toml`

---

## ✨ 提示

- ✅ 所有批处理文件都使用英文界面
- ✅ 避免了中文编码问题
- ✅ 兼容PowerShell和CMD
- ✅ 可在任何Windows环境运行

祝开发愉快! 🚀
