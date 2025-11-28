import type { ReactNode } from 'react'

type SectionHeaderProps = {
  title: string
  subtitle?: string
  action?: ReactNode
}

export const SectionHeader = ({ title, subtitle, action }: SectionHeaderProps) => (
  <div className="mb-2 flex items-center">
    <div className="flex-1">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ios-muted">
        {title}
      </p>
      {subtitle && <p className="mt-1 text-base text-ios-text">{subtitle}</p>}
    </div>
    {action}
  </div>
)

