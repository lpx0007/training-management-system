-- 添加客户信息字段：部门、性别、住宿需求
-- 创建时间: 2025-11-13

-- 添加部门字段
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- 添加性别字段（必填，默认值为空字符串以支持现有数据）
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS gender VARCHAR(10) NOT NULL DEFAULT '';

-- 添加住宿需求字段
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS accommodation_requirements TEXT;

-- 添加字段说明注释
COMMENT ON COLUMN customers.department IS '客户所属部门';
COMMENT ON COLUMN customers.gender IS '客户性别（男/女），必填项';
COMMENT ON COLUMN customers.accommodation_requirements IS '客户住宿需求备注';

-- 验证迁移
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'customers'
AND column_name IN ('department', 'gender', 'accommodation_requirements');
