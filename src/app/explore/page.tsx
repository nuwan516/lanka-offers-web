import { Suspense } from 'react'
import { ExplorePage } from '@/views/explore-page'
import { OfferGridSkeleton } from '@/components/shared/skeletons'

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-6">
          <OfferGridSkeleton count={9} />
        </div>
      }
    >
      <ExplorePage />
    </Suspense>
  )
}
