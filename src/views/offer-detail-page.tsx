'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
import { fetchOffer, fetchOffers } from '@/services/api/offers'
import { formatDiscount, formatDate, getMerchantName, isValidUrl, getValidGeoLocations } from '@/lib/offers'
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

      {/* Locations */}
      {geoLocations.length > 0 && (
        <Card className="mb-4 p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4" />
            {t('offer.branches', { count: geoLocations.length })}
          </h2>
          <div className="space-y-2">
            {geoLocations.map((loc, i) => (
              <div key={i} className="flex items-start justify-between gap-2 rounded-md bg-muted/40 p-2.5 text-xs">
                <div>
                  <p className="font-medium">{loc.name || loc.address || merchant}</p>
                  {loc.name && loc.address && (
                    <p className="text-muted-foreground">{loc.address}</p>
                  )}
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-primary hover:underline"
                >
                  {t('offer.viewMap')}
                </a>
              </div>
            ))}
          </div>
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
