-- ========================================
-- 完整数据库设置脚本
-- ========================================
-- 今天吃什么 - PWA 菜谱应用
-- 包含所有表、索引、触发器、RLS 策略和辅助函数
-- ========================================

-- ========================================
-- 1. 用户资料表
-- ========================================
CREATE TABLE IF NOT EXISTS public.menuapp_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.menuapp_user_profiles(username);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON public.menuapp_user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_profiles_updated_at();

-- ========================================
-- 2. 家庭表
-- ========================================
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE DEFAULT LOWER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6)),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_households_owner_id ON public.households(owner_id);
CREATE INDEX IF NOT EXISTS idx_households_invite_code ON public.households(invite_code);

-- 确保 invite_code 始终是小写的触发器
CREATE OR REPLACE FUNCTION public.set_lowercase_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NOT NULL THEN
    NEW.invite_code = LOWER(NEW.invite_code);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_lowercase_invite_code
  BEFORE INSERT OR UPDATE OF invite_code ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.set_lowercase_invite_code();

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_households_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.update_households_updated_at();

-- ========================================
-- 3. 成员表
-- ========================================
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, household_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_household_id ON public.members(household_id);
CREATE INDEX IF NOT EXISTS idx_members_user_household ON public.members(user_id, household_id);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_members_updated_at();

