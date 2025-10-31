/**
 * 公告和通知系统测试数据脚本
 * 用于插入示例公告和通知
 */

import { createClient } from '@supabase/supabase-js';

// 从环境变量或直接配置
const SUPABASE_URL = 'https://qinpsvempgjjocjfjvpc.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // 需要替换

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seedAnnouncements() {
  console.log('开始插入示例公告...');

  const announcements = [
    {
      title: '系统维护通知',
      content: '本周六凌晨2:00-4:00将进行系统升级维护，期间系统将暂时无法访问，请提前做好工作安排。感谢您的理解与支持！',
      priority: 'urgent',
      status: 'active',
      target_roles: null, // 全部用户
      is_pinned: true,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后过期
    },
    {
      title: '新功能上线通知',
      content: '数据管理模块新增批量导入功能，支持Excel和CSV格式文件导入。详情请查看数据管理页面。',
      priority: 'important',
      status: 'active',
      target_roles: ['admin', 'salesperson'],
      is_pinned: true,
    },
    {
      title: '培训计划调整',
      content: '由于场地原因，原定于本周三的技术培训调整至周五下午2点，请相关人员注意时间变更。',
      priority: 'normal',
      status: 'active',
      target_roles: ['salesperson', 'expert'],
    },
    {
      title: '节假日安排',
      content: '根据国家法定节假日安排，11月1日-3日系统正常运行，值班人员请按时到岗。',
      priority: 'normal',
      status: 'active',
      target_roles: null,
    },
    {
      title: '安全提醒',
      content: '请定期修改密码，密码长度不少于8位，建议包含大小写字母、数字和特殊字符。',
      priority: 'important',
      status: 'active',
      target_roles: null,
    },
  ];

  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert(announcements)
      .select();

    if (error) {
      console.error('插入公告失败:', error);
      return;
    }

    console.log(`✅ 成功插入 ${data.length} 条公告`);
    data.forEach((announcement, index) => {
      console.log(`  ${index + 1}. ${announcement.title} (${announcement.priority})`);
    });
  } catch (error) {
    console.error('错误:', error);
  }
}

async function seedNotificationTemplates() {
  console.log('\n检查通知模板...');

  try {
    const { data: existing } = await supabase
      .from('notification_templates')
      .select('type');

    if (existing && existing.length > 0) {
      console.log('✅ 通知模板已存在，跳过插入');
      return;
    }

    // 模板已在迁移中插入，这里只是验证
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*');

    if (error) {
      console.error('查询模板失败:', error);
      return;
    }

    console.log(`✅ 找到 ${data.length} 个通知模板`);
  } catch (error) {
    console.error('错误:', error);
  }
}

async function createSampleNotifications() {
  console.log('\n创建示例通知...');

  // 注意：这需要有实际的用户ID
  // 在实际使用中，应该从数据库查询用户ID
  console.log('⚠️  需要实际的用户ID才能创建通知');
  console.log('   可以在应用中通过管理员界面手动创建通知');
}

async function main() {
  console.log('=== 公告和通知系统数据初始化 ===\n');

  await seedAnnouncements();
  await seedNotificationTemplates();
  await createSampleNotifications();

  console.log('\n=== 完成 ===');
  console.log('\n提示：');
  console.log('1. 请在 Supabase 控制台验证数据');
  console.log('2. 登录应用查看公告显示效果');
  console.log('3. 管理员可以在"公告管理"页面管理公告');
}

main().catch(console.error);
