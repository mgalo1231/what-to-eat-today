-- ========================================
-- 清理所有旧表和函数
-- ========================================
-- 在 Supabase SQL Editor 中执行此脚本以删除所有现有的表和函数
-- 警告：这将删除所有数据！请确保已备份重要数据
-- ========================================

-- 1. 删除所有表（按依赖顺序，从依赖表到主表）
DROP TABLE IF EXISTS public.chat_logs CASCADE;
DROP TABLE IF EXISTS public.shopping_list CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP TABLE IF EXISTS public.households CASCADE;
DROP TABLE IF EXISTS public.menuapp_user_profiles CASCADE;

-- 2. 删除所有辅助函数
DROP FUNCTION IF EXISTS public.my_household_ids() CASCADE;
DROP FUNCTION IF EXISTS public.insert_user_profile(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.find_household_by_invite_code(text) CASCADE;
DROP FUNCTION IF EXISTS public.update_menuapp_user_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.set_lowercase_invite_code() CASCADE;

-- 3. 删除所有触发器（如果还存在）
DROP TRIGGER IF EXISTS update_menuapp_user_profiles_updated_at ON public.menuapp_user_profiles;
DROP TRIGGER IF EXISTS set_lowercase_invite_code_trigger ON public.households;

-- ========================================
-- 清理完成！
-- ========================================
-- 现在可以执行 complete-setup.sql 来创建新的数据库结构
-- ========================================

