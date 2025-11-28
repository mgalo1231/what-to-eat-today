import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ShoppingBasket, Check, Trash2 } from 'lucide-react'

import { useInventory, useRecipes, useShoppingList } from '@/db/hooks'
import {
  inventoryRepository,
  shoppingRepository,
} from '@/db/repositories'
import type { ShoppingListItem } from '@/types/entities'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'

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
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [formState, setFormState] = useState(defaultForm)

  const recipeMap = useMemo(() => {
    if (!recipes) return new Map<string, string>()
    return new Map(recipes.map((recipe) => [recipe.id, recipe.title]))
  }, [recipes])

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault()
    if (!formState.name.trim()) {
      showToast('请填写名称', 'error')
      return
    }
    await shoppingRepository.create({
      name: formState.name.trim(),
      quantity: formState.quantity,
      unit: formState.unit,
      isBought: false,
    })
    showToast(`${formState.name} 已添加到清单`, 'success')
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
      showToast(`${item.name} 已同步到库存 ✓`, 'success')
    }
  }

  const clearPurchased = async () => {
    if (!shoppingList?.some((item) => item.isBought)) {
      showToast('没有已购项目', 'info')
      return
    }
    const confirmed = await confirm({
      title: '清空已购商品',
      message: '库存数据已更新，确定清空已购商品吗？',
      confirmText: '清空',
      danger: true,
    })
    if (!confirmed) return
    await shoppingRepository.clearBought()
    showToast('已购商品已清空', 'success')
  }

  const pending = shoppingList?.filter((item) => !item.isBought) ?? []
  const completed = shoppingList?.filter((item) => item.isBought) ?? []

  // 加载状态
  if (!shoppingList) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header className="space-y-1">
          <p className="text-sm text-ios-muted">购物清单</p>
          <h1 className="text-3xl font-semibold">超市计划</h1>
        </header>
        <div className="space-y-3 rounded-[24px] bg-white p-4 shadow-card">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-14 w-full rounded-[18px]" />
          <Skeleton className="h-14 w-full rounded-[18px]" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
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
              className="card-press flex items-center gap-3 rounded-[18px] border border-ios-border px-3 py-2 cursor-pointer"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                  item.isBought
                    ? 'border-ios-primary bg-ios-primary'
                    : 'border-ios-muted'
                }`}
                onClick={(e) => {
                  e.preventDefault()
                  toggleItem(item)
                }}
              >
                {item.isBought && <Check className="h-4 w-4 text-white" />}
              </div>
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
              <ShoppingBasket className="mx-auto mb-2 h-8 w-8 text-ios-muted/50" />
              清单为空，去菜谱页面生成或手动添加
            </div>
          )}
        </div>
      </section>
      {completed.length > 0 && (
        <section className="space-y-2 rounded-[24px] bg-green-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-green-600">
              <Check className="h-5 w-5" />
              已完成（{completed.length}）
            </h2>
            <button
              className="btn-press flex items-center gap-1 text-sm font-semibold text-red-500"
              onClick={clearPurchased}
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
          </div>
          <div className="space-y-2">
            {completed.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 rounded-[18px] border border-transparent bg-white/70 px-3 py-2 text-sm text-ios-muted line-through cursor-pointer"
                onClick={() => toggleItem(item)}
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-3 w-3 text-white" />
                </div>
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
            className="w-full rounded-2xl border border-ios-border px-4 py-3 focus:border-ios-primary focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
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
              className="rounded-2xl border border-ios-border px-4 py-3 focus:border-ios-primary focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
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
              className="rounded-2xl border border-ios-border px-4 py-3 focus:border-ios-primary focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
              value={formState.unit}
              onChange={(event) =>
                setFormState({ ...formState, unit: event.target.value })
              }
              placeholder="单位"
            />
          </div>
          <Button type="submit" fullWidth className="btn-press">
            <ShoppingBasket className="mr-2 h-4 w-4" />
            添加到清单
          </Button>
        </form>
      </section>
    </div>
  )
}
