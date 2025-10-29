/**
 * 自动创建测试用户脚本
 * 
 * 使用方法：
 * 1. 确保已安装 Node.js
 * 2. 安装依赖: npm install @supabase/supabase-js
 * 3. 运行: node setup-test-users.js
 * 
 * 注意：这个脚本需要使用 service_role key（不是 anon key）
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const SUPABASE_URL = 'https://qinpsvempgjjocjfjvpc.supabase.co';

// ⚠️ 重要：这里需要使用 service_role key，不是 anon key
// service_role key 可以在 Supabase Dashboard -> Settings -> API 中找到
// 警告：service_role key 拥有完全权限，不要泄露或提交到代码库
const SUPABASE_SERVICE_ROLE_KEY = 'YOUR_SERVICE_ROLE_KEY_HERE';

// 测试用户配置
const TEST_USERS = [
  {
    email: 'admin@example.com',
    password: 'admin123456',
    username: 'admin',
    role: 'admin',
    name: '系统管理员',
    department: '管理部门'
  },
  {
    email: 'sales1@example.com',
    password: 'sales123456',
    username: 'sales1',
    role: 'salesperson',
    name: '张三',
    department: '销售部'
  },
  {
    email: 'expert1@example.com',
    password: 'expert123456',
    username: 'expert1',
    role: 'expert',
    name: '李教授',
    department: '培训部'
  }
];

async function setupTestUsers() {
  console.log('🚀 开始创建测试用户...\n');

  // 检查 service_role key
  if (SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    console.error('❌ 错误：请先设置 SUPABASE_SERVICE_ROLE_KEY');
    console.log('\n📝 获取 service_role key 的步骤：');
    console.log('1. 打开 Supabase Dashboard');
    console.log('2. 进入 Settings -> API');
    console.log('3. 复制 "service_role" key（不是 anon key）');
    console.log('4. 将 key 粘贴到本脚本的 SUPABASE_SERVICE_ROLE_KEY 变量中');
    console.log('\n⚠️  警告：service_role key 拥有完全权限，请妥善保管！\n');
    process.exit(1);
  }

  // 创建 Supabase 管理客户端
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Supabase 客户端已初始化\n');

  // 创建每个测试用户
  for (const user of TEST_USERS) {
    console.log(`📝 创建用户: ${user.email}`);
    
    try {
      // 1. 创建 auth 用户
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          username: user.username,
          name: user.name
        }
      });

      if (authError) {
        // 如果用户已存在，尝试获取现有用户
        if (authError.message.includes('already registered')) {
          console.log(`   ℹ️  用户已存在，尝试获取现有用户...`);
          
          // 查询现有用户
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find(u => u.email === user.email);
          
          if (existingUser) {
            console.log(`   ✅ 找到现有用户 ID: ${existingUser.id}`);
            
            // 检查是否已有用户资料
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', existingUser.id)
              .single();
            
            if (profile) {
              console.log(`   ✅ 用户资料已存在`);
            } else {
              // 创建用户资料
              const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                  id: existingUser.id,
                  username: user.username,
                  role: user.role,
                  name: user.name,
                  department: user.department
                });
              
              if (profileError) {
                console.log(`   ❌ 创建用户资料失败: ${profileError.message}`);
              } else {
                console.log(`   ✅ 用户资料创建成功`);
              }
            }
          }
        } else {
          throw authError;
        }
      } else {
        console.log(`   ✅ Auth 用户创建成功 ID: ${authData.user.id}`);
        
        // 2. 创建用户资料
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            department: user.department
          });

        if (profileError) {
          console.log(`   ❌ 创建用户资料失败: ${profileError.message}`);
        } else {
          console.log(`   ✅ 用户资料创建成功`);
        }
      }
      
      console.log('');
    } catch (error) {
      console.error(`   ❌ 创建失败: ${error.message}\n`);
    }
  }

  // 验证创建结果
  console.log('🔍 验证创建结果...\n');
  
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) {
    console.error('❌ 查询用户资料失败:', profilesError.message);
  } else {
    console.log(`✅ 找到 ${profiles.length} 个用户资料：\n`);
    profiles.forEach(profile => {
      console.log(`   - ${profile.email || profile.username} (${profile.role}): ${profile.name}`);
    });
  }

  console.log('\n✨ 测试用户创建完成！\n');
  console.log('📋 测试账号：');
  TEST_USERS.forEach(user => {
    console.log(`   ${user.email} / ${user.password} (${user.role})`);
  });
  console.log('');
}

// 运行脚本
setupTestUsers().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
