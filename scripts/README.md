# 数据库备份脚本使用说明

## 概述

提供了三种数据库备份方式，你可以根据自己的环境选择：

1. **Node.js 脚本**（推荐，跨平台）
2. **PowerShell 脚本**（Windows）
3. **Bash 脚本**（Linux/Mac）

## 方法 1: Node.js 脚本（推荐）

### 优点
- ✅ 跨平台（Windows/Linux/Mac）
- ✅ 不需要安装 PostgreSQL
- ✅ 使用现有的 Supabase 配置
- ✅ 自动清理旧备份

### 使用步骤

#### 1. 确保已安装依赖

```bash
npm install
```

#### 2. 配置环境变量

确保 `.env` 文件中有以下配置：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

或者添加 Service Role Key（更完整的权限）：

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 3. 运行备份脚本

```bash
node scripts/backup-database.js
```

### 输出

- **最新备份**: `database-backup-current.sql`（始终是最新的）
- **历史备份**: `database-backups/backup_YYYYMMDD_HHMMSS.sql`
- **自动清理**: 保留最近 10 个历史备份

---

## 方法 2: PowerShell 脚本（Windows）

### 前提条件

1. 安装 Supabase CLI:
   ```powershell
   npm install -g supabase
   ```

2. 登录 Supabase:
   ```powershell
   supabase login
   ```

3. 安装 PostgreSQL（可选，用于 pg_dump）

### 使用步骤

```powershell
.\scripts\backup-database.ps1
```

**注意**: 如果没有安装 PostgreSQL，脚本会提示使用 Node.js 版本。

---

## 方法 3: Bash 脚本（Linux/Mac）

### 前提条件

1. 安装 Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. 登录 Supabase:
   ```bash
   supabase login
   ```

3. 安装 PostgreSQL（用于 pg_dump）:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-client
   
   # macOS
   brew install postgresql
   ```

### 使用步骤

```bash
# 添加执行权限
chmod +x scripts/backup-database.sh

# 运行脚本
./scripts/backup-database.sh
```

---

## 自动化备份

### 方法 1: 使用 npm scripts

在 `package.json` 中添加：

```json
{
  "scripts": {
    "backup": "node scripts/backup-database.js",
    "backup:daily": "node scripts/backup-database.js"
  }
}
```

然后运行：

```bash
npm run backup
```

### 方法 2: 使用 Windows 任务计划程序

1. 打开"任务计划程序"
2. 创建基本任务
3. 触发器：每天
4. 操作：启动程序
   - 程序：`node`
   - 参数：`E:\培训机构业务通\scripts\backup-database.js`
   - 起始于：`E:\培训机构业务通`

### 方法 3: 使用 Linux Cron

编辑 crontab：

```bash
crontab -e
```

添加每天凌晨 2 点执行备份：

```cron
0 2 * * * cd /path/to/project && node scripts/backup-database.js >> backup.log 2>&1
```

---

## 备份文件说明

### 文件结构

```
project/
├── database-backup-current.sql          # 最新备份（始终更新）
├── database-backups/                    # 历史备份目录
│   ├── backup_20250127_143022.sql
│   ├── backup_20250126_143022.sql
│   └── ...                              # 保留最近 10 个
└── scripts/
    ├── backup-database.js               # Node.js 备份脚本
    ├── backup-database.ps1              # PowerShell 备份脚本
    └── backup-database.sh               # Bash 备份脚本
```

### 备份内容

每个备份文件包含：

- ✅ 所有表结构（CREATE TABLE）
- ✅ 所有索引（CREATE INDEX）
- ✅ 所有约束（PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK）
- ✅ 所有触发器（CREATE TRIGGER）
- ✅ 所有 RLS 策略（CREATE POLICY）
- ✅ 默认数据（INSERT INTO permissions）
- ✅ 时间戳和项目信息

### 不包含的内容

- ❌ 用户数据（只有结构，不包含数据）
- ❌ auth.users 表（由 Supabase 管理）

---

## 恢复数据库

### 从备份恢复

1. 在 Supabase Dashboard 中打开 SQL Editor
2. 复制备份文件的内容
3. 执行 SQL

或者使用 psql：

```bash
psql "your_database_url" < database-backup-current.sql
```

### 注意事项

- ⚠️ 恢复会删除现有表（因为使用了 `DROP TABLE IF EXISTS`）
- ⚠️ 建议在新项目中测试恢复
- ⚠️ 恢复前请确保有完整备份

---

## 故障排除

### 问题 1: "未找到 Supabase 配置"

**解决方案**: 确保 `.env` 文件存在且包含正确的配置：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 问题 2: "连接失败"

**解决方案**: 
1. 检查网络连接
2. 确认 Supabase 项目状态（是否暂停）
3. 验证 API 密钥是否正确

### 问题 3: "权限不足"

**解决方案**: 使用 Service Role Key 而不是 Anon Key：

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Service Role Key 可以在 Supabase Dashboard > Project Settings > API 中找到。

### 问题 4: Windows 上无法运行 .sh 脚本

**解决方案**: 
1. 使用 PowerShell 脚本：`.\scripts\backup-database.ps1`
2. 或使用 Node.js 脚本：`node scripts/backup-database.js`
3. 或安装 Git Bash 来运行 .sh 脚本

---

## 最佳实践

### 1. 定期备份

- ✅ 每天自动备份一次
- ✅ 重大更改前手动备份
- ✅ 部署前备份

### 2. 备份存储

- ✅ 保留最近 10 个本地备份
- ✅ 定期上传到云存储（Google Drive, OneDrive, etc.）
- ✅ 使用版本控制（Git）管理备份模板

### 3. 测试恢复

- ✅ 定期测试备份恢复流程
- ✅ 在测试环境中验证备份完整性
- ✅ 记录恢复时间和步骤

### 4. 安全性

- ⚠️ 不要将备份文件提交到公共 Git 仓库
- ⚠️ 备份文件可能包含敏感的数据库结构信息
- ⚠️ 使用 `.gitignore` 排除 `database-backups/` 目录

---

## 更新备份模板

如果数据库结构发生重大变化，需要更新备份模板：

### 方法 1: 手动更新

1. 在 Supabase Dashboard 中查看最新的表结构
2. 手动编辑 `database-backup-current.sql`
3. 运行备份脚本验证

### 方法 2: 使用 pg_dump（推荐）

```bash
# 获取数据库连接字符串
# 从 Supabase Dashboard > Project Settings > Database

pg_dump "your_database_url" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > database-backup-current.sql
```

### 方法 3: 使用 Supabase CLI

```bash
supabase db dump --project-ref qinpsvempgjjocjfjvpc > database-backup-current.sql
```

---

## 相关文件

- `database-backup-current.sql` - 当前数据库结构备份
- `scripts/backup-database.js` - Node.js 备份脚本
- `scripts/backup-database.ps1` - PowerShell 备份脚本
- `scripts/backup-database.sh` - Bash 备份脚本
- `.gitignore` - 排除备份目录

---

## 支持

如果遇到问题：

1. 查看脚本输出的错误信息
2. 检查 Supabase Dashboard 中的项目状态
3. 验证环境变量配置
4. 查看本文档的故障排除部分

---

## 更新日志

### 2025-01-27
- ✅ 创建 Node.js 备份脚本
- ✅ 创建 PowerShell 备份脚本
- ✅ 创建 Bash 备份脚本
- ✅ 添加自动清理旧备份功能
- ✅ 添加使用文档
