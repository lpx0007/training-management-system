import { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { BarChart2, Calendar, UserCheck, DollarSign, Users, Database, Shield, Settings, Image, FileText, History, GraduationCap } from 'lucide-react';
import { MENU_FEATURES } from '@/constants/menuFeatures';
import { generateDefaultAvatar } from '@/utils/imageUtils';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentPath?: string;
}

// 图标映射
const iconMap: Record<string, React.ReactNode> = {
  'chart-line': <BarChart2 size={20} />,
  'users': <Users size={20} />,
  'calendar': <Calendar size={20} />,
  'user-tie': <UserCheck size={20} />,
  'user-friends': <Users size={20} />,
  'file-alt': <FileText size={20} />,
  'image': <Image size={20} />,
  'database': <Database size={20} />,
  'chart-bar': <DollarSign size={20} />,
  'shield-alt': <Shield size={20} />,
  'history': <History size={20} />,
  'cog': <Settings size={20} />,
};

const Sidebar = ({ sidebarOpen, setSidebarOpen, currentPath }: SidebarProps) => {
  const { user, logout, canAccessMenu, hasAnyPermission } = useContext(AuthContext);
  const location = useLocation();
  const [activePath, setActivePath] = useState<string>(currentPath || location.pathname);
  
  // 监听路径变化，确保activePath始终正确
  useEffect(() => {
    const newPath = currentPath || location.pathname;
    if (newPath !== activePath) {
      setActivePath(newPath);
    }
  }, [currentPath, location.pathname, activePath]);

  // 根据功能面板访问权限和具体权限过滤菜单项
  const filteredMenuItems = MENU_FEATURES.filter(feature => {
    // 1. 检查功能面板是否启用
    if (!canAccessMenu(feature.id)) {
      return false;
    }
    
    // 2. 检查是否有所需的权限（如果有要求的话）
    if (feature.requiredPermissions.length > 0) {
      // 需要任一权限即可
      return hasAnyPermission(feature.requiredPermissions);
    }
    
    // 没有权限要求的功能面板（如仪表盘、个人设置）
    return true;
  }).sort((a, b) => a.displayOrder - b.displayOrder);

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
            {filteredMenuItems.map((feature) => (
              <li key={feature.id}>
                <Link
                  to={feature.path}
                  onClick={() => handleNavClick(feature.path)}
                  className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    feature.path === activePath
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }`}
                  aria-current={feature.path === activePath ? "page" : undefined}
                  title={feature.description}
                >
                  <span className="mr-3">{iconMap[feature.icon] || <Settings size={20} />}</span>
                  <span>{feature.name}</span>
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
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role === 'admin' ? '管理员' : user?.role === 'salesperson' ? '业务员' : user?.role === 'manager' ? '部门经理' : user?.role === 'conference_service' ? '会务客服' : '专家'}</p>
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