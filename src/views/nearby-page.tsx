'use client'

import { MapPin, List, Map as MapIcon, Crosshair, Search } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { BankBadge } from '@/components/shared/bank-badge'
import { useI18n } from '@/i18n'
import { useLocation } from '@/hooks/use-location'
import { fetchNearbyOffers } from '@/services/api/offers'
import {
  getMerchantName,
  formatDistance,
  formatDiscount,
  cleanLocationText,
} from '@/lib/offers'

import type { Offer } from '@/types'

const OfferMap = dynamic(
  () => import('@/components/shared/offer-map').then((m) => m.OfferMap),
  { ssr: false }
)

const PRESET_CITIES = [
  { name: 'Colombo', lat: 6.9271, lng: 79.8612 },
  { name: 'Kandy', lat: 7.2906, lng: 80.6337 },
  { name: 'Galle', lat: 6.0535, lng: 80.2210 },
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

  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Current active coordinates
  const activeLocation = useGps && gpsLocation ? gpsLocation : { lat: selectedCity.lat, lng: selectedCity.lng }
  const locationLabel = useGps && gpsLocation ? 'Your Location (GPS)' : selectedCity.name

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchNearbyOffers({
      lat: activeLocation.lat,
      lng: activeLocation.lng,
      radius,
      search: searchFilter.trim() || undefined,
      limit: 100,
    })
      .then((data) => {
        if (cancelled) return
        setOffers(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeLocation.lat, activeLocation.lng, radius, searchFilter])

  const handleUseGps = () => {
    setUseGps(true)
    requestLocation()
  }

  const handleSelectCity = (city: typeof PRESET_CITIES[0]) => {
    setUseGps(false)
    setSelectedCity(city)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('nearby.title')}</h1>
          <p className="text-sm text-muted-foreground">
            Explore active bank promotions sorted by proximity to {locationLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg border p-0.5 bg-card">
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('list')}
              className="gap-1.5 h-8"
            >
              <List className="size-3.5" />
              {t('nearby.viewList')}
            </Button>
            <Button
              variant={view === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('map')}
              className="gap-1.5 h-8"
            >
              <MapIcon className="size-3.5" />
              {t('nearby.viewMap')}
            </Button>
          </div>
        </div>
      </div>

      {/* Location Bar & City Selector */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* City / GPS Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={useGps ? 'default' : 'outline'}
              size="sm"
              onClick={handleUseGps}
              className="gap-1.5 text-xs h-8"
            >
              <Crosshair className="size-3.5" />
              {permission === 'requesting' ? t('nearby.requesting') : 'Current GPS'}
            </Button>

            <span className="text-xs text-muted-foreground mx-1">or</span>

            {PRESET_CITIES.map((city) => (
              <Button
                key={city.name}
                variant={!useGps && selectedCity.name === city.name ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleSelectCity(city)}
                className={`text-xs h-8 ${!useGps && selectedCity.name === city.name ? 'font-semibold border' : ''}`}
              >
                {city.name}
              </Button>
            ))}
          </div>

          {/* Radius selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Radius:</span>
            <div className="flex gap-1">
              {RADIUS_OPTIONS.map((r) => (
                <Button
                  key={r}
                  variant={radius === r ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRadius(r)}
                  className="text-xs h-7 px-2.5"
                >
                  {r} km
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Permission status message if denied/unavailable */}
        {useGps && permission === 'denied' && (
          <p className="mt-3 text-xs text-destructive">
            {t('nearby.denied')}
          </p>
        )}
        {useGps && permission === 'unavailable' && (
          <p className="mt-3 text-xs text-destructive">
            {t('nearby.unavailable')}
          </p>
        )}

        {/* Search filter within nearby results */}
        <div className="relative mt-3 pt-3 border-t">
          <Search className="absolute left-3 top-5 size-4 text-muted-foreground" />
          <Input
            placeholder="Filter nearby offers by merchant or keyword..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <OfferGridSkeleton />
      ) : error ? (
        <ErrorState onRetry={() => setRadius(radius)} />
      ) : offers.length === 0 ? (
        <EmptyState
          title={t('nearby.noNearby')}
          hint={`Try expanding your search radius beyond ${radius} km or selecting another city.`}
        />
      ) : view === 'map' ? (
        <div className="space-y-4">
          <div className="h-[550px] overflow-hidden rounded-lg border shadow-sm">
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
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
            <span>Found {offers.length} offers within {radius} km of {locationLabel}</span>
            <span>Sorted by nearest first</span>
          </div>

          {offers.map((offer) => (
            <NearbyOfferRow key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  )
}

function NearbyOfferRow({ offer }: { offer: Offer }) {
  const { t } = useI18n()
  const merchant = getMerchantName(offer)
  const discount = formatDiscount(offer.discount_percentage)
  const branchAddress = offer.geo_locations?.[0]?.address || offer.geo_locations?.[0]?.name || offer.merchant_location

  return (
    <Card className="flex items-center gap-4 p-4 transition-all duration-200 hover:shadow-md hover:border-primary/40">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <MapPin className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-foreground text-sm">{merchant}</p>
          {offer.bank && <BankBadge bankName={offer.bank} />}
        </div>

        <p className="truncate text-xs text-muted-foreground mt-0.5">{offer.title}</p>

        {branchAddress && (
          <p className="truncate text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
            <span className="text-primary font-medium">📍</span>
            <span className="truncate">{cleanLocationText(branchAddress)}</span>
          </p>
        )}

        {discount && (
          <p className="text-xs font-semibold text-primary mt-1">
            {discount} {t('offer.discountOff')}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right flex flex-col items-end gap-1.5">
        {offer.distance_km !== undefined && offer.distance_km !== null && (
          <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30 bg-primary/5">
            {formatDistance(offer.distance_km)}
          </Badge>
        )}
        <Button variant="outline" size="sm" asChild className="h-7 text-xs">
          <Link href={`/offers/${offer.id}`}>{t('offer.viewOffer')}</Link>
        </Button>
      </div>
    </Card>
  )
}

