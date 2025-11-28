import { useLiveQuery } from 'dexie-react-hooks'

import { db, getHouseholdId } from './client'
import type {
  InventoryItem,
  Recipe,
  ShoppingListItem,
  ChatLog,
} from '../types/entities'

const defaultHouseholdFilter = <T extends { householdId: string }>(items: T[]) =>
  items.filter((item) => item.householdId === getHouseholdId())

export const useRecipes = () =>
  useLiveQuery(
    async () => {
      const recipes = await db.recipes.toArray()
      return defaultHouseholdFilter(recipes).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      )
    },
    [],
    [] as Recipe[],
  )

export const useRecipe = (id?: string) =>
  useLiveQuery(
    () => (id ? db.recipes.get(id) : undefined),
    [id],
  )

export const useInventory = () =>
  useLiveQuery(
    async () => {
      const inventory = await db.inventory.toArray()
      return defaultHouseholdFilter(inventory).sort((a, b) =>
        a.location.localeCompare(b.location),
      )
    },
    [],
    [] as InventoryItem[],
  )

export const useShoppingList = () =>
  useLiveQuery(
    async () => {
      const list = await db.shoppingList.toArray()
      return defaultHouseholdFilter(list).sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      )
    },
    [],
    [] as ShoppingListItem[],
  )

export const useChatLogs = (recipeId?: string) =>
  useLiveQuery(
    async () => {
      const logs = recipeId
        ? await db.chatLogs.where('recipeId').equals(recipeId).toArray()
        : await db.chatLogs.toArray()
      return defaultHouseholdFilter(logs)
    },
    [recipeId],
    [] as ChatLog[],
  )

