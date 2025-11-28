import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ShoppingBasket } from 'lucide-react'

import { useInventory, useRecipes, useShoppingList } from '@/db/hooks'
import {
  inventoryRepository,
  shoppingRepository,
} from '@/db/repositories'
import type { ShoppingListItem } from '@/types/entities'
import { Button } from '@/components/ui/Button'

type ShoppingFormState = {
  name: string
  quantity: number
  unit: string
}

const defaultForm: ShoppingFormState = {
  name: '',
  quantity: 1,
  unit: '份',
}

export const ShoppingListPage = () => {
  const shoppingList = useShoppingList()
  const inventory = useInventory()
  const recipes = useRecipes()
  const [formState, setFormState] = useState(defaultForm)

  const recipeMap = useMemo(() => {
    if (!recipes) return new Map<string, string>()
    return new Map(recipes.map((recipe) => [recipe.id, recipe.title]))
  }, [recipes])

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault()
    if (!formState.name.trim()) {
      window.alert('请填写名称')
      return
    }
    await shoppingRepository.create({
      name: formState.name.trim(),
      quantity: formState.quantity,
      unit: formState.unit,
      isBought: false,
    })
    setFormState({ ...defaultForm })
  }

  const restockInventory = async (item: ShoppingListItem) => {
    if (!inventory) return
    const existing = inventory.find(
      (inventoryItem) => inventoryItem.name === item.name,
    )
    if (existing) {
      await inventoryRepository.update(existing.id, {
        quantity: existing.quantity + item.quantity,
      })
    } else {
      await inventoryRepository.create({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        location: '常温',
      })
    }
  }

  const toggleItem = async (item: ShoppingListItem) => {
    const nextState = !item.isBought
    await shoppingRepository.update(item.id, { isBought: nextState })
    if (nextState) {
      await restockInventory(item)
    }
  }

  const clearPurchased = async () => {
    if (!shoppingList?.some((item) => item.isBought)) {
      window.alert('没有已购项目')
      return
    }
    if (!window.confirm('清空已购商品？库存数据已更新，无需重复。')) return
    await shoppingRepository.clearBought()
  }

  const pending = shoppingList?.filter((item) => !item.isBought) ?? []
  const completed = shoppingList?.filter((item) => item.isBought) ?? []

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm text-ios-muted">购物清单</p>
        <h1 className="text-3xl font-semibold">超市计划</h1>
        <p className="text-ios-muted">
          完成后勾选即可同步到库存，避免重复购买。
        </p>
      </header>
      <section className="space-y-3 rounded-[24px] bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold">马上要买</h2>
        <div className="space-y-2">
          {pending.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 rounded-[18px] border border-ios-border px-3 py-2"
            >
              <input
                type="checkbox"
                className="h-5 w-5 rounded-full border-ios-border accent-ios-primary"
                checked={item.isBought}
                onChange={() => toggleItem(item)}
              />
              <div className="flex-1">
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-ios-muted">
                  {item.quantity}
                  {item.unit}
                  {item.sourceRecipeId &&
                    ` · 来自 ${recipeMap.get(item.sourceRecipeId) ?? '菜谱'}`}
                </p>
              </div>
            </label>
          ))}
          {pending.length === 0 && (
            <div className="rounded-[18px] border border-dashed border-ios-border px-3 py-8 text-center text-ios-muted">
              清单为空，去菜谱页面生成或手动添加。
            </div>
          )}
        </div>
      </section>
      {completed.length > 0 && (
        <section className="space-y-2 rounded-[24px] bg-ios-primaryMuted/40 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ios-primary">
              已完成（{completed.length}）
            </h2>
            <button
              className="text-sm font-semibold text-ios-primary underline"
              onClick={clearPurchased}
            >
              清空
            </button>
          </div>
          <div className="space-y-2">
            {completed.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 rounded-[18px] border border-transparent bg-white/70 px-3 py-2 text-sm text-ios-muted line-through"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded-full accent-ios-primary"
                  checked={item.isBought}
                  onChange={() => toggleItem(item)}
                />
                <span>
                  {item.name} · {item.quantity}
                  {item.unit}
                </span>
              </label>
            ))}
          </div>
        </section>
      )}
      <section className="space-y-3 rounded-[24px] bg-white p-4 shadow-card">
        <h2 className="text-lg font-semibold">手动添加</h2>
        <form className="space-y-3" onSubmit={handleAdd}>
          <input
            className="w-full rounded-2xl border border-ios-border px-4 py-3"
            placeholder="食材 / 商品名称"
            value={formState.name}
            onChange={(event) =>
              setFormState({ ...formState, name: event.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              min={1}
              className="rounded-2xl border border-ios-border px-4 py-3"
              value={formState.quantity}
              onChange={(event) =>
                setFormState({
                  ...formState,
                  quantity: Number(event.target.value) || 1,
                })
              }
              placeholder="数量"
            />
            <input
              className="rounded-2xl border border-ios-border px-4 py-3"
              value={formState.unit}
              onChange={(event) =>
                setFormState({ ...formState, unit: event.target.value })
              }
              placeholder="单位"
            />
          </div>
          <Button type="submit" fullWidth>
            <ShoppingBasket className="mr-2 h-4 w-4" />
            添加到清单
          </Button>
        </form>
      </section>
    </div>
  )
}

