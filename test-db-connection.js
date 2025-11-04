import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 加载环境变量
config({ path: '.env.local' });

// 从环境变量加载配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔍 测试数据库连接...\n');

  try {
    // 测试 1: 检查权限表状态
    console.log('📋 测试 1: 检查权限表状态');
    const { data: permissions, error: permError } = await supabase
      .from('permissions')
      .select('*');

    if (permError) {
      console.error('❌ 权限表查询失败:', permError.message);
    } else {
      console.log(`✅ 权限表正常，找到 ${permissions.length} 条记录`);

      // 显示前几条权限记录
      if (permissions.length > 0) {
        console.log('📝 权限样例:');
        permissions.slice(0, 3).forEach(p => {
          console.log(`   - ${p.name} (${p.category})`);
        });
      }
    }

    // 测试 2: 检查用户表状态
    console.log('\n👥 测试 2: 检查用户资料表');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5);

    if (profileError) {
      console.error('❌ 用户资料表查询失败:', profileError.message);
    } else {
      console.log(`✅ 用户资料表正常，找到 ${profiles.length} 个用户`);

      // 显示用户
      profiles.forEach(p => {
        console.log(`   - ${p.name} (${p.role})`);
      });
    }

    // 测试 3: 检查用户权限关联
    console.log('\n🔐 测试 3: 检查用户权限关联');
    const { data: userPerms, error: userPermError } = await supabase
      .from('user_permissions')
      .select('*')
      .limit(5);

    if (userPermError) {
      console.error('❌ 用户权限关联表查询失败:', userPermError.message);
    } else {
      console.log(`✅ 用户权限关联正常，找到 ${userPerms.length} 条关联记录`);
    }

    // 测试 4: 检查功能面板
    console.log('\n📱 测试 4: 检查功能面板');
    const { data: features, error: featureError } = await supabase
      .from('menu_features')
      .select('*');

    if (featureError) {
      console.error('❌ 功能面板表查询失败:', featureError.message);
    } else {
      console.log(`✅ 功能面板表正常，找到 ${features.length} 个功能面板`);

      features.forEach(f => {
        console.log(`   - ${f.name} (ID: ${f.feature_id})`);
      });
    }

    console.log('\n✨ 数据库连接测试完成！');

    // 总结状态
    console.log('\n📊 系统状态总结:');
    console.log(`   - 权限定义: ${permissions?.length || 0} 个 (期待 >= 35)`);
    console.log(`   - 用户资料: ${profiles?.length || 0} 个`);
    console.log(`   - 权限关联: ${userPerms?.length || 0} 条`);
    console.log(`   - 功能面板: ${features?.length || 0} 个 (期待 = 12)`);

    // 判断是否需要执行修复脚本
    if ((permissions?.length || 0) < 35 || (features?.length || 0) < 12) {
      console.log('\n⚠️ 建议执行 EMERGENCY_FIX.sql 脚本');
    } else {
      console.log('\n✅ 权限系统数据基本完整');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testConnection();