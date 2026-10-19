import { Skeleton } from '@/components/ui/skeleton'

export function OfferCardSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border bg-card p-4" aria-hidden="true">
      <Skeleton className="h-5 w-28" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <Skeleton className="mt-2 h-7 w-32" />
      <div className="flex gap-3 border-t pt-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="ml-auto h-4 w-24" />
      </div>
    </div>
  )
}

export function OfferGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <span className="sr-only">Loading</span>
      {Array.from({ length: count }).map((_, i) => (
        <OfferCardSkeleton key={i} />
      ))}
    </div>
  )
}
