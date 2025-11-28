-- ========================================
-- 检查 Realtime 状态
-- ========================================
-- 
-- 查看哪些表已经启用了 Realtime
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → SQL Editor
-- 2. 复制以下 SQL
-- 3. 粘贴并执行
-- ========================================

-- 查看所有已启用 Realtime 的表
SELECT 
  schemaname as schema_name,
  tablename as table_name
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- ========================================
-- 说明
-- ========================================
-- 
-- 这个查询会显示所有已经添加到 supabase_realtime publication 的表。
-- 如果看到以下表，说明 Realtime 已启用：
-- - public.recipes
-- - public.inventory
-- - public.shopping_list
-- - public.chat_logs
-- ========================================

