import { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { BarChart2, Calendar, UserCheck, DollarSign, Users, Database, GraduationCap, Shield, Settings, Megaphone } from 'lucide-react';
import dataService from '@/lib/dataService';
import { generateDefaultAvatar } from '@/utils/imageUtils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  permission?: string[];
}

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentPath?: string;
}

const Sidebar = ({ sidebarOpen, setSidebarOpen, currentPath }: SidebarProps) => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [activePath, setActivePath] = useState<string>(currentPath || location.pathname);
  const [salespersonPermissions, setSalespersonPermissions] = useState<string[]>([]);

  // 获取业务员的权限列表
  useEffect(() => {
    const fetchPermissions = async () => {
      if (user?.role === 'salesperson') {
        try {
          const salespersons = await dataService.getSalespersons();
          const currentSalesperson = salespersons.find(s => s.name === user.name);
          const permissions = (currentSalesperson as any)?.permissions;
          if (permissions && Array.isArray(permissions)) {
            setSalespersonPermissions(permissions);
          } else {
            // 如果没有找到权限，设置默认权限
            console.warn('未找到业务员权限，使用默认权限');
            setSalespersonPermissions(['dashboard_access', 'training_view', 'customer_view']);
          }
        } catch (error) {
          console.error('获取业务员权限失败:', error);
          // 即使获取失败，也设置默认权限，确保菜单可以显示
          setSalespersonPermissions(['dashboard_access', 'training_view', 'customer_view']);
        }
      }
    };
    
    if (user) {
      fetchPermissions();
    }
  }, [user]);

  // 统一的导航菜单配置，包含权限控制
  const navItems: NavItem[] = [
    { icon: <BarChart2 size={20} />, label: '仪表盘', path: '/dashboard', permission: ['admin', 'salesperson', 'expert'] },
    { icon: <Calendar size={20} />, label: '培训计划', path: '/training-performance', permission: ['admin', 'salesperson', 'expert'] },
    { icon: <UserCheck size={20} />, label: '专家管理', path: '/expert-management', permission: ['admin'] },
    { icon: <DollarSign size={20} />, label: '销售追踪', path: '/sales-tracking', permission: ['admin'] },
    { icon: <Users size={20} />, label: '客户管理', path: '/customer-management', permission: ['admin', 'salesperson'] },
    { icon: <Database size={20} />, label: '数据管理', path: '/data-management', permission: ['admin'] },
    { icon: <Users size={20} />, label: '业务员管理', path: '/salesperson-management', permission: ['admin'] },
    { icon: <Megaphone size={20} />, label: '公告管理', path: '/announcement-management', permission: ['admin'] },
    { icon: <Shield size={20} />, label: '权限管理', path: '/permission-management', permission: ['admin'] },
    { icon: <Settings size={20} />, label: '个人设置', path: '/profile-settings', permission: ['admin', 'salesperson', 'expert'] }
  ];
  
  // 监听路径变化，确保activePath始终正确
  useEffect(() => {
    // 确保即使currentPath为空，也能使用location.pathname
    const newPath = currentPath || location.pathname;
    if (newPath !== activePath) {
      setActivePath(newPath);
    }
  }, [currentPath, location.pathname, activePath]);

  // 根据用户角色和权限过滤导航项
  const filteredNavItems = navItems.filter(item => {
    // 如果没有指定权限，则所有角色都可以访问
    if (!item.permission) return true;
    
    // 检查用户角色是否在允许的权限列表中
    if (user && item.permission.includes(user.role)) {
                       // 对于业务员，还需要检查具体的权限
                       if (user.role === 'salesperson') {
                         // 根据用户的具体权限决定是否显示菜单项
                         const permissionMap: Record<string, string> = {
                           '/dashboard': 'dashboard_access',
                           '/training-performance': 'training_view',
                           '/customer-management': 'customer_view',
                           '/sales-tracking': 'sales_tracking_view',
                           '/data-export': 'data_export'
                         };
                         
                         // 检查是否有对应权限或是否为基础功能（包括个人设置）
                         return salespersonPermissions.includes(permissionMap[item.path] || '') || 
                                ['/dashboard', '/training-performance', '/customer-management', '/profile-settings'].includes(item.path);
                       }
      return true;
    }
    
    return false;
  });

  const handleLogout = () => {
    logout();
  };
  
  // 处理导航项点击 - 简化逻辑，确保状态正确更新
  const handleNavClick = (path: string) => {
    // 立即更新activePath状态
    setActivePath(path);
    // 对于移动设备，点击导航后关闭侧边栏
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  return (
    <div 
      className={`fixed lg:relative inset-y-0 left-0 z-30 w-56 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <GraduationCap className="text-blue-600 dark:text-blue-400" size={24} />
            <span className="font-bold text-lg text-gray-800 dark:text-white">培训管理系统</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="关闭菜单"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    item.path === activePath
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                  aria-current={item.path === activePath ? "page" : undefined}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img
                src={user?.avatar || generateDefaultAvatar(user?.name || '用户', 64)}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? '管理员' : user?.role === 'salesperson' ? '业务员' : '专家'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="退出登录"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;