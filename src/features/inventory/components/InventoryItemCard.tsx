import { Edit3, Trash2, AlertTriangle } from 'lucide-react'
import type { InventoryItem } from '@/types/entities'
import { TagPill } from '@/components/ui/TagPill'
import { formatDate, daysUntil } from '@/lib/format'

type InventoryItemCardProps = {
  item: InventoryItem
  onEdit: (item: InventoryItem) => void
  onDelete: (item: InventoryItem) => void
}

export const InventoryItemCard = ({
  item,
  onEdit,
  onDelete,
}: InventoryItemCardProps) => {
  const days = daysUntil(item.expiryDate)
  const nearing = typeof days === 'number' && days <= 2 && days >= 0
  const expired = typeof days === 'number' && days < 0

  return (
    <div
      className={`card-press flex items-center gap-3 rounded-[20px] border bg-white p-3 shadow-soft transition-colors ${
        expired
          ? 'border-red-200 bg-red-50'
          : nearing
          ? 'border-amber-200 bg-amber-50'
          : 'border-ios-border'
      }`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <TagPill tone={expired ? 'warn' : nearing ? 'accent' : 'default'}>
            {item.location}
          </TagPill>
        </div>
        <p className="text-sm text-ios-muted">
          剩余 <span className="font-semibold text-ios-text">{item.quantity}</span> {item.unit}
        </p>
        <p
          className={`flex items-center gap-1 text-xs ${
            expired ? 'text-red-500' : nearing ? 'text-amber-600' : 'text-ios-muted'
          }`}
        >
          {(expired || nearing) && <AlertTriangle className="h-3 w-3" />}
          {item.expiryDate
            ? expired
              ? `已过期 ${Math.abs(days!)} 天`
              : nearing
              ? `还剩 ${days} 天过期`
              : `${formatDate(item.expiryDate)} 到期`
            : '常备食材'}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-press flex h-9 w-9 items-center justify-center rounded-full bg-ios-primary/10 text-ios-primary"
          onClick={() => onEdit(item)}
        >
          <Edit3 className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="btn-press flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-500"
          onClick={() => onDelete(item)}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
