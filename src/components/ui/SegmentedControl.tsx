import clsx from 'clsx'

type Option<T extends string> = {
  label: string
  value: T
}

type SegmentedControlProps<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) => (
  <div className="flex rounded-pill bg-ios-surface p-1 shadow-inset">
    {options.map((option) => {
      const selected = option.value === value
      return (
        <button
          key={option.value}
          className={clsx(
            'flex-1 rounded-pill py-2 text-sm font-semibold transition-all',
            selected
              ? 'bg-white text-ios-primary shadow-soft'
              : 'text-ios-muted active:bg-white/60',
          )}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      )
    })}
  </div>
)

