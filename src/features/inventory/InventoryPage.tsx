import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Loader2 } from 'lucide-react'

import { useInventory } from '@/db/hooks'
import { inventoryRepository } from '@/db/repositories'
import type { InventoryItem, StorageLocation } from '@/types/entities'
import { InventoryItemCard } from './components/InventoryItemCard'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { InventoryCardSkeleton } from '@/components/ui/Skeleton'

type InventoryFormState = {
  id?: string
  name: string
  quantity: number
  unit: string
  location: StorageLocation
  expiryDate?: string
}

const defaultForm: InventoryFormState = {
  name: '',
  quantity: 1,
  unit: '份',
  location: '冷藏',
}

const locations: StorageLocation[] = ['常温', '冷藏', '冷冻']

export const InventoryPage = () => {
  const inventory = useInventory()
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [formState, setFormState] = useState<InventoryFormState | null>(null)
  const [saving, setSaving] = useState(false)

  const grouped = useMemo(() => {
    if (!inventory) return []
    const map: Record<StorageLocation, InventoryItem[]> = {
      常温: [],
      冷藏: [],
      冷冻: [],
    }
    inventory.forEach((item) => {
      map[item.location].push(item)
    })
    return Object.entries(map).map(([location, items]) => ({
      location: location as StorageLocation,
      items: items.sort((a, b) =>
        (a.expiryDate ?? '').localeCompare(b.expiryDate ?? ''),
      ),
    }))
  }, [inventory])

  const openForm = (item?: InventoryItem) => {
    setFormState(
      item
        ? {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            location: item.location,
            expiryDate: item.expiryDate,
          }
        : { ...defaultForm },
    )
  }

  const closeForm = () => setFormState(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!formState) return
    if (!formState.name.trim()) {
      showToast('请填写食材名称', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: formState.name.trim(),
        quantity: formState.quantity,
        unit: formState.unit,
        location: formState.location,
        expiryDate: formState.expiryDate || undefined,
      }
      if (formState.id) {
        await inventoryRepository.update(formState.id, payload)
        showToast('库存已更新', 'success')
      } else {
        await inventoryRepository.create(payload)
        showToast(`${payload.name} 已添加到库存`, 'success')
      }
      closeForm()
    } catch {
      showToast('操作失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item: InventoryItem) => {
    const confirmed = await confirm({
      title: '删除食材',
      message: `确定要从库存中删除「${item.name}」吗？`,
      confirmText: '删除',
      danger: true,
    })
    if (!confirmed) return
    try {
      await inventoryRepository.remove(item.id)
      showToast(`${item.name} 已从库存中移除`, 'success')
    } catch {
      showToast('删除失败，请重试', 'error')
    }
  }

  // 加载状态
  if (!inventory) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-ios-muted">家庭库存</p>
            <h1 className="text-3xl font-semibold">冰箱 & 储藏室</h1>
          </div>
        </header>
        <div className="space-y-3">
          <InventoryCardSkeleton />
          <InventoryCardSkeleton />
          <InventoryCardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ios-muted">家庭库存</p>
          <h1 className="text-3xl font-semibold">冰箱 & 储藏室</h1>
        </div>
        <button
          className="btn-press inline-flex h-10 items-center gap-1 rounded-full bg-ios-primary px-4 text-sm font-semibold text-white shadow-soft"
          onClick={() => openForm()}
        >
          <Plus className="h-4 w-4" />
          新增
        </button>
      </header>
      <div className="space-y-6">
        {grouped.map(({ location, items }) => (
          <section key={location} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{location}</h2>
              <span className="text-sm text-ios-muted">{items.length} 项</span>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <InventoryItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => openForm(item)}
                  onDelete={() => handleDelete(item)}
                />
              ))}
              {items.length === 0 && (
                <div className="rounded-[20px] border border-dashed border-ios-border p-4 text-center text-ios-muted">
                  暂无这类食材
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* 表单弹窗 */}
      {formState && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/30 backdrop-blur-sm px-4 pb-4">
          <div
            className="absolute inset-0"
            onClick={closeForm}
          />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-md space-y-4 rounded-[32px] bg-white p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-slide-up"
          >
            <h3 className="text-xl font-semibold">
              {formState.id ? '编辑库存' : '新增食材'}
            </h3>
            <div className="space-y-2">
              <label className="text-sm text-ios-muted">名称</label>
              <input
                className="w-full rounded-2xl border border-ios-border px-4 py-3 focus:border-ios-primary focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
                value={formState.name}
                placeholder="如：鸡蛋、牛奶、西红柿"
                autoFocus
                onChange={(event) =>
                  setFormState({ ...formState, name: event.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm text-ios-muted">数量</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-2xl border border-ios-border px-4 py-3 focus:border-ios-primary focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
                  value={formState.quantity}
                  onChange={(event) =>
                    setFormState({
                      ...formState,
                      quantity: Number(event.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-ios-muted">单位</label>
                <input
                  className="w-full rounded-2xl border border-ios-border px-4 py-3 focus:border-ios-primary focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
                  value={formState.unit}
                  placeholder="个、g、ml"
                  onChange={(event) =>
                    setFormState({ ...formState, unit: event.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-ios-muted">存放位置</label>
              <div className="flex gap-2 rounded-2xl border border-ios-border p-1">
                {locations.map((location) => {
                  const active = formState.location === location
                  return (
                    <button
                      key={location}
                      type="button"
                      className={`flex-1 rounded-2xl py-2 font-semibold transition-colors ${
                        active
                          ? 'bg-ios-primary text-white'
                          : 'text-ios-muted hover:bg-gray-50'
                      }`}
                      onClick={() =>
                        setFormState({ ...formState, location })
                      }
                    >
                      {location}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-ios-muted">保质期（可选）</label>
              <input
                type="date"
                className="w-full rounded-2xl border border-ios-border px-4 py-3 focus:border-ios-primary focus:outline-none focus:ring-2 focus:ring-ios-primary/20"
                value={formState.expiryDate?.slice(0, 10) ?? ''}
                onChange={(event) =>
                  setFormState({
                    ...formState,
                    expiryDate: event.target.value
                      ? new Date(event.target.value).toISOString()
                      : undefined,
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-3">
              <Button type="submit" fullWidth disabled={saving} className="btn-press">
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存'
                )}
              </Button>
              <button
                type="button"
                className="btn-press rounded-full border border-ios-border py-3 font-semibold text-ios-text"
                onClick={closeForm}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
