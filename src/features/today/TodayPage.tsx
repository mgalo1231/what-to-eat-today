import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, UtensilsCrossed, Sparkles, Plus, Check } from 'lucide-react'

import { useInventory, useRecipes } from '@/db/hooks'
import { recipeRepository } from '@/db/repositories'
import { DEFAULT_TAGS } from '@/constants/tags'
import { recommendRecipes } from '@/lib/recommendation'
import { categorizeByInventory } from '@/lib/filters'
import { TagPill } from '@/components/ui/TagPill'
import { ingredientDiff } from '@/db/repositories'
import { discoverRecipes, type DiscoverRecipe } from '@/data/discoverRecipes'
import type { Recipe } from '@/types/entities'

type DurationValue = 'all' | '20' | '40' | '60'
const durationOptions: { label: string; value: DurationValue; minutes?: number }[] = [
  { label: '不限', value: 'all' },
  { label: '≤20 分钟', value: '20', minutes: 20 },
  { label: '≤40 分钟', value: '40', minutes: 40 },
  { label: '≤60 分钟', value: '60', minutes: 60 },
]

// 发现新菜的标签分类
const discoverTags = ['全部', '川菜', '粤菜', '湘菜', '东北菜', '日式', '韩式', '西式', '甜品']

export const TodayPage = () => {
  const recipes = useRecipes()
  const inventory = useInventory()
  const [duration, setDuration] = useState<DurationValue>('all')
  const [tag, setTag] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Recipe[]>([])

  // 发现新菜相关状态
  const [discoverTag, setDiscoverTag] = useState('全部')
  const [discoverList, setDiscoverList] = useState<DiscoverRecipe[]>([])
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set())
  const [addingTitle, setAddingTitle] = useState<string | null>(null)

  const buildSuggestions = () =>
    recipes
      ? recommendRecipes({
          recipes,
          maxDuration: durationOptions.find((option) => option.value === duration)
            ?.minutes,
          tags: tag ? [tag] : undefined,
          count: 3,
        })
      : []

  useEffect(() => {
    setSuggestions(buildSuggestions())
  }, [recipes, duration, tag])

  // 过滤已添加的菜谱并随机选择
  const refreshDiscoverList = () => {
    const existingTitles = new Set(recipes?.map((r) => r.title) || [])
    let filtered = discoverRecipes.filter((r) => !existingTitles.has(r.title))
    
    if (discoverTag !== '全部') {
      filtered = filtered.filter((r) => r.tags.includes(discoverTag))
    }
    
    // 随机打乱并取前3个
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)
    setDiscoverList(shuffled.slice(0, 3))
  }

  useEffect(() => {
    refreshDiscoverList()
  }, [recipes, discoverTag])

  // 添加菜谱到我的菜谱库
  const handleAddRecipe = async (recipe: DiscoverRecipe) => {
    setAddingTitle(recipe.title)
    try {
      await recipeRepository.create({
        title: recipe.title,
        description: recipe.description,
        duration: recipe.duration,
        difficulty: recipe.difficulty,
        tags: recipe.tags,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      })
      setAddedTitles((prev) => new Set(prev).add(recipe.title))
    } catch (error) {
      console.error('添加菜谱失败:', error)
    } finally {
      setAddingTitle(null)
    }
  }

  const inventorySuggestions = useMemo(() => {
    if (!recipes || !inventory) return { canCook: [], close: [] }
    return categorizeByInventory(recipes, inventory)
  }, [recipes, inventory])

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-br from-ios-primary to-ios-secondary p-6 text-white shadow-card">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">
          今天吃什么
        </p>
        <h1 className="mt-3 text-3xl font-semibold">3 秒找到灵感</h1>
        <p className="mt-2 text-white/80">
          根据你设置的时间和标签，智能推荐 1-3 道菜，一键生成购物清单。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {durationOptions.map((option) => {
            const active = option.value === duration
            return (
              <button
                key={option.value}
                className={`rounded-pill px-4 py-1 text-sm font-semibold ${
                  active ? 'bg-white text-ios-primary' : 'bg-white/20'
                }`}
                onClick={() => setDuration(option.value)}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {DEFAULT_TAGS.map((item) => {
            const active = tag === item
            return (
              <button
                key={item}
                className={`rounded-pill px-3 py-1 text-sm ${
                  active ? 'bg-white text-ios-primary' : 'bg-white/20'
                }`}
                onClick={() => setTag(active ? null : item)}
              >
                {item}
              </button>
            )
          })}
        </div>
      </section>

      {/* 今日推荐 - 我的菜谱 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">今日推荐</h2>
          <button
            className="inline-flex items-center gap-1 text-sm font-semibold text-ios-primary"
            onClick={() => setSuggestions(buildSuggestions())}
          >
            <RefreshCw className="h-4 w-4" />
            换一批
          </button>
        </div>
        <div className="space-y-3">
          {suggestions && suggestions.length > 0 ? (
            suggestions.map((recipe) => (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="flex flex-col gap-2 rounded-[24px] border border-ios-border bg-white p-4 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-ios-muted">
                      {recipe.difficulty}
                    </p>
                    <h3 className="text-xl font-semibold">{recipe.title}</h3>
                  </div>
                  <span className="rounded-pill bg-ios-primaryMuted px-3 py-1 text-sm font-semibold text-ios-primary">
                    {recipe.duration}′
                  </span>
                </div>
                <p className="text-sm text-ios-muted">{recipe.description}</p>
                <div className="flex flex-wrap gap-2">
                  {recipe.tags.slice(0, 3).map((tagItem) => (
                    <TagPill key={tagItem}>{tagItem}</TagPill>
                  ))}
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-ios-border p-6 text-center text-ios-muted">
              暂无推荐，先去添加菜谱吧。
            </div>
          )}
        </div>
      </section>

      {/* 发现新菜 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-amber-500" />
            发现新菜
          </h2>
          <button
            className="inline-flex items-center gap-1 text-sm font-semibold text-ios-primary"
            onClick={refreshDiscoverList}
          >
            <RefreshCw className="h-4 w-4" />
            换一批
          </button>
        </div>
        
        {/* 菜系标签 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {discoverTags.map((t) => (
            <button
              key={t}
              onClick={() => setDiscoverTag(t)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-all ${
                discoverTag === t
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 推荐列表 */}
        <div className="space-y-3">
          {discoverList.length > 0 ? (
            discoverList.map((recipe) => {
              const isAdded = addedTitles.has(recipe.title)
              const isAdding = addingTitle === recipe.title
              return (
                <div
                  key={recipe.title}
                  className="flex flex-col gap-2 rounded-[24px] border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-600">
                        {recipe.tags[0]}
                      </p>
                      <h3 className="text-xl font-semibold text-amber-900">
                        {recipe.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        {recipe.duration}′
                      </span>
                      <button
                        onClick={() => handleAddRecipe(recipe)}
                        disabled={isAdded || isAdding}
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-all ${
                          isAdded
                            ? 'bg-green-100 text-green-600'
                            : 'bg-amber-500 text-white shadow-md hover:bg-amber-600'
                        }`}
                      >
                        {isAdding ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : isAdded ? (
                          <>
                            <Check className="h-4 w-4" />
                            已添加
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            添加
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-amber-700/80">{recipe.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.slice(0, 3).map((tagItem) => (
                      <span
                        key={tagItem}
                        className="rounded-full bg-amber-100/80 px-2 py-0.5 text-xs text-amber-700"
                      >
                        {tagItem}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-amber-600">
              {discoverTag === '全部'
                ? '所有推荐菜谱都已添加到你的菜谱库啦！'
                : `暂无更多${discoverTag}推荐，换个分类试试？`}
            </div>
          )}
        </div>
      </section>

      {/* 根据库存推荐 */}
      <section className="space-y-4 rounded-[24px] bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ios-muted">根据库存</p>
            <h2 className="text-xl font-semibold">现有食材能做什么</h2>
          </div>
          <Link className="text-sm font-semibold text-ios-primary" to="/inventory">
            管理库存
          </Link>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ios-muted">
            完全可做（{inventorySuggestions.canCook.length}）
          </h3>
          {inventorySuggestions.canCook.slice(0, 3).map((recipe) => (
            <Link
              key={recipe.id}
              to={`/recipes/${recipe.id}`}
              className="flex items-center justify-between rounded-[20px] border border-ios-border px-4 py-3"
            >
              <div>
                <p className="font-semibold">{recipe.title}</p>
                <p className="text-xs text-ios-muted">
                  所需食材 {recipe.ingredients.length} · {recipe.duration} 分钟
                </p>
              </div>
              <TagPill tone="positive">立即开做</TagPill>
            </Link>
          ))}
          {inventorySuggestions.canCook.length === 0 && (
            <p className="rounded-[20px] border border-dashed border-ios-border px-4 py-3 text-sm text-ios-muted">
              暂无完全匹配的菜谱，试试「只差一两样」。
            </p>
          )}
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ios-muted">
            只差一两样（{inventorySuggestions.close.length}）
          </h3>
          {inventorySuggestions.close.slice(0, 3).map((recipe) => {
            const diff = inventory ? ingredientDiff(recipe.ingredients, inventory) : null
            return (
              <Link
                key={recipe.id}
                to={`/recipes/${recipe.id}`}
                className="flex flex-col gap-2 rounded-[20px] border border-ios-border px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{recipe.title}</p>
                  <TagPill tone="accent">差 {diff?.missing.length ?? 0} 样</TagPill>
                </div>
                <p className="text-xs text-ios-muted">
                  缺：{diff?.missing.map((item) => item.name).join('、') || '未知'}
                </p>
              </Link>
            )
          })}
          {inventorySuggestions.close.length === 0 && (
            <p className="rounded-[20px] border border-dashed border-ios-border px-4 py-3 text-sm text-ios-muted">
              最近库存很齐全，去「菜谱」页面再挑一些想吃的吧。
            </p>
          )}
        </div>
      </section>
      <Link
        to="/recipes"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-ios-primary py-3 font-semibold text-white shadow-soft"
      >
        <UtensilsCrossed className="h-4 w-4" />
        浏览全部菜谱
      </Link>
    </div>
  )
}
