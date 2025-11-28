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
  const nearing = typeof days === 'number' && days <= 2
  const expired = typeof days === 'number' && days < 0

  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-ios-border bg-white p-3 shadow-soft">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <TagPill tone={nearing ? 'warn' : 'default'}>{item.location}</TagPill>
        </div>
        <p className="text-sm text-ios-muted">剩余 {item.quantity}{item.unit}</p>
        <p
          className={`text-xs ${
            expired ? 'text-ios-danger' : nearing ? 'text-ios-primary' : 'text-ios-muted'
          }`}
        >
          {item.expiryDate
            ? `保质期：${formatDate(item.expiryDate)}（${days ?? '未知'} 天）`
            : '常备食材'}
        </p>
      </div>
      <div className="flex flex-col gap-2 text-sm">
        <button
          type="button"
          className="rounded-full bg-ios-primary/10 px-3 py-1 text-ios-primary"
          onClick={() => onEdit(item)}
        >
          编辑
        </button>
        <button
          type="button"
          className="rounded-full bg-ios-danger/10 px-3 py-1 text-ios-danger"
          onClick={() => onDelete(item)}
        >
          删除
        </button>
      </div>
    </div>
  )
}

