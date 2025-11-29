-- ========================================
-- 启用 Supabase Realtime
-- ========================================
-- 在 Supabase SQL Editor 中执行此脚本
-- 前提：已执行 complete-setup.sql
-- ========================================

-- 为所有业务表启用 Realtime 复制
ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_list;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_logs;

-- 可选：为家庭和成员表启用 Realtime（如果需要实时更新家庭信息）
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.households;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.members;

-- ========================================
-- 完成！
-- ========================================
-- Realtime 已启用
-- 现在家庭成员间的数据会实时同步
-- ========================================

