import type { 
  AccountCreationResult, 
  BatchAccountCreationResult,
  ExpertTemplate,
  SalespersonTemplate
} from '@/types/dataManagement';
import { CONFIG } from '@/constants/dataManagement';
import { supabase } from '@/lib/supabase/client';

class AccountCreationService {
  // 创建单个账号
  async createAccount(
    userData: ExpertTemplate | SalespersonTemplate,
    role: 'expert' | 'salesperson'
  ): Promise<AccountCreationResult> {
    try {
      const userName = userData.name || '未知用户';
      
      // ✅ 1. 验证姓名
      if (!userData.name) {
        return { 
          success: false,
          username: userName,
          reason: '姓名缺失' 
        };
      }

      // ✅ 2. 验证邮箱（必填）
      if (!userData.email) {
        return { 
          success: false,
          username: userName,
          reason: '邮箱缺失' 
        };
      }

      // ✅ 3. 验证手机号（必填）
      if (!userData.phone) {
        return { 
          success: false,
          username: userName,
          reason: '手机号缺失' 
        };
      }

      // ✅ 4. 验证邮箱格式
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
        return { 
          success: false,
          username: userName,
          reason: '邮箱格式不正确' 
        };
      }

      // ✅ 5. 验证手机号格式
      if (!/^1[3-9]\d{9}$/.test(userData.phone)) {
        return { 
          success: false,
          username: userName,
          reason: '手机号格式不正确' 
        };
      }

      // ✅ 6. 检查邮箱是否已存在
      const { data: existingEmail } = await supabase
        .from('user_profiles')
        .select('email')
        .eq('email', userData.email)
        .single();
      
      if (existingEmail) {
        return { 
          success: false,
          username: userName,
          reason: '邮箱已被注册'
        };
      }

      // ✅ 7. 检查手机号是否已存在
      const { data: existingPhone } = await supabase
        .from('user_profiles')
        .select('phone')
        .eq('phone', userData.phone)
        .single();
      
      if (existingPhone) {
        return { 
          success: false,
          username: userName,
          reason: '手机号已被注册'
        };
      }

      // ✅ 8. 创建 Auth 用户（默认密码 123456）
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        phone: userData.phone,
        password: CONFIG.DEFAULT_PASSWORD,  // 默认密码 123456
        options: {
          emailRedirectTo: undefined,  // 不发送验证邮件
          data: {
            name: userData.name,
            department: 'department' in userData ? userData.department : undefined,
            position: 'position' in userData ? userData.position : undefined,
            team: 'team' in userData ? userData.team : undefined,
            title: 'title' in userData ? userData.title : undefined,
            field: 'field' in userData ? userData.field : undefined
          }
        }
      });

      if (authError) {
        return {
          success: false,
          username: userName,
          reason: '创建账号失败'
        };
      }

      if (!authData.user) {
        return {
          success: false,
          username: userName,
          reason: '创建账号失败'
        };
      }

      // ✅ 9. 等待触发器创建 user_profiles 记录
      await new Promise(resolve => setTimeout(resolve, 1000));

      // ✅ 10. 验证 user_profiles 是否创建成功
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profileData) {
        return {
          success: false,
          username: userName,
          reason: '创建账号失败'
        };
      }

      return {
        success: true,
        userId: authData.user.id,
        username: userName
      };

    } catch (error: any) {
      return { 
        success: false,
        username: userData.name || '未知用户',
        reason: '创建账号失败' 
      };
    }
  }

  // 批量创建账号
  async batchCreateAccounts(
    users: (ExpertTemplate | SalespersonTemplate)[],
    role: 'expert' | 'salesperson'
  ): Promise<BatchAccountCreationResult> {
    const results: AccountCreationResult[] = [];
    const summary = {
      created: 0,
      skipped: 0,
      failed: 0
    };

    for (const user of users) {
      const result = await this.createAccount(user, role);
      results.push(result);

      if (result.success) {
        summary.created++;
      } else if (result.reason === '账号已存在') {
        summary.skipped++;
      } else {
        summary.failed++;
      }

      // 避免 API 限流，每创建 10 个账号暂停 1 秒
      if (summary.created % 10 === 0 && summary.created > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const message = `成功创建 ${summary.created} 个账号，跳过 ${summary.skipped} 个已存在账号，失败 ${summary.failed} 个`;

    return {
      results,
      summary,
      message
    };
  }

  // 检查现有账号（通过 user_profiles）
  private async checkExistingProfile(username: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, role')
        .eq('username', username)
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  // 识别需要创建账号的记录
  identifyAccountCreationNeeds(
    data: (ExpertTemplate | SalespersonTemplate)[]
  ): number[] {
    const indices: number[] = [];

    data.forEach((row, index) => {
      // 如果提供了邮箱或手机号，标记为需要创建账号
      if (row.email || row.phone) {
        indices.push(index);
      }
    });

    return indices;
  }

  // 验证账号创建数据
  validateAccountData(
    userData: ExpertTemplate | SalespersonTemplate
  ): { valid: boolean; error?: string } {
    // ✅ 检查姓名
    if (!userData.name) {
      return {
        valid: false,
        error: '姓名为必填项'
      };
    }

    // ✅ 检查邮箱（必填）
    if (!userData.email) {
      return {
        valid: false,
        error: '邮箱为必填项'
      };
    }

    // ✅ 检查手机号（必填）
    if (!userData.phone) {
      return {
        valid: false,
        error: '手机号为必填项'
      };
    }

    // ✅ 验证邮箱格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      return {
        valid: false,
        error: '邮箱格式不正确'
      };
    }

    // ✅ 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(userData.phone)) {
      return {
        valid: false,
        error: '手机号格式不正确'
      };
    }

    return { valid: true };
  }

  // 生成初始密码
  getDefaultPassword(): string {
    return CONFIG.DEFAULT_PASSWORD;
  }

  // 生成账号创建摘要
  generateAccountCreationSummary(
    data: (ExpertTemplate | SalespersonTemplate)[],
    role: 'expert' | 'salesperson'
  ): {
    total: number;
    valid: number;
    hasEmail: number;
    hasPhone: number;
    missingEmail: number;
    missingPhone: number;
    missingBoth: number;
    hasBoth: number;
  } {
    const hasEmail = data.filter(row => row.email);
    const hasPhone = data.filter(row => row.phone);
    const hasBoth = data.filter(row => row.email && row.phone);
    const missingEmail = data.filter(row => !row.email);
    const missingPhone = data.filter(row => !row.phone);
    const missingBoth = data.filter(row => !row.email && !row.phone);

    return {
      total: data.length,
      valid: hasBoth.length,  // ✅ 只有邮箱和手机号都有的才是有效的
      hasEmail: hasEmail.length,
      hasPhone: hasPhone.length,
      missingEmail: missingEmail.length,
      missingPhone: missingPhone.length,
      missingBoth: missingBoth.length,
      hasBoth: hasBoth.length
    };
  }
}

export default new AccountCreationService();

