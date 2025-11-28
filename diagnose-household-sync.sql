-- ========================================
-- 家庭数据共享诊断脚本
-- ========================================
-- 这个脚本会检查：
-- 1. 当前用户信息
-- 2. 用户所属的家庭
-- 3. 家庭成员列表
-- 4. 每个家庭的数据（recipes, inventory 等）
-- 5. RLS 策略是否正确
-- ========================================

-- 1. 当前用户
SELECT 
  auth.uid() as "当前用户ID",
  (SELECT username FROM public.menuapp_user_profiles WHERE id = auth.uid()) as "用户名";

-- 2. 当前用户所属的家庭
SELECT 
  h.id as "家庭ID",
  h.name as "家庭名称",
  h.invite_code as "邀请码",
  h.owner_id as "创建者ID",
  m.role as "我的角色",
  h.created_at as "创建时间"
FROM public.households h
JOIN public.members m ON h.id = m.household_id
WHERE m.user_id = auth.uid()
ORDER BY h.created_at DESC;

-- 3. 所有家庭的成员列表
SELECT 
  h.name as "家庭名称",
  h.invite_code as "邀请码",
  m.user_id as "成员ID",
  p.username as "成员用户名",
  m.role as "角色",
  m.created_at as "加入时间"
FROM public.households h
JOIN public.members m ON h.id = m.household_id
LEFT JOIN public.menuapp_user_profiles p ON m.user_id = p.id
WHERE h.id IN (
  SELECT household_id FROM public.members WHERE user_id = auth.uid()
)
ORDER BY h.name, m.created_at;

-- 4. 每个家庭的菜谱数量
SELECT 
  h.name as "家庭名称",
  h.id as "家庭ID",
  COUNT(r.id) as "菜谱数量"
FROM public.households h
LEFT JOIN public.recipes r ON h.id = r.household_id
WHERE h.id IN (
  SELECT household_id FROM public.members WHERE user_id = auth.uid()
)
GROUP BY h.id, h.name
ORDER BY h.name;

-- 5. 每个家庭的库存数量
SELECT 
  h.name as "家庭名称",
  h.id as "家庭ID",
  COUNT(i.id) as "库存数量"
FROM public.households h
LEFT JOIN public.inventory i ON h.id = i.household_id
WHERE h.id IN (
  SELECT household_id FROM public.members WHERE user_id = auth.uid()
)
GROUP BY h.id, h.name
ORDER BY h.name;

-- 6. 检查 my_household_ids() 函数是否正常工作
SELECT 
  household_id as "我可以访问的家庭ID"
FROM public.my_household_ids();

-- 7. 尝试直接查询 recipes 表（测试 RLS）
SELECT 
  id as "菜谱ID",
  household_id as "所属家庭ID",
  title as "菜谱名称",
  created_at as "创建时间"
FROM public.recipes
ORDER BY created_at DESC
LIMIT 10;

-- 8. 尝试直接查询 inventory 表（测试 RLS）
SELECT 
  id as "库存ID",
  household_id as "所属家庭ID",
  name as "食材名称",
  quantity as "数量",
  created_at as "创建时间"
FROM public.inventory
ORDER BY created_at DESC
LIMIT 10;

-- 9. 检查 RLS 策略状态
SELECT 
  tablename as "表名",
  policyname as "策略名称",
  permissive as "类型",
  roles as "角色",
  cmd as "操作",
  CASE 
    WHEN qual IS NOT NULL THEN '有 USING 条件'
    ELSE '无 USING 条件'
  END as "USING",
  CASE 
    WHEN with_check IS NOT NULL THEN '有 WITH CHECK 条件'
    ELSE '无 WITH CHECK 条件'
  END as "WITH_CHECK"
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('households', 'members', 'recipes', 'inventory', 'shopping_list', 'chat_logs')
ORDER BY tablename, cmd, policyname;

-- ========================================
-- 执行完后，请把所有结果截图给我！
-- ========================================

