'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Search, ArrowLeft, ChevronRight, Store, X } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'

import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OfferCard } from '@/features/offers'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { BankBadge } from '@/components/shared/bank-badge'
import { useI18n } from '@/i18n'
import { useReferenceData } from '@/hooks/use-reference-data'
import { usePagedOffers } from '@/hooks/use-paged-offers'
import { LoadMore } from '@/components/shared/load-more'
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 motion-safe:animate-in motion-safe:fade-in lg:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('merchants.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
          {loading
            ? t('common.loading')
            : search
              ? t('merchants.filtered', { count: filtered.length, total: merchants.length })
              : t('merchants.subtitle', { count: merchants.length })}
        </p>
      </div>

      <div className="relative mb-6 max-w-md" role="search">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('merchants.searchPlaceholder')}
          aria-label={t('merchants.searchPlaceholder')}
          className="h-11 rounded-xl bg-card pr-10 pl-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t('search.clear')}
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : error ? (
        <ErrorState onRetry={() => window.location.reload()} />
      ) : filtered.length === 0 ? (

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
    <Link href={`/merchants/${encodeURIComponent(slug)}`} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="group flex h-full flex-col justify-between p-4 shadow-sm transition duration-200 hover:border-primary/40 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md">
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
              {t('merchants.activeOffers', { count: merchant.offer_count ?? 0 })}
            </span>
          )}
          {merchant.banks && merchant.banks.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {t('merchants.acrossBanks', { count: merchant.banks.length })}
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
  const router = useRouter()
  const decoded = decodeURIComponent(merchantSlug || '')

  const [merchantInfo, setMerchantInfo] = useState<Merchant | null>(null)

  // Fetch offers strictly filtered for this merchant from the backend
  const { offers, loading, error, refetch, total, hasMore, loadingMore, moreError, loadMore } = usePagedOffers({
    merchant: decoded,
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
    <div className="mx-auto max-w-6xl px-4 py-6 motion-safe:animate-in motion-safe:fade-in lg:py-8">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/merchants">
          <ArrowLeft className="size-4" />
          {t('nav.merchants')}
        </Link>
      </Button>

      {/* Merchant Header Hero */}
      <div className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
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
                    {t('merchants.alsoKnown', { names: merchantInfo.aliases.slice(0, 2).join(', ') })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-muted/40 px-3 py-1 text-xs font-medium">
              {loading ? t('common.loading') : t('merchants.activeOffers', { count: total })}
            </Badge>
          </div>
        </div>

        {/* Participating banks */}
        {merchantInfo?.banks && merchantInfo.banks.length > 0 && (
          <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{t('merchants.availableWith')}</span>
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
          actionLabel={t('merchants.browseAll')}
          onAction={() => router.push('/merchants')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {offers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
          <LoadMore
            shown={offers.length}
            total={total}
            hasMore={hasMore}
            loading={loadingMore}
            error={!!moreError}
            onLoadMore={loadMore}
          />
        </>
      )}
    </div>
  )
}
