-- ========================================
-- 修复：添加 households 表的删除策略
-- ========================================
-- 
-- 问题：删除家庭操作没有被保留，因为缺少 RLS 删除策略
-- 解决：添加策略，允许 owner 删除自己创建的家庭
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → SQL Editor
-- 2. 复制以下 SQL
-- 3. 粘贴并执行
-- ========================================

-- 添加 households 表的删除策略
drop policy if exists "Users can delete their households" on public.households;

create policy "Users can delete their households"
on public.households for delete
using (auth.uid() = owner_id);

-- ========================================
-- 完成！
-- ========================================
-- 
-- 现在 owner 可以删除自己创建的家庭了。
-- 删除操作会级联删除所有相关数据（members、recipes、inventory 等）。
-- ========================================

