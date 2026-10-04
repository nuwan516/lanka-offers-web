'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'

import { OfferCard } from '@/components/shared/offer-card'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { useI18n } from '@/i18n'
import { useSavedOffers } from '@/hooks/use-saved-offers'
import { useOffers } from '@/hooks/use-offers'

export function SavedPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { savedIds } = useSavedOffers()
  const { offers, loading, error, refetch } = useOffers({ status: 'active', limit: 200 })

  const savedOffers = useMemo(() => {
    return offers.filter((o) => savedIds.includes(o.id))
  }, [offers, savedIds])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold tracking-tight">{t('saved.title')}</h1>
        <OfferGridSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold tracking-tight">{t('saved.title')}</h1>
        <ErrorState onRetry={refetch} />
      </div>
    )
  }

  if (savedOffers.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold tracking-tight">{t('saved.title')}</h1>
        <EmptyState
          title={t('saved.empty')}
          hint={t('saved.emptyHint')}
          actionLabel={t('saved.explore')}
          onAction={() => router.push('/explore')}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold tracking-tight">{t('saved.title')}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {savedOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  )
}
