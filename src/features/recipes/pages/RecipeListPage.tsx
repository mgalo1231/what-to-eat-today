import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { useRecipes } from '@/db/hooks'
import { RecipeCard } from '../components/RecipeCard'
import { RecipeFilters } from '../components/RecipeFilters'
import type { DurationValue } from '../components/RecipeFilters'
import { filterRecipes } from '@/lib/filters'

const durationMap: Record<DurationValue, number | undefined> = {
  all: undefined,
  '15': 15,
  '30': 30,
  '45': 45,
}

export const RecipeListPage = () => {
  const recipes = useRecipes()
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [duration, setDuration] = useState<DurationValue>('all')

  const filtered = useMemo(() => {
    if (!recipes) return []
    return filterRecipes(recipes, {
      keyword: search,
      tags: selectedTags,
      maxDuration: durationMap[duration],
    })
  }, [recipes, search, selectedTags, duration])

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    )

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ios-muted">我的菜谱</p>
          <h1 className="text-3xl font-semibold">收藏夹</h1>
        </div>
        <Link
          to="/recipes/new"
          className="inline-flex h-10 items-center gap-1 rounded-full bg-ios-primary px-4 text-sm font-semibold text-white shadow-soft"
        >
          <Plus className="h-4 w-4" />
          新增
        </Link>
      </header>
      <RecipeFilters
        search={search}
        onSearchChange={setSearch}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        duration={duration}
        onDurationChange={setDuration}
      />
      <div className="space-y-4">
        {filtered.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
        {filtered.length === 0 && (
          <div className="ios-card text-center text-ios-muted">
            暂无符合条件的菜谱，试着调整筛选条件或添加新菜。
          </div>
        )}
      </div>
    </div>
  )
}

