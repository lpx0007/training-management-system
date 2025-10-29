/**
 * Supabase 模块统一导出
 */

export { supabase } from './client';
export type { SupabaseClient } from './client';

export { default as supabaseService } from './supabaseService';

export { handleSupabaseError, logError, retryOperation, SupabaseError } from './errorHandler';

export type * from './types';
