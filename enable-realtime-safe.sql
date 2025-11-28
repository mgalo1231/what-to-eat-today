-- ========================================
-- 安全地启用 Supabase Realtime 功能
-- ========================================
-- 
-- 这个脚本会检查表是否已经在 Realtime publication 中，
-- 如果不在，才会添加。避免重复添加的错误。
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → SQL Editor
-- 2. 复制以下 SQL
-- 3. 粘贴并执行
-- ========================================

-- 检查并添加 recipes 表（如果还没有添加）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'recipes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes;
    RAISE NOTICE 'Added recipes to Realtime';
  ELSE
    RAISE NOTICE 'recipes already in Realtime';
  END IF;
END $$;

-- 检查并添加 inventory 表（如果还没有添加）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'inventory'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
    RAISE NOTICE 'Added inventory to Realtime';
  ELSE
    RAISE NOTICE 'inventory already in Realtime';
  END IF;
END $$;

-- 检查并添加 shopping_list 表（如果还没有添加）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'shopping_list'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_list;
    RAISE NOTICE 'Added shopping_list to Realtime';
  ELSE
    RAISE NOTICE 'shopping_list already in Realtime';
  END IF;
END $$;

-- 检查并添加 chat_logs 表（如果还没有添加）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chat_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_logs;
    RAISE NOTICE 'Added chat_logs to Realtime';
  ELSE
    RAISE NOTICE 'chat_logs already in Realtime';
  END IF;
END $$;

-- ========================================
-- 完成！
-- ========================================
-- 
-- 检查结果会在 "NOTICE" 消息中显示。
-- 如果看到 "already in Realtime"，说明该表已经启用。
-- 如果看到 "Added ... to Realtime"，说明刚刚添加成功。
-- ========================================

