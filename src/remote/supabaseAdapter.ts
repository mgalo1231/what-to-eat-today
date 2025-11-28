import { supabase, isSupabaseConfigured, supabaseSchema } from '@/lib/supabase'
import type { InventoryItem, Recipe, ShoppingListItem, ChatLog } from '@/types/entities'

const ensure = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured')
  }
  return supabase.schema(supabaseSchema)
}

// 将前端字段名映射到数据库字段名（snake_case）
const toDbRecipe = (r: Recipe) => ({
  id: r.id,
  household_id: r.householdId,
  title: r.title,
  description: r.description,
  duration: r.duration,
  difficulty: r.difficulty,
  tags: r.tags,
  servings: r.servings,
  ingredients: r.ingredients,
  steps: r.steps,
  created_at: r.createdAt,
  updated_at: r.updatedAt,
})

const toDbInventory = (i: InventoryItem) => ({
  id: i.id,
  household_id: i.householdId,
  name: i.name,
  quantity: i.quantity,
  unit: i.unit,
  location: i.location,
  expiry_date: i.expiryDate,
  notes: i.notes,
  created_at: i.createdAt,
  updated_at: i.updatedAt,
})

const toDbShopping = (s: ShoppingListItem) => ({
  id: s.id,
  household_id: s.householdId,
  name: s.name,
  quantity: s.quantity,
  unit: s.unit,
  is_bought: s.isBought,
  source_recipe_id: s.sourceRecipeId,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
})

const toDbChat = (c: ChatLog) => ({
  id: c.id,
  household_id: c.householdId,
  recipe_id: c.recipeId,
  title: c.title,
  messages: c.messages,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
})

export const remote = {
  async upsertRecipe(recipe: Recipe) {
    const sb = ensure()
    await sb.from('recipes').upsert(toDbRecipe(recipe))
  },
  async deleteRecipe(id: string) {
    const sb = ensure()
    await sb.from('recipes').delete().eq('id', id)
  },
  async upsertInventory(item: InventoryItem) {
    const sb = ensure()
    await sb.from('inventory').upsert(toDbInventory(item))
  },
  async deleteInventory(id: string) {
    const sb = ensure()
    await sb.from('inventory').delete().eq('id', id)
  },
  async upsertShopping(item: ShoppingListItem) {
    const sb = ensure()
    await sb.from('shopping_list').upsert(toDbShopping(item))
  },
  async deleteShopping(id: string) {
    const sb = ensure()
    await sb.from('shopping_list').delete().eq('id', id)
  },
  async upsertChat(log: ChatLog) {
    const sb = ensure()
    await sb.from('chat_logs').upsert(toDbChat(log))
  },
}
