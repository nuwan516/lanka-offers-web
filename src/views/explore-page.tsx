'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
import { BANKS, getBankName } from '@/lib/banks'
import { deriveCardTypes, deriveCategories, filterOffers, isExpired, sortOffers } from '@/lib/offers'

const PAGE_SIZE = 24
const SORTS = ['newest', 'discount', 'endingSoon'] as const

export function ExplorePage() {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname() || '/explore'
  const searchParams = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)

  const bank = searchParams?.get('bank') || ''
  const search = searchParams?.get('search') || ''
  const category = searchParams?.get('category') || ''
  const cardType = searchParams?.get('cardType') || ''
  const sortParam = searchParams?.get('sortBy') || 'newest'
  const sortBy = (SORTS as readonly string[]).includes(sortParam) ? sortParam : 'newest'

  // Bank, category and search are filtered by the API; card type and sort are applied here
  // over the full result set so counts and ordering are never based on a partial page.
  const { offers, loading, error, refetch } = useOffers({
    bank: bank || undefined,
    category: category || undefined,
    search: search || undefined,
  })

  const live = useMemo(() => offers.filter((o) => !isExpired(o.valid_to)), [offers])
  const categories = useMemo(() => deriveCategories(live), [live])
  const cardTypes = useMemo(() => deriveCardTypes(live), [live])

  const filtered = useMemo(
    () => sortOffers(filterOffers(live, { cardType }), sortBy),
    [live, cardType, sortBy]
  )

  useEffect(() => setVisible(PAGE_SIZE), [bank, search, category, cardType, sortBy])

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams ? searchParams.toString() : '')
    if (value) next.set(key, value)
    else next.delete(key)
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const clearFilters = () => router.push(pathname)

  const chips = [
    bank && { key: 'bank', label: getBankName(bank) },
    category && { key: 'category', label: category },
    cardType && { key: 'cardType', label: cardType },
    search && { key: 'search', label: `“${search}”` },
  ].filter(Boolean) as { key: string; label: string }[]

  const filterFields = (
    <div className="space-y-5">
      <FilterSelect
        label={t('filters.bank')}
        allLabel={t('filters.allBanks')}
        value={bank}
        onChange={(v) => updateParam('bank', v)}
        options={BANKS.map((b) => ({ value: b.code, label: b.name }))}
      />
      <FilterSelect
        label={t('filters.category')}
        allLabel={t('filters.allCategories')}
        value={category}
        onChange={(v) => updateParam('category', v)}
        options={categories.map((c) => ({ value: c, label: c }))}
      />
      <FilterSelect
        label={t('filters.cardType')}
        allLabel={t('filters.allCardTypes')}
        value={cardType}
        onChange={(v) => updateParam('cardType', v)}
        options={cardTypes.map((c) => ({ value: c, label: c }))}
      />
      {chips.length > 0 && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
          <X className="size-3.5" aria-hidden="true" />
          {t('filters.clear')}
        </Button>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('nav.explore')}</h1>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
            {loading ? t('common.loading') : t('search.results', { count: filtered.length })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 lg:hidden" onClick={() => setSheetOpen(true)}>
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {t('filters.title')}
            {chips.length > 0 && (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                {chips.length}
              </span>
            )}
          </Button>
          <Select value={sortBy} onValueChange={(v) => updateParam('sortBy', v === 'newest' ? '' : v)}>
            <SelectTrigger className="w-44" aria-label={t('filters.sortBy')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`sort.${s}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-4 max-w-xl">
        <SearchInput value={search} onChange={(v) => updateParam('search', v)} />
      </div>

      {chips.length > 0 && (
        <ul className="mb-6 flex flex-wrap gap-2" aria-label={t('filters.active')}>
          {chips.map((c) => (
            <li key={c.key}>
              <button
                type="button"
                onClick={() => updateParam(c.key, '')}
                className="inline-flex items-center gap-1.5 rounded-full border bg-primary-soft px-3 py-1 text-sm text-primary transition-colors hover:border-primary/40"
              >
                {c.label}
                <X className="size-3.5" aria-hidden="true" />
                <span className="sr-only">{t('filters.clear')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-5 rounded-lg border bg-card p-5">
            <h2 className="text-sm font-semibold">{t('filters.title')}</h2>
            {filterFields}
          </div>
        </aside>

        <div>
          {loading ? (
            <OfferGridSkeleton count={9} />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t('search.noResults')}
              hint={t('search.noResultsHint')}
              actionLabel={chips.length > 0 ? t('filters.clear') : undefined}
              onAction={clearFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.slice(0, visible).map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
              {visible < filtered.length && (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {t('explore.showing', { count: visible, total: filtered.length })}
                  </p>
                  <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    {t('common.loadMore')}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('filters.title')}</SheetTitle>
          </SheetHeader>
          <div className="px-4 pt-2 pb-6">{filterFields}</div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

interface FilterSelectProps {
  label: string
  allLabel: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

function FilterSelect({ label, allLabel, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      <Select value={value || 'all'} onValueChange={(v) => onChange(v === 'all' ? '' : v)}>
        <SelectTrigger className="w-full" aria-label={label}>
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
