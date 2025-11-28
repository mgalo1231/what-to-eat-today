-- ========================================
-- 紧急修复：解决 RLS 无限递归导致的 500 错误
-- ========================================
-- 
-- 问题原因：members 表的 RLS 策略调用了 my_household_ids() 函数，
-- 而该函数内部又查询 members 表，导致死循环。
-- 
-- 解决办法：
-- 1. 重写 my_household_ids 函数，确保高效且无副作用。
-- 2. 简化 members 表的 RLS 策略，直接基于 auth.uid() 判断。
-- 3. 确保业务表（recipes等）的策略逻辑清晰。
-- ========================================

-- 1. 重建辅助函数（确保是 Stable 且 Security Definer）
create or replace function public.my_household_ids()
returns setof uuid
language sql
security definer -- 使用创建者权限运行，绕过 RLS
stable
as $$
  select household_id from public.members where user_id = auth.uid();
$$;

-- 2. 重置 members 表的策略（打破递归的关键！）
alter table public.members enable row level security;

drop policy if exists "Members view policy" on public.members;
drop policy if exists "Users can view household members" on public.members;
drop policy if exists "Users can insert themselves as members" on public.members;
drop policy if exists "Users can update household members" on public.members;
drop policy if exists "Users can delete household members" on public.members;

-- 允许用户查看：(1) 自己的记录 OR (2) 同一家庭的其他成员
-- 注意：这里使用 exists 子查询来避免函数递归调用风险
create policy "Members view policy"
on public.members
for select
using (
  user_id = auth.uid()
  or 
  household_id in (
    select m.household_id 
    from public.members m 
    where m.user_id = auth.uid()
  )
);

-- 允许用户插入：只能插入自己
create policy "Members insert policy"
on public.members
for insert
with check (
  user_id = auth.uid()
);

-- 允许用户更新/删除：只能操作自己所在家庭的记录
create policy "Members update policy"
on public.members
for update
using (
  household_id in (
    select m.household_id 
    from public.members m 
    where m.user_id = auth.uid()
  )
);

create policy "Members delete policy"
on public.members
for delete
using (
  household_id in (
    select m.household_id 
    from public.members m 
    where m.user_id = auth.uid()
  )
);

-- 3. 重置业务表策略（确保简单直接）
-- recipes
drop policy if exists "Recipes policy" on public.recipes;
create policy "Recipes policy" on public.recipes
for all using (
  household_id in (select public.my_household_ids())
) with check (
  household_id in (select public.my_household_ids())
);

-- inventory
drop policy if exists "Inventory policy" on public.inventory;
create policy "Inventory policy" on public.inventory
for all using (
  household_id in (select public.my_household_ids())
) with check (
  household_id in (select public.my_household_ids())
);

-- shopping_list
drop policy if exists "Shopping list policy" on public.shopping_list;
create policy "Shopping list policy" on public.shopping_list
for all using (
  household_id in (select public.my_household_ids())
) with check (
  household_id in (select public.my_household_ids())
);

-- chat_logs
drop policy if exists "Chat logs policy" on public.chat_logs;
create policy "Chat logs policy" on public.chat_logs
for all using (
  household_id in (select public.my_household_ids())
) with check (
  household_id in (select public.my_household_ids())
);

-- ========================================
-- 完成！请现在尝试添加数据。
-- ========================================

