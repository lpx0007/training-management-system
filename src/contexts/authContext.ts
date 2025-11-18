import { createContext } from "react";

// 用户角色类型
export type UserRole = 'admin' | 'salesperson' | 'expert' | 'manager' | 'conference_service';

// 用户信息接口
export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  department?: string;
  department_id?: number; // 部门ID
  avatar?: string | null; // 用户头像 URL
  permissions?: string[]; // 用户权限列表
  menuAccess?: string[]; // 用户可访问的功能面板列表
}

// 认证上下文接口
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  permissions: string[]; // 当前用户的权限列表
  menuAccess: string[]; // 当前用户可访问的功能面板列表
  setIsAuthenticated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // 权限验证方法
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  
  // 功能面板访问验证方法
  canAccessMenu: (featureId: string) => boolean;
  
  // 检查是否为管理员
  isAdmin: () => boolean;
  
  // 检查是否可以查看特定客户（保留兼容性）
  canViewCustomer: (customer: {salesperson: string}) => boolean;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  permissions: [],
  menuAccess: [],
  setIsAuthenticated: () => {},
  setUser: () => {},
  login: async () => false,
  logout: async () => {},
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  canAccessMenu: () => false,
  isAdmin: () => false,
  canViewCustomer: () => true,
});