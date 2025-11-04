import { createClient } from '@supabase/supabase-js';

// 直接使用配置文件中的值
const supabaseUrl = 'https://qinpsvempgjjocjfjvpc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbnBzdmVtcGdqam9jamZqdnBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExODg3ODgsImV4cCI6MjA3Njc2NDc4OH0.wmpPyRumAkyuzqJuT0ssbigzEJN-HrbI99FwajDq760';

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
      if (permError.code === 'PGRST116') {
        console.log('   这可能意味着权限表不存在，需要初始化数据库');
      }
    } else {
      console.log(`✅ 权限表正常，找到 ${permissions.length} 条记录`);

      // 显示前几条权限记录
      if (permissions.length > 0) {
        console.log('📝 权限样例:');
        permissions.slice(0, 3).forEach(p => {
          console.log(`   - ${p.name} (${p.category || '无分类'})`);
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

    // 测试 3: 检查功能面板
    console.log('\n📱 测试 3: 检查功能面板');
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

    // 测试 4: 尝试登录测试用户
    console.log('\n🔐 测试 4: 尝试登录管理员账号');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ 管理员登录失败:', authError.message);
    } else {
      console.log(`✅ 管理员登录成功! 用户ID: ${authData.user.id}`);

      // 立即登出
      await supabase.auth.signOut();
    }

    console.log('\n✨ 数据库连接测试完成！');

    // 总结状态
    console.log('\n📊 系统状态总结:');
    console.log(`   - 权限定义: ${permissions?.length || 0} 个 (期待 >= 35)`);
    console.log(`   - 用户资料: ${profiles?.length || 0} 个`);
    console.log(`   - 功能面板: ${features?.length || 0} 个 (期待 = 12)`);

    // 判断是否需要执行修复脚本
    if ((permissions?.length || 0) < 35 || (features?.length || 0) < 12) {
      console.log('\n⚠️ 建议执行 EMERGENCY_FIX.sql 脚本');
      console.log('   请访问 Supabase 控制台 -> SQL Editor，运行该脚本');
    } else {
      console.log('\n✅ 权限系统数据基本完整');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testConnection();