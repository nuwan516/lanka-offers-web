'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, MapPin, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OfferCard } from '@/components/shared/offer-card'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { useI18n } from '@/i18n'
import { useOffers } from '@/hooks/use-offers'
import { useReferenceData } from '@/hooks/use-reference-data'
import { BANKS } from '@/lib/banks'
import { deriveCategories, isEndingSoon, isExpired, sortOffers } from '@/lib/offers'
import { cn } from '@/lib/utils'

export function HomePage() {
  const { t } = useI18n()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { offers, loading, error, refetch } = useOffers()
  const { banks } = useReferenceData()

  const live = useMemo(() => offers.filter((o) => !isExpired(o.valid_to)), [offers])
  const topDiscounts = useMemo(() => sortOffers(live, 'discount').slice(0, 8), [live])
  const endingSoon = useMemo(
    () => sortOffers(live.filter((o) => isEndingSoon(o.valid_to)), 'endingSoon').slice(0, 4),
    [live]
  )
  const categories = useMemo(() => deriveCategories(live).filter((c) => c.toLowerCase() !== 'all').slice(0, 10), [live])

  // The ten supported banks, with live counts from the API where available.
  const bankRows = useMemo(() => {
    const counts = new Map(banks.map((b) => [(b.code ?? b.name).toLowerCase(), b.activeOfferCount]))
    return BANKS.map((b) => ({ ...b, count: counts.get(b.code) }))
  }, [banks])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    if (q) router.push(`/explore?search=${encodeURIComponent(q)}`)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 lg:py-12">
      <section aria-labelledby="home-heading" className="space-y-5">
        <div className="max-w-2xl space-y-2">
          <h1 id="home-heading" className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {t('app.tagline')}
          </h1>
          <p className="text-base text-muted-foreground">{t('app.description')}</p>
        </div>

        <form onSubmit={handleSearch} role="search" className="flex max-w-2xl gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search.placeholder')}
              className="h-12 pl-10 text-base"
              aria-label={t('search.placeholder')}
            />
          </div>
          <Button type="submit" className="h-12 px-6">
            {t('search.button')}
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/nearby">
              <MapPin className="size-4" aria-hidden="true" />
              {t('home.nearbyCta')}
            </Link>
          </Button>
          {categories.slice(0, 6).map((c) => (
            <Link
              key={c}
              href={`/explore?category=${encodeURIComponent(c)}`}
              className="rounded-full border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="banks-heading" className="space-y-4">
        <h2 id="banks-heading" className="text-lg font-semibold tracking-tight">
          {t('bank.title')}
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {bankRows.map((b) => {
            const hasOffers = b.count === undefined || b.count > 0
            const body = (
              <>
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-6 min-w-9 items-center justify-center rounded-sm bg-primary-soft px-1 text-[11px] font-semibold text-primary"
                  >
                    {b.short}
                  </span>
                </span>
                <span className="mt-2 block text-sm font-medium leading-snug text-foreground">{b.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {b.count === undefined
                    ? ' '
                    : b.count > 0
                      ? t('bank.activeOffers', { count: b.count })
                      : t('bank.noActive')}
                </span>
              </>
            )
            return (
              <li key={b.code}>
                {hasOffers ? (
                  <Link
                    href={`/explore?bank=${b.code}`}
                    className="block h-full rounded-lg border bg-card p-3 transition-colors hover:border-primary/40"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={cn('h-full rounded-lg border border-dashed bg-surface p-3')}>{body}</div>
                )}
              </li>
            )
          })}
        </ul>
      </section>

      <OfferSection
        title={t('offer.featured')}
        offers={topDiscounts}
        loading={loading}
        error={error}
        onRetry={refetch}
        emptyTitle={t('search.noResults')}
        emptyHint={t('search.noResultsHint')}
        viewAll={t('common.viewAll')}
        href="/explore?sortBy=discount"
      />

      {endingSoon.length > 0 && (
        <OfferSection
          title={t('offer.endingSoon')}
          offers={endingSoon}
          loading={false}
          error={null}
          onRetry={refetch}
          emptyTitle=""
          emptyHint=""
          viewAll={t('common.viewAll')}
          href="/explore?sortBy=endingSoon"
        />
      )}

      <section aria-labelledby="guide-heading" className="space-y-4 rounded-lg border bg-surface p-5 sm:p-6">
        <h2 id="guide-heading" className="text-lg font-semibold tracking-tight">
          {t('home.guide.title')}
        </h2>
        <dl className="grid gap-5 sm:grid-cols-3">
          {(['upTo', 'cards', 'dates'] as const).map((k) => (
            <div key={k} className="space-y-1">
              <dt className="text-sm font-semibold">{t(`home.guide.${k}.title`)}</dt>
              <dd className="text-sm leading-6 text-muted-foreground">{t(`home.guide.${k}.body`)}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

interface OfferSectionProps {
  title: string
  offers: Parameters<typeof OfferCard>[0]['offer'][]
  loading: boolean
  error: Error | null
  onRetry: () => void
  emptyTitle: string
  emptyHint: string
  viewAll: string
  href: string
}

function OfferSection({
  title,
  offers,
  loading,
  error,
  onRetry,
  emptyTitle,
  emptyHint,
  viewAll,
  href,
}: OfferSectionProps) {
  return (
    <section aria-label={title} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href={href}>
            {viewAll}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
      {loading ? (
        <OfferGridSkeleton count={8} />
      ) : error ? (
        <ErrorState onRetry={onRetry} />
      ) : offers.length === 0 ? (
        <ErrorState title={emptyTitle} hint={emptyHint} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </section>
  )
}
