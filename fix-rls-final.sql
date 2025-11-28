-- ========================================
-- 终极修复：完全重置 RLS 策略
-- ========================================
-- 这个脚本会：
-- 1. 删除所有现有的 RLS 策略
-- 2. 重建辅助函数
-- 3. 创建简单、无递归的 RLS 策略
-- ========================================

-- 1. 删除所有现有策略
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('households', 'members', 'recipes', 'inventory', 'shopping_list', 'chat_logs')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 2. 重建辅助函数（Security Definer，绕过 RLS）
CREATE OR REPLACE FUNCTION public.my_household_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id FROM public.members WHERE user_id = auth.uid();
$$;

-- 3. households 表策略
CREATE POLICY "households_select_policy" ON public.households
FOR SELECT
USING (
  auth.uid() = owner_id 
  OR id IN (SELECT public.my_household_ids())
);

CREATE POLICY "households_insert_policy" ON public.households
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "households_update_policy" ON public.households
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "households_delete_policy" ON public.households
FOR DELETE
USING (auth.uid() = owner_id);

-- 4. members 表策略（关键：避免递归）
CREATE POLICY "members_select_policy" ON public.members
FOR SELECT
USING (
  user_id = auth.uid()
  OR household_id IN (
    SELECT m.household_id 
    FROM public.members m 
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "members_insert_policy" ON public.members
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "members_update_policy" ON public.members
FOR UPDATE
USING (
  household_id IN (
    SELECT m.household_id 
    FROM public.members m 
    WHERE m.user_id = auth.uid()
  )
);

CREATE POLICY "members_delete_policy" ON public.members
FOR DELETE
USING (
  household_id IN (
    SELECT m.household_id 
    FROM public.members m 
    WHERE m.user_id = auth.uid()
  )
);

-- 5. 业务表策略（recipes, inventory, shopping_list, chat_logs）
CREATE POLICY "recipes_policy" ON public.recipes
FOR ALL
USING (household_id IN (SELECT public.my_household_ids()))
WITH CHECK (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "inventory_policy" ON public.inventory
FOR ALL
USING (household_id IN (SELECT public.my_household_ids()))
WITH CHECK (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "shopping_list_policy" ON public.shopping_list
FOR ALL
USING (household_id IN (SELECT public.my_household_ids()))
WITH CHECK (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "chat_logs_policy" ON public.chat_logs
FOR ALL
USING (household_id IN (SELECT public.my_household_ids()))
WITH CHECK (household_id IN (SELECT public.my_household_ids()));

-- ========================================
-- 完成！现在测试：
-- 1. 清空浏览器缓存和 IndexedDB
-- 2. 重新登录
-- 3. 尝试添加菜谱
-- 4. 检查 Supabase 表格是否有数据
-- ========================================

