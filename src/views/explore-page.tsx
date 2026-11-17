'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { OfferCard } from '@/features/offers'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadMore } from '@/components/shared/load-more'
import { SearchInput } from '@/components/shared/search-input'
import { useI18n } from '@/i18n'
import { useCategories } from '@/hooks/use-categories'
import { useOffers } from '@/hooks/use-offers'
import { PAGE_SIZE, usePagedOffers } from '@/hooks/use-paged-offers'
import { BANKS, getBankName } from '@/lib/banks'
import { filterOffers, isExpired, sortOffers } from '@/lib/offers'
import { cn } from '@/lib/utils'

const SORTS = ['newest', 'discount', 'endingSoon'] as const
const CARD_TYPES = ['Credit Card', 'Debit Card']

export function ExplorePage() {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname() || '/explore'
  const searchParams = useSearchParams()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [searchPending, setSearchPending] = useState(false)

  const bank = searchParams?.get('bank') || ''
  const search = searchParams?.get('search') || ''
  const category = searchParams?.get('category') || ''
  const cardType = searchParams?.get('cardType') || ''
  const sortParam = searchParams?.get('sortBy') || 'newest'
  const sortBy = (SORTS as readonly string[]).includes(sortParam) ? sortParam : 'newest'

  // The API filters by bank, category and search and returns newest first, one page at a time.
  // Sorting by discount or end date, and filtering by card type, need every offer, so those
  // switch to loading the full set and working on it here.
  const needsAll = sortBy !== 'newest' || cardType !== ''
  const query = {
    bank: bank || undefined,
    category: category || undefined,
    search: search || undefined,
  }
  const paged = usePagedOffers(query, { enabled: !needsAll })
  const all = useOffers(query, needsAll)
  const categories = useCategories()

  useEffect(() => setVisible(PAGE_SIZE), [bank, search, category, cardType, sortBy])

  const allMatches = useMemo(
    () =>
      sortOffers(
        filterOffers(
          all.offers.filter((o) => !isExpired(o.valid_to)),
          { cardType }
        ),
        sortBy
      ),
    [all.offers, cardType, sortBy]
  )
  const pagedLive = useMemo(() => paged.offers.filter((o) => !isExpired(o.valid_to)), [paged.offers])

  const loading = needsAll ? all.loading : paged.loading
  const error = needsAll ? all.error : paged.error
  const refetch = needsAll ? all.refetch : paged.refetch
  const list = needsAll ? allMatches.slice(0, visible) : pagedLive
  const matchCount = needsAll ? allMatches.length : paged.total
  const refreshing = (loading || searchPending) && list.length > 0 && !error
  const busy = loading || searchPending

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
        options={CARD_TYPES.map((c) => ({ value: c, label: c }))}
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
    <div className="mx-auto max-w-6xl px-4 py-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 lg:py-8">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('nav.explore')}</h1>
          <p className="mt-1 text-sm text-muted-foreground" aria-live="polite" aria-busy={busy}>
            {searchPending || (loading && search)
              ? t('search.searching')
              : loading
                ? t('common.loading')
                : t('search.results', { count: matchCount })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 rounded-xl lg:hidden"
            onClick={() => setSheetOpen(true)}
            aria-expanded={sheetOpen}
            aria-haspopup="dialog"
          >
            <SlidersHorizontal className="size-4" aria-hidden="true" />
            {t('filters.title')}
            {chips.length > 0 && (
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                {chips.length}
              </span>
            )}
          </Button>
          <Select value={sortBy} onValueChange={(v) => updateParam('sortBy', v === 'newest' ? '' : v)}>
            <SelectTrigger className="w-44 rounded-xl" aria-label={t('filters.sortBy')}>
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

      <div className="mb-4 max-w-xl" role="search">
        <SearchInput value={search} onChange={(v) => updateParam('search', v)} onPendingChange={setSearchPending} />
      </div>

      {chips.length > 0 && (
        <ul className="mb-6 flex flex-wrap gap-2" aria-label={t('filters.active')}>
          {chips.map((c) => (
            <li key={c.key} className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
              <button
                type="button"
                onClick={() => updateParam(c.key, '')}
                aria-label={t('filters.remove', { label: c.label })}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-primary-soft px-3 py-1.5 text-sm text-primary transition-colors hover:border-primary/40"
              >
                <span className="truncate">{c.label}</span>
                <X className="size-3.5 shrink-0" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5 rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold">{t('filters.title')}</h2>
            {filterFields}
          </div>
        </aside>

        <div aria-busy={busy} className={cn(refreshing && 'opacity-70 transition-opacity')}>
          {loading && list.length === 0 ? (
            <OfferGridSkeleton count={9} className="xl:grid-cols-3" />
          ) : error ? (
            <ErrorState onRetry={refetch} />
          ) : list.length === 0 ? (
            <EmptyState
              title={t('search.noResults')}
              hint={t('search.noResultsHint')}
              actionLabel={chips.length > 0 ? t('filters.clear') : undefined}
              onAction={clearFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
              {!refreshing &&
                (needsAll ? (
                  <LoadMore
                    shown={list.length}
                    total={allMatches.length}
                    hasMore={visible < allMatches.length}
                    onLoadMore={() => setVisible((v) => v + PAGE_SIZE)}
                  />
                ) : (
                  <LoadMore
                    shown={paged.offers.length}
                    total={paged.total}
                    hasMore={paged.hasMore}
                    loading={paged.loadingMore}
                    error={!!paged.moreError}
                    onLoadMore={paged.loadMore}
                  />
                ))}
            </>
          )}
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" closeLabel={t('common.close')} className="max-h-[85vh] gap-0 overflow-hidden rounded-t-2xl p-0">
          <div aria-hidden="true" className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-border" />
          <SheetHeader className="text-left">
            <SheetTitle>{t('filters.title')}</SheetTitle>
            <SheetDescription>{t('filters.sheetHint')}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">{filterFields}</div>
          <SheetFooter className="border-t bg-background">
            <SheetClose asChild>
              <Button className="w-full">{t('filters.showResults')}</Button>
            </SheetClose>
          </SheetFooter>
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
        <SelectTrigger className="w-full rounded-xl" aria-label={label}>
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
