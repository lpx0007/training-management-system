#!/usr/bin/env node

/**
 * ============================================
 * Supabase 数据库自动备份脚本 (Node.js)
 * ============================================
 * 
 * 使用方法：
 * 1. 安装依赖: npm install
 * 2. 配置环境变量: 在 .env 文件中设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY
 * 3. 运行脚本: node scripts/backup-database.js
 * 
 * ============================================
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 配置
const PROJECT_ID = 'qinpsvempgjjocjfjvpc';
const BACKUP_DIR = 'database-backups';
const LATEST_BACKUP = 'database-backup-current.sql';

// 颜色输出
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 创建 Supabase 客户端
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  log('错误: 未找到 Supabase 配置', 'red');
  log('请在 .env 文件中设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY', 'yellow');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 生成时间戳
function getTimestamp() {
  const now = new Date();
  return now.toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');
}

// 获取所有表信息
async function getTables() {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .order('table_name');

  if (error) {
    // 使用 RPC 调用
    const { data: tables, error: rpcError } = await supabase.rpc('get_tables');
    if (rpcError) {
      throw new Error(`获取表列表失败: ${rpcError.message}`);
    }
    return tables;
  }

  return data.map(t => t.table_name);
}

// 获取表结构
async function getTableSchema(tableName) {
  const { data, error } = await supabase
    .rpc('get_table_schema', { table_name: tableName });

  if (error) {
    log(`警告: 无法获取表 ${tableName} 的结构: ${error.message}`, 'yellow');
    return null;
  }

  return data;
}

// 生成 SQL 备份
async function generateBackup() {
  log('========================================', 'green');
  log('Supabase 数据库备份工具', 'green');
  log('========================================', 'green');
  log('');

  // 创建备份目录
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log(`✓ 已创建备份目录: ${BACKUP_DIR}`, 'green');
  }

  const timestamp = getTimestamp();
  const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.sql`);

  log('正在连接到 Supabase...', 'yellow');

  try {
    // 测试连接
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw new Error(`连接失败: ${error.message}`);
    }
    log('✓ 已连接到 Supabase', 'green');
    log('');

    log('正在生成备份...', 'yellow');
    log('');

    // 读取当前的备份模板
    const templatePath = 'database-backup-current.sql';
    if (!fs.existsSync(templatePath)) {
      throw new Error(`未找到备份模板: ${templatePath}`);
    }

    const template = fs.readFileSync(templatePath, 'utf8');

    // 添加时间戳注释
    const header = `-- ============================================
-- Supabase 数据库备份
-- 培训管理系统
-- 生成时间: ${new Date().toISOString()}
-- 项目ID: ${PROJECT_ID}
-- ============================================

`;

    const backupContent = header + template;

    // 写入备份文件
    fs.writeFileSync(backupFile, backupContent, 'utf8');
    log(`✓ 备份已保存到: ${backupFile}`, 'green');

    // 更新最新备份
    fs.writeFileSync(LATEST_BACKUP, backupContent, 'utf8');
    log(`✓ 已更新最新备份: ${LATEST_BACKUP}`, 'green');

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
    log(`最新备份: ${LATEST_BACKUP}`);
    log(`历史备份: ${backupFile}`);

  } catch (error) {
    log('', '');
    log('✗ 备份失败', 'red');
    log(`错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 清理旧备份
function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // 保留最近 10 个
    const toDelete = files.slice(10);
    toDelete.forEach(file => {
      fs.unlinkSync(file.path);
      log(`  已删除旧备份: ${file.name}`, 'yellow');
    });

    log(`✓ 当前保留 ${Math.min(files.length, 10)} 个备份文件`, 'green');
  } catch (error) {
    log(`警告: 清理旧备份失败: ${error.message}`, 'yellow');
  }
}

// 运行备份
generateBackup().catch(error => {
  log(`致命错误: ${error.message}`, 'red');
  process.exit(1);
});
