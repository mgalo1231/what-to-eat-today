-- ========================================
-- 检查表结构
-- ========================================

-- 1. 检查 recipes 表的列
SELECT 
  column_name as "列名",
  data_type as "数据类型",
  is_nullable as "可为空"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'recipes'
ORDER BY ordinal_position;

-- 2. 检查 inventory 表的列
SELECT 
  column_name as "列名",
  data_type as "数据类型",
  is_nullable as "可为空"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'inventory'
ORDER BY ordinal_position;

-- 3. 检查 households 表的列
SELECT 
  column_name as "列名",
  data_type as "数据类型",
  is_nullable as "可为空"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'households'
ORDER BY ordinal_position;

-- 4. 检查 members 表的列
SELECT 
  column_name as "列名",
  data_type as "数据类型",
  is_nullable as "可为空"
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'members'
ORDER BY ordinal_position;

-- 5. 列出所有表
SELECT 
  table_name as "表名"
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

