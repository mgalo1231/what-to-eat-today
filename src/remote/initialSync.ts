import { supabase, isSupabaseConfigured, supabaseSchema } from '@/lib/supabase'
import { db } from '@/db/client'
import type { Recipe, InventoryItem, ShoppingListItem, ChatLog } from '@/types/entities'

// 将数据库字段（snake_case）映射到前端字段（camelCase）
const fromDbRecipe = (r: Record<string, unknown>): Recipe => ({
  id: r.id as string,
  householdId: r.household_id as string,
  title: r.title as string,
  description: r.description as string | undefined,
  duration: r.duration as number,
  difficulty: r.difficulty as Recipe['difficulty'],
  tags: r.tags as string[],
  servings: r.servings as number | undefined,
  ingredients: r.ingredients as Recipe['ingredients'],
  steps: r.steps as Recipe['steps'],
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
})

const fromDbInventory = (i: Record<string, unknown>): InventoryItem => ({
  id: i.id as string,
  householdId: i.household_id as string,
  name: i.name as string,
  quantity: i.quantity as number,
  unit: i.unit as string,
  location: i.location as InventoryItem['location'],
  expiryDate: i.expiry_date as string | undefined,
  notes: i.notes as string | undefined,
  createdAt: i.created_at as string,
  updatedAt: i.updated_at as string,
})

const fromDbShopping = (s: Record<string, unknown>): ShoppingListItem => ({
  id: s.id as string,
  householdId: s.household_id as string,
  name: s.name as string,
  quantity: s.quantity as number,
  unit: s.unit as string,
  isBought: s.is_bought as boolean,
  sourceRecipeId: s.source_recipe_id as string | undefined,
  createdAt: s.created_at as string,
  updatedAt: s.updated_at as string,
})

const fromDbChat = (c: Record<string, unknown>): ChatLog => ({
  id: c.id as string,
  householdId: c.household_id as string,
  recipeId: c.recipe_id as string | undefined,
  title: c.title as string,
  messages: c.messages as ChatLog['messages'],
  createdAt: c.created_at as string,
  updatedAt: c.updated_at as string,
})

export const pullAllToDexie = async (householdId: string) => {
  if (!isSupabaseConfigured || !supabase) return
  const client = supabase.schema(supabaseSchema)

  // Pull recipes
  const { data: recipes } = await client
    .from('recipes')
    .select('*')
    .eq('household_id', householdId)
  if (recipes && recipes.length) {
    const mapped = recipes.map(fromDbRecipe)
    await db.recipes.bulkPut(mapped)
  }

  // Pull inventory
  const { data: inventory } = await client
    .from('inventory')
    .select('*')
    .eq('household_id', householdId)
  if (inventory && inventory.length) {
    const mapped = inventory.map(fromDbInventory)
    await db.inventory.bulkPut(mapped)
  }

  // Pull shopping_list
  const { data: shopping } = await client
    .from('shopping_list')
    .select('*')
    .eq('household_id', householdId)
  if (shopping && shopping.length) {
    const mapped = shopping.map(fromDbShopping)
    await db.shoppingList.bulkPut(mapped)
  }

  // Pull chat_logs
  const { data: chats } = await client
    .from('chat_logs')
    .select('*')
    .eq('household_id', householdId)
  if (chats && chats.length) {
    const mapped = chats.map(fromDbChat)
    await db.chatLogs.bulkPut(mapped)
  }
}
