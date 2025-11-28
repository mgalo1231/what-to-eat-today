-- ========================================
-- 修复：优化邀请码查询功能
-- ========================================
-- 
-- 问题：通过邀请码加入家庭时，可能因为 RLS 策略或大小写问题无法找到家庭
-- 
-- 解决：创建一个数据库函数，允许通过邀请码查找家庭（不区分大小写）
-- 
-- 使用方法：
-- 1. 打开 Supabase 控制台 → SQL Editor
-- 2. 复制以下 SQL
-- 3. 粘贴并执行
-- ========================================

-- 创建一个函数，通过邀请码查找家庭（不区分大小写）
create or replace function public.find_household_by_invite_code(
  invite_code_input text
)
returns public.households
language plpgsql
security definer
as $$
declare
  result public.households;
  normalized_code text;
begin
  -- 将邀请码转为小写
  normalized_code := lower(trim(invite_code_input));
  
  -- 查找匹配的家庭（不区分大小写）
  select * into result
  from public.households
  where lower(invite_code) = normalized_code
  limit 1;
  
  if result is null then
    raise exception '邀请码无效或家庭不存在';
  end if;
  
  return result;
end;
$$;

-- 授予所有认证用户执行此函数的权限
grant execute on function public.find_household_by_invite_code(text) to authenticated;

-- ========================================
-- 完成！
-- ========================================
-- 
-- 现在可以通过调用 find_household_by_invite_code 函数来查找家庭，
-- 即使 RLS 策略限制也能正常工作（因为使用了 security definer）。
-- ========================================

