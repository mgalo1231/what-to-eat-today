import type { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx'

type IconButtonProps = ComponentPropsWithoutRef<'button'> & {
  active?: boolean
}

export const IconButton = ({
  className,
  active,
  ...rest
}: IconButtonProps) => (
  <button
    className={clsx(
      'h-10 w-10 rounded-full border border-ios-border bg-white text-ios-text shadow-soft transition-all active:scale-95',
      active && 'border-ios-primary text-ios-primary',
      rest.disabled && 'opacity-40 cursor-not-allowed',
      className,
    )}
    {...rest}
  />
)

