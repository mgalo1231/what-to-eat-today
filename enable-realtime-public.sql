-- ========================================
-- 启用 Supabase Realtime 功能（public schema）
-- ========================================
-- 
-- 如果你的表在 public schema 中，执行以下 SQL
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → SQL Editor
-- 2. 复制以下 SQL
-- 3. 粘贴并执行
-- ========================================

-- 为以下表启用 Realtime 复制（public schema）
alter publication supabase_realtime add table public.recipes;
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.shopping_list;
alter publication supabase_realtime add table public.chat_logs;

-- ========================================
-- 完成！
-- ========================================
-- 
-- 现在以下表已启用 Realtime：
-- - recipes（菜谱）
-- - inventory（库存）
-- - shopping_list（购物清单）
-- - chat_logs（聊天记录）
-- 
-- 实时同步功能现在应该可以正常工作了！
-- ========================================

