'use client'

import { MapPin, List, Map as MapIcon, Crosshair, Search } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { BankBadge } from '@/components/shared/bank-badge'
import { DiscountLabel } from '@/components/shared/discount-badge'
import { useI18n } from '@/i18n'
import { useLocation } from '@/hooks/use-location'
import { fetchNearbyOffers } from '@/services/api/offers'
import {
  cleanLocationText,
  decodeHtmlEntities,
  formatDistance,
  getAreaOnlyLabel,
  getMerchantName,
  hasConfirmedBranch,
} from '@/lib/offers'
import { cn } from '@/lib/utils'
import type { Offer } from '@/types'

const OfferMap = dynamic(() => import('@/components/shared/offer-map').then((m) => m.OfferMap), {
  ssr: false,
})

const PRESET_CITIES = [
  { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { name: 'Galle', lat: 6.0535, lng: 80.221 },
  { name: 'Negombo', lat: 7.2008, lng: 79.8737 },
  { name: 'Kurunegala', lat: 7.4863, lng: 80.3623 },
]

const RADIUS_OPTIONS = [5, 10, 25, 50]

export function NearbyPage() {
  const { t } = useI18n()
  const { permission, location: gpsLocation, requestLocation } = useLocation()

  const [selectedCity, setSelectedCity] = useState(PRESET_CITIES[0])
  const [useGps, setUseGps] = useState(false)
  const [radius, setRadius] = useState<number>(25)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [nonce, setNonce] = useState(0)

  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const gpsActive = useGps && !!gpsLocation
  const activeLocation = gpsActive ? gpsLocation : { lat: selectedCity.lat, lng: selectedCity.lng }
  const place = gpsActive ? t('nearby.yourLocation') : selectedCity.name
  const { lat, lng } = activeLocation

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    // Coordinates are sent to the API only to compute distances; nothing is stored client-side.
    fetchNearbyOffers(
      { lat, lng, radius, search: searchFilter.trim() || undefined, limit: 100 },
      controller.signal
    )
      .then((data) => {
        // Confirmed branches nearest-first; area-only offers last (their distance is to a town centre).
        const rank = (o: Offer) =>
          hasConfirmedBranch(o) ? (o.distance_km ?? Number.MAX_VALUE / 2) : Number.MAX_VALUE
        setOffers([...data].sort((a, b) => rank(a) - rank(b)))
        setLoading(false)
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return
        setError(err)
        setLoading(false)
      })

    return () => controller.abort()
  }, [lat, lng, radius, searchFilter, nonce])

  const handleUseGps = () => {
    setUseGps(true)
    requestLocation()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{t('nearby.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('nearby.subtitle', { place })}</p>
        </div>

        <div className="flex shrink-0 gap-1 rounded-lg border bg-card p-0.5" role="group">
          {(['list', 'map'] as const).map((v) => (
            <Button
              key={v}
              variant={view === v ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className="h-8 gap-1.5"
            >
              {v === 'list' ? (
                <List className="size-3.5" aria-hidden="true" />
              ) : (
                <MapIcon className="size-3.5" aria-hidden="true" />
              )}
              {t(v === 'list' ? 'nearby.viewList' : 'nearby.viewMap')}
            </Button>
          ))}
        </div>
      </div>

      <section aria-label={t('nearby.title')} className="mb-6 space-y-4 rounded-lg border bg-card p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={gpsActive ? 'default' : 'outline'}
              size="sm"
              onClick={handleUseGps}
              className="gap-1.5"
            >
              <Crosshair className="size-3.5" aria-hidden="true" />
              {permission === 'requesting' ? t('nearby.requesting') : t('nearby.gps')}
            </Button>
            <span className="text-xs text-muted-foreground">{t('nearby.or')}</span>
            {PRESET_CITIES.map((city) => {
              const active = !gpsActive && selectedCity.name === city.name
              return (
                <Button
                  key={city.name}
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  aria-pressed={active}
                  onClick={() => {
                    setUseGps(false)
                    setSelectedCity(city)
                  }}
                  className={cn(active && 'border font-semibold')}
                >
                  {city.name}
                </Button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs whitespace-nowrap text-muted-foreground">{t('nearby.radius')}</span>
            <div className="flex gap-1">
              {RADIUS_OPTIONS.map((r) => (
                <Button
                  key={r}
                  variant={radius === r ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={radius === r}
                  onClick={() => setRadius(r)}
                  className="h-8 px-2.5 text-xs"
                >
                  {r} km
                </Button>
              ))}
            </div>
          </div>
        </div>

        {useGps && permission === 'denied' && (
          <p role="alert" className="text-sm text-destructive">
            {t('nearby.denied')}
          </p>
        )}
        {useGps && permission === 'unavailable' && (
          <p role="alert" className="text-sm text-destructive">
            {t('nearby.unavailable')}
          </p>
        )}

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder={t('nearby.filterPlaceholder')}
            aria-label={t('nearby.filterPlaceholder')}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground">{t('nearby.permissionHint')}</p>
      </section>

      {loading ? (
        <OfferGridSkeleton />
      ) : error ? (
        <ErrorState onRetry={() => setNonce((n) => n + 1)} />
      ) : offers.length === 0 ? (
        <EmptyState title={t('nearby.noNearby')} hint={t('nearby.emptyHint')} />
      ) : view === 'map' ? (
        <div className="h-[32rem] overflow-hidden rounded-lg border">
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t('common.loading')}
              </div>
            }
          >
            <OfferMap
              offers={offers}
              userLocation={activeLocation}
              className="h-full w-full"
              selectedOfferId={selectedOfferId}
              onSelectOffer={setSelectedOfferId}
            />
          </Suspense>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t('nearby.found', { count: offers.length, radius })}
          </p>
          <ul className="space-y-3">
            {offers.map((offer) => (
              <li key={offer.id}>
                <NearbyOfferRow offer={offer} />
              </li>
            ))}
          </ul>
          <p className="pt-2 text-xs text-muted-foreground">{t('nearby.approxNote')}</p>
        </div>
      )}
    </div>
  )
}

function NearbyOfferRow({ offer }: { offer: Offer }) {
  const { t } = useI18n()
  const merchant = getMerchantName(offer)
  const branch = offer.matched_branch_name || offer.geo_locations?.[0]?.name
  const address =
    offer.matched_branch_address || offer.geo_locations?.[0]?.address || offer.merchant_location
  const areaOnly = getAreaOnlyLabel(offer)
  // A distance to a town centre is not a distance to a branch.
  const hasDistance =
    offer.distance_km !== undefined && offer.distance_km !== null && hasConfirmedBranch(offer)

  return (
    <article className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="min-w-0 truncate text-base font-semibold">{merchant}</h3>
          {offer.bank && <BankBadge bankName={offer.bank} />}
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{decodeHtmlEntities(offer.title)}</p>
        {areaOnly ? (
          <p className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{t('location.areaOnly', { area: areaOnly })}</span>
          </p>
        ) : (branch || address) && (
          <p className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 break-words">
              {[branch, address && cleanLocationText(address)].filter(Boolean).join(' · ')}
            </span>
          </p>
        )}
        <DiscountLabel offer={offer} className="pt-1 text-base" />
      </div>

      <div className="flex flex-col items-end gap-2">
        {hasDistance && (
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
            {formatDistance(offer.distance_km as number)}
          </span>
        )}
        <Button variant="outline" size="sm" asChild>
          <Link href={`/offers/${offer.id}`}>{t('offer.viewOffer')}</Link>
        </Button>
      </div>
    </article>
  )
}
