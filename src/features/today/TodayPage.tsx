import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, UtensilsCrossed, Sparkles, Plus, Check, Wand2 } from 'lucide-react'

import { useInventory, useRecipes } from '@/db/hooks'
import { recipeRepository } from '@/db/repositories'
import { DEFAULT_TAGS } from '@/constants/tags'
import { recommendRecipes } from '@/lib/recommendation'
import { categorizeByInventory } from '@/lib/filters'
import { TagPill } from '@/components/ui/TagPill'
import { ingredientDiff } from '@/db/repositories'
import { discoverRecipes, type DiscoverRecipe } from '@/data/discoverRecipes'
import { generateNewRecipes, generateRecipeByTag } from '@/lib/aiRecipeGenerator'
import { useToast } from '@/components/ui/Toast'
import { RecipeCardSkeleton } from '@/components/ui/Skeleton'
import { RecipePreviewModal } from '@/components/ui/RecipePreviewModal'
import type { Recipe } from '@/types/entities'

type DurationValue = 'all' | '20' | '40' | '60'
const durationOptions: { label: string; value: DurationValue; minutes?: number }[] = [
  { label: '不限', value: 'all' },
  { label: '≤20 分钟', value: '20', minutes: 20 },
  { label: '≤40 分钟', value: '40', minutes: 40 },
  { label: '≤60 分钟', value: '60', minutes: 60 },
]

// 发现新菜的标签分类
const discoverTags = ['全部', '川菜', '粤菜', '湘菜', '东北菜', '日式', '韩式', '西式', '江浙菜']

