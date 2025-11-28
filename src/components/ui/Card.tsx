import type { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx'

type CardProps = ComponentPropsWithoutRef<'div'> & {
  padding?: 'md' | 'lg' | 'none'
}

const paddingStyles = {
  none: '',
  md: 'p-4',
  lg: 'p-6',
}

export const Card = ({ className, padding = 'md', ...rest }: CardProps) => (
  <div
    className={clsx(
      'rounded-[24px] bg-ios-surface shadow-card',
      paddingStyles[padding],
      className,
    )}
    {...rest}
  />
)

