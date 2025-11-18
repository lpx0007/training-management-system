/**
 * 权限管理页面
 * 管理所有用户的权限和功能面板访问权限
 */

import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { motion } from 'framer-motion';
import { Shield, Search, Users as UsersIcon, UserCog, Menu } from 'lucide-react';
import { Empty } from '@/components/Empty';
import Sidebar from '@/components/Sidebar';
import supabaseService from '@/lib/supabase/supabaseService';
import { getPermissionCategories, getPermissionById, getRoleDefaultPermissions } from '@/constants/permissions';
import { MENU_FEATURES, getRoleDefaultMenuFeatures } from '@/constants/menuFeatures';
import { getFeaturePermissions, getFeaturePermissionDescription } from '@/constants/featurePermissionMapping';
import { toast } from 'sonner';
import UserRoleEditModal from '@/components/UserRoleEditModal';

// 用户接口（包含权限和功能面板信息）
interface UserWithPermissions {
  id: string;
  username: string;
  role: 'admin' | 'salesperson' | 'expert' | 'manager' | 'conference_service';
  name: string;
  department: string | null;
  department_id?: number;
  status: string;
  permissions: string[];
  menuAccess: string[];
}

export default function PermissionManagement() {
  const { user, isAdmin } = useContext(AuthContext);
  
  // 状态管理
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'salesperson' | 'expert' | 'manager' | 'conference_service'>('all');
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithPermissions[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 模态框状态
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [selectedMenuFeatures, setSelectedMenuFeatures] = useState<string[]>([]);
  
  // 角色批量设置状态
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRoleForBatch, setSelectedRoleForBatch] = useState<'salesperson' | 'expert' | 'manager' | 'conference_service' | null>(null);
  const [batchStrategy, setBatchStrategy] = useState<'override' | 'merge' | 'reset'>('merge');
  
  // 角色编辑状态
  const [isRoleEditModalOpen, setIsRoleEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserWithPermissions | null>(null);

  // 权限分类和功能面板
  const permissionCategories = getPermissionCategories();
  const menuFeatures = MENU_FEATURES;

  // 加载用户数据
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await supabaseService.getAllUsersWithPermissions();
      setUsers(usersData as UserWithPermissions[]);
      setFilteredUsers(usersData as UserWithPermissions[]);
    } catch (error) {
      console.error('加载用户失败:', error);
      toast.error('加载用户数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 筛选用户
  useEffect(() => {
    let result = [...users];

    // 角色筛选
    if (selectedRole !== 'all') {
      result = result.filter(u => u.role === selectedRole);
    }

    // 搜索筛选
    if (searchTerm) {
      result = result.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredUsers(result);
  }, [searchTerm, selectedRole, users]);

  // 打开权限设置模态框
  const openPermissionModal = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setSelectedPermissions(user.permissions || []);
    setSelectedMenuFeatures(user.menuAccess || []);
    setIsPermissionModalOpen(true);
  };

  // 保存权限设置
  const savePermissions = async () => {
    if (!selectedUser) return;

    try {
      // 保存权限
      await supabaseService.updateUserPermissions(selectedUser.id, selectedPermissions);
      
      // 保存功能面板访问权限
      await supabaseService.updateUserMenuAccess(selectedUser.id, selectedMenuFeatures);

      toast.success('权限设置已保存');
      
      // 刷新用户列表
      await loadUsers();
      
      setIsPermissionModalOpen(false);
    } catch (error) {
      console.error('保存权限失败:', error);
      toast.error('保存权限失败，请重试');
    }
  };

  // 打开角色批量设置模态框
  const openRoleModal = (role: 'salesperson' | 'expert' | 'manager' | 'conference_service') => {
    setSelectedRoleForBatch(role);
    
    // 加载该角色的默认权限和功能面板
    const defaultPermissions = getRoleDefaultPermissions(role as any);
    const defaultMenuFeatures = getRoleDefaultMenuFeatures(role as any);
    
    setSelectedPermissions(defaultPermissions);
    setSelectedMenuFeatures(defaultMenuFeatures);
    setBatchStrategy('merge');
    setIsRoleModalOpen(true);
  };

  // 保存角色批量权限设置
  const saveRolePermissions = async () => {
    if (!selectedRoleForBatch) return;

    const affectedUsers = users.filter(u => u.role === selectedRoleForBatch);
    
    if (affectedUsers.length === 0) {
      toast.error('没有找到该角色的用户');
      return;
    }

    if (!window.confirm(
      `确定要为 ${affectedUsers.length} 个${getRoleDisplayName(selectedRoleForBatch)}用户批量设置权限吗？\n\n` +
      `策略：${batchStrategy === 'override' ? '完全覆盖' : batchStrategy === 'merge' ? '合并模式' : '重置为角色默认'}\n` +
      `权限数：${selectedPermissions.length} 个\n` +
      `功能面板：${selectedMenuFeatures.length} 个`
    )) {
      return;
    }

    try {
      toast.info('正在批量更新权限...');
      
      // 批量更新权限
      const permResult = await supabaseService.batchUpdateRolePermissions(
        selectedRoleForBatch,
        selectedPermissions,
        batchStrategy
      );
      
      // 批量更新功能面板
      const menuResult = await supabaseService.batchUpdateRoleMenuAccess(
        selectedRoleForBatch,
        selectedMenuFeatures,
        batchStrategy
      );

      toast.success(
        `批量设置完成！\n` +
        `权限更新：成功 ${permResult.success} 个，失败 ${permResult.failed} 个\n` +
        `功能面板更新：成功 ${menuResult.success} 个，失败 ${menuResult.failed} 个`
      );
      
      // 刷新用户列表
      await loadUsers();
      
      setIsRoleModalOpen(false);
    } catch (error) {
      console.error('批量设置权限失败:', error);
      toast.error('批量设置权限失败，请重试');
    }
  };

  // 切换权限选择
  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  // 切换功能面板的所有权限
  const toggleFeaturePermissions = (featurePermissions: string[]) => {
    const allSelected = featurePermissions.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      // 取消该功能面板的所有权限
      setSelectedPermissions(prev => prev.filter(p => !featurePermissions.includes(p)));
    } else {
      // 选中该功能面板的所有权限
      setSelectedPermissions(prev => {
        const newPerms = [...prev];
        featurePermissions.forEach(p => {
          if (!newPerms.includes(p)) {
            newPerms.push(p);
          }
        });
        return newPerms;
      });
    }
  };

  // 切换功能面板显示（导航栏显示/隐藏）
  const toggleMenuFeature = (featureId: string) => {
    setSelectedMenuFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  // 全选/清空权限分类
  const toggleCategoryPermissions = (categoryPermissions: string[]) => {
    const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p));
    
    if (allSelected) {
      // 清空该分类
      setSelectedPermissions(prev => prev.filter(p => !categoryPermissions.includes(p)));
    } else {
      // 全选该分类
      setSelectedPermissions(prev => {
        const newPerms = [...prev];
        categoryPermissions.forEach(p => {
          if (!newPerms.includes(p)) {
            newPerms.push(p);
          }
        });
        return newPerms;
      });
    }
  };

  // 获取角色显示名称
  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      admin: '管理员',
      salesperson: '业务员',
      expert: '专家',
      manager: '部门经理',
      conference_service: '会务客服'
    };
    return roleMap[role] || role;
  };

  // 获取状态显示
  const getStatusDisplay = (status: string) => {
    if (status === 'enabled' || status === 'active') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">在职</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">离职</span>;
  };

  // 权限检查 - 只有管理员可以访问
  if (!isAdmin || !isAdmin()) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
          currentPath="/permission-management"
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">权限不足</h2>
            <p className="text-gray-500 dark:text-gray-400">只有管理员可以访问权限管理页面</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-0 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        currentPath="/permission-management"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-20">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center">
              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg mr-3"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">权限管理</h1>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* 统计卡片和测试按钮 - 合并到一行 */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-2 sm:p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">用户总数</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mt-1">{users.length}</h3>
                </div>
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 items-center justify-center">
                  <UsersIcon className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-2 sm:p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">系统权限总数</p>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mt-1">
                    {permissionCategories.reduce((sum, cat) => sum + cat.permissions.length, 0)}
                  </h3>
                </div>
                <div className="hidden sm:flex w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 items-center justify-center">
                  <Shield className="text-purple-600 dark:text-purple-400" size={24} />
                </div>
              </div>
            </motion.div>

            {/* 权限测试按钮 - 作为第三列 */}
            <motion.div 
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm p-2 sm:p-4 border border-gray-100 dark:border-gray-700 flex items-center justify-center"
            >
              <a
                href="/permission-test"
                className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white rounded-md sm:rounded-lg hover:bg-purple-700 transition-colors shadow-sm w-full justify-center"
              >
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">权限测试验证</span>
              </a>
            </motion.div>
          </div>

          {/* 按角色批量设置区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">按角色批量设置权限</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              快速为某个角色的所有用户统一设置权限和功能面板访问权限
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 业务员角色 */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                      <UsersIcon className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">业务员</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {users.filter(u => u.role === 'salesperson').length} 个用户
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  管理客户信息、培训记录和招商简章
                </p>
                <button
                  onClick={() => openRoleModal('salesperson')}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  批量设置
                </button>
              </div>

              {/* 专家角色 */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3">
                      <i className="fas fa-user-graduate text-green-600 dark:text-green-400"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">专家</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {users.filter(u => u.role === 'expert').length} 个用户
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  管理培训课程和专家个人资料
                </p>
                <button
                  onClick={() => openRoleModal('expert')}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  批量设置
                </button>
              </div>

              {/* 部门经理角色 */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                      <i className="fas fa-user-tie text-purple-600 dark:text-purple-400"></i>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">部门经理</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {users.filter(u => u.role === 'manager').length} 个用户
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  管理部门团队、业务员和部门业绩
                </p>
                <button
                  onClick={() => openRoleModal('manager')}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  批量设置
                </button>
              </div>

              {/* 会务客服角色 */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-3">
                      <UserCog className="text-orange-600 dark:text-orange-400" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white">会务客服</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {users.filter(u => u.role === 'conference_service').length} 个用户
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  管理培训服务协调和参训人信息维护
                </p>
                <button
                  onClick={() => openRoleModal('conference_service')}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  批量设置
                </button>
              </div>
            </div>
          </div>

          {/* 搜索和筛选 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索用户姓名、用户名或部门..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">所有角色</option>
                  <option value="admin">管理员</option>
                  <option value="salesperson">业务员</option>
                  <option value="expert">专家</option>
                  <option value="manager">部门经理</option>
                  <option value="conference_service">会务客服</option>
                </select>
              </div>
            </div>
          </div>

          {/* 用户列表 */}
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        用户
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        角色
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        部门
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        权限数
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        功能面板
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {u.name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-800 dark:text-white">{u.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-800 dark:text-white">
                            {getRoleDisplayName(u.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                          {u.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusDisplay(u.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-800 dark:text-white">
                            {u.permissions?.length || 0} 个
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-800 dark:text-white">
                            {u.menuAccess?.length || 0} 个
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user?.role === 'admin' && (
                              <button
                                onClick={() => {
                                  setUserToEdit(u);
                                  setIsRoleEditModalOpen(true);
                                }}
                                className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 text-sm font-medium flex items-center gap-1"
                              >
                                <UserCog size={14} />
                                角色
                              </button>
                            )}
                            <button
                              onClick={() => openPermissionModal(u)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm font-medium"
                            >
                              管理权限
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
              <Empty />
            </div>
          )}
        </main>
      </div>

      {/* 权限设置模态框 */}
      {isPermissionModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* 模态框头部 */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    管理权限 - {selectedUser.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {getRoleDisplayName(selectedUser.role)} • {selectedUser.username}
                  </p>
                </div>
                <button
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* 说明文字 */}
            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                以功能面板为单位管理权限。每个功能面板包含该页面的所有操作权限，右侧开关控制是否在导航栏显示。
              </p>
            </div>

            {/* 模态框内容 - 按功能面板组织权限 */}
            <div className="flex-1 overflow-y-auto p-6">
              {menuFeatures.map((feature) => {
                // 使用映射关系获取该功能面板的权限
                const featurePermissionIds = getFeaturePermissions(feature.id);
                const relatedPermissions = featurePermissionIds
                  .map(id => getPermissionById(id))
                  .filter(p => p !== undefined);

                const allPermissionsSelected = relatedPermissions.length > 0 && 
                  relatedPermissions.every(p => selectedPermissions.includes(p!.id));
                const isMenuEnabled = selectedMenuFeatures.includes(feature.id);
                const permissionDescription = getFeaturePermissionDescription(feature.id);

                return (
                  <div key={feature.id} className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {/* 功能面板头部 */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <i className={`${feature.icon} text-gray-600 dark:text-gray-400 mr-3 text-lg`}></i>
                        <div className="flex-1">
                          <h3 className="text-md font-semibold text-gray-800 dark:text-white">
                            {feature.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {permissionDescription || feature.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* 全选/清空按钮 */}
                        {relatedPermissions.length > 0 && (
                          <button
                            onClick={() => toggleFeaturePermissions(relatedPermissions.map(p => p.id))}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                          >
                            {allPermissionsSelected ? '清空' : '全选'}
                          </button>
                        )}
                        
                        {/* 导航栏显示开关 */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400">导航栏</span>
                          <button
                            onClick={() => toggleMenuFeature(feature.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              isMenuEnabled
                                ? 'bg-blue-600'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isMenuEnabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 功能面板权限列表 */}
                    {relatedPermissions.length > 0 ? (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {relatedPermissions.map((permission) => permission && (
                          <label
                            key={permission.id}
                            className="flex items-start p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="ml-3 flex-1">
                              <div className="text-sm font-medium text-gray-800 dark:text-white">
                                {permission.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {permission.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        此功能面板无需特定权限，所有用户均可访问
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    已选择 <span className="font-semibold text-gray-800 dark:text-white">{selectedPermissions.length}</span> 个权限
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="fas fa-th-large text-sm text-green-600 dark:text-green-400"></i>
                  <span className="text-gray-600 dark:text-gray-400">
                    导航栏显示 <span className="font-semibold text-gray-800 dark:text-white">{selectedMenuFeatures.length}</span> 个面板
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsPermissionModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  取消
                </button>
                <button
                  onClick={savePermissions}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  <i className="fas fa-save mr-2"></i>
                  保存设置
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 角色批量权限设置模态框 */}
      {isRoleModalOpen && selectedRoleForBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* 模态框头部 */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    批量设置 {getRoleDisplayName(selectedRoleForBatch)} 权限
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    将影响 {users.filter(u => u.role === selectedRoleForBatch).length} 个用户
                  </p>
                </div>
                <button
                  onClick={() => setIsRoleModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* 更新策略选择 - 横向排列 */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2">更新策略</h3>
              <div className="grid grid-cols-3 gap-3">
                <label className={`flex items-center p-2.5 rounded-lg border-2 cursor-pointer transition-colors ${
                  batchStrategy === 'merge' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                }`}>
                  <input
                    type="radio"
                    name="strategy"
                    value="merge"
                    checked={batchStrategy === 'merge'}
                    onChange={(e) => setBatchStrategy(e.target.value as any)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-2 flex-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-white">合并模式</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">保留现有+添加新权限</div>
                  </div>
                </label>

                <label className={`flex items-center p-2.5 rounded-lg border-2 cursor-pointer transition-colors ${
                  batchStrategy === 'override' 
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-700'
                }`}>
                  <input
                    type="radio"
                    name="strategy"
                    value="override"
                    checked={batchStrategy === 'override'}
                    onChange={(e) => setBatchStrategy(e.target.value as any)}
                    className="text-yellow-600 focus:ring-yellow-500"
                  />
                  <div className="ml-2 flex-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-white">完全覆盖</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">删除现有+仅保留新权限</div>
                  </div>
                </label>

                <label className={`flex items-center p-2.5 rounded-lg border-2 cursor-pointer transition-colors ${
                  batchStrategy === 'reset' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'
                }`}>
                  <input
                    type="radio"
                    name="strategy"
                    value="reset"
                    checked={batchStrategy === 'reset'}
                    onChange={(e) => setBatchStrategy(e.target.value as any)}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <div className="ml-2 flex-1">
                    <div className="text-sm font-medium text-gray-800 dark:text-white">重置默认</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">恢复角色默认配置</div>
                  </div>
                </label>
              </div>
            </div>

            {/* 权限和功能面板配置 */}
            <div className="flex-1 overflow-y-auto p-6">
              {batchStrategy !== 'reset' ? (
                <>
                  {menuFeatures.map((feature) => {
                    const featurePermissionIds = getFeaturePermissions(feature.id);
                    const relatedPermissions = featurePermissionIds
                      .map(id => getPermissionById(id))
                      .filter(p => p !== undefined);

                    const allPermissionsSelected = relatedPermissions.length > 0 && 
                      relatedPermissions.every(p => selectedPermissions.includes(p!.id));
                    const isMenuEnabled = selectedMenuFeatures.includes(feature.id);
                    const permissionDescription = getFeaturePermissionDescription(feature.id);

                    return (
                      <div key={feature.id} className="mb-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {/* 功能面板头部 */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <i className={`${feature.icon} text-gray-600 dark:text-gray-400 mr-3 text-lg`}></i>
                            <div className="flex-1">
                              <h3 className="text-md font-semibold text-gray-800 dark:text-white">
                                {feature.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {permissionDescription || feature.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {relatedPermissions.length > 0 && (
                              <button
                                onClick={() => toggleFeaturePermissions(relatedPermissions.map(p => p.id))}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                              >
                                {allPermissionsSelected ? '清空' : '全选'}
                              </button>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600 dark:text-gray-400">导航栏</span>
                              <button
                                onClick={() => toggleMenuFeature(feature.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  isMenuEnabled
                                    ? 'bg-blue-600'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    isMenuEnabled ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 功能面板权限列表 */}
                        {relatedPermissions.length > 0 ? (
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {relatedPermissions.map((permission) => permission && (
                              <label
                                key={permission.id}
                                className="flex items-start p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.includes(permission.id)}
                                  onChange={() => togglePermission(permission.id)}
                                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="ml-3 flex-1">
                                  <div className="text-sm font-medium text-gray-800 dark:text-white">
                                    {permission.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {permission.description}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                            此功能面板无需特定权限
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-center py-12">
                  <Shield className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                    重置为角色默认权限
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    将为所有 {getRoleDisplayName(selectedRoleForBatch)} 用户重置权限配置，
                    恢复为系统预设的角色默认权限和功能面板访问权限。
                  </p>
                </div>
              )}
            </div>

            {/* 模态框底部 */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50">
              {batchStrategy !== 'reset' && (
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-600 dark:text-gray-400">
                      已选择 <span className="font-semibold text-gray-800 dark:text-white">{selectedPermissions.length}</span> 个权限
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-th-large text-sm text-green-600 dark:text-green-400"></i>
                    <span className="text-gray-600 dark:text-gray-400">
                      导航栏显示 <span className="font-semibold text-gray-800 dark:text-white">{selectedMenuFeatures.length}</span> 个面板
                    </span>
                  </div>
                </div>
              )}
              <div className="flex gap-3 ml-auto">
                <button
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  取消
                </button>
                <button
                  onClick={saveRolePermissions}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  <i className="fas fa-save mr-2"></i>
                  批量保存
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* 用户角色编辑模态框 */}
      {userToEdit && (
        <UserRoleEditModal
          isOpen={isRoleEditModalOpen}
          onClose={() => {
            setIsRoleEditModalOpen(false);
            setUserToEdit(null);
          }}
          user={userToEdit}
          onSave={loadUsers}
        />
      )}
    </div>
  );
}
