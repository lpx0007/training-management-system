-- 添加折扣和优惠价字段到 training_participants 表
-- 用于记录每个参训人的实际价格和折扣率

-- 添加 actual_price 字段（实际价格）
ALTER TABLE training_participants 
ADD COLUMN IF NOT EXISTS actual_price NUMERIC(10, 2) DEFAULT NULL;

-- 添加 discount_rate 字段（折扣率，百分比）
ALTER TABLE training_participants 
ADD COLUMN IF NOT EXISTS discount_rate NUMERIC(5, 2) DEFAULT NULL;

-- 添加注释
COMMENT ON COLUMN training_participants.actual_price IS '实际价格（优惠后的价格，用于业绩统计）';
COMMENT ON COLUMN training_participants.discount_rate IS '折扣率（百分比，0-100）';

-- 更新现有记录：如果 actual_price 为空，则设置为 payment_amount
UPDATE training_participants 
SET actual_price = payment_amount 
WHERE actual_price IS NULL AND payment_amount IS NOT NULL;

-- 打印结果
DO $$
BEGIN
  RAISE NOTICE '✅ 已成功添加折扣字段:';
  RAISE NOTICE '  - actual_price: 实际价格';
  RAISE NOTICE '  - discount_rate: 折扣率';
  RAISE NOTICE '  - 现有记录的 actual_price 已设置为 payment_amount';
END $$;
