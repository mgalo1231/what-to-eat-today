-- ========================================
-- 彻底修复 RLS 策略 (Fix All RLS Policies)
-- ========================================
-- 
-- 目的：确保只要用户是家庭成员（无论是 owner 还是 member），
-- 都可以对业务表（菜谱、库存、购物清单、聊天）进行增删改查。
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → SQL Editor
-- 2. 复制以下全部 SQL
-- 3. 粘贴并运行 (Run)
-- ========================================

-- 1. 确保辅助函数存在且逻辑正确
create or replace function public.my_household_ids()
returns setof uuid
language sql
security definer
stable
as $$
  -- 返回当前用户所属的所有家庭 ID
  select household_id from public.members where user_id = auth.uid();
$$;

-- 2. 重置 recipes 表策略
drop policy if exists "Access recipes" on public.recipes;
drop policy if exists "Recipes policy" on public.recipes;

create policy "Recipes policy"
on public.recipes
for all
using (
  household_id in (select public.my_household_ids())
)
with check (
  household_id in (select public.my_household_ids())
);

-- 3. 重置 inventory 表策略
drop policy if exists "Access inventory" on public.inventory;
drop policy if exists "Inventory policy" on public.inventory;

create policy "Inventory policy"
on public.inventory
for all
using (
  household_id in (select public.my_household_ids())
)
with check (
  household_id in (select public.my_household_ids())
);

-- 4. 重置 shopping_list 表策略
drop policy if exists "Access shopping_list" on public.shopping_list;
drop policy if exists "Shopping list policy" on public.shopping_list;

create policy "Shopping list policy"
on public.shopping_list
for all
using (
  household_id in (select public.my_household_ids())
)
with check (
  household_id in (select public.my_household_ids())
);

-- 5. 重置 chat_logs 表策略
drop policy if exists "Access chat_logs" on public.chat_logs;
drop policy if exists "Chat logs policy" on public.chat_logs;

create policy "Chat logs policy"
on public.chat_logs
for all
using (
  household_id in (select public.my_household_ids())
)
with check (
  household_id in (select public.my_household_ids())
);

-- 6. 确保 members 表允许用户查看自己所在的行（关键！）
-- 如果用户查不到自己在 members 表里的记录，上面的 my_household_ids() 就会返回空，导致无法写入。
drop policy if exists "Members view policy" on public.members;
create policy "Members view policy"
on public.members
for select
using (
  user_id = auth.uid() 
  or household_id in (select household_id from public.members where user_id = auth.uid())
);

-- 7. 确保家庭表可读
drop policy if exists "Households view policy" on public.households;
create policy "Households view policy"
on public.households
for select
using (
  id in (select public.my_household_ids())
  or owner_id = auth.uid()
);

-- ========================================
-- 完成！
-- ========================================

