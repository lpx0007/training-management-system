# RLS策略动态管理可行性分析

## 一、技术可行性

### 1. 实现方式
```sql
-- 管理员可以通过执行SQL动态创建/修改策略
CREATE OR REPLACE FUNCTION manage_rls_policy(
  p_table_name text,
  p_policy_name text,
  p_command text,  -- SELECT, INSERT, UPDATE, DELETE, ALL
  p_role text,
  p_using_expression text,
  p_with_check_expression text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- 删除旧策略（如果存在）
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
    p_policy_name, 'public', p_table_name);
  
  -- 创建新策略
  IF p_command = 'ALL' THEN
    EXECUTE format('CREATE POLICY %I ON %I.%I FOR ALL TO %I USING (%s) WITH CHECK (%s)',
      p_policy_name, 'public', p_table_name, p_role, 
      p_using_expression, COALESCE(p_with_check_expression, p_using_expression));
  ELSE
    EXECUTE format('CREATE POLICY %I ON %I.%I FOR %s TO %I USING (%s)',
      p_policy_name, 'public', p_table_name, p_command, p_role, p_using_expression);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. 应用层界面设计
```typescript
// 权限管理页面可以添加RLS策略管理模块
interface RLSPolicy {
  id: string;
  tableName: string;
  policyName: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  role: string;
  description: string;
  usingExpression: string;
  withCheckExpression?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

// 管理界面示例
const RLSPolicyManager = () => {
  // 预定义模板
  const policyTemplates = [
    {
      name: '业务员只能看自己的数据',
      template: 'salesperson_id = auth.uid()',
    },
    {
      name: '部门经理看本部门数据',
      template: 'department_id IN (SELECT department_id FROM user_profiles WHERE id = auth.uid())',
    },
    {
      name: '仅管理员可操作',
      template: "EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')",
    }
  ];
};
```

## 二、安全风险分析 ⚠️

### 1. SQL注入风险
- **风险**：用户输入的表达式可能包含恶意SQL
- **缓解**：严格验证和参数化查询

### 2. 权限提升风险
- **风险**：错误的策略可能导致越权访问
- **缓解**：策略变更需要审批流程

### 3. 性能影响
- **风险**：复杂的RLS策略可能影响查询性能
- **缓解**：监控和优化策略表达式

### 4. 策略冲突
- **风险**：多个策略之间可能产生冲突
- **缓解**：策略测试和验证机制

## 三、最佳实践建议 🎯

### 推荐方案：混合模式

#### 1. 核心策略固定（数据库层）
```sql
-- 这些策略不应该被动态修改
-- 1. 基础数据隔离
CREATE POLICY "customers_isolation" ON customers
  FOR ALL USING (salesperson_id = auth.uid() OR role = 'admin');

-- 2. 敏感数据保护
CREATE POLICY "financial_data_protection" ON financial_records
  FOR ALL USING (role IN ('admin', 'finance'));
```

#### 2. 业务策略可配置（应用层）
```typescript
// 可以让管理员配置的策略类型
enum ConfigurablePolicyType {
  DEPARTMENT_ACCESS = 'department_access',     // 部门访问控制
  TEMPORARY_ACCESS = 'temporary_access',       // 临时权限
  CUSTOM_FILTER = 'custom_filter',            // 自定义过滤条件
}

// 策略配置存储在数据库表中
CREATE TABLE rls_policy_configs (
  id SERIAL PRIMARY KEY,
  policy_type VARCHAR(50),
  table_name VARCHAR(100),
  conditions JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP  -- 支持临时策略
);
```

#### 3. 审计和回滚机制
```sql
-- 策略变更历史记录
CREATE TABLE rls_policy_history (
  id SERIAL PRIMARY KEY,
  policy_config_id INTEGER REFERENCES rls_policy_configs(id),
  action VARCHAR(20),  -- CREATE, UPDATE, DELETE, ROLLBACK
  old_config JSONB,
  new_config JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP DEFAULT NOW(),
  rollback_id INTEGER REFERENCES rls_policy_history(id)
);
```

## 四、实施建议

### 第一阶段：保持现状 ✅
- 核心RLS策略保持在数据库层固定
- 通过应用层权限系统提供灵活性
- 积累业务需求和使用场景

### 第二阶段：部分动态化（可选）
- 实现策略模板管理
- 允许管理员选择预定义的策略组合
- 提供策略测试沙箱环境

### 第三阶段：完全动态化（谨慎评估）
- 实现完整的RLS策略管理界面
- 建立策略审批和审计流程
- 提供策略影响分析工具

## 五、结论

**当前建议**：保持RLS策略在数据库层固定
- ✅ 安全性最高
- ✅ 性能可预测
- ✅ 维护简单

**未来可选**：根据业务需求逐步开放
- 先通过应用层权限提供灵活性
- 评估需求后再考虑动态RLS管理
- 始终保持核心安全策略不可修改
