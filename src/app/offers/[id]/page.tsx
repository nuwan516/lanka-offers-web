import { Suspense } from 'react'
import { OfferDetailPage } from '@/views/offer-detail-page'
import { Skeleton } from '@/components/ui/skeleton'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      }
    >
      <OfferDetailPage params={resolvedParams} />
    </Suspense>
  )
}
