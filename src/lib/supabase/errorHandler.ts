/**
 * Supabase 错误处理工具
 * 将 Supabase 错误转换为用户友好的错误消息
 */

import { PostgrestError, AuthError } from '@supabase/supabase-js';

// 自定义错误类
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
    public hint?: string
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

/**
 * 处理 Supabase 错误
 * @param error 原始错误对象
 * @returns 用户友好的错误对象
 */
export function handleSupabaseError(error: any): SupabaseError {
  // 处理认证错误
  if (error instanceof AuthError || error?.name === 'AuthError') {
    return handleAuthError(error);
  }

  // 处理数据库错误
  if (error?.code && typeof error.code === 'string') {
    return handleDatabaseError(error);
  }

  // 处理网络错误
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
    return new SupabaseError(
      '网络连接失败，请检查您的网络连接',
      'NETWORK_ERROR',
      error,
      '请确保您已连接到互联网'
    );
  }

  // 处理超时错误
  if (error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
    return new SupabaseError(
      '请求超时，请稍后重试',
      'TIMEOUT_ERROR',
      error,
      '服务器响应时间过长'
    );
  }

  // 通用错误
  return new SupabaseError(
    error?.message || '操作失败，请稍后重试',
    'UNKNOWN_ERROR',
    error
  );
}

/**
 * 处理认证错误
 */
function handleAuthError(error: any): SupabaseError {
  const message = error.message?.toLowerCase() || '';

  // 登录凭证错误
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return new SupabaseError(
      '用户名或密码错误',
      'AUTH_INVALID_CREDENTIALS',
      error,
      '请检查您的邮箱和密码是否正确'
    );
  }

  // 用户不存在
  if (message.includes('user not found')) {
    return new SupabaseError(
      '用户不存在',
      'AUTH_USER_NOT_FOUND',
      error,
      '请检查邮箱地址是否正确'
    );
  }

  // 邮箱未验证
  if (message.includes('email not confirmed')) {
    return new SupabaseError(
      '邮箱未验证',
      'AUTH_EMAIL_NOT_CONFIRMED',
      error,
      '请检查您的邮箱并点击验证链接'
    );
  }

  // Session 过期
  if (message.includes('session expired') || message.includes('jwt expired')) {
    return new SupabaseError(
      '登录已过期，请重新登录',
      'AUTH_SESSION_EXPIRED',
      error,
      '您的登录状态已失效'
    );
  }

  // 密码太弱
  if (message.includes('password') && message.includes('weak')) {
    return new SupabaseError(
      '密码强度不够',
      'AUTH_WEAK_PASSWORD',
      error,
      '密码至少需要 6 个字符'
    );
  }

  // 邮箱已存在
  if (message.includes('already registered') || message.includes('already exists')) {
    return new SupabaseError(
      '该邮箱已被注册',
      'AUTH_EMAIL_EXISTS',
      error,
      '请使用其他邮箱或尝试登录'
    );
  }

  // 通用认证错误
  return new SupabaseError(
    '认证失败: ' + error.message,
    'AUTH_ERROR',
    error
  );
}

/**
 * 处理数据库错误
 */
function handleDatabaseError(error: PostgrestError | any): SupabaseError {
  const code = error.code;
  const message = error.message || '';

  // 权限错误
  if (code === 'PGRST301' || code === '42501' || message.includes('permission denied')) {
    return new SupabaseError(
      '您没有权限执行此操作',
      'PERMISSION_DENIED',
      error,
      '请联系管理员获取相应权限'
    );
  }

  // RLS 策略违规
  if (code === 'PGRST116' || message.includes('row-level security')) {
    return new SupabaseError(
      '数据访问被拒绝',
      'RLS_VIOLATION',
      error,
      '您只能访问属于您的数据'
    );
  }

  // 唯一约束违规
  if (code === '23505' || message.includes('unique constraint')) {
    return new SupabaseError(
      '数据已存在，不能重复添加',
      'UNIQUE_VIOLATION',
      error,
      '请检查是否已存在相同的记录'
    );
  }

  // 外键约束违规
  if (code === '23503' || message.includes('foreign key')) {
    return new SupabaseError(
      '关联数据不存在',
      'FOREIGN_KEY_VIOLATION',
      error,
      '请确保关联的数据存在'
    );
  }

  // 非空约束违规
  if (code === '23502' || message.includes('not null')) {
    return new SupabaseError(
      '必填字段不能为空',
      'NOT_NULL_VIOLATION',
      error,
      '请填写所有必填字段'
    );
  }

  // 数据类型错误
  if (code === '22P02' || message.includes('invalid input syntax')) {
    return new SupabaseError(
      '数据格式错误',
      'INVALID_INPUT',
      error,
      '请检查输入的数据格式是否正确'
    );
  }

  // 记录不存在
  if (message.includes('no rows') || message.includes('not found')) {
    return new SupabaseError(
      '数据不存在',
      'NOT_FOUND',
      error,
      '请求的数据可能已被删除'
    );
  }

  // 通用数据库错误
  return new SupabaseError(
    '数据库操作失败: ' + message,
    'DATABASE_ERROR',
    error,
    '请稍后重试或联系技术支持'
  );
}

/**
 * 记录错误日志
 * @param error 错误对象
 * @param context 错误上下文
 */
export function logError(error: SupabaseError, context?: string) {
  if (import.meta.env.DEV) {
    console.group(`❌ Supabase Error${context ? ` [${context}]` : ''}`);
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.hint) {
      console.info('Hint:', error.hint);
    }
    if (error.details) {
      console.error('Details:', error.details);
    }
    console.groupEnd();
  }

  // 生产环境可以发送到错误追踪服务（如 Sentry）
  if (import.meta.env.PROD) {
    // TODO: 集成错误追踪服务
    // Sentry.captureException(error, { extra: { context } });
  }
}

/**
 * 重试操作
 * @param operation 要执行的操作
 * @param maxRetries 最大重试次数
 * @param delay 重试延迟（毫秒）
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // 如果是权限错误或数据不存在，不重试
      const supabaseError = handleSupabaseError(error);
      if (
        supabaseError.code === 'PERMISSION_DENIED' ||
        supabaseError.code === 'NOT_FOUND' ||
        supabaseError.code === 'AUTH_INVALID_CREDENTIALS'
      ) {
        throw supabaseError;
      }

      // 最后一次重试失败，抛出错误
      if (i === maxRetries - 1) {
        throw handleSupabaseError(lastError);
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      
      if (import.meta.env.DEV) {
        console.log(`🔄 重试操作 (${i + 1}/${maxRetries})...`);
      }
    }
  }

  throw handleSupabaseError(lastError);
}
