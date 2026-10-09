'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  ExternalLink,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  ChevronRight,
  Globe,
  Phone,
  Navigation,
  Store,
} from 'lucide-react'
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
import { fetchOffer, fetchOffers } from '@/services/api/offers'
import {
  formatDiscount,
  formatDate,
  getMerchantName,
  isValidUrl,
  getValidGeoLocations,
  extractPhoneNumbers,
  cleanLocationText,
} from '@/lib/offers'
import type { Offer, OfferDetail } from '@/types'


export function OfferDetailPage({ params }: { params?: { id?: string } }) {
  const routerParams = useParams<{ id?: string }>()
  const id = params?.id ?? routerParams?.id
  const { t, lang } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
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
    const bank = searchParams?.get('bank')
    const search = searchParams?.get('search')
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
          onRetry={() => router.push('/explore')}
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
        <Link href="/explore" className="hover:text-foreground">{t('nav.explore')}</Link>
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
          <h2 className="mb-2 text-sm font-semibold">{t('offer.description')}</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {offer.description}
          </p>
        </Card>
      )}

      {/* Card eligibility */}
      {eligibility && (
        <Card className="mb-4 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <CreditCard className="size-4" />
            {t('offer.eligibleCards')}
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {eligibility.cardTypes?.map((ct) => (
              <Badge key={ct} variant="outline" className="text-xs capitalize">{ct}</Badge>
            ))}
            {eligibility.networks?.map((n) => (
              <Badge key={n} variant="outline" className="text-xs uppercase">{n}</Badge>
            ))}
            {eligibility.includedCards?.map((card) => (
              <Badge key={card} variant="outline" className="text-xs">{card}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Locations & Availability */}
      {offer.location_scope === 'ONLINE' ? (
        <Card className="mb-4 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="size-4 text-primary" />
              Online Promotion
            </h2>
            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
              Web & App
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This promotion is valid for online purchases and digital orders through the merchant's official website or app.
          </p>
          {offer.source_url && isValidUrl(offer.source_url) && (
            <Button variant="outline" size="sm" asChild className="mt-3 text-xs h-8">
              <a href={offer.source_url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
                <ExternalLink className="size-3.5" />
                Redeem Online / Open Merchant Site
              </a>
            </Button>
          )}
        </Card>
      ) : geoLocations.length > 0 ? (
        <Card className="mb-4 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="size-4 text-primary" />
              {geoLocations.length === 1 ? 'Branch Location' : `Participating Branches (${geoLocations.length})`}
            </h2>
            {offer.location_scope && (
              <LocationScopeBadge scope={offer.location_scope} />
            )}
          </div>
          <div className="space-y-2">
            {geoLocations.map((loc, i) => {
              const branchTitle = loc.name ? cleanLocationText(loc.name) : (loc.city || merchant)
              return (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-xs transition-colors hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Store className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{branchTitle}</span>
                    </div>
                    {loc.address && (
                      <p className="text-muted-foreground mt-0.5 pl-5">{loc.address}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0 pl-5 sm:pl-0">
                    <Button variant="outline" size="sm" asChild className="h-7 text-xs px-2.5">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-1 inline-flex items-center text-primary"
                      >
                        <Navigation className="size-3" />
                        {t('offer.viewMap')}
                      </a>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Location details or outlet listing text */}
          {offer.merchant_location && (
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Outlet Notes & Details:</p>
              <p className="whitespace-pre-line leading-relaxed">{offer.merchant_location}</p>
            </div>
          )}

          {/* Contact numbers if available */}
          {extractPhoneNumbers(offer.merchant_location).length > 0 && (
            <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Phone className="size-3" /> Contact:
              </span>
              {extractPhoneNumbers(offer.merchant_location).map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-card text-foreground font-mono hover:text-primary transition-colors"
                >
                  {phone}
                </a>
              ))}
            </div>
          )}
        </Card>
      ) : offer.location_scope === 'NATIONWIDE' ? (
        <Card className="mb-4 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="size-4 text-primary" />
              Islandwide Promotion
            </h2>
            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
              All Outlets
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This promotion is valid across all official branches and outlets of {merchant} throughout Sri Lanka.
          </p>
          {offer.merchant_location && (
            <div className="mt-2.5 rounded-md bg-muted/30 p-2.5 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-0.5">Participating Outlets:</p>
              <p className="whitespace-pre-line">{offer.merchant_location}</p>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant + ' Sri Lanka')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1.5"
              >
                <Navigation className="size-3.5" />
                Find Nearest Outlet on Google Maps
              </a>
            </Button>
          </div>
        </Card>
      ) : offer.merchant_location ? (
        <Card className="mb-4 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="size-4 text-primary" />
              Participating Outlets & Locations
            </h2>
            {offer.location_scope && (
              <LocationScopeBadge scope={offer.location_scope} />
            )}
          </div>
          <div className="rounded-md bg-muted/40 p-3 text-xs leading-relaxed text-foreground">
            <p className="whitespace-pre-line font-medium">{offer.merchant_location}</p>
          </div>

          {extractPhoneNumbers(offer.merchant_location).length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <Phone className="size-3" /> Contact:
              </span>
              {extractPhoneNumbers(offer.merchant_location).map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-card text-foreground font-mono hover:text-primary transition-colors"
                >
                  {phone}
                </a>
              ))}
            </div>
          )}

          <div className="mt-3">
            <Button variant="outline" size="sm" asChild className="h-8 text-xs">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant + ' ' + cleanLocationText(offer.merchant_location) + ' Sri Lanka')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="gap-1.5"
              >
                <Navigation className="size-3.5" />
                Search Locations on Google Maps
              </a>
            </Button>
          </div>
        </Card>
      ) : null}


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
            onClick={() => {
              if (prevOffer) {
                const qs = searchParams?.toString()
                router.push(`/offers/${prevOffer.id}${qs ? `?${qs}` : ''}`)
              }
            }}
          >
            <ArrowLeft className="size-4" />
            {t('offer.previous')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={!nextOffer}
            onClick={() => {
              if (nextOffer) {
                const qs = searchParams?.toString()
                router.push(`/offers/${nextOffer.id}${qs ? `?${qs}` : ''}`)
              }
            }}
          >
            {t('offer.next')}
            <ArrowRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
