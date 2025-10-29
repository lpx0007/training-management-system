# 数据库备份系统

## 📁 目录结构

```
database-backup/
├── README.md              # 本文件 - 使用说明
├── backup.js              # 备份脚本
├── backup.bat             # Windows 快捷方式
├── current-schema.sql     # 当前数据库结构模板
└── history/               # 历史备份目录（自动创建）
    ├── backup_20250127_141530.sql
    ├── backup_20250126_141530.sql
    └── ...                # 保留最近 10 个备份
```

---

## 🚀 快速开始

### 方法 1: 使用批处理文件（最简单）

双击 `backup.bat` 文件即可！

### 方法 2: 使用命令行

```bash
# 进入备份目录
cd database-backup

# 运行备份
node backup.js
```

### 方法 3: 从项目根目录运行

```bash
node database-backup/backup.js
```

---

## 📋 工作原理

1. **读取模板**: 读取 `current-schema.sql`（当前数据库结构）
2. **添加时间戳**: 在文件开头添加生成时间和项目信息
3. **保存备份**: 保存到 `history/backup_YYYYMMDD_HHMMSS.sql`
4. **自动清理**: 保留最近 10 个备份，删除更早的

---

## 🔄 更新数据库结构模板

当数据库结构发生变化时（添加表、修改字段等），需要更新 `current-schema.sql`：

### 方法 1: 使用 Supabase CLI（推荐）

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 导出最新结构到备份目录
supabase db dump --project-ref qinpsvempgjjocjfjvpc > database-backup/current-schema.sql
```

### 方法 2: 使用 pg_dump

```bash
# 从 Supabase Dashboard 获取数据库连接字符串
# Project Settings > Database > Connection string

pg_dump "your_database_url" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > database-backup/current-schema.sql
```

### 方法 3: 手动编辑

直接编辑 `current-schema.sql` 文件

---

## 📦 备份内容

每个备份文件包含：

- ✅ 所有表结构（CREATE TABLE）
- ✅ 所有索引（CREATE INDEX）
- ✅ 所有约束（PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK）
- ✅ 所有触发器（CREATE TRIGGER）
- ✅ 所有 RLS 策略（CREATE POLICY）
- ✅ 默认数据（INSERT INTO permissions）
- ✅ 生成时间戳和项目信息

**不包含**：
- ❌ 用户数据（只有结构，不包含数据）
- ❌ auth.users 表（由 Supabase 管理）

---

## 🔧 自动化备份

### 方法 1: Windows 任务计划程序

1. 打开"任务计划程序"
2. 创建基本任务
3. 触发器：每天凌晨 2 点
4. 操作：启动程序
   - 程序：`E:\培训机构业务通\database-backup\backup.bat`

### 方法 2: 添加到 package.json

在项目根目录的 `package.json` 中添加：

```json
{
  "scripts": {
    "backup": "node database-backup/backup.js"
  }
}
```

然后运行：

```bash
npm run backup
```

---

## 📝 恢复数据库

### 从备份恢复

1. 在 Supabase Dashboard 中打开 SQL Editor
2. 复制备份文件的内容
3. 执行 SQL

或者使用 psql：

```bash
psql "your_database_url" < database-backup/history/backup_YYYYMMDD_HHMMSS.sql
```

### ⚠️ 注意事项

- 恢复会删除现有表（因为使用了 `DROP TABLE IF EXISTS`）
- 建议在新项目中测试恢复
- 恢复前请确保有完整备份

---

## 🔍 查看备份历史

```bash
# Windows
dir database-backup\history

# Linux/Mac
ls -lh database-backup/history
```

---

## ❓ 常见问题

### Q: 备份包含数据吗？

A: 不包含。只备份数据库结构（表、索引、约束等），不包含实际数据。

### Q: 如何备份数据？

A: 使用 Supabase Dashboard 的导出功能，或使用 `pg_dump` 不带 `--schema-only` 参数。

### Q: 备份文件安全吗？

A: 备份文件包含数据库结构信息，建议不要提交到公共 Git 仓库。已在 `.gitignore` 中排除。

### Q: 为什么要保留历史备份？

A: 可以回溯到之前的数据库结构版本，用于对比变更或恢复到特定时间点。

### Q: 可以修改保留的备份数量吗？

A: 可以。编辑 `backup.js` 文件，找到 `files.slice(10)` 这一行，将 10 改为你想要的数量。

---

## 📊 备份统计

运行备份后，脚本会显示：

```
========================================
Supabase 数据库备份工具
========================================

正在生成备份...

✓ 备份已保存到: database-backup/history/backup_20250127_141530.sql
✓ 备份文件大小: 45.23 KB

正在清理旧备份...
✓ 当前保留 10 个历史备份

========================================
备份完成！
========================================

当前模板: database-backup/current-schema.sql
最新备份: database-backup/history/backup_20250127_141530.sql
历史目录: database-backup/history
```

---

## 🎯 最佳实践

1. **定期备份**
   - 每天自动备份一次
   - 重大更改前手动备份
   - 部署前备份

2. **更新模板**
   - 数据库结构变化后立即更新 `current-schema.sql`
   - 使用 Supabase CLI 自动导出
   - 提交模板到 Git（但不提交历史备份）

3. **测试恢复**
   - 定期测试备份恢复流程
   - 在测试环境中验证备份完整性

4. **云存储**
   - 定期上传历史备份到云存储（Google Drive, OneDrive 等）
   - 保持异地备份

---

## 📚 相关文件

- `current-schema.sql` - 当前数据库结构模板
- `backup.js` - 备份脚本
- `backup.bat` - Windows 快捷方式
- `history/` - 历史备份目录
- `README.md` - 本文件

---

## 🆘 故障排除

### 问题 1: "未找到数据库结构模板文件"

**解决方案**: 确保 `current-schema.sql` 文件存在于 `database-backup` 目录中。

### 问题 2: 无法创建历史目录

**解决方案**: 检查文件权限，确保有写入权限。

### 问题 3: 备份文件太大

**解决方案**: 这是正常的，完整的数据库结构可能有几十 KB。如果超过 1MB，检查是否包含了数据。

---

## 📅 更新日志

### 2025-01-27
- ✅ 创建备份系统
- ✅ 创建 Node.js 备份脚本
- ✅ 创建 Windows 批处理文件
- ✅ 添加自动清理功能
- ✅ 创建使用文档

---

## 💡 提示

- 备份很快，通常只需要几秒钟
- 历史备份会自动清理，不用担心占用太多空间
- 可以随时查看历史备份，对比数据库结构的变化
- 建议每次修改数据库结构后都运行一次备份

---

**需要帮助？** 查看本文档或联系开发团队。
