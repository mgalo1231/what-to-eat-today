-- ========================================
-- 添加用户资料表（存储用户名）
-- ========================================
-- 
-- 为了避免与已有的 profiles 表冲突，使用 menuapp_user_profiles 表名
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → SQL Editor
-- 2. 复制以下 SQL
-- 3. 粘贴并执行
-- ========================================

-- 创建用户资料表
create table if not exists public.menuapp_user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(username)
);

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

create trigger update_menuapp_user_profiles_updated_at
before update on public.menuapp_user_profiles
for each row
execute function public.update_menuapp_user_profiles_updated_at();

-- 开启 RLS
alter table public.menuapp_user_profiles enable row level security;

-- RLS 策略：用户可以查看和更新自己的资料
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

-- ========================================
-- 完成！
-- ========================================
-- 
-- 现在可以：
-- 1. 在注册时保存用户名
-- 2. 在应用中显示用户名
-- ========================================

