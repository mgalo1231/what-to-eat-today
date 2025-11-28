import type { Recipe } from '../types/entities'

type RecommendationParams = {
  recipes: Recipe[]
  maxDuration?: number
  tags?: string[]
  count?: number
}

const pickRandom = <T>(items: T[], count: number) => {
  const copy = [...items]
  const result: T[] = []
  while (copy.length > 0 && result.length < count) {
    const index = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(index, 1)[0])
  }
  return result
}

export const recommendRecipes = ({
  recipes,
  maxDuration,
  tags,
  count = 3,
}: RecommendationParams) => {
  let pool = [...recipes]
  if (maxDuration) {
    pool = pool.filter((recipe) => recipe.duration <= maxDuration)
  }
  if (tags && tags.length > 0) {
    pool = pool.filter((recipe) => recipe.tags.some((tag) => tags.includes(tag)))
  }
  if (pool.length === 0) {
    return pickRandom(recipes, Math.min(count, recipes.length))
  }
  return pickRandom(pool, Math.min(count, pool.length))
}

