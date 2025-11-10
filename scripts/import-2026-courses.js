/**
 * 导入2026年公开课计划到courses表
 * 运行方式: node scripts/import-2026-courses.js
 */

import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置。请检查 .env.local 文件');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 解析培训费字段
 * 支持格式：
 * - "44800" -> { standard: 44800, online: null, offline: null }
 * - "线上5100/线下6000" -> { standard: 6000, online: 5100, offline: 6000 }
 * - "32000/9800（单模块）" -> { standard: 32000, online: null, offline: null }
 */
function parseTrainingFee(feeStr) {
  if (!feeStr || feeStr.trim() === '') {
    return { standard: null, online: null, offline: null };
  }

  const str = feeStr.trim();
  
  // 格式：线上XXX/线下XXX
  const onlineOfflineMatch = str.match(/线上(\d+).*?线下(\d+)/);
  if (onlineOfflineMatch) {
    const online = parseInt(onlineOfflineMatch[1]);
    const offline = parseInt(onlineOfflineMatch[2]);
    return {
      standard: offline, // 使用线下价格作为标准费
      online: online,
      offline: offline
    };
  }

  // 格式：XXXXX/XXXX（说明）- 取第一个作为标准费
  const complexMatch = str.match(/(\d+)\/\d+/);
  if (complexMatch) {
    return {
      standard: parseInt(complexMatch[1]),
      online: null,
      offline: null
    };
  }

  // 纯数字格式
  const simpleMatch = str.match(/(\d+)/);
  if (simpleMatch) {
    return {
      standard: parseInt(simpleMatch[1]),
      online: null,
      offline: null
    };
  }

  return { standard: null, online: null, offline: null };
}

/**
 * 解析均价字段
 */
function parseAveragePrice(priceStr) {
  if (!priceStr || priceStr.trim() === '') {
    return null;
  }
  const match = priceStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

/**
 * 生成课程编号
 */
function generateCourseCode(module, index) {
  const moduleMap = {
    '综合管理': 'ZH',
    '非财高管': 'FC',
    '管理会计': 'GL',
    '公司金融': 'JR',
    '风险合规': 'FX',
    '内审实务': 'NS',
    '数智转型': 'SZ',
    '会计准则': 'KJ',
    '税务管理': 'SW',
    '行业课程': 'HY'
  };
  
  const prefix = moduleMap[module] || 'OT';
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

/**
 * 主导入函数
 */
async function importCourses() {
  console.log('📚 开始导入2026年公开课计划...\n');

  // 读取CSV文件
  const csvPath = 'e:/培训机构业务通/导入数据/2026年公开课计划（11.4）.csv';
  console.log(`📁 读取文件: ${csvPath}`);
  
  let csvContent;
  try {
    csvContent = fs.readFileSync(csvPath, 'utf-8');
  } catch (error) {
    console.error('❌ 无法读取CSV文件:', error.message);
    process.exit(1);
  }

  // 解析CSV
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true // 处理BOM
  });

  console.log(`📊 共读取 ${records.length} 行数据\n`);

  // 处理数据
  const courses = [];
  let currentModule = '';
  let moduleCounter = {};

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    
    // 跳过统计行（最后一行，课程名称为空）
    if (!record['课程'] || record['课程'].trim() === '') {
      continue;
    }

    // 处理模块名称（如果为空，使用上一行的模块）
    if (record['模块'] && record['模块'].trim() !== '') {
      currentModule = record['模块'].trim();
      if (!moduleCounter[currentModule]) {
        moduleCounter[currentModule] = 0;
      }
    }

    if (!currentModule) {
      console.warn(`⚠️  第 ${i + 2} 行缺少模块信息，跳过`);
      continue;
    }

    moduleCounter[currentModule]++;

    // 解析培训费
    const feeInfo = parseTrainingFee(record['培训费']);
    const avgPrice = parseAveragePrice(record['均价']);

    // 构建课程对象
    const course = {
      module: currentModule,
      name: record['课程'].trim(),
      code: generateCourseCode(currentModule, moduleCounter[currentModule]),
      duration_days: parseInt(record['每期天数']) || 0,
      sessions_per_year: parseInt(record['期数']) || 0,
      standard_fee: feeInfo.standard,
      online_price: feeInfo.online,
      offline_price: feeInfo.offline,
      average_price: avgPrice,
      description: null, // 可以从月份信息提取
      notes: record['备注'] ? record['备注'].trim() : null,
      status: 'active'
    };

    courses.push(course);
  }

  console.log(`✅ 处理完成，共 ${courses.length} 个有效课程\n`);

  // 显示前3个课程预览
  console.log('📋 课程预览（前3个）:');
  courses.slice(0, 3).forEach((course, idx) => {
    console.log(`\n${idx + 1}. ${course.name}`);
    console.log(`   模块: ${course.module}`);
    console.log(`   编号: ${course.code}`);
    console.log(`   天数: ${course.duration_days}天 | 期数: ${course.sessions_per_year}期`);
    console.log(`   定价: 标准${course.standard_fee || 'N/A'} | 线上${course.online_price || 'N/A'} | 线下${course.offline_price || 'N/A'}`);
    console.log(`   均价: ${course.average_price || 'N/A'}`);
  });

  console.log('\n');

  // 询问是否继续导入
  console.log('⏸️  即将导入到数据库...');
  console.log('按任意键继续，或Ctrl+C取消...');
  
  // 简单暂停（实际使用中可以用readline）
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  // 批量插入数据库
  console.log('\n💾 开始插入数据库...');
  
  let successCount = 0;
  let errorCount = 0;

  for (const course of courses) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert(course)
        .select();

      if (error) {
        console.error(`❌ 插入失败: ${course.name} - ${error.message}`);
        errorCount++;
      } else {
        successCount++;
        process.stdout.write(`✓`);
      }
    } catch (error) {
      console.error(`❌ 插入异常: ${course.name} - ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n');
  console.log('=' .repeat(60));
  console.log('📊 导入完成统计:');
  console.log(`   ✅ 成功: ${successCount} 个课程`);
  console.log(`   ❌ 失败: ${errorCount} 个课程`);
  console.log(`   📚 总计: ${courses.length} 个课程`);
  console.log('=' .repeat(60));

  // 验证导入
  const { count } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true });

  console.log(`\n🔍 数据库中现有课程总数: ${count}`);
}

// 执行导入
importCourses().catch(error => {
  console.error('\n💥 导入过程中发生错误:', error);
  process.exit(1);
});
