import { useEffect } from 'react'
import { supabase, isSupabaseConfigured, supabaseSchema } from '@/lib/supabase'
import { db } from '@/db/client'
import type { Recipe, InventoryItem, ShoppingListItem, ChatLog } from '@/types/entities'

// 将数据库字段映射到前端字段
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

/**
 * 设置实时同步，监听 Supabase 数据变化并更新本地 Dexie
 */
export const useRealtimeSync = (householdId: string | undefined) => {
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !householdId || householdId === 'local-family') {
      console.log('Realtime sync skipped:', { isSupabaseConfigured, hasSupabase: !!supabase, householdId })
      return
    }

    console.log('Setting up realtime sync for household:', householdId)

    // 订阅 recipes 表
    const recipesChannel = supabase
      .channel(`recipes-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: supabaseSchema,
          table: 'recipes',
          filter: `household_id=eq.${householdId}`,
        },
        async (payload: {
          eventType: 'INSERT' | 'UPDATE' | 'DELETE'
          new?: Record<string, unknown>
          old?: Record<string, unknown>
        }) => {
          console.log('Recipes change:', payload.eventType, payload.new)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new) {
              const recipe = fromDbRecipe(payload.new)
              await db.recipes.put(recipe)
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old) {
              await db.recipes.delete(payload.old.id as string)
            }
          }
        },
      )
      .subscribe((status) => {
        console.log('Recipes channel status:', status)
      })

    // 订阅 inventory 表
    const inventoryChannel = supabase
      .channel(`inventory-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: supabaseSchema,
          table: 'inventory',
          filter: `household_id=eq.${householdId}`,
        },
        async (payload: {
          eventType: 'INSERT' | 'UPDATE' | 'DELETE'
          new?: Record<string, unknown>
          old?: Record<string, unknown>
        }) => {
          console.log('Inventory change:', payload.eventType, payload.new)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new) {
              const item = fromDbInventory(payload.new)
              await db.inventory.put(item)
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old) {
              await db.inventory.delete(payload.old.id as string)
            }
          }
        },
      )
      .subscribe((status) => {
        console.log('Inventory channel status:', status)
      })

    // 订阅 shopping_list 表
    const shoppingChannel = supabase
      .channel(`shopping-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: supabaseSchema,
          table: 'shopping_list',
          filter: `household_id=eq.${householdId}`,
        },
        async (payload: {
          eventType: 'INSERT' | 'UPDATE' | 'DELETE'
          new?: Record<string, unknown>
          old?: Record<string, unknown>
        }) => {
          console.log('Shopping list change:', payload.eventType, payload.new)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new) {
              const item = fromDbShopping(payload.new)
              await db.shoppingList.put(item)
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old) {
              await db.shoppingList.delete(payload.old.id as string)
            }
          }
        },
      )
      .subscribe((status) => {
        console.log('Shopping channel status:', status)
      })

    // 订阅 chat_logs 表
    const chatChannel = supabase
      .channel(`chat-${householdId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: supabaseSchema,
          table: 'chat_logs',
          filter: `household_id=eq.${householdId}`,
        },
        async (payload: {
          eventType: 'INSERT' | 'UPDATE' | 'DELETE'
          new?: Record<string, unknown>
          old?: Record<string, unknown>
        }) => {
          console.log('Chat log change:', payload.eventType, payload.new)
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new) {
              const chat = fromDbChat(payload.new)
              await db.chatLogs.put(chat)
            }
          } else if (payload.eventType === 'DELETE') {
            if (payload.old) {
              await db.chatLogs.delete(payload.old.id as string)
            }
          }
        },
      )
      .subscribe((status) => {
        console.log('Chat channel status:', status)
      })

    return () => {
      console.log('Cleaning up realtime subscriptions')
      recipesChannel.unsubscribe()
      inventoryChannel.unsubscribe()
      shoppingChannel.unsubscribe()
      chatChannel.unsubscribe()
    }
  }, [householdId])
}

