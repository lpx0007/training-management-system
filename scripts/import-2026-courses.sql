-- 导入2026年公开课计划到courses表
-- 执行时间: 2025-11-08
-- 数据来源: 2026年公开课计划（11.4）.csv

-- 清理测试数据（如果需要）
-- DELETE FROM courses WHERE code LIKE 'ZH-%' OR code LIKE 'FC-%';

-- 综合管理模块
INSERT INTO courses (module, name, code, duration_days, sessions_per_year, standard_fee, online_price, offline_price, average_price, notes, status) VALUES
('综合管理', '首席财务官高级研修班（第34期）', 'ZH-001', 15, 1, 44800, NULL, NULL, 2987, NULL, 'active'),
('综合管理', '企业经营管理"头雁人才"培养计划——产融结合助力新质生产力培育研修班（第2期）', 'ZH-002', 17, 1, 68000, NULL, NULL, 4000, NULL, 'active'),
('综合管理', '财务精英的战略与商业课程', 'ZH-003', 15, 1, 68000, NULL, NULL, 4533, NULL, 'active'),
('综合管理', '国有企业高级财务管理人员研修班', 'ZH-004', 5, 1, 9800, NULL, NULL, 1960, NULL, 'active'),
('综合管理', 'AI浪潮下财务人员履职能力提升', 'ZH-005', 4, 4, 6800, NULL, NULL, 1700, NULL, 'active');

-- 非财高管模块
INSERT INTO courses (module, name, code, duration_days, sessions_per_year, standard_fee, online_price, offline_price, average_price, notes, status) VALUES
('非财高管', '非财高管的财报分析与管理决策', 'FC-001', 2, 2, 9800, NULL, NULL, 4900, NULL, 'active'),
('非财高管', '非财高管的财务管理与价值创造', 'FC-002', 3, 2, 6800, NULL, NULL, 2267, NULL, 'active');

-- 管理会计模块
INSERT INTO courses (module, name, code, duration_days, sessions_per_year, standard_fee, online_price, offline_price, average_price, notes, status) VALUES
('管理会计', '业财融合实务与财务BP核心能力建设', 'GL-001', 3, 2, 6000, 5100, 6000, 2000, NULL, 'active'),
('管理会计', '一利五率指标体系与企业高质量发展', 'GL-002', 2, 2, 4000, NULL, NULL, 2000, NULL, 'active'),
('管理会计', '全面预算管理体系建设与标杆企业实践', 'GL-003', 3, 3, 6000, 5100, 6000, 2267, NULL, 'active'),
('管理会计', '企业成本管控全流程优化：方法、工具与难点、痛点解析', 'GL-004', 2, 2, 4000, 3400, 4000, 2000, NULL, 'active'),
('管理会计', '全面预算管理与成本控制', 'GL-005', 2, 2, 4000, NULL, NULL, 2000, NULL, 'active');

-- 公司金融模块
INSERT INTO courses (module, name, code, duration_days, sessions_per_year, standard_fee, online_price, offline_price, average_price, notes, status) VALUES
('公司金融', '公司并购与重组', 'JR-001', 5, 3, 9800, NULL, NULL, 1960, NULL, 'active'),
('公司金融', '企业IPO财税规范', 'JR-002', 3, 1, 6800, NULL, NULL, 2267, NULL, 'active'),
('公司金融', '市值管理实务与案例', 'JR-003', 2, 3, 4900, NULL, NULL, 2450, NULL, 'active'),
('公司金融', '公司估值与企业价值管理', 'JR-004', 2, 1, 4500, NULL, NULL, 2250, NULL, 'active'),
('公司金融', '财务分析与企业价值创造', 'JR-005', 2, 2, 9800, NULL, NULL, 4900, NULL, 'active'),
('公司金融', '微咨询课程：资金管理与司库体系建设', 'JR-006', 2, 1, 4800, NULL, NULL, 2400, NULL, 'active');

-- 风险合规模块
INSERT INTO courses (module, name, code, duration_days, sessions_per_year, standard_fee, online_price, offline_price, average_price, notes, status) VALUES
('风险合规', '企业数字化内控实践', 'FX-001', 2, 2, 4000, 3400, 4000, 2000, NULL, 'active'),
('风险合规', '微咨询课程：穿透式监管视角下的企业内控升级与一流企业风险管控实践', 'FX-002', 3, 2, 5600, 4800, 5600, 1867, NULL, 'active'),
('风险合规', '内部控制审计实务与案例', 'FX-003', 2, 2, 4000, NULL, NULL, 2000, NULL, 'active'),
('风险合规', '高风险业务经营价值挖掘与风控实务', 'FX-004', 2, 2, 4000, 3400, 4000, 2000, NULL, 'active');

-- 内审实务模块
INSERT INTO courses (module, name, code, duration_days, sessions_per_year, standard_fee, online_price, offline_price, average_price, notes, status) VALUES
('内审实务', '内部审计负责人与后备人才岗位能力提升', 'NS-001', 3, 2, 6800, NULL, NULL, 2267, NULL, 'active'),
('内审实务', '内部审计专业能力提升：高舞弊业务审计实务与案例', 'NS-002', 2, 2, 4200, NULL, NULL, 2100, NULL, 'active'),
('内审实务', '"人工智能+"驱动下的内部审计管理与变革', 'NS-003', 2, 2, 4200, NULL, NULL, 2100, NULL, 'active'),
('内审实务', '风险导向审计实务与案例', 'NS-004', 2, 1, 4000, NULL, NULL, 2000, NULL, 'active'),
('内审实务', '工程项目审计实务', 'NS-005', 2, 6, 4000, 3400, 4000, 2000, NULL, 'active'),
('内审实务', '中国企业出海系列课程：海外审计创新实践与风险治理专题', 'NS-006', 2, 1, 4800, NULL, NULL, 2400, NULL, 'active'),
('内审实务', 'AI浪潮下采购全流程风险管理与审计实务', 'NS-007', 2, 3, 4500, 3900, 4500, 2250, NULL, 'active'),
('内审实务', '经济责任审计实务与案例：穿透式核查与整改闭环管理', 'NS-008', 2, 3, 4000, 3400, 4000, 2000, NULL, 'active'),
('内审实务', '合规审计与反舞弊调查', 'NS-009', 3, 3, 5600, NULL, NULL, 1867, NULL, 'active');

