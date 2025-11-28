import type { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx'

const colors = {
  default: 'bg-white text-ios-text border border-ios-border',
  positive: 'bg-ios-success/10 text-ios-success',
  warn: 'bg-ios-danger/10 text-ios-danger',
  accent: 'bg-ios-primaryMuted text-ios-primary',
}

type TagPillProps = ComponentPropsWithoutRef<'span'> & {
  tone?: keyof typeof colors
  interactive?: boolean
}

export const TagPill = ({
  className,
  tone = 'default',
  interactive,
  ...rest
}: TagPillProps) => {
  const TagElement = interactive ? 'button' : 'span'
  return (
    <TagElement
      className={clsx(
        'inline-flex items-center gap-1 rounded-pill px-3 py-1 text-sm font-medium',
        colors[tone],
        interactive && 'active:scale-95 transition-transform',
        className,
      )}
      {...rest}
    />
  )
}

