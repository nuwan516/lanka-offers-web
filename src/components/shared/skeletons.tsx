'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

export function OfferCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card" aria-hidden="true">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-auto flex gap-3 border-t pt-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

export function OfferGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  const { t } = useI18n()
  return (
    <div
      role="status"
      aria-busy="true"
      className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}
    >
      <span className="sr-only">{t('common.loading')}</span>
      {Array.from({ length: count }).map((_, i) => (
        <OfferCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function OfferListSkeleton({ count = 4 }: { count?: number }) {
  const { t } = useI18n()
  return (
    <div role="status" aria-busy="true" className="space-y-3">
      <span className="sr-only">{t('common.loading')}</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border bg-card p-4" aria-hidden="true">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  )
}
