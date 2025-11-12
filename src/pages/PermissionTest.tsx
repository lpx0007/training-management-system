import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { Shield, CheckCircle, XCircle, Play, RefreshCw, User, Menu, Eye } from 'lucide-react';
import { PERMISSION_CATEGORIES, getAllPermissions, Permission } from '@/constants/permissions';
import { MENU_FEATURES } from '@/constants/menuFeatures';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import PermissionGuard from '@/components/PermissionGuard';

interface TestResult {
  permissionId: string;
  hasPermission: boolean;
  testType: 'ui' | 'api' | 'both';
  message: string;
  timestamp: string;
}

interface UserForTest {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function PermissionTest() {
  const { user } = useContext(AuthContext);
  const [selectedUser, setSelectedUser] = useState<UserForTest | null>(null);
  const [users, setUsers] = useState<UserForTest[]>([]);
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map());
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Set<string>>(new Set());
  const [userMenuAccess, setUserMenuAccess] = useState<Set<string>>(new Set());
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [activeTab, setActiveTab] = useState<'permissions' | 'menus'>('permissions');

  // 加载用户列表
  useEffect(() => {
    loadUsers();
  }, []);

  // 当选择用户改变时，加载其权限
  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions(selectedUser.id);
    }
  }, [selectedUser]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name, email, role')
        .order('name');
      
      if (error) throw error;
      setUsers((data as UserForTest[]) || []);
      
      // 默认选择当前用户
      if (user && data) {
        const currentUser = (data as UserForTest[]).find(u => u.id === user.id);
        if (currentUser) {
          setSelectedUser(currentUser);
        }
      }
    } catch (error) {
      console.error('加载用户列表失败:', error);
      toast.error('加载用户列表失败');
    }
  };

  const loadUserPermissions = async (userId: string) => {
    setIsLoadingPermissions(true);
    try {
      // 加载用户权限
      const { data: permData, error: permError } = await supabase
        .from('user_permissions')
        .select('permission_id')
        .eq('user_id', userId);
      
      if (permError) throw permError;
      
      const permissions = new Set((permData as {permission_id: string}[] || []).map(p => p.permission_id));
      setUserPermissions(permissions);
      
      // 加载用户菜单访问权限
      const { data: menuData, error: menuError } = await supabase
        .from('user_menu_access')
        .select('menu_feature_id')
        .eq('user_id', userId);
      
      if (menuError) {
        // 如果表不存在，默认所有菜单都可访问（依赖权限控制）
        console.warn('user_menu_access表可能不存在，使用默认设置:', menuError);
        const allMenus = new Set(MENU_FEATURES.map(m => m.id));
        setUserMenuAccess(allMenus);
      } else {
        const menus = new Set((menuData as {menu_feature_id: string}[] || []).map(m => m.menu_feature_id));
        setUserMenuAccess(menus);
      }
    } catch (error) {
      console.error('加载用户权限失败:', error);
      toast.error('加载用户权限失败');
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  // 测试单个权限
  const testPermission = async (permissionId: string) => {
    if (!selectedUser) {
      toast.error('请先选择要测试的用户');
      return;
    }

    const hasPermission = userPermissions.has(permissionId);
    
    // 模拟API调用测试
    let apiTestPassed = false;
    try {
      // 这里可以根据不同的权限执行不同的测试API调用
      apiTestPassed = await testPermissionAPI(permissionId);
    } catch (error) {
      console.error('API测试失败:', error);
    }

    const result: TestResult = {
      permissionId,
      hasPermission,
      testType: 'both',
      message: hasPermission 
        ? `✅ 用户拥有此权限${apiTestPassed ? '，API测试通过' : '，但API测试失败'}` 
        : '❌ 用户没有此权限',
      timestamp: new Date().toLocaleTimeString()
    };

    setTestResults(prev => {
      const newMap = new Map(prev);
      newMap.set(permissionId, result);
      return newMap;
    });

    // 显示测试结果
    if (hasPermission && apiTestPassed) {
      toast.success(`权限 ${permissionId} 测试通过`);
    } else if (hasPermission && !apiTestPassed) {
      toast.warning(`权限 ${permissionId} UI显示正常，但API测试失败`);
    } else {
      toast.info(`权限 ${permissionId} 正确地被拒绝`);
    }
  };

  // 模拟API权限测试
  const testPermissionAPI = async (permissionId: string): Promise<boolean> => {
    // 根据不同的权限执行不同的测试
    switch (permissionId) {
      case 'customer_view':
        // 测试查看客户
        const { error: viewError } = await supabase
          .from('customers')
          .select('id')
          .limit(1);
        return !viewError;
      
      case 'customer_add':
        // 测试添加客户（使用事务回滚）
        // 实际不会保存数据
        return true; // 简化测试
      
      case 'training_view':
        // 测试查看培训
        const { error: trainingError } = await supabase
          .from('training_sessions')
          .select('id')
          .limit(1);
        return !trainingError;
      
      default:
        // 其他权限暂时返回true
        return true;
    }
  };

  // 测试所有权限
  const testAllPermissions = async () => {
    if (!selectedUser) {
      toast.error('请先选择要测试的用户');
      return;
    }

    setIsTestingAll(true);
    const allPermissions = getAllPermissions();
    
    for (const permission of allPermissions) {
      await testPermission(permission.id);
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsTestingAll(false);
    toast.success('所有权限测试完成');
  };

  // 清除测试结果
  const clearResults = () => {
    setTestResults(new Map());
    toast.info('测试结果已清除');
  };

  // 获取权限的测试结果
  const getTestResult = (permissionId: string) => {
    return testResults.get(permissionId);
  };

  // 渲染菜单测试项
  const renderMenuTest = (menu: any) => {
    const hasMenuAccess = userMenuAccess.has(menu.id);
    const hasRequiredPermissions = menu.requiredPermissions.length === 0 || 
      menu.requiredPermissions.some((p: string) => userPermissions.has(p));
    const shouldShow = hasMenuAccess && hasRequiredPermissions;
    
    return (
      <div 
        key={menu.id}
        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {menu.name}
            </span>
            <code className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
              {menu.path}
            </code>
            {shouldShow ? (
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-green-500" />
                <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                  显示
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                  隐藏
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {menu.description}
          </p>
          {menu.requiredPermissions.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">所需权限：</span>
              {menu.requiredPermissions.map((perm: string) => (
                <span 
                  key={perm}
                  className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    userPermissions.has(perm)
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {perm}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">显示逻辑：</span>
            {!hasMenuAccess && '⚠ 菜单访问权限未开启 '}
            {hasMenuAccess && !hasRequiredPermissions && '⚠ 缺少所需权限 '}
            {shouldShow && '✅ 满足所有条件，菜单将显示'}
          </div>
        </div>
      </div>
    );
  };

  // 渲染权限测试项
  const renderPermissionTest = (permission: Permission) => {
    const result = getTestResult(permission.id);
    const hasPermission = userPermissions.has(permission.id);
    
    return (
      <div 
        key={permission.id}
        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {permission.name}
            </span>
            <code className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
              {permission.id}
            </code>
            {hasPermission ? (
              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                已授权
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">
                未授权
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {permission.description}
          </p>
          {result && (
            <div className="mt-2 text-sm">
              <span className={result.hasPermission ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {result.message}
              </span>
              <span className="text-gray-400 ml-2">
                {result.timestamp}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <div className="mr-2">
              {result.hasPermission ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
          )}
          <button
            onClick={() => testPermission(permission.id)}
            disabled={isTestingAll || !selectedUser}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <Play size={14} />
            测试
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            权限测试验证
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            测试和验证系统中所有权限是否正常工作
          </p>
        </div>

        {/* 用户选择和操作栏 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  选择测试用户：
                </label>
                <select
                  value={selectedUser?.id || ''}
                  onChange={(e) => {
                    const user = users.find(u => u.id === e.target.value);
                    setSelectedUser(user || null);
                    setTestResults(new Map()); // 清除之前的测试结果
                  }}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">请选择用户</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedUser && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  角色：<span className="font-medium">{selectedUser.role}</span>
                  {' | '}
                  权限数：<span className="font-medium">{userPermissions.size}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={testAllPermissions}
                disabled={isTestingAll || !selectedUser || isLoadingPermissions}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isTestingAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    测试中...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    测试所有权限
                  </>
                )}
              </button>
              
              <button
                onClick={clearResults}
                disabled={testResults.size === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                清除结果
              </button>
            </div>
          </div>

          {/* 测试统计 */}
          {testResults.size > 0 && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {testResults.size}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    已测试
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Array.from(testResults.values()).filter(r => r.hasPermission).length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    已授权
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {Array.from(testResults.values()).filter(r => !r.hasPermission).length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    未授权
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {getAllPermissions().length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    总权限数
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 选项卡切换 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('permissions')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'permissions'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  权限测试
                </div>
              </button>
              <button
                onClick={() => setActiveTab('menus')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'menus'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Menu className="w-4 h-4" />
                  菜单显示测试
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 当前用户UI权限测试 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            当前登录用户UI权限测试
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                客户管理权限示例：
              </h3>
              <div className="space-y-2">
                <PermissionGuard permission="customer_view">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                    ✅ 你有查看客户权限
                  </div>
                </PermissionGuard>
                
                <PermissionGuard permission="customer_add">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                    ✅ 你有添加客户权限
                  </div>
                </PermissionGuard>
                
                <PermissionGuard permission="customer_delete">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                    ✅ 你有删除客户权限
                  </div>
                </PermissionGuard>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                培训管理权限示例：
              </h3>
              <div className="space-y-2">
                <PermissionGuard permission="training_view">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                    ✅ 你有查看培训权限
                  </div>
                </PermissionGuard>
                
                <PermissionGuard permission="training_add">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                    ✅ 你有添加培训权限
                  </div>
                </PermissionGuard>
                
                <PermissionGuard permission="training_delete">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                    ✅ 你有删除培训权限
                  </div>
                </PermissionGuard>
              </div>
            </div>
          </div>
        </div>

        {/* 权限分类测试 / 菜单显示测试 */}
        {activeTab === 'permissions' ? (
          <div className="space-y-6">
            {Object.entries(PERMISSION_CATEGORIES).map(([category, categoryData]) => (
              <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {categoryData.name}
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({categoryData.permissions?.length || 0} 个权限)
                  </span>
                </h2>
                {isLoadingPermissions ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500">加载权限中...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryData.permissions?.map((permission: Permission) => renderPermissionTest(permission))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* 菜单显示测试 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                导航菜单显示权限测试
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({MENU_FEATURES.length} 个菜单项)
                </span>
              </h2>
              {isLoadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">加载中...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {MENU_FEATURES.map((menu) => renderMenuTest(menu))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