-- 数智转型模块
INSERT INTO courses (module, name, code, duration_days, sessions_per_year, standard_fee, online_price, offline_price, average_price, notes, status) VALUES
('数智转型', '走进蒙牛：数字化转型之智慧财务共享', 'SZ-001', 2, 1, 6800, NULL, NULL, 3400, NULL, 'active'),
('数智转型', '走进美的数字化高级研修班', 'SZ-002', 2, 2, 6800, NULL, NULL, 3400, NULL, 'active'),
('数智转型', '拥抱AI系列课程：美的AI工作坊', 'SZ-003', 2, 2, 6800, NULL, NULL, 3400, NULL, 'active'),
('数智转型', '拥抱AI系列课程：AI赋能智能财务创新与实践', 'SZ-004', 2, 3, 4000, NULL, NULL, 2000, NULL, 'active'),
('数智转型', '人工智能大模型财务应用暨电子凭证会计数据标准应用与会计档案无纸化', 'SZ-005', 2, 2, 4500, NULL, NULL, 2250, NULL, 'active');

-- 会计准则模块
INSERT INTO courses (module, name, code, duration_days, sessions_per_year, standard_fee, online_price, offline_price, average_price, notes, status) VALUES
('会计准则', '会计准则执行中热点难点问题解析', 'KJ-001', 2, 2, 4000, 3400, 4000, 2000, NULL, 'active');

-- 税务管理模块
INSERT INTO courses (module, name, code, duration_days, sessions_per_year, standard_fee, online_price, offline_price, average_price, notes, status) VALUES
('税务管理', '名师课堂：税务专题课程（模块制）', 'SW-001', 16, 1, 32000, NULL, NULL, 2000, '9800/单模块', 'active'),
('税务管理', '新型监管机制下的企业税务稽查与风险应对', 'SW-002', 3, 1, 5600, NULL, NULL, 1867, NULL, 'active'),
('税务管理', '股权交易、股权架构设计与并购重组的税务风险排查与实案演练', 'SW-003', 3, 2, 5600, NULL, NULL, 1867, NULL, 'active'),
('税务管理', '增值税法及实施条例全面解析与风险防范', 'SW-004', 2, 2, 4000, NULL, NULL, 2000, NULL, 'active');

-- 行业课程模块
INSERT INTO courses (module, name, code, duration_days, sessions_per_year, standard_fee, online_price, offline_price, average_price, notes, status) VALUES
('行业课程', '中国企业出海系列课程：事务所跨境服务专题', 'HY-001', 2, 2, 4800, NULL, NULL, 2400, NULL, 'active'),
('行业课程', '中国企业出海系列课程：财税合规专题', 'HY-002', 2, 2, 4800, NULL, NULL, 2400, NULL, 'active'),
('行业课程', '中国企业出海系列课程：跨境电商专题', 'HY-003', 3, 1, 5600, NULL, NULL, 1867, NULL, 'active'),
('行业课程', '破产业务综合能力提升', 'HY-004', 2, 1, 3000, NULL, NULL, 1500, NULL, 'active'),
('行业课程', '事务所核心能力进阶研修班', 'HY-005', 3, 2, 4500, NULL, NULL, 1500, NULL, 'active');

-- 验证导入结果
SELECT 
  module as "模块",
  COUNT(*) as "课程数量",
  SUM(sessions_per_year) as "全年总期数",
  AVG(standard_fee) as "平均标准费",
  COUNT(CASE WHEN online_price IS NOT NULL THEN 1 END) as "含线上价格课程数"
FROM courses
WHERE code LIKE 'ZH-%' 
   OR code LIKE 'FC-%' 
   OR code LIKE 'GL-%' 
   OR code LIKE 'JR-%'
   OR code LIKE 'FX-%'
   OR code LIKE 'NS-%'
   OR code LIKE 'SZ-%'
   OR code LIKE 'KJ-%'
   OR code LIKE 'SW-%'
   OR code LIKE 'HY-%'
GROUP BY module
ORDER BY module;

-- 查看所有导入的课程
SELECT 
  id,
  module as "模块",
  name as "课程名称",
  code as "编号",
  duration_days as "天数",
  sessions_per_year as "期数",
  standard_fee as "标准费",
  online_price as "线上价",
  offline_price as "线下价",
  average_price as "均价"
FROM courses
WHERE code LIKE 'ZH-%' 
   OR code LIKE 'FC-%' 
   OR code LIKE 'GL-%' 
   OR code LIKE 'JR-%'
   OR code LIKE 'FX-%'
   OR code LIKE 'NS-%'
   OR code LIKE 'SZ-%'
   OR code LIKE 'KJ-%'
   OR code LIKE 'SW-%'
   OR code LIKE 'HY-%'
ORDER BY module, code;
