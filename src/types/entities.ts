export type HouseholdScoped = {
  householdId: string // UUID of menuapp.households
}

export type DifficultyLevel = '简单' | '中等' | '挑战'

export type RecipeTag =
  | '快手菜'
  | '汤'
  | '面'
  | '素菜'
  | '一锅端'
  | '下饭菜'
  | '低脂'
  | '宴客'
  | '甜品'
  | string

export type IngredientItem = {
  id: string
  name: string
  amount: number
  unit: string
}

export type RecipeStep = {
  id: string
  text: string
  tip?: string
}

export type Recipe = HouseholdScoped & {
  id: string
  title: string
  description?: string
  duration: number
  difficulty: DifficultyLevel
  tags: RecipeTag[]
  servings?: number
  ingredients: IngredientItem[]
  steps: RecipeStep[]
  isFavorite?: boolean
  viewCount?: number
  createdAt: string
  updatedAt: string
}

export type StorageLocation = '常温' | '冷藏' | '冷冻'

export type InventoryItem = HouseholdScoped & {
  id: string
  name: string
  quantity: number
  unit: string
  location: StorageLocation
  category?: string
  purchaseDate?: string
  expiryDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type ShoppingListItem = HouseholdScoped & {
  id: string
  name: string
  quantity: number
  unit: string
  isBought: boolean
  priority?: number
  sourceRecipeId?: string
  notes?: string
  boughtAt?: string
  createdAt: string
  updatedAt: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

export type ChatLog = HouseholdScoped & {
  id: string
  recipeId?: string
  sessionId?: string
  title: string
  messages: ChatMessage[]
  context?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ========== Household & Member ==========
export type Household = {
  id: string // UUID
  name: string
  description?: string
  inviteCode: string
  settings?: Record<string, unknown>
  createdAt: string
  updatedAt?: string
}

export type HouseholdMember = {
  id: string
  userId: string
  householdId: string
  displayName?: string
  role: 'owner' | 'member'
  isActive?: boolean
  createdAt: string
  updatedAt?: string
}

// ========== User Profile ==========
export type UserProfile = {
  id: string // auth.users.id
  username: string
  email?: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}
