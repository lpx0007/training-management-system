#!/bin/bash

# ============================================
# Supabase 数据库自动备份脚本
# ============================================
# 
# 使用方法：
# 1. 安装 Supabase CLI: npm install -g supabase
# 2. 登录 Supabase: supabase login
# 3. 运行脚本: ./scripts/backup-database.sh
# 
# ============================================

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_ID="qinpsvempgjjocjfjvpc"
BACKUP_DIR="database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
LATEST_BACKUP="database-backup-current.sql"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Supabase 数据库备份工具${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查 Supabase CLI 是否安装
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}错误: Supabase CLI 未安装${NC}"
    echo -e "${YELLOW}请运行: npm install -g supabase${NC}"
    exit 1
fi

echo -e "${YELLOW}正在检查登录状态...${NC}"

# 检查是否已登录
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}错误: 未登录 Supabase${NC}"
    echo -e "${YELLOW}请运行: supabase login${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 已登录 Supabase${NC}"
echo ""

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

echo -e "${YELLOW}正在连接到项目: ${PROJECT_ID}${NC}"
echo ""

# 使用 Supabase CLI 导出数据库结构
echo -e "${YELLOW}正在导出数据库结构...${NC}"

# 方法 1: 使用 pg_dump（需要数据库连接字符串）
# 获取数据库连接信息
DB_URL=$(supabase projects api-keys --project-ref ${PROJECT_ID} 2>/dev/null | grep "DB URL" | awk '{print $3}')

if [ -z "$DB_URL" ]; then
    echo -e "${RED}错误: 无法获取数据库连接信息${NC}"
    echo -e "${YELLOW}请手动设置 DB_URL 环境变量${NC}"
    exit 1
fi

# 使用 pg_dump 导出
echo -e "${YELLOW}正在使用 pg_dump 导出...${NC}"

pg_dump "${DB_URL}" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 数据库结构已导出到: ${BACKUP_FILE}${NC}"
    
    # 复制到最新备份文件
    cp "${BACKUP_FILE}" "${LATEST_BACKUP}"
    echo -e "${GREEN}✓ 已更新最新备份: ${LATEST_BACKUP}${NC}"
    
    # 显示文件大小
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}✓ 备份文件大小: ${FILE_SIZE}${NC}"
    
    # 清理旧备份（保留最近 10 个）
    echo ""
    echo -e "${YELLOW}正在清理旧备份...${NC}"
    cd "${BACKUP_DIR}"
    ls -t backup_*.sql | tail -n +11 | xargs -r rm
    BACKUP_COUNT=$(ls -1 backup_*.sql 2>/dev/null | wc -l)
    echo -e "${GREEN}✓ 当前保留 ${BACKUP_COUNT} 个备份文件${NC}"
    cd ..
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}备份完成！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "最新备份: ${LATEST_BACKUP}"
    echo -e "历史备份: ${BACKUP_FILE}"
    
else
    echo -e "${RED}✗ 备份失败${NC}"
    exit 1
fi
