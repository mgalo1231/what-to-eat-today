-- ========================================
-- 修复：添加 households 表的更新策略
-- ========================================
-- 
-- 问题：无法更新家庭名称，因为缺少 RLS 更新策略
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → SQL Editor
-- 2. 复制以下 SQL
-- 3. 粘贴并执行
-- ========================================

-- 添加 households 表的更新策略
drop policy if exists "Users can update their households" on public.households;

create policy "Users can update their households"
on public.households for update
using (auth.uid() = owner_id);

-- ========================================
-- 完成！
-- ========================================
-- 
-- 现在 owner 可以更新自己创建的家庭的名称了。
-- ========================================

