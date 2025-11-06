import { supabase } from '../lib/supabase/client';
import fs from 'fs';
import path from 'path';

// 读取SQL文件内容
const sqlPath = path.join(process.cwd(), 'scripts', 'init-department-managers.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

// 分割SQL语句（按分号和GO语句）
const statements = sqlContent
  .split(/;\s*$|^\s*GO\s*$/gmi)
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

async function executeSQLScript() {
  console.log('🚀 开始执行部门经理初始化脚本...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const [index, statement] of statements.entries()) {
    if (!statement || statement.length < 5) continue;
    
    try {
      console.log(`执行语句 ${index + 1}/${statements.length}...`);
      
      // 使用rpc执行原始SQL
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement 
      });
      
      if (error) {
        console.error(`❌ 语句 ${index + 1} 执行失败:`, error);
        errorCount++;
      } else {
        console.log(`✅ 语句 ${index + 1} 执行成功`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ 语句 ${index + 1} 执行异常:`, err);
      errorCount++;
    }
  }
  
  console.log('\n📊 执行结果:');
  console.log(`  成功: ${successCount}`);
  console.log(`  失败: ${errorCount}`);
  console.log(`  总计: ${statements.length}`);
}

// 执行脚本
executeSQLScript()
  .then(() => {
    console.log('✅ 脚本执行完成');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ 脚本执行失败:', err);
    process.exit(1);
  });
