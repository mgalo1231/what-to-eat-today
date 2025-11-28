import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'

import { useRecipe } from '@/db/hooks'
import { recipeRepository } from '@/db/repositories'
import { DEFAULT_TAGS } from '@/constants/tags'
import { createId } from '@/lib/createId'
import { TagPill } from '@/components/ui/TagPill'
import { Button } from '@/components/ui/Button'

type IngredientState = {
  id: string
  name: string
  amount: number
  unit: string
}

type StepState = {
  id: string
  text: string
  tip?: string
}

const difficultyOptions = ['容易', '中等', '挑战'] as const

export const RecipeEditorPage = () => {
  const params = useParams<{ id?: string }>()
  const recipeId = params.id
  const editing = Boolean(recipeId)
  const recipe = useRecipe(recipeId)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(20)
  const [difficulty, setDifficulty] =
    useState<(typeof difficultyOptions)[number]>('容易')
  const [servings, setServings] = useState(2)
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [ingredients, setIngredients] = useState<IngredientState[]>([
    { id: createId(), name: '', amount: 0, unit: '' },
  ])
  const [steps, setSteps] = useState<StepState[]>([
    { id: createId(), text: '' },
  ])

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title)
      setDescription(recipe.description ?? '')
      setDuration(recipe.duration)
      setDifficulty(recipe.difficulty)
      setServings(recipe.servings ?? 2)
      setTags(recipe.tags)
      setIngredients(recipe.ingredients)
      setSteps(recipe.steps)
    }
  }, [recipe])

  const handleIngredientChange = (
    id: string,
    key: keyof Omit<IngredientState, 'id'>,
    value: string,
  ) => {
    setIngredients((prev) =>
      prev.map((ingredient) =>
        ingredient.id === id
          ? {
              ...ingredient,
              [key]:
                key === 'amount' ? Number(value) || 0 : value,
            }
          : ingredient,
      ),
    )
  }

  const handleStepChange = (id: string, text: string) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === id ? { ...step, text } : step)),
    )
  }

  const addIngredient = () =>
    setIngredients((prev) => [
      ...prev,
      { id: createId(), name: '', amount: 0, unit: '' },
    ])

  const removeIngredient = (id: string) =>
    setIngredients((prev) => prev.filter((item) => item.id !== id))

  const addStep = () =>
    setSteps((prev) => [...prev, { id: createId(), text: '' }])

  const removeStep = (id: string) =>
    setSteps((prev) => prev.filter((step) => step.id !== id))

  const toggleTag = (tag: string) =>
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    )

  const addCustomTag = () => {
    if (!customTag.trim()) return
    setTags((prev) => Array.from(new Set([...prev, customTag.trim()])))
    setCustomTag('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) {
      window.alert('请填写菜名')
      return
    }
    if (ingredients.some((ingredient) => !ingredient.name.trim())) {
      window.alert('每个食材需要名称')
      return
    }
    if (steps.some((step) => !step.text.trim())) {
      window.alert('每个步骤需要描述')
      return
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      duration,
      difficulty,
      servings,
      tags,
      ingredients,
      steps,
    }

    if (editing && recipeId) {
      await recipeRepository.update(recipeId, payload)
      window.alert('菜谱已更新')
      navigate(-1)
    } else {
      const created = await recipeRepository.create(payload)
      window.alert('已新增菜谱')
      navigate(`/recipes/${created.id}`)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <header>
        <p className="text-sm text-ios-muted">
          {editing ? '编辑菜谱' : '新增菜谱'}
        </p>
        <h1 className="text-3xl font-semibold">
          {editing ? '整理这道菜' : '添加新菜'}
        </h1>
      </header>
      <section className="space-y-4 rounded-[24px] bg-white p-4 shadow-card">
        <div className="space-y-2">
          <label className="text-sm text-ios-muted">菜名</label>
          <input
            className="w-full rounded-2xl border border-ios-border bg-transparent px-4 py-3 text-base"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="比如：三杯杏鲍菇"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-ios-muted">简介</label>
          <textarea
            className="w-full rounded-2xl border border-ios-border bg-transparent px-4 py-3 text-base"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="写一句吸引人的描述"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-ios-muted">时间（分钟）</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-2xl border border-ios-border bg-transparent px-4 py-3"
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-ios-muted">份量</label>
            <input
              type="number"
              min={1}
              className="w-full rounded-2xl border border-ios-border bg-transparent px-4 py-3"
              value={servings}
              onChange={(event) => setServings(Number(event.target.value) || 1)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm text-ios-muted">难度</label>
          <div className="flex gap-2 rounded-2xl border border-ios-border p-1">
            {difficultyOptions.map((item) => {
              const active = difficulty === item
              return (
                <button
                  key={item}
                  type="button"
                  className={`flex-1 rounded-2xl py-2 font-semibold ${
                    active
                      ? 'bg-ios-primary text-white'
                      : 'text-ios-muted'
                  }`}
                  onClick={() => setDifficulty(item)}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-sm text-ios-muted">标签</label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_TAGS.map((tag) => {
              const active = tags.includes(tag)
              return (
                <TagPill
                  key={tag}
                  interactive
                  onClick={() => toggleTag(tag)}
                  className={
                    active ? 'bg-ios-primary text-white border-ios-primary' : ''
                  }
                >
                  {tag}
                </TagPill>
              )
            })}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-2xl border border-ios-border bg-transparent px-4 py-2"
              placeholder="自定义标签"
              value={customTag}
              onChange={(event) => setCustomTag(event.target.value)}
            />
            <Button type="button" size="sm" onClick={addCustomTag}>
              添加
            </Button>
          </div>
        </div>
      </section>
      <section className="space-y-4 rounded-[24px] bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ios-muted">材料</p>
            <h2 className="text-xl font-semibold">食材列表</h2>
          </div>
          <Button type="button" size="sm" onClick={addIngredient}>
            <Plus className="mr-1 h-4 w-4" />
            新增
          </Button>
        </div>
        <div className="space-y-3">
          {ingredients.map((ingredient) => (
            <div
              key={ingredient.id}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-2 rounded-2xl border border-ios-border p-3"
            >
              <input
                className="rounded-2xl border border-transparent bg-transparent px-3 py-2"
                placeholder="食材名称"
                value={ingredient.name}
                onChange={(event) =>
                  handleIngredientChange(ingredient.id, 'name', event.target.value)
                }
              />
              <input
                type="number"
                className="w-20 rounded-2xl border border-transparent bg-transparent px-3 py-2 text-right"
                placeholder="数量"
                value={ingredient.amount}
                onChange={(event) =>
                  handleIngredientChange(ingredient.id, 'amount', event.target.value)
                }
              />
              <input
                className="w-20 rounded-2xl border border-transparent bg-transparent px-3 py-2"
                placeholder="单位"
                value={ingredient.unit}
                onChange={(event) =>
                  handleIngredientChange(ingredient.id, 'unit', event.target.value)
                }
              />
              <button
                type="button"
                className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-ios-danger/10 text-ios-danger"
                onClick={() => removeIngredient(ingredient.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-4 rounded-[24px] bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ios-muted">步骤</p>
            <h2 className="text-xl font-semibold">烹饪流程</h2>
          </div>
          <Button type="button" size="sm" onClick={addStep}>
            <Plus className="mr-1 h-4 w-4" />
            新增
          </Button>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-start gap-3 rounded-2xl border border-ios-border p-3"
            >
              <span className="rounded-full bg-ios-primaryMuted px-2 py-1 text-xs font-bold text-ios-primary">
                {index + 1}
              </span>
              <textarea
                className="flex-1 rounded-2xl border border-transparent bg-transparent px-3 py-2"
                placeholder="描述这个步骤"
                value={step.text}
                onChange={(event) => handleStepChange(step.id, event.target.value)}
                rows={2}
              />
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ios-danger/10 text-ios-danger"
                onClick={() => removeStep(step.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
      <div className="flex flex-col gap-3">
        <Button type="submit" fullWidth>
          {editing ? '保存修改' : '创建菜谱'}
        </Button>
        <button
          type="button"
          className="rounded-full border border-ios-border bg-white py-3 font-semibold text-ios-text"
          onClick={() => navigate(-1)}
        >
          取消
        </button>
      </div>
    </form>
  )
}