export const TodayPage = () => {
  const recipes = useRecipes()
  const inventory = useInventory()
  const { showToast } = useToast()
  const [duration, setDuration] = useState<DurationValue>('all')
  const [tag, setTag] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Recipe[]>([])

  // 发现新菜相关状态
  const [discoverTag, setDiscoverTag] = useState('全部')
  const [discoverList, setDiscoverList] = useState<DiscoverRecipe[]>([])
  const [addedTitles, setAddedTitles] = useState<Set<string>>(new Set())
  const [addingTitle, setAddingTitle] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  
  // 预览弹窗
  const [previewRecipe, setPreviewRecipe] = useState<DiscoverRecipe | null>(null)

  const buildSuggestions = useCallback(() =>
    recipes
      ? recommendRecipes({
          recipes,
          maxDuration: durationOptions.find((option) => option.value === duration)
            ?.minutes,
          tags: tag ? [tag] : undefined,
          count: 3,
        })
      : []
  , [recipes, duration, tag])

  useEffect(() => {
    setSuggestions(buildSuggestions())
  }, [buildSuggestions])

  // 从预设菜谱中获取
  const getPresetRecipes = useCallback(() => {
    const existingTitles = new Set(recipes?.map((r) => r.title) || [])
    let filtered = discoverRecipes.filter((r) => !existingTitles.has(r.title))
    
    if (discoverTag !== '全部') {
      filtered = filtered.filter((r) => r.tags.includes(discoverTag))
    }
    
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3)
  }, [recipes, discoverTag])

  // 初始化发现列表
  useEffect(() => {
    setDiscoverList(getPresetRecipes())
  }, [getPresetRecipes])

  // 换一批：混合预设和AI生成
  const refreshDiscoverList = async () => {
    setGenerating(true)
    
    try {
      // 先获取预设菜谱
      const presets = getPresetRecipes()
      
      // 如果预设不够3个，用AI生成补充
      if (presets.length < 3) {
        const needCount = 3 - presets.length
        const generated = discoverTag === '全部'
          ? generateNewRecipes(needCount)
          : Array.from({ length: needCount }, () => generateRecipeByTag(discoverTag))
        
        setDiscoverList([...presets, ...generated])
        showToast('✨ AI 为你生成了新菜谱', 'success')
      } else {
        // 随机决定是否生成AI菜谱（30%概率）
        if (Math.random() < 0.3) {
          const generated = discoverTag === '全部'
            ? generateNewRecipes(1)
            : [generateRecipeByTag(discoverTag)]
          setDiscoverList([...presets.slice(0, 2), ...generated])
          showToast('✨ AI 为你生成了新菜谱', 'success')
        } else {
          setDiscoverList(presets)
        }
      }
    } finally {
      setGenerating(false)
    }
  }

  // AI生成新菜
  const generateAIRecipes = () => {
    setGenerating(true)
    try {
      const generated = discoverTag === '全部'
        ? generateNewRecipes(3)
        : Array.from({ length: 3 }, () => generateRecipeByTag(discoverTag))
      setDiscoverList(generated)
      showToast('✨ AI 为你生成了 3 道新菜', 'success')
    } finally {
      setGenerating(false)
    }
  }

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
      showToast(`「${recipe.title}」已添加到菜谱库`, 'success')
      setPreviewRecipe(null)
    } catch {
      showToast('添加失败，请重试', 'error')
    } finally {
      setAddingTitle(null)
    }
  }

  const inventorySuggestions = useMemo(() => {
    if (!recipes || !inventory) return { canCook: [], close: [] }
    return categorizeByInventory(recipes, inventory)
  }, [recipes, inventory])

  // 加载状态
  if (!recipes) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="rounded-[32px] bg-gradient-to-br from-ios-primary to-ios-secondary p-6 text-white shadow-card">
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">今天吃什么</p>
          <h1 className="mt-3 text-3xl font-semibold">3 秒找到灵感</h1>
        </div>
        <div className="space-y-3">
          <RecipeCardSkeleton />
          <RecipeCardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
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
                className={`btn-press rounded-pill px-4 py-1 text-sm font-semibold ${
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
                className={`btn-press rounded-pill px-3 py-1 text-sm ${
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
            className="btn-press inline-flex items-center gap-1 text-sm font-semibold text-ios-primary"
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
                className="card-press flex flex-col gap-2 rounded-[24px] border border-ios-border bg-white p-4 shadow-soft"
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
                <p className="text-sm text-ios-muted line-clamp-2">{recipe.description}</p>
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
          <div className="flex items-center gap-2">
            <button
              className="btn-press inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-600"
              onClick={generateAIRecipes}
              disabled={generating}
            >
              <Wand2 className="h-4 w-4" />
              AI生成
            </button>
            <button
              className="btn-press inline-flex items-center gap-1 text-sm font-semibold text-ios-primary"
              onClick={refreshDiscoverList}
              disabled={generating}
            >
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              换一批
            </button>
          </div>
        </div>
        
        {/* 菜系标签 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {discoverTags.map((t) => (
            <button
              key={t}
              onClick={() => setDiscoverTag(t)}
              className={`btn-press whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-all ${
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
          {generating ? (
            <div className="flex items-center justify-center rounded-[24px] border border-amber-200 bg-amber-50 p-8">
              <div className="flex items-center gap-3 text-amber-600">
                <Wand2 className="h-5 w-5 animate-pulse" />
                <span>AI 正在为你生成新菜谱...</span>
              </div>
            </div>
          ) : discoverList.length > 0 ? (
            discoverList.map((recipe) => {
              const isAdded = addedTitles.has(recipe.title)
              const isAdding = addingTitle === recipe.title
              return (
                <div
                  key={recipe.title}
                  className="card-press flex flex-col gap-2 rounded-[24px] border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-soft cursor-pointer"
                  onClick={() => setPreviewRecipe(recipe)}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddRecipe(recipe)
                        }}
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
                  <p className="text-sm text-amber-700/80 line-clamp-2">{recipe.description}</p>
                  <div className="flex items-center justify-between">
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
                    <span className="text-xs text-amber-500">点击查看详情 →</span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-amber-600">
              <p className="mb-3">
                {discoverTag === '全部'
                  ? '所有预设菜谱都已添加啦！'
                  : `暂无更多${discoverTag}推荐`}
              </p>
              <button
                onClick={generateAIRecipes}
                className="btn-press inline-flex items-center gap-2 rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold text-white"
              >
                <Wand2 className="h-4 w-4" />
                让 AI 为你生成新菜
              </button>
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
          <Link className="btn-press text-sm font-semibold text-ios-primary" to="/inventory">
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
              className="card-press flex items-center justify-between rounded-[20px] border border-ios-border px-4 py-3"
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
                className="card-press flex flex-col gap-2 rounded-[20px] border border-ios-border px-4 py-3"
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
        className="btn-press flex w-full items-center justify-center gap-2 rounded-full bg-ios-primary py-3 font-semibold text-white shadow-soft"
      >
        <UtensilsCrossed className="h-4 w-4" />
        浏览全部菜谱
      </Link>

      {/* 菜谱预览弹窗 */}
      <RecipePreviewModal
        recipe={previewRecipe}
        isAdded={previewRecipe ? addedTitles.has(previewRecipe.title) : false}
        isAdding={previewRecipe ? addingTitle === previewRecipe.title : false}
        onAdd={() => previewRecipe && handleAddRecipe(previewRecipe)}
        onClose={() => setPreviewRecipe(null)}
      />
    </div>
  )
}
