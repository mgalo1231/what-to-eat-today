import { DEFAULT_TAGS } from '@/constants/tags'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { TagPill } from '@/components/ui/TagPill'

export type DurationValue = 'all' | '15' | '30' | '45'

const durationOptions = [
  { label: '不限', value: 'all' as const },
  { label: '15"', value: '15' as const },
  { label: '30"', value: '30' as const },
  { label: '45"', value: '45' as const },
]

type RecipeFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  selectedTags: string[]
  onToggleTag: (tag: string) => void
  duration: DurationValue
  onDurationChange: (value: DurationValue) => void
}

export const RecipeFilters = ({
  search,
  onSearchChange,
  selectedTags,
  onToggleTag,
  duration,
  onDurationChange,
}: RecipeFiltersProps) => (
  <div className="space-y-4">
    <div className="flex items-center rounded-pill border border-ios-border bg-white px-4 py-2 text-sm shadow-inset">
      <input
        className="w-full border-none bg-transparent outline-none"
        placeholder="搜索菜名 / 标签 / 食材"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
    </div>
    <SegmentedControl
      options={durationOptions}
      value={duration}
      onChange={onDurationChange}
    />
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-ios-muted">
        标签快捷筛选
      </p>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_TAGS.map((tag) => {
          const active = selectedTags.includes(tag)
          return (
            <TagPill
              key={tag}
              interactive
              onClick={() => onToggleTag(tag)}
              className={active ? 'bg-ios-primary text-white border-ios-primary' : ''}
            >
              {tag}
            </TagPill>
          )
        })}
      </div>
    </div>
  </div>
)

