/**
 * Supabase 客户端配置
 * 创建和导出 Supabase 客户端实例
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 验证环境变量
function validateEnv() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      '缺少环境变量: VITE_SUPABASE_URL\n' +
      '请在 .env.local 文件中配置 Supabase 项目 URL'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      '缺少环境变量: VITE_SUPABASE_ANON_KEY\n' +
      '请在 .env.local 文件中配置 Supabase Anon Key'
    );
  }

  // 验证 URL 格式
  if (!supabaseUrl.startsWith('https://')) {
    throw new Error(
      'VITE_SUPABASE_URL 格式错误\n' +
      '应该以 https:// 开头，例如: https://xxxxx.supabase.co'
    );
  }

  // 验证 Key 格式（JWT token 应该很长）
  if (supabaseAnonKey.length < 100) {
    throw new Error(
      'VITE_SUPABASE_ANON_KEY 格式错误\n' +
      'Anon Key 应该是一个很长的 JWT token'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

// 获取并验证环境变量
const { supabaseUrl, supabaseAnonKey } = validateEnv();

// 创建 Supabase 客户端
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 持久化 session 到 localStorage
    persistSession: true,
    // 自动刷新 token
    autoRefreshToken: true,
    // 检测 session 从其他标签页的更新
    detectSessionInUrl: false, // 改为 false，避免 URL 参数干扰
    // Storage key - 使用唯一的 key 避免冲突
    storageKey: 'sb-training-auth',
    // 流程类型：使用 pkce 更安全
    flowType: 'pkce',
    // 调试模式
    debug: import.meta.env.DEV,
  },
  realtime: {
    params: {
      // 每秒最多接收的事件数
      eventsPerSecond: 10,
    },
    // 心跳间隔（毫秒）
    heartbeatIntervalMs: 30000,
    // 重连延迟（毫秒）
    reconnectAfterMs: () => 1000,
  },
  global: {
    headers: {
      'x-application-name': 'training-management-system',
    },
  },
});

// 导出类型化的客户端
export type SupabaseClient = typeof supabase;

// 开发环境日志
if (import.meta.env.DEV) {
  console.log('✅ Supabase 客户端已初始化');
  console.log('📍 Project URL:', supabaseUrl);
  console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
}
