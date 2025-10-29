import { createContext } from "react";

// 用户角色类型
export type UserRole = 'admin' | 'salesperson' | 'expert';

// 用户信息接口
export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  department?: string;
  permissions?: string[]; // 用户权限列表
}

// 认证上下文接口
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  setIsAuthenticated: (value: boolean) => void;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  // 检查用户是否有特定权限
  hasPermission: (permission: string) => boolean;
  // 检查是否可以查看特定客户
  canViewCustomer: (customer: {salesperson: string}) => boolean;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  setIsAuthenticated: () => {},
  setUser: () => {},
  login: async () => false,
  logout: async () => {},
  hasPermission: () => false,
  canViewCustomer: () => true,
});