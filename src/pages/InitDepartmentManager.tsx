import { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { toast } from 'sonner';

export default function InitDepartmentManager() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResults, setInitResults] = useState<any>({});
  
  const initDepartmentManagers = async () => {
    setIsInitializing(true);
    const results: any = {};
    
    try {
      // Step 1: 创建部门表
      console.log('📋 Step 1: 创建部门表...');
      const { error: deptTableError } = await supabase
        .from('departments')
        .select('id')
        .limit(1);
        
      if (deptTableError?.code === '42P01') {
        // 表不存在，需要创建
        // 需要管理员在Supabase控制台执行建表SQL
        results.departmentTable = { status: 'need_manual', message: '请在Supabase控制台执行建表SQL（见init-department-managers.sql）' };
        toast.warning('需要在Supabase控制台手动创建departments表');
      } else {
        results.departmentTable = { status: 'exists', message: '部门表已存在' };
      }
      
      // Step 2: 创建三个部门
      console.log('📋 Step 2: 创建三个部门...');
      const departments = [
        { name: '销售一部', code: 'SALES_DEPT_1', level: 1, status: 'active' },
        { name: '销售二部', code: 'SALES_DEPT_2', level: 1, status: 'active' },
        { name: '销售三部', code: 'SALES_DEPT_3', level: 1, status: 'active' }
      ];
      
      const deptCreationResults = [];
      for (const dept of departments) {
        const { data, error } = await supabase
          .from('departments')
          .upsert(dept as any, { onConflict: 'name' })
          .select()
          .single();
          
        if (error) {
          console.error('创建部门失败:', dept.name, error);
          deptCreationResults.push({ name: dept.name, status: 'error', error });
        } else if (data) {
          deptCreationResults.push({ name: dept.name, status: 'success', id: (data as any).id });
        } else {
          console.error('创建部门返回空数据:', dept.name);
          deptCreationResults.push({ name: dept.name, status: 'error', message: '返回数据为空' });
        }
      }
      results.departments = deptCreationResults;
      
      // Step 3: 创建部门经理账号
      console.log('📋 Step 3: 创建部门经理账号...');
      const managers = [
        {
          email: 'manager1@qq.com',
          name: '张经理',
          phone: '13800138001',
          departmentCode: 'SALES_DEPT_1',
          password: 'Manager123!'
        },
        {
          email: 'manager2@qq.com',
          name: '李经理',
          phone: '13800138002',
          departmentCode: 'SALES_DEPT_2',
          password: 'Manager123!'
        },
        {
          email: 'manager3@qq.com',
          name: '王经理',
          phone: '13800138003',
          departmentCode: 'SALES_DEPT_3',
          password: 'Manager123!'
        }
      ];
      
      const managerCreationResults = [];
      for (const manager of managers) {
        // 获取部门ID
        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id')
          .eq('code', manager.departmentCode)
          .single();
        
        console.log('查询部门:', manager.departmentCode, 'data:', deptData, 'error:', deptError);
          
        if (!deptData || deptError) {
          console.error('部门不存在:', manager.departmentCode, deptError);
          managerCreationResults.push({ 
            name: manager.name, 
            status: 'error', 
            message: `部门${manager.departmentCode}不存在`,
            error: deptError
          });
          continue;
        }
        
        // 创建用户（使用Supabase Auth）
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: manager.email,
          password: manager.password,
          options: {
            data: {
              name: manager.name,
              phone: manager.phone
            }
          }
        });
        
        if (authError) {
          // 用户可能已存在，查询现有用户
          const { data: existingUser } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('email', manager.email)
            .single();
          
          if (existingUser) {
            // 更新现有用户为manager
            const { error: updateError } = await supabase
              .from('user_profiles')
              .update({ 
                role: 'manager',
                department_id: (deptData as any).id 
              } as any)
              .eq('email', manager.email);
              
            if (!updateError) {
              // 更新部门的manager_id
              await supabase
                .from('departments')
                .update({ manager_id: (existingUser as any).id } as any)
                .eq('id', (deptData as any).id);
              
              managerCreationResults.push({ 
                name: manager.name, 
                status: 'updated', 
                message: '已更新为部门经理',
                email: manager.email
              });
            } else {
              managerCreationResults.push({ 
                name: manager.name, 
                status: 'error', 
                error: updateError
              });
            }
          } else {
            managerCreationResults.push({ 
              name: manager.name, 
              status: 'error', 
              message: '用户不存在且创建失败',
              error: authError
            });
          }
        } else if (authData?.user) {
          // 创建用户档案
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({
              id: authData.user.id,
              name: manager.name,
              email: manager.email,
              phone: manager.phone,
              role: 'manager',
              department_id: (deptData as any).id
            } as any);
            
          if (!profileError) {
            // 更新部门的manager_id
            await supabase
              .from('departments')
              .update({ manager_id: authData.user.id } as any)
              .eq('id', (deptData as any).id);
              
            managerCreationResults.push({ 
              name: manager.name, 
              status: 'success', 
              email: manager.email 
            });
          } else {
            managerCreationResults.push({ 
              name: manager.name, 
              status: 'error', 
              error: profileError 
            });
          }
        }
      }
      results.managers = managerCreationResults;
      
      // Step 4: 分配现有业务员到部门
      console.log('📋 Step 4: 分配业务员到部门...');
      const { data: salespersons } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('role', 'salesperson')
        .is('department_id', null);
        
      if (salespersons && salespersons.length > 0) {
        const { data: depts } = await supabase
          .from('departments')
          .select('id, name, manager_id')
          .order('id');
          
        if (depts) {
          const assignmentResults = [];
          for (let i = 0; i < salespersons.length; i++) {
            const deptIndex = i % depts.length;
            const dept = depts[deptIndex];
            
            const { error } = await supabase
              .from('user_profiles')
              .update({ department_id: (dept as any).id } as any)
              .eq('id', (salespersons[i] as any).id);
              
            if (!error) {
              // 创建团队成员关系（如果team_members表存在且部门有经理）
              if ((dept as any).manager_id) {
                try {
                  await supabase
                    .from('team_members')
                    .insert({
                      manager_id: (dept as any).manager_id,
                      member_id: (salespersons[i] as any).id,
                      department_id: (dept as any).id
                    } as any)
                    .select();
                } catch (teamError) {
                  // 忽略错误，表可能不存在
                  console.log('⚠️ team_members表可能不存在，跳过', teamError);
                }
              }
                
              assignmentResults.push({
                name: (salespersons[i] as any).name,
                department: (dept as any).name,
                status: 'success'
              });
            } else {
              assignmentResults.push({
                name: (salespersons[i] as any).name,
                status: 'error',
                error
              });
            }
          }
          results.assignments = assignmentResults;
        }
      } else {
        results.assignments = { status: 'none', message: '没有需要分配的业务员' };
      }
      
      // Step 5: 分配部门经理权限
      console.log('📋 Step 5: 分配部门经理权限...');
      const { data: managers_profiles } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('role', 'manager');
        
      if (managers_profiles) {
        const permissionResults = [];
        const permissions = [
          'customer_view', 'customer_export',
          'training_view', 'training_export',
          'salesperson_view', 'salesperson_manage',
          'performance_view', 'performance_export',
          'team_view', 'team_manage'
        ];
        
        const menuAccess = [
          'dashboard', 'customer_management', 'training_management',
          'team_management', 'performance_statistics',
          'data_management', 'profile_settings'
        ];
        
        for (const manager of managers_profiles) {
          // 分配功能权限
          for (const perm of permissions) {
            await supabase
              .from('user_permissions')
              .upsert({
                user_id: (manager as any).id,
                permission_code: perm
              } as any, { onConflict: 'user_id,permission_code' });
          }
          
          // 分配菜单权限
          for (const menu of menuAccess) {
            await supabase
              .from('user_menu_access')
              .upsert({
                user_id: (manager as any).id,
                menu_code: menu
              } as any, { onConflict: 'user_id,menu_code' });
          }
          
          permissionResults.push({
            name: (manager as any).name,
            permissions: permissions.length,
            menus: menuAccess.length,
            status: 'success'
          });
        }
        results.permissions = permissionResults;
      }
      
      setInitResults(results);
      toast.success('部门经理系统初始化完成！');
      
    } catch (error) {
      console.error('❌ 初始化失败:', error);
      if (error instanceof Error) {
        toast.error(`初始化失败: ${error.message}`);
        console.error('错误详情:', error.stack);
      } else {
        toast.error('初始化过程中出现未知错误');
      }
      setInitResults({ error: String(error) });
    } finally {
      setIsInitializing(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
            <div className="flex items-center mb-8">
              <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                初始化部门经理系统
              </h1>
            </div>
            
            <div className="space-y-6">
              <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      注意事项
                    </p>
                    <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                      此操作将创建部门、部门经理账号并分配现有业务员。请确保数据库已备份。
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                  将执行以下操作：
                </h3>
                <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">1.</span>
                    创建三个销售部门（销售一部、销售二部、销售三部）
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">2.</span>
                    创建部门经理账号（manager1/2/3@qq.com，密码：Manager123!）
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">3.</span>
                    将现有业务员平均分配到三个部门
                  </li>
                  <li className="flex items-start">
                    <span className="font-semibold mr-2">4.</span>
                    为部门经理分配权限
                  </li>
                </ol>
              </div>
              
              {!isInitializing && Object.keys(initResults).length === 0 && (
                <button
                  onClick={initDepartmentManagers}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Users className="w-5 h-5 mr-2" />
                  开始初始化
                </button>
              )}
              
              {isInitializing && (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-3 text-gray-600 dark:text-gray-300">
                    正在初始化，请稍候...
                  </span>
                </div>
              )}
              
              {Object.keys(initResults).length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    初始化结果：
                  </h3>
                  
                  {initResults.departments && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">
                        部门创建
                      </h4>
                      {initResults.departments.map((dept: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-1">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {dept.name}
                          </span>
                          {dept.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {initResults.managers && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">
                        部门经理账号
                      </h4>
                      {initResults.managers.map((mgr: any, index: number) => (
                        <div key={index} className="flex items-center justify-between py-1">
                          <div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {mgr.name}
                            </span>
                            {mgr.email && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                ({mgr.email})
                              </span>
                            )}
                          </div>
                          {mgr.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : mgr.status === 'exists' ? (
                            <span className="text-xs text-yellow-600">已存在</span>
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {initResults.assignments && Array.isArray(initResults.assignments) && (
                    <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                      <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2">
                        业务员分配（{initResults.assignments.length}人）
                      </h4>
                      <div className="max-h-40 overflow-y-auto">
                        {initResults.assignments.map((assign: any, index: number) => (
                          <div key={index} className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {assign.name} → {assign.department}
                            </span>
                            {assign.status === 'success' && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="ml-2 text-green-700 dark:text-green-300 font-medium">
                        初始化完成！
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                      <p>部门经理账号：</p>
                      <ul className="mt-1 space-y-1">
                        <li>• manager1@qq.com（张经理 - 销售一部）</li>
                        <li>• manager2@qq.com（李经理 - 销售二部）</li>
                        <li>• manager3@qq.com（王经理 - 销售三部）</li>
                        <li>• 默认密码：Manager123!</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
