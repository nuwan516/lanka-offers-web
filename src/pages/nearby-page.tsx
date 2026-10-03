import { MapPin, Navigation, List, Map as MapIcon, Crosshair } from 'lucide-react'
import { useMemo, useState, Suspense, lazy } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { OfferGridSkeleton } from '@/components/shared/skeletons'
import { ErrorState } from '@/components/shared/error-state'
import { EmptyState } from '@/components/shared/empty-state'
import { BankBadge } from '@/components/shared/bank-badge'
import { useI18n } from '@/i18n'
import { useOffers } from '@/hooks/use-offers'
import { useLocation } from '@/hooks/use-location'
import {
  hasPhysicalLocations,
  getValidGeoLocations,
  getMerchantName,
  haversineDistance,
  formatDistance,
  formatDiscount,
} from '@/lib/offers'
import type { Offer } from '@/types'

const OfferMap = lazy(() =>
  import('@/components/shared/offer-map').then((m) => ({ default: m.OfferMap }))
)

export function NearbyPage() {
  const { t } = useI18n()
  const { offers, loading, error, refetch } = useOffers({ status: 'active', limit: 200 })
  const { permission, location, requestLocation } = useLocation()
  const [view, setView] = useState<'list' | 'map'>('list')
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null)

  const nearbyOffers = useMemo(() => {
    return offers
      .filter((o) => hasPhysicalLocations(o))
      .map((o) => {
        const locs = getValidGeoLocations(o)
        if (locs.length === 0 || !location) return { offer: o, minDist: Infinity, loc: null }
        let minDist = Infinity
        let nearest = locs[0]
        for (const loc of locs) {
          const d = haversineDistance(location.lat, location.lng, loc.lat, loc.lng)
          if (d < minDist) {
            minDist = d
            nearest = loc
          }
        }
        return { offer: o, minDist, loc: nearest }
      })
      .filter((item) => item.loc !== null)
      .sort((a, b) => a.minDist - b.minDist) as { offer: Offer; minDist: number; loc: NonNullable<Offer['geo_locations']>[number] }[]
  }, [offers, location])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">{t('nearby.title')}</h1>
        <div className="flex gap-1 rounded-lg border p-0.5">
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
            className="gap-1.5"
          >
            <List className="size-3.5" />
            {t('nearby.viewList')}
          </Button>
          <Button
            variant={view === 'map' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('map')}
            className="gap-1.5"
          >
            <MapIcon className="size-3.5" />
            {t('nearby.viewMap')}
          </Button>
        </div>
      </div>

      {/* Permission request */}
      {permission === 'not_requested' && (
        <Card className="mb-6 p-6 text-center">
          <Crosshair className="mx-auto mb-3 size-10 text-muted-foreground" />
          <h2 className="mb-1 font-semibold">{t('nearby.permissionTitle')}</h2>
          <p className="mb-4 text-sm text-muted-foreground">{t('nearby.permissionHint')}</p>
          <Button onClick={requestLocation}>
            <Navigation className="size-4" />
            {t('nearby.useLocation')}
          </Button>
        </Card>
      )}

      {permission === 'requesting' && (
        <Card className="mb-6 p-4 text-center text-sm text-muted-foreground">
          {t('nearby.requesting')}
        </Card>
      )}

      {permission === 'denied' && (
        <Card className="mb-6 p-4 text-center text-sm text-destructive">
          {t('nearby.denied')}
        </Card>
      )}

      {permission === 'unavailable' && (
        <Card className="mb-6 p-4 text-center text-sm text-destructive">
          {t('nearby.unavailable')}
        </Card>
      )}

      {permission === 'unsupported' && (
        <Card className="mb-6 p-4 text-center text-sm text-destructive">
          {t('nearby.unsupported')}
        </Card>
      )}

      {permission === 'granted' && (
        <Button variant="outline" size="sm" onClick={requestLocation} className="mb-4">
          <Crosshair className="size-3.5" />
          {t('nearby.useLocation')}
        </Button>
      )}

      {loading ? (
        <OfferGridSkeleton />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : nearbyOffers.length === 0 && permission === 'granted' ? (
        <EmptyState title={t('nearby.noNearby')} />
      ) : nearbyOffers.length === 0 ? (
        <EmptyState
          title={t('nearby.noNearby')}
          hint={t('nearby.permissionHint')}
        />
      ) : view === 'map' ? (
        <div className="space-y-4">
          <div className="h-[400px] overflow-hidden rounded-lg border lg:h-[500px]">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">{t('common.loading')}</div>}>
              <OfferMap
                offers={nearbyOffers.map((n) => n.offer)}
                userLocation={location}
                className="h-full w-full"
                selectedOfferId={selectedOfferId}
                onSelectOffer={setSelectedOfferId}
              />
            </Suspense>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {nearbyOffers.map(({ offer, minDist, loc }) => (
            <NearbyOfferRow
              key={offer.id}
              offer={offer}
              distance={minDist}
              location={loc}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NearbyOfferRow({ offer, distance }: { offer: Offer; distance: number; location: NonNullable<Offer['geo_locations']>[number] }) {
  const { t } = useI18n()
  const merchant = getMerchantName(offer)
  const discount = formatDiscount(offer.discount_percentage)

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
        <MapPin className="size-5 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{merchant}</p>
        {discount && <p className="text-sm font-semibold text-foreground">{discount} {t('offer.discountOff')}</p>}
        {offer.bank && <div className="mt-1"><BankBadge bankName={offer.bank} /></div>}
      </div>
      <div className="shrink-0 text-right">
        {distance !== Infinity && (
          <p className="text-xs text-muted-foreground">{t('nearby.distance', { distance: formatDistance(distance) })}</p>
        )}
        <Button variant="ghost" size="sm" asChild className="mt-1">
          <a href={`/offers/${offer.id}`}>{t('offer.viewOffer')}</a>
        </Button>
      </div>
    </Card>
  )
}
