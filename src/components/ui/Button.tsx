import type { ComponentPropsWithoutRef } from 'react'
import clsx from 'clsx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'md' | 'sm'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-ios-primary text-white shadow-soft active:opacity-90 transition-all',
  secondary:
    'bg-white text-ios-primary border border-ios-border shadow-inset active:bg-ios-primaryMuted/60',
  ghost: 'bg-transparent text-ios-text active:bg-black/5',
  danger: 'bg-ios-danger text-white shadow-soft active:opacity-90',
}

const sizeStyles: Record<ButtonSize, string> = {
  md: 'h-12 px-5 text-base',
  sm: 'h-9 px-3 text-sm',
}

export const Button = ({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth,
  ...rest
}: ButtonProps) => (
  <button
    className={clsx(
      'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-150',
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && 'w-full',
      rest.disabled && 'opacity-60 cursor-not-allowed',
      className,
    )}
    {...rest}
  />
)
