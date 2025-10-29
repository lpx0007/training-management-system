#!/usr/bin/env node

/**
 * ============================================
 * Supabase 数据库自动备份脚本
 * ============================================
 * 
 * 使用方法：
 * 1. 进入备份目录: cd database-backup
 * 2. 运行脚本: node backup.js
 * 
 * 或从项目根目录运行:
 * node database-backup/backup.js
 * 
 * ============================================
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 获取脚本所在目录（database-backup 目录）
const SCRIPT_DIR = __dirname;
const TEMPLATE_FILE = path.join(SCRIPT_DIR, 'current-schema.sql');
const HISTORY_DIR = path.join(SCRIPT_DIR, 'history');

// 生成时间戳
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hour}${minute}${second}`;
}

// 生成备份
async function generateBackup() {
  log('========================================', 'green');
  log('Supabase 数据库备份工具', 'green');
  log('========================================', 'green');
  log('');

  // 检查模板文件是否存在
  if (!fs.existsSync(TEMPLATE_FILE)) {
    log('错误: 未找到数据库结构模板文件', 'red');
    log(`期望位置: ${TEMPLATE_FILE}`, 'yellow');
    log('', '');
    log('请先创建 current-schema.sql 文件', 'yellow');
    log('或从 Supabase 导出数据库结构', 'yellow');
    process.exit(1);
  }

  // 创建历史备份目录
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
    log(`✓ 已创建历史备份目录: ${HISTORY_DIR}`, 'green');
  }

  const timestamp = getTimestamp();
  const backupFile = path.join(HISTORY_DIR, `backup_${timestamp}.sql`);

  log('正在生成备份...', 'yellow');
  log('');

  try {
    // 读取模板文件
    const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');

    // 添加时间戳注释
    const header = `-- ============================================
-- Supabase 数据库备份
-- 培训管理系统
-- 生成时间: ${new Date().toISOString()}
-- 项目ID: qinpsvempgjjocjfjvpc
-- ============================================

`;

    const backupContent = header + template;

    // 写入历史备份文件
    fs.writeFileSync(backupFile, backupContent, 'utf8');
    log(`✓ 备份已保存到: ${path.relative(process.cwd(), backupFile)}`, 'green');

    // 显示文件大小
    const stats = fs.statSync(backupFile);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);
    log(`✓ 备份文件大小: ${fileSizeInKB} KB`, 'green');

    // 清理旧备份（保留最近 10 个）
    log('');
    log('正在清理旧备份...', 'yellow');
    cleanOldBackups();

    log('');
    log('========================================', 'green');
    log('备份完成！', 'green');
    log('========================================', 'green');
    log('');
    log(`当前模板: ${path.relative(process.cwd(), TEMPLATE_FILE)}`, 'cyan');
    log(`最新备份: ${path.relative(process.cwd(), backupFile)}`, 'cyan');
    log(`历史目录: ${path.relative(process.cwd(), HISTORY_DIR)}`, 'cyan');

  } catch (error) {
    log('');
    log('✗ 备份失败', 'red');
    log(`错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 清理旧备份
function cleanOldBackups() {
  try {
    const files = fs.readdirSync(HISTORY_DIR)
      .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
      .map(f => ({
        name: f,
        path: path.join(HISTORY_DIR, f),
        time: fs.statSync(path.join(HISTORY_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // 保留最近 10 个
    const toDelete = files.slice(10);
    if (toDelete.length > 0) {
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        log(`  已删除旧备份: ${file.name}`, 'yellow');
      });
    }

    log(`✓ 当前保留 ${Math.min(files.length, 10)} 个历史备份`, 'green');
  } catch (error) {
    log(`警告: 清理旧备份失败: ${error.message}`, 'yellow');
  }
}

// 运行备份
generateBackup().catch(error => {
  log(`致命错误: ${error.message}`, 'red');
  process.exit(1);
});
