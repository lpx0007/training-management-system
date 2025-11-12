-- ============================================
-- 添加部门经理管理下属客户的RLS策略
-- 允许部门经理查看和管理本部门业务员的客户
-- ============================================

-- 1. 部门经理可以查看本部门业务员的客户
CREATE POLICY "Managers can view department customers"
ON public.customers
FOR SELECT
USING (
  -- 方案1：通过team_members表判断（推荐）
  EXISTS (
    SELECT 1 
    FROM public.team_members tm
    WHERE tm.manager_id = auth.uid()
    AND tm.member_id = customers.salesperson_id
    AND tm.status = 'active'
  )
  OR
  -- 方案2：通过部门判断（备用）
  EXISTS (
    SELECT 1
    FROM public.user_profiles up_manager
    JOIN public.user_profiles up_salesperson 
      ON up_manager.department_id = up_salesperson.department_id
    WHERE up_manager.id = auth.uid()
    AND up_manager.role = 'manager'
    AND up_salesperson.id = customers.salesperson_id
  )
);

-- 2. 部门经理可以添加客户（分配给本部门业务员）
CREATE POLICY "Managers can insert department customers"
ON public.customers
FOR INSERT
WITH CHECK (
  -- 确保分配的业务员是本部门的
  EXISTS (
    SELECT 1 
    FROM public.team_members tm
    WHERE tm.manager_id = auth.uid()
    AND tm.member_id = customers.salesperson_id
    AND tm.status = 'active'
  )
  OR
  -- 或者客户未分配业务员（manager自己处理）
  customers.salesperson_id IS NULL
  OR
  -- 或者分配给manager自己
  customers.salesperson_id = auth.uid()
);

-- 3. 部门经理可以更新本部门业务员的客户
CREATE POLICY "Managers can update department customers"
ON public.customers
FOR UPDATE
USING (
  -- 现有客户必须属于本部门
  EXISTS (
    SELECT 1 
    FROM public.team_members tm
    WHERE tm.manager_id = auth.uid()
    AND tm.member_id = customers.salesperson_id
    AND tm.status = 'active'
  )
  OR
  -- 或者是未分配的客户
  customers.salesperson_id IS NULL
)
WITH CHECK (
  -- 更新后仍然属于本部门或未分配
  EXISTS (
    SELECT 1 
    FROM public.team_members tm
    WHERE tm.manager_id = auth.uid()
    AND tm.member_id = customers.salesperson_id
    AND tm.status = 'active'
  )
  OR
  customers.salesperson_id IS NULL
  OR
  customers.salesperson_id = auth.uid()
);

-- 4. 部门经理可以删除本部门业务员的客户（谨慎使用）
CREATE POLICY "Managers can delete department customers"
ON public.customers
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM public.team_members tm
    WHERE tm.manager_id = auth.uid()
    AND tm.member_id = customers.salesperson_id
    AND tm.status = 'active'
  )
);

-- ============================================
-- 添加部门经理管理培训参与者的RLS策略
-- ============================================

-- 5. 部门经理可以添加本部门客户为培训参与者
CREATE POLICY "Managers can add department customers as participants"
ON public.training_participants
FOR INSERT
WITH CHECK (
  -- 验证customer_id属于本部门的客户
  EXISTS (
    SELECT 1 
    FROM public.customers c
    JOIN public.team_members tm ON tm.member_id = c.salesperson_id
    WHERE c.id = training_participants.customer_id
    AND tm.manager_id = auth.uid()
    AND tm.status = 'active'
  )
);

-- 6. 部门经理可以更新本部门客户的培训参与信息
CREATE POLICY "Managers can update department participants"
ON public.training_participants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 
    FROM public.customers c
    JOIN public.team_members tm ON tm.member_id = c.salesperson_id
    WHERE c.id = training_participants.customer_id
    AND tm.manager_id = auth.uid()
    AND tm.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.customers c
    JOIN public.team_members tm ON tm.member_id = c.salesperson_id
    WHERE c.id = training_participants.customer_id
    AND tm.manager_id = auth.uid()
    AND tm.status = 'active'
  )
);

-- 7. 部门经理可以删除本部门客户的培训参与记录
CREATE POLICY "Managers can delete department participants"
ON public.training_participants
FOR DELETE
USING (
  EXISTS (
    SELECT 1 
    FROM public.customers c
    JOIN public.team_members tm ON tm.member_id = c.salesperson_id
    WHERE c.id = training_participants.customer_id
    AND tm.manager_id = auth.uid()
    AND tm.status = 'active'
  )
);

-- ============================================
-- 验证策略创建
-- ============================================
SELECT 
  tablename,
  policyname,
  permissive,
  cmd,
  roles
FROM pg_policies 
WHERE tablename IN ('customers', 'training_participants')
AND policyname LIKE '%Manager%'
ORDER BY tablename, policyname;
