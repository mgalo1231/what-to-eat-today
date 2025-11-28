-- ========================================
-- 启用 Supabase Realtime 功能
-- ========================================
-- 
-- 问题：同一个家庭无法实时同步菜单/库存/购物部分的数据
-- 
-- 解决：在 Supabase 中启用 Realtime 功能
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → Database → Replication
-- 2. 或者直接在 SQL Editor 中执行以下 SQL
-- ========================================

-- 方法 1：通过 SQL 启用 Realtime（推荐）
-- 为以下表启用 Realtime 复制

-- 如果使用 public schema（默认），使用以下命令：
alter publication supabase_realtime add table public.recipes;
alter publication supabase_realtime add table public.inventory;
alter publication supabase_realtime add table public.shopping_list;
alter publication supabase_realtime add table public.chat_logs;

-- 如果使用 menuapp schema，使用以下命令（需要先创建 menuapp schema）：
-- alter publication supabase_realtime add table menuapp.recipes;
-- alter publication supabase_realtime add table menuapp.inventory;
-- alter publication supabase_realtime add table menuapp.shopping_list;
-- alter publication supabase_realtime add table menuapp.chat_logs;

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
-- 注意：如果表在 menuapp schema 下，请使用对应的命令。
-- ========================================

