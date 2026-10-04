'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OfferCard } from '@/components/shared/offer-card'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { SearchInput } from '@/components/shared/search-input'
import { useI18n } from '@/i18n'
import { useOffers } from '@/hooks/use-offers'
import { useReferenceData } from '@/hooks/use-reference-data'
import { filterOffers, sortOffers, deriveCategories, deriveCardTypes } from '@/lib/offers'

export function ExplorePage() {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)

  const bank = searchParams?.get('bank') || ''
  const search = searchParams?.get('search') || ''
  const category = searchParams?.get('category') || ''
  const cardType = searchParams?.get('cardType') || ''
  const sortBy = searchParams?.get('sortBy') || 'newest'

  const { offers, loading, error, refetch } = useOffers({ status: 'active', limit: 200 })
  const { banks } = useReferenceData()

  const categories = useMemo(() => deriveCategories(offers), [offers])
  const cardTypes = useMemo(() => deriveCardTypes(offers), [offers])
  const bankList = banks.length > 0 ? banks : deriveBanks(offers)

  const filtered = useMemo(() => {
    const result = filterOffers(offers, { bank, category, cardType, search })
    return sortOffers(result, sortBy)
  }, [offers, bank, category, cardType, search, sortBy])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams ? searchParams.toString() : '')
    if (value) next.set(key, value)
    else next.delete(key)
    const qs = next.toString()
    const currentPath = pathname || '/explore'
    router.push(qs ? `${currentPath}?${qs}` : currentPath)
  }

  const clearFilters = () => {
    router.push(pathname || '/explore')
  }

  const hasActiveFilters = bank || search || category || cardType

  const FilterContent = () => (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('filters.bank')}</label>
        <Select value={bank} onValueChange={(v) => updateParam('bank', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('filters.allBanks')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allBanks')}</SelectItem>
            {bankList.map((b) => (
              <SelectItem key={b.code || b.name} value={b.code || b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t('filters.category')}</label>
        <Select value={category} onValueChange={(v) => updateParam('category', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('filters.allCategories')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allCategories')}</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t('filters.cardType')}</label>
        <Select value={cardType} onValueChange={(v) => updateParam('cardType', v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t('filters.allCardTypes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.allCardTypes')}</SelectItem>
            {cardTypes.map((ct) => (
              <SelectItem key={ct} value={ct}>
                {ct}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
          <X className="size-3.5" />
          {t('filters.clear')}
        </Button>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('nav.explore')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('explore.showing', { count: filtered.length, total: offers.length })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile filter toggle */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2 lg:hidden"
            onClick={() => setSheetOpen(true)}
          >
            <SlidersHorizontal className="size-4" />
            {t('filters.title')}
            {hasActiveFilters && (
              <span className="flex size-2 rounded-full bg-primary" />
            )}
          </Button>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => updateParam('sortBy', v)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('sort.newest')}</SelectItem>
              <SelectItem value="discount">{t('sort.discount')}</SelectItem>
              <SelectItem value="endingSoon">{t('sort.endingSoon')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <SearchInput
          value={search}
          onChange={(v) => updateParam('search', v)}
          placeholder={t('search.placeholder')}
        />
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-6 rounded-lg border bg-card p-5">
            <h2 className="text-base font-semibold">{t('filters.title')}</h2>
            <FilterContent />
          </div>
        </aside>

        {/* Offers grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <OfferGridSkeleton count={9} />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t('search.noResults')}
              hint={t('search.noResultsHint')}
              actionLabel={t('filters.clear')}
              onAction={clearFilters}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('filters.title')}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4 pt-2">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function deriveBanks(offers: { bank: string }[]) {
  const seen = new Map<string, { name: string; code: string }>()
  for (const o of offers) {
    if (o.bank && !seen.has(o.bank)) {
      seen.set(o.bank, { name: o.bank, code: o.bank })
    }
  }
  return Array.from(seen.values())
}
