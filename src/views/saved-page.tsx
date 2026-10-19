'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { OfferCard } from '@/components/shared/offer-card'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { useI18n } from '@/i18n'
import { useSavedOffers } from '@/hooks/use-saved-offers'
import { fetchOffersByIds } from '@/services/api/offers'
import { isExpired } from '@/lib/offers'
import type { Offer } from '@/types'

export function SavedPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { savedIds } = useSavedOffers()
  const [savedOffers, setSavedOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [nonce, setNonce] = useState(0)
  const refetch = () => setNonce((n) => n + 1)
  const idsKey = savedIds.join(',')

  // Fetch only the saved offers by id; the whole catalogue is not loaded to find them.
  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : []
    if (ids.length === 0) {
      setSavedOffers([])
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetchOffersByIds(ids, controller.signal)
      .then((offers) => {
        setSavedOffers(offers.filter((o) => !isExpired(o.valid_to)))
        setLoading(false)
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return
        setError(err)
        setLoading(false)
      })
    return () => controller.abort()
  }, [idsKey, nonce])

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold tracking-tight">{t('saved.title')}</h1>
        <OfferGridSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold tracking-tight">{t('saved.title')}</h1>
        <ErrorState onRetry={refetch} />
      </div>
    )
  }

  if (savedOffers.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold tracking-tight">{t('saved.title')}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {savedOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  )
}
