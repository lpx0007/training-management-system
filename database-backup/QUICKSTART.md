# 快速开始 - 数据库备份

## 🎯 最简单的方法

### Windows 用户

**双击 `backup.bat` 文件即可！**

就这么简单！✨

---

### 命令行用户

```bash
# 进入备份目录
cd database-backup

# 运行备份
node backup.js
```

---

## 📋 第一次使用

### 1. 确认文件存在

确保 `database-backup` 目录中有以下文件：

- ✅ `backup.js` - 备份脚本
- ✅ `backup.bat` - Windows 快捷方式
- ✅ `current-schema.sql` - 数据库结构模板
- ✅ `README.md` - 详细文档

### 2. 运行备份

双击 `backup.bat` 或运行 `node backup.js`

### 3. 查看结果

备份文件会保存在 `history/` 目录中：

```
database-backup/
└── history/
    └── backup_20250127_141530.sql  ← 你的备份
```

---

## 🔄 日常使用

### 什么时候需要备份？

- ✅ 每天（可以设置自动任务）
- ✅ 修改数据库结构前
- ✅ 部署新功能前
- ✅ 重大更新前

### 如何备份？

双击 `backup.bat` 或运行 `node backup.js`

### 备份保存在哪里？

`database-backup/history/` 目录，自动保留最近 10 个备份

---

## 📝 更新数据库结构

当你在 Supabase 中修改了数据库结构（添加表、修改字段等），需要更新模板：

### 最简单的方法

```bash
# 安装 Supabase CLI（只需一次）
npm install -g supabase

# 登录（只需一次）
supabase login

# 导出最新结构
supabase db dump --project-ref qinpsvempgjjocjfjvpc > database-backup/current-schema.sql
```

然后再运行备份即可。

---

## ❓ 常见问题

### Q: 备份包含数据吗？

A: 不包含。只备份数据库结构，不包含实际数据。

### Q: 备份文件在哪里？

A: `database-backup/history/` 目录

### Q: 会占用很多空间吗？

A: 不会。每个备份约 40-50 KB，保留 10 个约 500 KB。

### Q: 如何恢复备份？

A: 在 Supabase Dashboard 的 SQL Editor 中执行备份文件的内容。

---

## 🎉 就这么简单！

现在你可以：

1. ✅ 双击 `backup.bat` 运行备份
2. ✅ 在 `history/` 目录查看历史备份
3. ✅ 随时恢复到之前的数据库结构

**需要更多帮助？** 查看 `README.md` 获取详细文档。
