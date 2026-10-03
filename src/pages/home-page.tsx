import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OfferCard } from '@/components/shared/offer-card'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { useI18n } from '@/i18n'
import { useOffers } from '@/hooks/use-offers'
import { useReferenceData } from '@/hooks/use-reference-data'
import { sortOffers, isEndingSoon } from '@/lib/offers'

export function HomePage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { offers, loading, error, refetch } = useOffers({ status: 'active', limit: 200 })
  const { banks } = useReferenceData()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/explore?search=${encodeURIComponent(search.trim())}`)
    }
  }

  const sortedByDiscount = sortOffers(offers, 'discount').slice(0, 8)
  const endingSoon = offers.filter((o) => isEndingSoon(o.valid_to)).slice(0, 4)
  const bankList = banks.length > 0 ? banks : deriveBanksFromOffers(offers)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:py-10">
      {/* Hero */}
      <section className="mb-8 space-y-4 lg:mb-12">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            {t('app.tagline')}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {t('app.description')}
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex max-w-2xl gap-2">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search.placeholder')}
              className="h-11 pl-9"
              aria-label={t('search.placeholder')}
            />
          </div>
          <Button type="submit" size="lg">
            {t('search.button')}
          </Button>
        </form>
      </section>

      {/* Bank quick filters */}
      {bankList.length > 0 && (
        <section className="mb-8 lg:mb-10">
          <h2 className="mb-3 text-sm font-semibold text-foreground">{t('bank.title')}</h2>
          <div className="flex flex-wrap gap-2">
            {bankList.slice(0, 12).map((bank) => (
              <Link
                key={bank.code || bank.name}
                to={`/explore?bank=${encodeURIComponent(bank.code || bank.name)}`}
                className="rounded-lg border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {bank.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Best offers */}
      <section className="mb-8 lg:mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{t('offer.benefit')}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/explore">
              {t('common.viewAll')}
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        {loading ? (
          <OfferGridSkeleton count={8} />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : sortedByDiscount.length === 0 ? (
          <ErrorState title={t('search.noResults')} hint={t('search.noResultsHint')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedByDiscount.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        )}
      </section>

      {/* Ending soon */}
      {endingSoon.length > 0 && (
        <section className="mb-8 lg:mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">{t('offer.endingSoon')}</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {endingSoon.map((offer) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function deriveBanksFromOffers(offers: { bank: string }[]) {
  const seen = new Map<string, { name: string; code: string }>()
  for (const o of offers) {
    if (o.bank && !seen.has(o.bank)) {
      seen.set(o.bank, { name: o.bank, code: o.bank })
    }
  }
  return Array.from(seen.values())
}
