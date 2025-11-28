import { isSupabaseConfigured } from '@/lib/supabase'
import { remote } from '@/remote/supabaseAdapter'
import { db, getHouseholdId } from './client'
import type {
  ChatLog,
  IngredientItem,
  InventoryItem,
  Recipe,
  ShoppingListItem,
} from '../types/entities'
import { createId } from '../lib/createId'
import { nowIso } from '../lib/date'

type RecipeInput = Omit<
  Recipe,
  'id' | 'householdId' | 'createdAt' | 'updatedAt'
>

type InventoryInput = Omit<
  InventoryItem,
  'id' | 'householdId' | 'createdAt' | 'updatedAt'
>

type ShoppingInput = Omit<
  ShoppingListItem,
  'id' | 'householdId' | 'createdAt' | 'updatedAt'
>

type ChatLogInput = Omit<
  ChatLog,
  'id' | 'householdId' | 'createdAt' | 'updatedAt'
>

export const recipeRepository = {
  async list() {
    return db.recipes
      .where('householdId')
      .equals(getHouseholdId())
      .reverse()
      .sortBy('updatedAt')
  },
  async get(id: string) {
    return db.recipes.get(id)
  },
  async create(payload: RecipeInput) {
    const timestamps = nowIso()
    const recipe: Recipe = {
      id: createId(),
      householdId: getHouseholdId(),
      createdAt: timestamps,
      updatedAt: timestamps,
      ...payload,
    }
    await db.recipes.add(recipe)
    if (isSupabaseConfigured) {
      remote.upsertRecipe(recipe).catch((err) => {
        console.error('Failed to sync recipe to Supabase:', err)
      })
    }
    return recipe
  },
  async update(id: string, changes: Partial<Recipe>) {
    const exists = await db.recipes.get(id)
    if (!exists) {
      throw new Error('Recipe not found')
    }
    const updated: Recipe = {
      ...exists,
      ...changes,
      updatedAt: nowIso(),
    }
    await db.recipes.put(updated)
    if (isSupabaseConfigured) {
      remote.upsertRecipe(updated).catch((err) => {
        console.error('Failed to sync recipe update to Supabase:', err)
      })
    }
    return updated
  },
  async remove(id: string) {
    await db.recipes.delete(id)
    if (isSupabaseConfigured) {
      remote.deleteRecipe(id).catch((err) => {
        console.error('Failed to sync recipe deletion to Supabase:', err)
      })
    }
  },
}

export const inventoryRepository = {
  async list() {
    return db.inventory.where('householdId').equals(getHouseholdId()).toArray()
  },
  async create(payload: InventoryInput) {
    const timestamps = nowIso()
    const item: InventoryItem = {
      id: createId(),
      householdId: getHouseholdId(),
      createdAt: timestamps,
      updatedAt: timestamps,
      ...payload,
    }
    await db.inventory.add(item)
    if (isSupabaseConfigured) {
      remote.upsertInventory(item).catch((err) => {
        console.error('Failed to sync inventory to Supabase:', err)
      })
    }
    return item
  },
  async update(id: string, changes: Partial<InventoryItem>) {
    const exists = await db.inventory.get(id)
    if (!exists) throw new Error('Inventory item not found')
    const updated: InventoryItem = {
      ...exists,
      ...changes,
      updatedAt: nowIso(),
    }
    await db.inventory.put(updated)
    if (isSupabaseConfigured) {
      remote.upsertInventory(updated).catch((err) => {
        console.error('Failed to sync inventory update to Supabase:', err)
      })
    }
    return updated
  },
  async remove(id: string) {
    await db.inventory.delete(id)
    if (isSupabaseConfigured) {
      remote.deleteInventory(id).catch((err) => {
        console.error('Failed to sync inventory deletion to Supabase:', err)
      })
    }
  },
}

export const shoppingRepository = {
  async list() {
    return db.shoppingList
      .where('householdId')
      .equals(getHouseholdId())
      .sortBy('createdAt')
  },
  async create(payload: ShoppingInput) {
    const timestamps = nowIso()
    const item: ShoppingListItem = {
      id: createId(),
      householdId: getHouseholdId(),
      createdAt: timestamps,
      updatedAt: timestamps,
      ...payload,
    }
    await db.shoppingList.add(item)
    if (isSupabaseConfigured) {
      remote.upsertShopping(item).catch((err) => {
        console.error('Failed to sync shopping item to Supabase:', err)
      })
    }
    return item
  },
  async update(id: string, changes: Partial<ShoppingListItem>) {
    const exists = await db.shoppingList.get(id)
    if (!exists) throw new Error('Shopping item not found')
    const updated: ShoppingListItem = {
      ...exists,
      ...changes,
      updatedAt: nowIso(),
    }
    await db.shoppingList.put(updated)
    if (isSupabaseConfigured) {
      remote.upsertShopping(updated).catch((err) => {
        console.error('Failed to sync shopping item update to Supabase:', err)
      })
    }
    return updated
  },
  async remove(id: string) {
    await db.shoppingList.delete(id)
    if (isSupabaseConfigured) {
      remote.deleteShopping(id).catch((err) => {
        console.error('Failed to sync shopping item deletion to Supabase:', err)
      })
    }
  },
  async clearBought() {
    const boughtItems = await db.shoppingList
      .where('householdId')
      .equals(getHouseholdId())
      .and((item) => item.isBought)
      .primaryKeys()
    await db.shoppingList.bulkDelete(boughtItems)
  },
}

export const chatRepository = {
  async listByRecipe(recipeId?: string) {
    if (!recipeId) {
      return db.chatLogs.where('householdId').equals(getHouseholdId()).toArray()
    }
    return db.chatLogs.where({ householdId: getHouseholdId(), recipeId }).toArray()
  },
  async create(payload: ChatLogInput) {
    const timestamps = nowIso()
    const log: ChatLog = {
      id: createId(),
      householdId: getHouseholdId(),
      createdAt: timestamps,
      updatedAt: timestamps,
      ...payload,
    }
    await db.chatLogs.add(log)
    return log
  },
  async addMessage(id: string, message: { role: 'user' | 'assistant'; content: string }) {
    const exists = await db.chatLogs.get(id)
    if (!exists) throw new Error('Chat session not found')
    const newMessage = {
      id: createId(),
      createdAt: nowIso(),
      ...message,
    }
    const updated: ChatLog = {
      ...exists,
      messages: [...exists.messages, newMessage],
      updatedAt: nowIso(),
    }
    await db.chatLogs.put(updated)
    return updated
  },
}

export const ingredientDiff = (
  ingredients: IngredientItem[],
  inventory: InventoryItem[],
) => {
  return ingredients.reduce(
    (acc, ingredient) => {
      const item = inventory.find(
        (inv) => inv.name.trim() === ingredient.name.trim(),
      )
      if (!item || item.quantity < ingredient.amount) {
        acc.missing.push({
          name: ingredient.name,
          need: ingredient.amount,
          current: item?.quantity ?? 0,
          unit: ingredient.unit,
        })
      } else {
        acc.available.push({
          name: ingredient.name,
          used: ingredient.amount,
          unit: ingredient.unit,
        })
      }
      return acc
    },
    {
      missing: [] as { name: string; need: number; current: number; unit: string }[],
      available: [] as { name: string; used: number; unit: string }[],
    },
  )
}

