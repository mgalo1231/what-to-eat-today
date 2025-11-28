-- ========================================
-- 今天吃什么 App - Supabase 完整配置 SQL
-- 使用 public schema（适用于已有其他应用的情况）
-- ========================================
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → SQL Editor
-- 2. 复制以下全部 SQL
-- 3. 粘贴到 SQL Editor
-- 4. 点击 Run 执行
-- ========================================

-- ========================================
-- 1. 创建表（public schema）
-- ========================================

-- 家庭表
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique default substr(md5(random()::text), 1, 6),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz default now()
);

-- 成员表
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  display_name text,
  role text not null default 'member',  -- 'owner' | 'member'
  created_at timestamptz default now(),
  unique(user_id, household_id)
);

-- 菜谱表
create table if not exists public.recipes (
  id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  description text,
  duration int not null,
  difficulty text not null,
  tags jsonb not null default '[]',
  servings int,
  ingredients jsonb not null default '[]',
  steps jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 库存表
create table if not exists public.inventory (
  id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  quantity double precision not null,
  unit text not null,
  location text not null,
  expiry_date timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 购物清单表
create table if not exists public.shopping_list (
  id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  quantity double precision not null,
  unit text not null,
  is_bought boolean not null default false,
  source_recipe_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 聊天记录表
create table if not exists public.chat_logs (
  id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  recipe_id text,
  title text not null,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 用户资料表（存储用户名，避免与已有的 profiles 表冲突）
create table if not exists public.menuapp_user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(username)
);

-- ========================================
-- 2. 开启 Row Level Security (RLS)
-- ========================================

alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.recipes enable row level security;
alter table public.inventory enable row level security;
alter table public.shopping_list enable row level security;
alter table public.chat_logs enable row level security;
alter table public.menuapp_user_profiles enable row level security;

-- ========================================
-- 3. 创建辅助函数
-- ========================================

-- 获取当前用户所属的所有家庭 ID
create or replace function public.my_household_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select household_id from public.members where user_id = auth.uid();
$$;

-- ========================================
-- 4. 创建 RLS 策略
-- ========================================

-- households 表策略
drop policy if exists "Users can view their households" on public.households;
drop policy if exists "Users can insert households" on public.households;
drop policy if exists "Users can update their households" on public.households;
drop policy if exists "Users can delete their households" on public.households;

create policy "Users can view their households"
on public.households for select
using (
  auth.uid() = owner_id
  or id in (select public.my_household_ids())
);

create policy "Users can insert households"
on public.households for insert
with check (auth.uid() = owner_id);

create policy "Users can update their households"
on public.households for update
using (auth.uid() = owner_id);

create policy "Users can delete their households"
on public.households for delete
using (auth.uid() = owner_id);

-- members 表策略
drop policy if exists "Users can insert themselves as members" on public.members;
drop policy if exists "Users can view household members" on public.members;
drop policy if exists "Users can update household members" on public.members;
drop policy if exists "Users can delete household members" on public.members;

create policy "Users can insert themselves as members"
on public.members for insert
with check (user_id = auth.uid());

create policy "Users can view household members"
on public.members for select
using (
  user_id = auth.uid()
  or household_id in (select public.my_household_ids())
);

create policy "Users can update household members"
on public.members for update
using (household_id in (select public.my_household_ids()));

create policy "Users can delete household members"
on public.members for delete
using (household_id in (select public.my_household_ids()));

-- 业务表策略：同家庭成员可完全读写
drop policy if exists "Access recipes" on public.recipes;
drop policy if exists "Access inventory" on public.inventory;
drop policy if exists "Access shopping_list" on public.shopping_list;
drop policy if exists "Access chat_logs" on public.chat_logs;

create policy "Access recipes"
on public.recipes for all
using (household_id in (select public.my_household_ids()));

create policy "Access inventory"
on public.inventory for all
using (household_id in (select public.my_household_ids()));

create policy "Access shopping_list"
on public.shopping_list for all
using (household_id in (select public.my_household_ids()));

create policy "Access chat_logs"
on public.chat_logs for all
using (household_id in (select public.my_household_ids()));

-- 用户资料表策略
drop policy if exists "Users can view own profile" on public.menuapp_user_profiles;
drop policy if exists "Users can update own profile" on public.menuapp_user_profiles;
drop policy if exists "Users can insert own profile" on public.menuapp_user_profiles;

create policy "Users can view own profile"
on public.menuapp_user_profiles for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.menuapp_user_profiles for update
using (auth.uid() = id);

create policy "Users can insert own profile"
on public.menuapp_user_profiles for insert
with check (auth.uid() = id);

-- 创建更新时间触发器
create or replace function public.update_menuapp_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_menuapp_user_profiles_updated_at on public.menuapp_user_profiles;
create trigger update_menuapp_user_profiles_updated_at
before update on public.menuapp_user_profiles
for each row
execute function public.update_menuapp_user_profiles_updated_at();

-- ========================================
-- 完成！
-- ========================================
-- 
-- 接下来（可选）：
-- 1. 在 Database → Replication 中为以下表启用 Realtime：
--    - recipes
--    - inventory
--    - shopping_list
--    - chat_logs
-- 
-- 2. 在 Authentication → Providers 中启用 Email 登录
-- 
-- 3. 在 Authentication → URL Configuration 中添加你的应用地址到 Redirect URLs
-- ========================================

