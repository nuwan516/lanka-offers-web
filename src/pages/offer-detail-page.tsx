import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Heart, ExternalLink, Calendar, CreditCard, MapPin, FileText, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { BankBadge } from '@/components/shared/bank-badge'
import { LocationScopeBadge } from '@/components/shared/location-scope-badge'
import { useI18n } from '@/i18n'
import { useSavedOffers } from '@/hooks/use-saved-offers'
import { fetchOffer } from '@/services/api/offers'
import { fetchOffers } from '@/services/api/offers'
import { formatDiscount, formatDate, getMerchantName, isValidUrl, getValidGeoLocations } from '@/lib/offers'
import type { Offer, OfferDetail } from '@/types'

export function OfferDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isSaved, toggleSave } = useSavedOffers()

  const [offer, setOffer] = useState<OfferDetail | null>(null)
  const [siblingOffers, setSiblingOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchOffer(id)
      .then((data) => {
        if (cancelled) return
        setOffer(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err)
        setLoading(false)
      })

    // Load sibling offers for prev/next navigation
    const bank = searchParams.get('bank')
    const search = searchParams.get('search')
    fetchOffers({ status: 'active', limit: 200, bank: bank || undefined, search: search || undefined })
      .then((data) => {
        if (cancelled) return
        setSiblingOffers(data)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [id, searchParams])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }

  if (error || !offer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <ErrorState
          title={t('offer.notFound')}
          hint={t('offer.notFoundHint')}
          onRetry={() => navigate('/explore')}
        />
      </div>
    )
  }

  const saved = isSaved(offer.id)
  const merchant = getMerchantName(offer)
  const discount = formatDiscount(offer.discount_percentage)
  const geoLocations = getValidGeoLocations(offer)
  const eligibility = offer.card_eligibility

  // Sibling navigation
  const currentIndex = siblingOffers.findIndex((o) => o.id === offer.id)
  const prevOffer = currentIndex > 0 ? siblingOffers[currentIndex - 1] : null
  const nextOffer = currentIndex >= 0 && currentIndex < siblingOffers.length - 1 ? siblingOffers[currentIndex + 1] : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/explore" className="hover:text-foreground">{t('nav.explore')}</Link>
        <ChevronRight className="size-3" />
        <span className="truncate text-foreground">{merchant}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {merchant}
            </h1>
            {offer.bank && <BankBadge bankName={offer.bank} />}
          </div>
          <Button
            variant={saved ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleSave(offer.id)}
            className="shrink-0"
          >
            <Heart className={saved ? 'fill-current' : ''} />
            {saved ? t('offer.saved') : t('offer.save')}
          </Button>
        </div>

        {discount && (
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold tracking-tight">{discount}</span>
            <span className="text-sm font-medium text-muted-foreground">{t('offer.discountOff')}</span>
          </div>
        )}

        <p className="text-sm text-muted-foreground">{offer.title}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {offer.category && (
            <Badge variant="secondary">{offer.category}</Badge>
          )}
          {offer.location_scope && (
            <LocationScopeBadge scope={offer.location_scope} />
          )}
          {offer.valid_to && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {t('offer.validUntil')} {formatDate(offer.valid_to, lang)}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {offer.description && (
        <Card className="mb-4 p-4">
          <p className="text-sm leading-relaxed text-foreground">{offer.description}</p>
        </Card>
      )}

      {/* Card eligibility */}
      <Card className="mb-4 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="size-4" />
          {t('offer.cardEligibility')}
        </h2>
        <Separator className="mb-3" />
        {eligibility ? (
          <div className="space-y-3 text-sm">
            {eligibility.cardTypes && eligibility.cardTypes.length > 0 && (
              <div>
                <p className="text-muted-foreground">{t('offer.eligibleCards')}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {eligibility.cardTypes.map((ct, i) => (
                    <Badge key={i} variant="outline">{ct}</Badge>
                  ))}
                </div>
              </div>
            )}
            {eligibility.networks && eligibility.networks.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {eligibility.networks.map((nw, i) => (
                  <Badge key={i} variant="secondary">{nw}</Badge>
                ))}
              </div>
            )}
            {eligibility.includedCards && eligibility.includedCards.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {eligibility.includedCards.map((c, i) => (
                  <Badge key={i} variant="outline">{c}</Badge>
                ))}
              </div>
            )}
            {eligibility.excludedCards && eligibility.excludedCards.length > 0 && (
              <div>
                <p className="text-muted-foreground">{t('offer.notValidFor')}</p>
                <p className="mt-1 text-destructive">
                  {eligibility.excludedCards.join(', ')}
                </p>
              </div>
            )}
            {eligibility.restrictions && eligibility.restrictions.length > 0 && (
              <div>
                <p className="text-muted-foreground">{t('offer.restrictions')}</p>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {eligibility.restrictions.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {(!eligibility.cardTypes || eligibility.cardTypes.length === 0) &&
              (!eligibility.networks || eligibility.networks.length === 0) &&
              (!eligibility.includedCards || eligibility.includedCards.length === 0) && (
              <p className="text-muted-foreground">{t('offer.eligibilityIncomplete')}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('offer.eligibilityIncomplete')}</p>
        )}
      </Card>

      {/* Where it applies */}
      {offer.location_scope && (
        <Card className="mb-4 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4" />
            {t('offer.whereApplies')}
          </h2>
          <Separator className="mb-3" />
          <LocationScopeBadge scope={offer.location_scope} />
          {geoLocations.length > 0 && (
            <div className="mt-3 space-y-2">
              {geoLocations.map((loc, i) => (
                <div key={i} className="text-sm">
                  {loc.name && <p className="font-medium">{loc.name}</p>}
                  {loc.address && <p className="text-muted-foreground">{loc.address}</p>}
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=16/${loc.lat}/${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <MapPin className="size-3" />
                    {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Terms */}
      {offer.terms && (
        <Card className="mb-4 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FileText className="size-4" />
            {t('offer.terms')}
          </h2>
          <Separator className="mb-3" />
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {offer.terms}
          </p>
        </Card>
      )}

      {/* Source link */}
      {offer.source_url && isValidUrl(offer.source_url) && (
        <Button variant="outline" asChild className="mb-6 w-full">
          <a href={offer.source_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            {t('offer.viewSource')}
          </a>
        </Button>
      )}

      {/* Prev/Next navigation */}
      {(prevOffer || nextOffer) && (
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            disabled={!prevOffer}
            onClick={() => prevOffer && navigate(`/offers/${prevOffer.id}?${searchParams.toString()}`)}
          >
            <ArrowLeft className="size-4" />
            {t('offer.previous')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!nextOffer}
            onClick={() => nextOffer && navigate(`/offers/${nextOffer.id}?${searchParams.toString()}`)}
          >
            {t('offer.next')}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
