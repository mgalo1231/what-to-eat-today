-- ========================================
-- 修复：邀请码大小写问题
-- ========================================
-- 
-- 问题：数据库中的邀请码可能是大小写混合的（MD5 生成），
--       但查询时转成了小写，导致匹配失败
-- 
-- 解决：
-- 1. 将现有邀请码统一转换为小写
-- 2. 修改默认值生成函数，确保新创建的邀请码都是小写
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → SQL Editor
-- 2. 复制以下 SQL
-- 3. 粘贴并执行
-- ========================================

-- 1. 将现有邀请码统一转换为小写
update public.households
set invite_code = lower(invite_code)
where invite_code != lower(invite_code);

-- 2. 修改默认值，确保新创建的邀请码都是小写
-- 注意：PostgreSQL 的 default 表达式不能直接使用函数，需要创建触发器
-- 但更简单的方法是修改应用代码，在创建时显式设置小写邀请码
-- 或者创建一个函数来生成小写邀请码

-- 创建一个函数来生成小写邀请码
create or replace function public.generate_lowercase_invite_code()
returns text
language plpgsql
as $$
declare
  code text;
begin
  -- 生成 6 位小写字母数字组合
  code := lower(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  
  -- 确保唯一性（如果已存在则重新生成）
  while exists (select 1 from public.households where invite_code = code) loop
    code := lower(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  end loop;
  
  return code;
end;
$$;

-- 3. 修改表的默认值（如果可能）
-- 注意：PostgreSQL 不支持在 default 中调用函数（除了某些内置函数）
-- 所以我们需要在应用代码中显式设置，或者使用触发器

-- 创建一个触发器函数，在插入时自动生成小写邀请码（如果未提供）
create or replace function public.set_lowercase_invite_code()
returns trigger
language plpgsql
as $$
begin
  -- 如果 invite_code 为空或未提供，生成一个新的小写邀请码
  if new.invite_code is null or new.invite_code = '' then
    new.invite_code := public.generate_lowercase_invite_code();
  else
    -- 如果提供了邀请码，确保是小写
    new.invite_code := lower(new.invite_code);
  end if;
  return new;
end;
$$;

-- 创建触发器
drop trigger if exists ensure_lowercase_invite_code on public.households;
create trigger ensure_lowercase_invite_code
before insert or update on public.households
for each row
execute function public.set_lowercase_invite_code();

-- ========================================
-- 完成！
-- ========================================
-- 
-- 现在：
-- 1. 所有现有邀请码已转换为小写
-- 2. 新创建的邀请码会自动生成为小写
-- 3. 即使手动设置邀请码，也会自动转换为小写
-- 
-- 查询时使用小写邀请码即可正常匹配。
-- ========================================

