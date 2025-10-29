# ============================================
# Supabase 数据库自动备份脚本 (PowerShell)
# ============================================
# 
# 使用方法：
# 1. 安装 Supabase CLI: npm install -g supabase
# 2. 登录 Supabase: supabase login
# 3. 运行脚本: .\scripts\backup-database.ps1
# 
# ============================================

# 项目配置
$PROJECT_ID = "qinpsvempgjjocjfjvpc"
$BACKUP_DIR = "database-backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR/backup_$TIMESTAMP.sql"
$LATEST_BACKUP = "database-backup-current.sql"

Write-Host "========================================" -ForegroundColor Green
Write-Host "Supabase 数据库备份工具" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 检查 Supabase CLI 是否安装
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✓ Supabase CLI 已安装" -ForegroundColor Green
} catch {
    Write-Host "错误: Supabase CLI 未安装" -ForegroundColor Red
    Write-Host "请运行: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "正在检查登录状态..." -ForegroundColor Yellow

# 检查是否已登录
try {
    $null = supabase projects list 2>&1
    Write-Host "✓ 已登录 Supabase" -ForegroundColor Green
} catch {
    Write-Host "错误: 未登录 Supabase" -ForegroundColor Red
    Write-Host "请运行: supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 创建备份目录
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "✓ 已创建备份目录: $BACKUP_DIR" -ForegroundColor Green
}

Write-Host "正在连接到项目: $PROJECT_ID" -ForegroundColor Yellow
Write-Host ""

# 注意：这个脚本需要 pg_dump 工具
# 如果没有安装 PostgreSQL，可以使用 Node.js 脚本代替

Write-Host "正在导出数据库结构..." -ForegroundColor Yellow
Write-Host ""
Write-Host "注意: 此脚本需要 PostgreSQL 的 pg_dump 工具" -ForegroundColor Yellow
Write-Host "如果未安装，请使用 Node.js 备份脚本: node scripts/backup-database.js" -ForegroundColor Yellow
Write-Host ""

# 检查 pg_dump 是否可用
try {
    $null = Get-Command pg_dump -ErrorAction Stop
    Write-Host "✓ pg_dump 已安装" -ForegroundColor Green
    
    # 这里需要数据库连接字符串
    # 你需要从 Supabase Dashboard 获取
    Write-Host ""
    Write-Host "请从 Supabase Dashboard 获取数据库连接字符串" -ForegroundColor Yellow
    Write-Host "位置: Project Settings > Database > Connection string" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "或者使用 Node.js 备份脚本: node scripts/backup-database.js" -ForegroundColor Yellow
    
} catch {
    Write-Host "pg_dump 未安装" -ForegroundColor Yellow
    Write-Host "请使用 Node.js 备份脚本: node scripts/backup-database.js" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "提示: 推荐使用 Node.js 备份脚本" -ForegroundColor Green
Write-Host "运行: node scripts/backup-database.js" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
