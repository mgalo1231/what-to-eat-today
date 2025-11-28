import clsx from 'clsx'

type SkeletonProps = {
  className?: string
}

export const Skeleton = ({ className }: SkeletonProps) => (
  <div
    className={clsx(
      'animate-pulse rounded-lg bg-gray-200',
      className
    )}
  />
)

export const RecipeCardSkeleton = () => (
  <div className="rounded-[24px] border border-ios-border bg-white p-4 shadow-soft">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-32" />
      </div>
      <Skeleton className="h-8 w-12 rounded-full" />
    </div>
    <Skeleton className="mt-3 h-4 w-full" />
    <div className="mt-3 flex gap-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  </div>
)

export const InventoryCardSkeleton = () => (
  <div className="rounded-[20px] border border-ios-border bg-white p-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-12 rounded-full" />
    </div>
  </div>
)

export const ListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <RecipeCardSkeleton key={i} />
    ))}
  </div>
)

