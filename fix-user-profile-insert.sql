-- ========================================
-- 修复：允许在注册时插入用户资料
-- ========================================
-- 
-- 问题：注册时 session 可能还未建立，导致 RLS 策略阻止插入用户资料
-- 
-- 解决：创建一个使用 security definer 的函数，允许通过函数插入用户资料
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → SQL Editor
-- 2. 复制以下 SQL
-- 3. 粘贴并执行
-- ========================================

-- 创建一个函数，允许通过用户 ID 插入用户资料（用于注册时）
create or replace function public.insert_user_profile(
  user_id uuid,
  user_username text
)
returns public.menuapp_user_profiles
language plpgsql
security definer
as $$
declare
  result public.menuapp_user_profiles;
begin
  -- 检查用户名是否已被使用
  if exists (
    select 1 from public.menuapp_user_profiles
    where username = user_username and id != user_id
  ) then
    raise exception '该用户名已被使用，请选择其他用户名';
  end if;

  -- 插入或更新用户资料
  insert into public.menuapp_user_profiles (id, username)
  values (user_id, user_username)
  on conflict (id) do update
  set username = excluded.username,
      updated_at = now()
  returning * into result;

  return result;
end;
$$;

-- 授予所有认证用户执行此函数的权限
grant execute on function public.insert_user_profile(uuid, text) to authenticated;

-- ========================================
-- 完成！
-- ========================================
-- 
-- 现在可以通过调用 insert_user_profile 函数来插入用户资料，
-- 即使 session 还未完全建立也可以工作。
-- 
-- 注意：前端代码需要更新为使用 RPC 调用此函数，而不是直接插入。
-- ========================================

