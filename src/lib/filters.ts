import type { InventoryItem, Recipe } from '../types/entities'

type FilterParams = {
  keyword?: string
  tags?: string[]
  maxDuration?: number
}

export const filterRecipes = (recipes: Recipe[], filters: FilterParams) => {
  const { keyword, tags, maxDuration } = filters
  return recipes.filter((recipe) => {
    if (keyword) {
      const text = `${recipe.title}${recipe.description ?? ''}${recipe.tags.join('')}`
      if (!text.toLowerCase().includes(keyword.toLowerCase())) {
        return false
      }
    }
    if (tags && tags.length > 0) {
      const hasTag = tags.some((tag) => recipe.tags.includes(tag))
      if (!hasTag) return false
    }
    if (maxDuration && recipe.duration > maxDuration) {
      return false
    }
    return true
  })
}

export const categorizeByInventory = (recipes: Recipe[], inventory: InventoryItem[]) => {
  // 添加空值检查
  if (!recipes || !inventory) {
    return { canCook: [], close: [] }
  }

  const inventoryMap = new Map(
    inventory.map((item) => [item.name.trim(), item]),
  )
  const canCook: Recipe[] = []
  const close: Recipe[] = []

  recipes.forEach((recipe) => {
    // 确保 ingredients 存在且是数组
    if (!recipe.ingredients || !Array.isArray(recipe.ingredients)) {
      return
    }

    let missingCount = 0
    recipe.ingredients.forEach((ingredient) => {
      const stock = inventoryMap.get(ingredient.name.trim())
      if (!stock || stock.quantity < ingredient.amount) {
        missingCount += 1
      }
    })
    if (missingCount === 0) {
      canCook.push(recipe)
    } else if (missingCount <= 2) {
      close.push(recipe)
    }
  })

  return { canCook, close }
}

