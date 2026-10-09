'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Search, ArrowLeft, ChevronRight, Store } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'

import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OfferCard } from '@/components/shared/offer-card'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { BankBadge } from '@/components/shared/bank-badge'
import { useI18n } from '@/i18n'
import { useReferenceData } from '@/hooks/use-reference-data'
import { useOffers } from '@/hooks/use-offers'
import { fetchMerchant } from '@/services/api/merchants'
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
      (m.canonical_merchant || '').toLowerCase().includes(q) ||
      (m.category || '').toLowerCase().includes(q) ||
      (m.aliases || []).some((a) => a.toLowerCase().includes(q))
    )
  }, [merchants, search])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-6 text-xl font-bold tracking-tight">{t('merchants.title')}</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted/50" />
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
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('merchants.title')}</h1>
          <p className="text-sm text-muted-foreground">
            Explore {merchants.length} partner merchants offering exclusive discounts across Sri Lanka
          </p>
        </div>
      </div>

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
      <Card className="group flex flex-col justify-between p-4 h-full transition-all duration-200 hover:shadow-md hover:border-primary/40">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Store className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
              {merchant.name}
            </p>
            {merchant.category && (
              <Badge variant="secondary" className="mt-1 text-[10px] font-normal">
                {merchant.category}
              </Badge>
            )}
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>

        <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          {merchant.offer_count != null && (
            <span className="font-medium text-foreground">
              {merchant.offer_count} {merchant.offer_count === 1 ? 'promotion' : 'promotions'}
            </span>
          )}
          {merchant.banks && merchant.banks.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              Across {merchant.banks.length} {merchant.banks.length === 1 ? 'bank' : 'banks'}
            </span>
          )}
        </div>
      </Card>
    </Link>
  )
}

export function MerchantDetailPage({ params }: { params?: { merchant?: string } }) {
  const routerParams = useParams<{ merchant?: string }>()
  const merchantSlug = params?.merchant ?? routerParams?.merchant
  const { t } = useI18n()
  const decoded = decodeURIComponent(merchantSlug || '')

  const [merchantInfo, setMerchantInfo] = useState<Merchant | null>(null)

  // Fetch offers strictly filtered for this merchant from the backend
  const { offers, loading, error, refetch } = useOffers({
    merchant: decoded,
    status: 'active',
    limit: 100,
  })

  useEffect(() => {
    if (!decoded) return
    let cancelled = false
    fetchMerchant(decoded).then((data) => {
      if (!cancelled && data) {
        setMerchantInfo(data)
      }
    })
    return () => {
      cancelled = true
    }
  }, [decoded])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/merchants">
          <ArrowLeft className="size-4" />
          {t('nav.merchants')}
        </Link>
      </Button>

      {/* Merchant Header Hero */}
      <div className="mb-8 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Store className="size-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {merchantInfo?.name || decoded}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {merchantInfo?.category && (
                  <Badge variant="secondary" className="text-xs">
                    {merchantInfo.category}
                  </Badge>
                )}
                {merchantInfo?.aliases && merchantInfo.aliases.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Also known as: {merchantInfo.aliases.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs px-3 py-1 font-medium bg-muted/40">
              {offers.length} {offers.length === 1 ? 'Active Offer' : 'Active Offers'}
            </Badge>
          </div>
        </div>

        {/* Participating banks */}
        {merchantInfo?.banks && merchantInfo.banks.length > 0 && (
          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Available with cards from:</span>
            {merchantInfo.banks.map((b) => (
              <BankBadge key={b} bankName={b} />
            ))}
          </div>
        )}
      </div>

      <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
        {t('merchants.offersFor', { merchant: merchantInfo?.name || decoded })}
      </h2>

      {loading ? (
        <OfferGridSkeleton count={6} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : offers.length === 0 ? (
        <EmptyState
          title={t('search.noResults')}
          hint={t('search.noResultsHint')}
          actionLabel="Browse all merchants"
          onAction={() => window.location.href = '/merchants'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  )
}
