# Supabase 配置指南（菜单 App）

## 1) 环境变量

在项目根目录创建 `.env.local`，填入：

```
VITE_SUPABASE_URL=https://你的项目ID.supabase.co
VITE_SUPABASE_ANON_KEY=你的anon公钥
VITE_SUPABASE_SCHEMA=menuapp
```

## 2) 执行 SQL（完整版，含用户与家庭共享）

复制以下整段到 Supabase SQL Editor 执行。
所有表都建在 `menuapp` schema 下，不会影响你现有应用的 `public.profiles` 等表。

```sql
-- ========================================
-- 1. 创建独立 schema
-- ========================================
create schema if not exists menuapp;
grant usage on schema menuapp to postgres, anon, authenticated, service_role;

-- ========================================
-- 2. 家庭与用户表（menuapp 下，不影响 public.profiles）
-- ========================================
create table if not exists menuapp.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique default substr(md5(random()::text), 1, 6),
  created_at timestamptz default now()
);

create table if not exists menuapp.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references menuapp.households(id) on delete cascade,
  display_name text,
  role text not null default 'member',  -- 'owner' | 'member'
  created_at timestamptz default now(),
  unique(user_id, household_id)
);

-- ========================================
-- 3. 业务表
-- ========================================
create table if not exists menuapp.recipes (
  id uuid primary key,
  household_id uuid not null references menuapp.households(id) on delete cascade,
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

create table if not exists menuapp.inventory (
  id uuid primary key,
  household_id uuid not null references menuapp.households(id) on delete cascade,
  name text not null,
  quantity double precision not null,
  unit text not null,
  location text not null,
  expiry_date timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menuapp.shopping_list (
  id uuid primary key,
  household_id uuid not null references menuapp.households(id) on delete cascade,
  name text not null,
  quantity double precision not null,
  unit text not null,
  is_bought boolean not null default false,
  source_recipe_id uuid references menuapp.recipes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists menuapp.chat_logs (
  id uuid primary key,
  household_id uuid not null references menuapp.households(id) on delete cascade,
  recipe_id uuid references menuapp.recipes(id) on delete set null,
  title text not null,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========================================
-- 4. RLS 开启
-- ========================================
alter table menuapp.households enable row level security;
alter table menuapp.members enable row level security;
alter table menuapp.recipes enable row level security;
alter table menuapp.inventory enable row level security;
alter table menuapp.shopping_list enable row level security;
alter table menuapp.chat_logs enable row level security;

-- ========================================
-- 5. RLS 策略
-- ========================================

-- 辅助函数：当前用户所属的所有 household_id
create or replace function menuapp.my_household_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select household_id from menuapp.members where user_id = auth.uid();
$$;

-- households：成员可读，owner 可改
create policy "members can view household"
  on menuapp.households for select
  using ( id in (select menuapp.my_household_ids()) );

create policy "owner can update household"
  on menuapp.households for update
  using ( id in (select household_id from menuapp.members where user_id = auth.uid() and role = 'owner') );

-- 任何登录用户可创建家庭
create policy "authenticated can create household"
  on menuapp.households for insert
  with check ( auth.role() = 'authenticated' );

-- members：成员可读同家庭成员，自己可加入/退出
create policy "members can view members"
  on menuapp.members for select
  using ( household_id in (select menuapp.my_household_ids()) );

create policy "user can join household"
  on menuapp.members for insert
  with check ( user_id = auth.uid() );

create policy "user can leave household"
  on menuapp.members for delete
  using ( user_id = auth.uid() );

-- 业务表：同家庭成员可完全读写
do $$
declare
  t text;
  tables text[] := array['recipes','inventory','shopping_list','chat_logs'];
begin
  foreach t in array tables loop
    execute format('drop policy if exists "household read" on menuapp.%I;', t);
    execute format('drop policy if exists "household insert" on menuapp.%I;', t);
    execute format('drop policy if exists "household update" on menuapp.%I;', t);
    execute format('drop policy if exists "household delete" on menuapp.%I;', t);

    execute format($f$
      create policy "household read" on menuapp.%I
        for select using ( household_id in (select menuapp.my_household_ids()) );
    $f$, t);

    execute format($f$
      create policy "household insert" on menuapp.%I
        for insert with check ( household_id in (select menuapp.my_household_ids()) );
    $f$, t);

    execute format($f$
      create policy "household update" on menuapp.%I
        for update using ( household_id in (select menuapp.my_household_ids()) );
    $f$, t);

    execute format($f$
      create policy "household delete" on menuapp.%I
        for delete using ( household_id in (select menuapp.my_household_ids()) );
    $f$, t);
  end loop;
end $$;
```

## 3) 启用 Realtime（可选）

在 Supabase Table Editor 中为以下表开启 Realtime：
- `menuapp.recipes`
- `menuapp.inventory`
- `menuapp.shopping_list`
- `menuapp.chat_logs`

## 4) 开启邮箱登录

1. Authentication → Providers → 开启 Email (Magic Link)
2. Authentication → URL Configuration → 添加 `http://localhost:5173` 到 Redirect URLs

## 5) 本地运行

```bash
npm run dev
```

访问 `http://localhost:5173/auth` 发送邮箱魔法链接登录。

---

## 家庭共享使用流程

1. **创建家庭**：登录后调用 `menuapp.households` 插入一条记录，同时在 `menuapp.members` 插入自己（role = 'owner'）。
2. **邀请成员**：把家庭的 `invite_code` 分享给伴侣/家人。
3. **加入家庭**：对方登录后，通过 `invite_code` 查到 `household_id`，在 `menuapp.members` 插入自己（role = 'member'）。
4. **共享数据**：同一 `household_id` 下的菜谱、库存、购物清单自动共享。

---

## 使用 public schema 的配置（如果使用 public schema 而非 menuapp）

如果你的项目使用 `public` schema，执行以下 SQL：

```sql
-- ========================================
-- 1. 创建表（public schema）
-- ========================================
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique default substr(md5(random()::text), 1, 6),
  owner_id uuid not null default auth.uid(),
  created_at timestamptz default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  display_name text,
  role text not null default 'member',  -- 'owner' | 'member'
  created_at timestamptz default now(),
  unique(user_id, household_id)
);

-- 业务表：菜谱、库存、购物清单、聊天记录
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

create table if not exists public.chat_logs (
  id text primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  recipe_id text,
  title text not null,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ========================================
-- 2. 开启 RLS
-- ========================================
alter table public.households enable row level security;
alter table public.members enable row level security;
alter table public.recipes enable row level security;
alter table public.inventory enable row level security;
alter table public.shopping_list enable row level security;
alter table public.chat_logs enable row level security;

-- ========================================
-- 3. 辅助函数
-- ========================================
create or replace function public.my_household_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select household_id from public.members where user_id = auth.uid();
$$;

-- ========================================
-- 4. RLS 策略
-- ========================================

-- households：允许查看自己所在的家庭，允许创建家庭
drop policy if exists "Users can view their households" on public.households;
drop policy if exists "Users can insert households" on public.households;

create policy "Users can view their households"
on public.households for select
using (
  auth.uid() = owner_id
  or id in (select public.my_household_ids())
);

create policy "Users can insert households"
on public.households for insert
with check (auth.uid() = owner_id);

-- members：允许用户插入自己为成员，允许查看同家庭成员
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

-- 业务表：同家庭成员可完全读写
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
```
