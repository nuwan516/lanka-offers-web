'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Search, ArrowLeft, ChevronRight, Store } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OfferCard } from '@/components/shared/offer-card'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { useI18n } from '@/i18n'
import { useReferenceData } from '@/hooks/use-reference-data'
import { useOffers } from '@/hooks/use-offers'
import { getMerchantName } from '@/lib/offers'
import type { Merchant } from '@/types'

export function MerchantsPage() {
  const { t } = useI18n()
  const [search, setSearch] = useState('')

  const { merchants, loading, error } = useReferenceData()

  const filtered = useMemo(() => {
    if (!search) return merchants
    const q = search.toLowerCase()
    return merchants.filter((m) =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.canonical_merchant || '').toLowerCase().includes(q)
    )
  }, [merchants, search])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold tracking-tight">{t('merchants.title')}</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted/50" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold tracking-tight">{t('merchants.title')}</h1>
        <ErrorState onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-xl font-bold tracking-tight">{t('merchants.title')}</h1>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('merchants.searchPlaceholder')}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={t('merchants.noResults')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((m) => (
            <MerchantCard key={m.canonical_merchant || m.name} merchant={m} />
          ))}
        </div>
      )}
    </div>
  )
}

function MerchantCard({ merchant }: { merchant: Merchant }) {
  const { t } = useI18n()
  const slug = merchant.canonical_merchant || merchant.name

  return (
    <Link href={`/merchants/${encodeURIComponent(slug)}`}>
      <Card className="group flex items-center gap-3 p-4 transition-shadow hover:shadow-md">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Store className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{merchant.name}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {merchant.offer_count != null && (
              <span>{t('merchants.activeOffers', { count: merchant.offer_count })}</span>
            )}
            {merchant.bank_count != null && (
              <span>{t('merchants.acrossBanks', { count: merchant.bank_count })}</span>
            )}
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  )
}

export function MerchantDetailPage({ params }: { params?: { merchant?: string } }) {
  const routerParams = useParams<{ merchant?: string }>()
  const merchant = params?.merchant ?? routerParams?.merchant
  const { t } = useI18n()
  const decoded = decodeURIComponent(merchant || '')

  const { offers, loading, error, refetch } = useOffers({ status: 'active', limit: 200 })

  const merchantOffers = useMemo(() => {
    return offers.filter((o) => {
      const name = getMerchantName(o).toLowerCase()
      const canonical = (o.canonical_merchant || '').toLowerCase()
      const target = decoded.toLowerCase()
      return name === target || canonical === target ||
        name.includes(target) || target.includes(name) ||
        canonical.includes(target) || target.includes(canonical)
    })
  }, [offers, decoded])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/merchants">
          <ArrowLeft className="size-4" />
          {t('nav.merchants')}
        </Link>
      </Button>

      <h1 className="mb-6 text-xl font-bold tracking-tight">
        {t('merchants.offersFor', { merchant: decoded })}
      </h1>

      {loading ? (
        <OfferGridSkeleton />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : merchantOffers.length === 0 ? (
        <EmptyState title={t('search.noResults')} hint={t('search.noResultsHint')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {merchantOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  )
}