-- ========================================
-- 4. 菜谱表
-- ========================================
CREATE TABLE IF NOT EXISTS public.recipes (
  id TEXT PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('简单', '中等', '挑战')),
  tags JSONB NOT NULL DEFAULT '[]',
  servings INTEGER DEFAULT 2,
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_recipes_household_id ON public.recipes(household_id);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON public.recipes USING GIN(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON public.recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON public.recipes(household_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON public.recipes(household_id, updated_at DESC);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_recipes_updated_at();

-- ========================================
-- 5. 库存表
-- ========================================
CREATE TABLE IF NOT EXISTS public.inventory (
  id TEXT PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  location TEXT NOT NULL CHECK (location IN ('冷藏', '冷冻', '常温')),
  category TEXT,
  purchase_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_inventory_household_id ON public.inventory(household_id);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON public.inventory(household_id, name);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON public.inventory(household_id, location);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON public.inventory(household_id, expiry_date) WHERE expiry_date IS NOT NULL;

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inventory_updated_at();

-- ========================================
-- 6. 购物清单表
-- ========================================
CREATE TABLE IF NOT EXISTS public.shopping_list (
  id TEXT PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,
  is_bought BOOLEAN NOT NULL DEFAULT FALSE,
  priority INTEGER DEFAULT 0,
  source_recipe_id TEXT,
  notes TEXT,
  bought_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_shopping_list_household_id ON public.shopping_list(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_is_bought ON public.shopping_list(household_id, is_bought);
CREATE INDEX IF NOT EXISTS idx_shopping_list_priority ON public.shopping_list(household_id, priority DESC);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_shopping_list_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shopping_list_updated_at
  BEFORE UPDATE ON public.shopping_list
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shopping_list_updated_at();

-- ========================================
-- 7. 聊天记录表
-- ========================================
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id TEXT PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  recipe_id TEXT,
  session_id TEXT,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_chat_logs_household_id ON public.chat_logs(household_id);
CREATE INDEX IF NOT EXISTS idx_chat_logs_recipe_id ON public.chat_logs(recipe_id) WHERE recipe_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_logs_session_id ON public.chat_logs(session_id) WHERE session_id IS NOT NULL;

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION public.update_chat_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_logs_updated_at
  BEFORE UPDATE ON public.chat_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_logs_updated_at();

-- ========================================
-- 8. RLS 策略
-- ========================================

-- 启用 RLS
ALTER TABLE public.menuapp_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

-- 辅助函数：获取用户所属的所有 household_id
CREATE OR REPLACE FUNCTION public.my_household_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT household_id FROM public.members WHERE user_id = auth.uid();
$$;

-- ========================================
-- 用户资料表 RLS 策略
-- ========================================
CREATE POLICY "Users can view own profile"
  ON public.menuapp_user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.menuapp_user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.menuapp_user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- ========================================
-- 家庭表 RLS 策略
-- ========================================
CREATE POLICY "Users can view their households"
  ON public.households FOR SELECT
  USING (
    auth.uid() = owner_id 
    OR id IN (SELECT public.my_household_ids())
  );

CREATE POLICY "Users can insert households they own"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their households"
  ON public.households FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their households"
  ON public.households FOR DELETE
  USING (auth.uid() = owner_id);

-- ========================================
-- 成员表 RLS 策略（避免递归）
-- ========================================
CREATE POLICY "Users can view members of their households"
  ON public.members FOR SELECT
  USING (
    user_id = auth.uid()
    OR household_id IN (
      SELECT m.household_id 
      FROM public.members m 
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert themselves as members"
  ON public.members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update members in their households"
  ON public.members FOR UPDATE
  USING (
    household_id IN (
      SELECT m.household_id 
      FROM public.members m 
      WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete members from their households"
  ON public.members FOR DELETE
  USING (
    household_id IN (
      SELECT m.household_id 
      FROM public.members m 
      WHERE m.user_id = auth.uid()
    )
  );

-- ========================================
-- 业务表 RLS 策略（recipes, inventory, shopping_list, chat_logs）
-- ========================================
CREATE POLICY "Household members can manage recipes"
  ON public.recipes FOR ALL
  USING (household_id IN (SELECT public.my_household_ids()))
  WITH CHECK (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "Household members can manage inventory"
  ON public.inventory FOR ALL
  USING (household_id IN (SELECT public.my_household_ids()))
  WITH CHECK (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "Household members can manage shopping list"
  ON public.shopping_list FOR ALL
  USING (household_id IN (SELECT public.my_household_ids()))
  WITH CHECK (household_id IN (SELECT public.my_household_ids()));

CREATE POLICY "Household members can manage chat logs"
  ON public.chat_logs FOR ALL
  USING (household_id IN (SELECT public.my_household_ids()))
  WITH CHECK (household_id IN (SELECT public.my_household_ids()));

-- ========================================
-- 辅助函数：通过邀请码查找家庭（安全定义器，绕过 RLS）
-- ========================================
CREATE OR REPLACE FUNCTION public.find_household_by_invite_code(invite_code_input TEXT)
RETURNS public.households
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  result public.households;
  normalized_code TEXT;
BEGIN
  normalized_code := LOWER(TRIM(invite_code_input));
  
  SELECT * INTO result
  FROM public.households
  WHERE LOWER(invite_code) = normalized_code
  LIMIT 1;
  
  IF result IS NULL THEN
    RAISE EXCEPTION '邀请码无效或家庭不存在';
  END IF;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_household_by_invite_code(TEXT) TO authenticated;

-- ========================================
-- 辅助函数：插入用户资料（安全定义器，用于注册时）
-- ========================================
CREATE OR REPLACE FUNCTION public.insert_user_profile(
  user_id UUID,
  user_username TEXT,
  user_email TEXT DEFAULT NULL
)
RETURNS public.menuapp_user_profiles
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  result public.menuapp_user_profiles;
BEGIN
  -- 检查用户名是否已被使用
  IF EXISTS (
    SELECT 1 FROM public.menuapp_user_profiles
    WHERE username = user_username AND id != user_id
  ) THEN
    RAISE EXCEPTION '该用户名已被使用，请选择其他用户名';
  END IF;
  
  -- 插入或更新用户资料
  INSERT INTO public.menuapp_user_profiles (id, username, email)
  VALUES (user_id, user_username, user_email)
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      email = EXCLUDED.email,
      updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_user_profile(UUID, TEXT, TEXT) TO authenticated;

-- ========================================
-- 完成！
-- ========================================
-- 数据库结构已创建完成
-- 下一步：执行 enable-realtime.sql 启用实时同步
-- ========================================

