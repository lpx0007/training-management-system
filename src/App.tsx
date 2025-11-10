import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import TrainingPerformance from "@/pages/TrainingPerformance";
import ExpertManagement from "@/pages/ExpertManagement";
import SalesTracking from "@/pages/SalesTracking";
import CustomerManagement from "@/pages/CustomerManagement";
import DataExport from "@/pages/DataExport";
import DataManagement from "@/pages/DataManagement";
import SalesPersonManagement from "@/pages/SalesPersonManagement";
import PermissionManagement from "@/pages/PermissionManagement";
import ProfileSettings from "@/pages/ProfileSettings";
import AnnouncementManagement from "@/pages/AnnouncementManagement";
import NotificationCenter from "@/pages/NotificationCenter";
import AnnouncementList from "@/pages/AnnouncementList";
import PosterGenerator from "@/pages/PosterGenerator";
import ProspectusManagement from '@/pages/ProspectusManagement';
import InitDepartmentManager from '@/pages/InitDepartmentManager';
import CourseManagement from '@/pages/CourseManagement';
import AuditLogs from '@/pages/AuditLogs';
import { useState, useEffect } from "react";
import { AuthContext, User } from '@/contexts/authContext';
import { toast } from 'sonner';
import supabaseService from '@/lib/supabase/supabaseService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [menuAccess, setMenuAccess] = useState<string[]>([]);

  // 检查现有 session
  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;
    let initializationComplete = false;
    
    const initAuth = async () => {
      console.log('=== 开始初始化认证 ===');
      
      // 添加超时保护，防止无限等待
      const timeout = setTimeout(() => {
        if (mounted && !initializationComplete) {
          console.error('⏰ 初始化超时，强制完成');
          setLoading(false);
          // 不清除认证状态，让用户可以重试
        }
      }, 8000); // 8秒超时
      
      try {
        console.log('步骤 1: 获取 session...');
        const session = await supabaseService.getSession();
        console.log('Session 结果:', session ? '存在' : '不存在');
        
        if (session?.user && mounted) {
          console.log('步骤 2: 找到现有 session，用户:', session.user.email);
          
          // 加载用户资料
          console.log('步骤 3: 加载用户资料...');
          try {
            await loadUserProfile(session.user.id);
            console.log('✅ 用户资料加载成功');
          } catch (profileError: any) {
            console.error('❌ 加载用户资料失败:', profileError.message);
            // 使用 session 中的基本信息创建临时用户
            if (mounted && session.user) {
              const tempUser: User = {
                id: session.user.id,
                username: session.user.email || 'user',
                role: 'salesperson', // 默认角色
                name: session.user.email?.split('@')[0] || '用户',
                department: undefined,
                avatar: undefined
              };
              setUser(tempUser);
              setIsAuthenticated(true);
              toast.warning('使用临时用户信息，请稍后刷新页面');
            }
          }
        } else {
          console.log('步骤 2: 没有现有 session');
          if (mounted) {
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } catch (error: any) {
        console.error('❌ 检查 session 失败:', error.message);
        if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        clearTimeout(timeout);
        initializationComplete = true;
        
        if (mounted) {
          console.log('=== 初始化完成，设置 loading = false ===');
          setLoading(false);
        }
      }
    };

    const setupAuthListener = () => {
      // 监听认证状态变化
      const { data: { subscription } } = supabaseService.onAuthStateChange(
        async (event, session) => {
          console.log('🔔 认证状态变化:', event);
          
          if (!mounted) {
            console.log('组件已卸载，忽略认证事件');
            return;
          }
          
          // 只在初始化完成后处理认证事件，避免竞态条件
          if (!initializationComplete) {
            console.log('初始化未完成，延迟处理认证事件');
            return;
          }
          
          if (event === 'SIGNED_IN' && session) {
            console.log('用户登录事件');
            // 登录事件由 login 函数处理，这里不重复处理
          } else if (event === 'SIGNED_OUT') {
            console.log('用户登出事件，清理状态');
            setIsAuthenticated(false);
            setUser(null);
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('Token 刷新事件');
            // Token 刷新时保持现有状态，不做任何操作
          } else if (event === 'USER_UPDATED' && session) {
            console.log('用户信息更新事件');
            // 重新加载用户资料
            try {
              await loadUserProfile(session.user.id);
            } catch (error) {
              console.error('更新用户资料失败:', error);
            }
          }
        }
      );
      
      authSubscription = subscription;
    };

    // 先初始化，再设置监听器
    initAuth().then(() => {
      if (mounted) {
        setupAuthListener();
      }
    });

    return () => {
      console.log('清理认证监听器');
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    console.log('📋 loadUserProfile 开始，用户 ID:', userId);
    
    try {
      const profile = await supabaseService.getUserProfile(userId);
      
      if (profile) {
        console.log('✅ 用户资料加载成功:', profile.name, profile.role);
        
        // 并行加载用户权限和功能面板访问权限
        const [userPermissions, userMenuAccess] = await Promise.all([
          supabaseService.getUserPermissions(userId),
          supabaseService.getUserMenuAccess(userId)
        ]);
        
        console.log('✅ 权限加载成功:', userPermissions.length, '个权限');
        console.log('✅ 功能面板加载成功:', userMenuAccess.length, '个面板');
        
        const userData: User = {
          id: profile.id,
          username: profile.username,
          role: profile.role,
          name: profile.name,
          department: profile.department || undefined,
          avatar: profile.avatar || undefined,
          permissions: userPermissions,
          menuAccess: userMenuAccess,
        };
        
        setUser(userData);
        setPermissions(userPermissions);
        setMenuAccess(userMenuAccess);
        setIsAuthenticated(true);
      } else {
        throw new Error('用户资料为空');
      }
    } catch (error: any) {
      console.error('❌ loadUserProfile 失败:', error.message);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 执行登录:', email);
      const { user: authUser, profile } = await supabaseService.signIn(email, password);
      
      if (authUser && profile) {
        console.log('✅ 登录成功，用户:', profile.name);
        
        // 检查用户状态（使用 timeout 避免卡住）
        try {
          const statusCheckPromise = supabaseService.checkUserStatus(profile.id);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('状态检查超时')), 5000)
          );
          
          await Promise.race([statusCheckPromise, timeoutPromise]);
        } catch (statusError: any) {
          console.error('❌ 状态检查失败:', statusError);
          // 如果是状态问题，登出用户
          await supabaseService.signOut();
          toast.error(statusError.message || '账号状态异常');
          return false;
        }
        
        // 状态正常，加载用户权限和功能面板访问权限
        console.log('📋 加载用户权限和功能面板...');
        const [userPermissions, userMenuAccess] = await Promise.all([
          supabaseService.getUserPermissions(profile.id),
          supabaseService.getUserMenuAccess(profile.id)
        ]);
        
        console.log('✅ 权限加载成功:', userPermissions.length, '个权限');
        console.log('✅ 功能面板加载成功:', userMenuAccess.length, '个面板');
        
        // 设置用户信息（包含权限和功能面板）
        const userData: User = {
          id: profile.id,
          username: profile.username,
          role: profile.role,
          name: profile.name,
          department: profile.department || undefined,
          avatar: profile.avatar || undefined,
          permissions: userPermissions,
          menuAccess: userMenuAccess,
        };
        setUser(userData);
        setPermissions(userPermissions);
        setMenuAccess(userMenuAccess);
        setIsAuthenticated(true);
        
        toast.success(`欢迎，${profile.name}！`);
        return true;
      }
      
      console.error('❌ 登录失败：未获取到用户信息');
      toast.error('登录失败');
      return false;
    } catch (error: any) {
      console.error('❌ 登录错误:', error);
      const errorMessage = error.message || '用户名或密码错误';
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 执行登出');
      
      // 1. 先清理本地状态（立即反馈）
      setIsAuthenticated(false);
      setUser(null);
      setPermissions([]);
      setMenuAccess([]);
      
      // 2. 调用 Supabase 登出（清除服务器端 session）
      console.log('调用 Supabase signOut');
      await supabaseService.signOut();
      
      // 3. 清除应用相关的 localStorage（不触碰 Supabase 的存储）
      try {
        const keysToRemove = ['user_profile', 'app_state'];
        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
        });
      } catch (e) {
        console.warn('清除 localStorage 失败:', e);
      }
      
      console.log('✅ 登出成功');
      toast.info('已退出系统');
      
      // 4. 使用 navigate 而不是 window.location，避免强制刷新
      window.location.href = '/login';
      
    } catch (error) {
      console.error('❌ 登出失败:', error);
      
      // 即使登出失败，也要清理本地状态
      setIsAuthenticated(false);
      setUser(null);
      setPermissions([]);
      setMenuAccess([]);
      
      toast.error('登出时出现问题，已清除本地状态');
      window.location.href = '/login';
    }
  };

  // 受保护的路由组件
  const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string[] }) => {
    // 如果正在加载，显示加载状态
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    if (requiredRole && user && !requiredRole.includes(user.role)) {
      toast.error('您没有权限访问此页面');
      return <Navigate to="/dashboard" replace />;
    }
    
    return children;
  };

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated, 
        user,
        loading,
        permissions,
        menuAccess,
        setIsAuthenticated, 
        setUser, 
        login, 
        logout,
        
        // 检查单个权限
        hasPermission: (permission: string) => {
          // 管理员拥有所有权限
          if (user?.role === 'admin') return true;
          // 业务员默认有添加培训客户的权限（兼容性）
          if (user?.role === 'salesperson' && permission === 'training_add_customer') return true;
          // 检查用户是否有特定权限
          return permissions.includes(permission);
        },
        
        // 检查多个权限（任一）
        hasAnyPermission: (perms: string[]) => {
          if (user?.role === 'admin') return true;
          return perms.some(p => permissions.includes(p));
        },
        
        // 检查多个权限（全部）
        hasAllPermissions: (perms: string[]) => {
          if (user?.role === 'admin') return true;
          return perms.every(p => permissions.includes(p));
        },
        
        // 检查是否可访问功能面板
        canAccessMenu: (featureId: string) => {
          if (user?.role === 'admin') return true;
          return menuAccess.includes(featureId);
        },
        
        // 检查是否为管理员
        isAdmin: () => {
          return user?.role === 'admin';
        },
        
        // 检查是否可以查看特定客户（保留兼容性）
        canViewCustomer: (customer: {salesperson: string, name?: string}) => {
          // 管理员可以查看所有客户
          if (user?.role === 'admin') {
            console.log('管理员查看客户权限检查通过');
            return true;
          }
          // 有 customer_view_all 权限可以查看所有客户
          if (permissions.includes('customer_view_all')) {
            return true;
          }
          // 业务员只能查看自己的客户
          const canView = user?.name === customer.salesperson;
          console.log(`业务员${user?.name}查看客户${customer.name}权限检查: ${canView}`);
          return canView;
        }
      }}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/training-performance" element={
          <ProtectedRoute requiredRole={['admin', 'salesperson', 'manager', 'expert']}>
            <TrainingPerformance />
          </ProtectedRoute>
        } />
        <Route path="/training-management" element={
          <ProtectedRoute requiredRole={['admin', 'salesperson', 'manager', 'expert']}>
            <TrainingPerformance />
          </ProtectedRoute>
        } />
        <Route path="/course-management" element={
          <ProtectedRoute requiredRole={['admin', 'salesperson', 'manager']}>
            <CourseManagement />
          </ProtectedRoute>
        } />
        <Route path="/expert-management" element={
          <ProtectedRoute requiredRole={['admin', 'salesperson', 'manager', 'expert']}>
            <ExpertManagement />
          </ProtectedRoute>
        } />
        <Route path="/sales-tracking" element={
          <ProtectedRoute requiredRole={['admin', 'manager', 'salesperson']}>
            <SalesTracking />
          </ProtectedRoute>
        } />
        <Route path="/customer-management" element={
          <ProtectedRoute requiredRole={['admin', 'salesperson', 'manager']}>
            <CustomerManagement />
          </ProtectedRoute>
        } />
        <Route path="/data-export" element={
          <ProtectedRoute requiredRole={['admin']}>
            <DataExport />
          </ProtectedRoute>
        } />
        <Route path="/data-management" element={
          <ProtectedRoute requiredRole={['admin', 'salesperson', 'manager']}>
            <DataManagement />
          </ProtectedRoute>
        } />
        <Route path="/salesperson-management" element={
          <ProtectedRoute requiredRole={['admin', 'manager']}>
            <SalesPersonManagement />
          </ProtectedRoute>
        } />
        <Route path="/permission-management" element={
          <ProtectedRoute requiredRole={['admin']}>
            <PermissionManagement />
          </ProtectedRoute>
        } />
        <Route path="/profile-settings" element={
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        } />
        <Route path="/announcement-management" element={
          <ProtectedRoute requiredRole={['admin']}>
            <AnnouncementManagement />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationCenter />
          </ProtectedRoute>
        } />
        <Route path="/announcements" element={
          <ProtectedRoute>
            <AnnouncementList />
          </ProtectedRoute>
        } />
        <Route path="/poster-generator" element={
          <ProtectedRoute requiredRole={['admin', 'manager']}>
            <PosterGenerator />
          </ProtectedRoute>
        } />
        <Route path="/prospectus-management" element={
          <ProtectedRoute requiredRole={['admin', 'salesperson', 'manager', 'expert']}>
            <ProspectusManagement />
          </ProtectedRoute>
        } />
        <Route path="/init-department-manager" element={
          <ProtectedRoute requiredRole={['admin']}>
            <InitDepartmentManager />
          </ProtectedRoute>
        } />
        <Route path="/audit-logs" element={
          <ProtectedRoute requiredRole={['admin']}>
            <AuditLogs />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthContext.Provider>
  );
}
