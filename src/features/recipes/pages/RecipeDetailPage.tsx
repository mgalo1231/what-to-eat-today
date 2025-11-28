import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle, ShoppingCart, Sparkles } from 'lucide-react'

import { useInventory, useRecipe } from '@/db/hooks'
import {
  ingredientDiff,
  recipeRepository,
  shoppingRepository,
} from '@/db/repositories'
import { Button } from '@/components/ui/Button'
import { TagPill } from '@/components/ui/TagPill'

export const RecipeDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const recipe = useRecipe(id)
  const inventory = useInventory()
  const [stepStatus, setStepStatus] = useState<Record<string, boolean>>({})

  const diff = useMemo(() => {
    if (!recipe || !inventory) return undefined
    return ingredientDiff(recipe.ingredients, inventory)
  }, [recipe, inventory])

  const toggleStep = (stepId: string) =>
    setStepStatus((prev) => ({ ...prev, [stepId]: !prev[stepId] }))

  const handleGenerateShopping = async () => {
    if (!recipe || !diff) return
    const missingItems = diff.missing
    if (missingItems.length === 0) {
      window.alert('所有食材都已在库存中，无需采购。')
      return
    }
    await Promise.all(
      missingItems.map((item) =>
        shoppingRepository.create({
          name: item.name,
          quantity: item.need - item.current,
          unit: item.unit,
          isBought: false,
          sourceRecipeId: recipe.id,
        }),
      ),
    )
    window.alert('已将缺少的食材加入购物清单')
    navigate('/shopping')
  }

  const handleDelete = async () => {
    if (!recipe) return
    const confirmed = window.confirm(`确定要删除 ${recipe.title} 吗？`)
    if (!confirmed) return
    await recipeRepository.remove(recipe.id)
    window.alert('菜谱已删除')
    navigate('/recipes')
  }

  if (!recipe) {
    return (
      <div className="space-y-4 text-ios-muted">
        正在加载菜谱信息，如长时间未显示请返回列表。
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm text-ios-muted">菜谱详情</p>
        <h1 className="text-3xl font-semibold">{recipe.title}</h1>
        {recipe.description && (
          <p className="text-ios-muted">{recipe.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {recipe.tags.map((tag) => (
            <TagPill key={tag}>{tag}</TagPill>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-ios-muted">
          <span>{recipe.duration} 分钟</span>
          <span>·</span>
          <span>{recipe.difficulty}</span>
          <span>·</span>
          <span>{recipe.servings ?? 2} 人份</span>
        </div>
      </header>
      <div className="space-y-3">
        <Button fullWidth onClick={() => navigate(`/chat/${recipe.id}`)}>
          <Sparkles className="mr-2 h-4 w-4" />
          问机器人：这道菜还能怎么做？
        </Button>
        <Button variant="secondary" fullWidth onClick={handleGenerateShopping}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          生成购物清单
        </Button>
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">食材清单</h2>
          <span className="text-sm text-ios-muted">
            {recipe.ingredients.length} 项
          </span>
        </div>
        <div className="space-y-2 rounded-[20px] border border-ios-border bg-white p-4">
          {recipe.ingredients.map((ingredient) => {
            const missingItem = diff?.missing.find(
              (item) => item.name === ingredient.name,
            )
            return (
              <div
                key={ingredient.id}
                className="flex items-center justify-between rounded-[16px] px-3 py-2"
              >
                <div>
                  <p className="font-medium">{ingredient.name}</p>
                  {missingItem ? (
                    <p className="text-sm text-ios-danger">
                      缺 {missingItem.need - missingItem.current}
                      {missingItem.unit}
                    </p>
                  ) : (
                    <p className="text-sm text-ios-muted">库存充足</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-ios-text">
                  {ingredient.amount}
                  {ingredient.unit}
                </span>
              </div>
            )
          })}
        </div>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">步骤</h2>
          <span className="text-sm text-ios-muted">
            {recipe.steps.length} 步
          </span>
        </div>
        <div className="space-y-3">
          {recipe.steps.map((step, index) => {
            const checked = stepStatus[step.id]
            return (
              <button
                key={step.id}
                className="flex w-full items-start gap-3 rounded-[20px] border border-ios-border bg-white px-4 py-3 text-left"
                onClick={() => toggleStep(step.id)}
              >
                <span className="mt-0.5 rounded-full bg-ios-primaryMuted px-2 py-1 text-xs font-bold text-ios-primary">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{step.text}</p>
                  {step.tip && <p className="text-sm text-ios-muted">{step.tip}</p>}
                </div>
                <CheckCircle
                  className={`h-5 w-5 ${
                    checked ? 'text-ios-success' : 'text-ios-muted'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </section>
      {diff && diff.missing.length > 0 && (
        <section className="space-y-3 rounded-[24px] bg-ios-danger/5 p-4">
          <h2 className="text-lg font-semibold text-ios-danger">
            缺少的食材（{diff.missing.length}）
          </h2>
          <ul className="space-y-2 text-sm text-ios-text">
            {diff.missing.map((item) => (
              <li key={item.name} className="flex justify-between">
                <span>{item.name}</span>
                <span>
                  需 {item.need}
                  {item.unit}，现有 {item.current}
                  {item.unit}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link
        to={`/recipes/${recipe.id}/edit`}
        className="inline-flex w-full items-center justify-center rounded-full border border-ios-border bg-white py-3 font-semibold text-ios-text"
      >
        编辑菜谱
      </Link>
      <Button variant="danger" fullWidth onClick={handleDelete}>
        删除菜谱
      </Button>
    </div>
  )
}

