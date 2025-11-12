-- ============================================
-- 添加业务员管理培训参与者的RLS策略
-- 允许业务员添加和删除自己的客户作为培训参与者
-- ============================================

-- 1. 业务员可以添加自己的客户作为培训参与者
CREATE POLICY "Salespersons can add their own customers as participants"
ON public.training_participants
FOR INSERT
WITH CHECK (
  -- 验证customer_id是否属于当前业务员
  EXISTS (
    SELECT 1 
    FROM public.customers c
    WHERE c.id = training_participants.customer_id
    AND c.salesperson_id = auth.uid()
  )
);

-- 2. 业务员可以删除自己客户的培训参与记录
CREATE POLICY "Salespersons can remove their own customers from training"
ON public.training_participants
FOR DELETE
USING (
  -- 验证customer_id是否属于当前业务员
  EXISTS (
    SELECT 1 
    FROM public.customers c
    WHERE c.id = training_participants.customer_id
    AND c.salesperson_id = auth.uid()
  )
);

-- 3. 业务员可以更新自己客户的培训参与信息（如支付状态等）
CREATE POLICY "Salespersons can update their own customers participation info"
ON public.training_participants
FOR UPDATE
USING (
  -- 验证customer_id是否属于当前业务员
  EXISTS (
    SELECT 1 
    FROM public.customers c
    WHERE c.id = training_participants.customer_id
    AND c.salesperson_id = auth.uid()
  )
)
WITH CHECK (
  -- 确保更新后的customer_id仍然属于当前业务员
  EXISTS (
    SELECT 1 
    FROM public.customers c
    WHERE c.id = training_participants.customer_id
    AND c.salesperson_id = auth.uid()
  )
);

-- 4. 部门经理可以管理本部门业务员的客户的培训参与记录
-- 注意：这需要先建立部门关系表，暂时保留此注释以备后续扩展

-- 验证策略是否正确创建
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'training_participants'
ORDER BY policyname;
