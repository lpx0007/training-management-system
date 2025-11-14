// 简单的权限计数脚本
const permissions = [
  // CUSTOMER (5个)
  'customer_view', 'customer_view_all', 'customer_add', 'customer_edit', 'customer_delete',
  
  // TRAINING (8个) 
  'training_view', 'training_add', 'training_edit', 'training_delete', 
  'training_add_participant', 'training_manage_participant', 'training_view_stats', 'training_export_participants',
  
  // EXPERT (6个)
  'expert_view', 'expert_add', 'expert_edit', 'expert_delete', 'expert_view_feedback', 'expert_profile_edit',
  
  // SALESPERSON (6个)
  'salesperson_view', 'salesperson_add', 'salesperson_edit', 'salesperson_delete', 
  'salesperson_view_performance', 'performance_view_all_departments',
  
  // PROSPECTUS (6个)
  'prospectus_view', 'prospectus_upload', 'prospectus_edit', 'prospectus_delete', 
  'prospectus_download', 'prospectus_manage_category',
  
  // POSTER (3个)
  'poster_generate', 'poster_view_history', 'poster_config_template',
  
  // DATA (12个)
  'customer_import', 'customer_export', 'training_import', 'training_export',
  'expert_import', 'expert_export', 'salesperson_import', 'salesperson_export',
  'prospectus_import', 'prospectus_export', 'performance_export',
  'data_download_template', 'data_view_history',
  
  // SYSTEM (4个)
  'permission_manage', 'audit_log_view', 'system_config', 'user_account_manage'
];

console.log('权限统计:');
console.log('CUSTOMER: 5个');
console.log('TRAINING: 8个');
console.log('EXPERT: 6个');
console.log('SALESPERSON: 6个');
console.log('PROSPECTUS: 6个');
console.log('POSTER: 3个');
console.log('DATA: 13个');  // 注意这里有13个，包括data_view_history
console.log('SYSTEM: 4个');
console.log('---');
console.log('总计:', permissions.length, '个权限');

console.log('\n所有权限列表:');
permissions.forEach((p, i) => {
  console.log(`${i + 1}. ${p}`);
});
