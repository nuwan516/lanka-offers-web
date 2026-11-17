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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/shared/error-state'
import { BankBadge } from '@/components/shared/bank-badge'
import { DiscountLabel } from '@/components/shared/discount-badge'
import { LocationScopeBadge } from '@/components/shared/location-scope-badge'
import { useI18n } from '@/i18n'
import { useSavedOffers } from '@/hooks/use-saved-offers'
import { fetchOffer, fetchOffers } from '@/services/api/offers'
import {
  getDiscountPresentation,
  isExpired,
  formatDate,
  getMerchantName,
  isValidUrl,
  getConfirmedBranches,
  getAreaOnlyLabel,
  extractPhoneNumbers,
  cleanLocationText,
  decodeHtmlEntities,
} from '@/lib/offers'
import type { Offer, OfferDetail } from '@/types'
import { OfferImage } from '@/features/offers'

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

    const bank = searchParams?.get('bank')
    const search = searchParams?.get('search')
    fetchOffers({ limit: 200, bank: bank || undefined, search: search || undefined })
      .then((data) => {
        if (cancelled) return
        setSiblingOffers(data)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [id, searchParams])

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full rounded-2xl" />
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
  const discount = getDiscountPresentation(offer)
  const geoLocations = getConfirmedBranches(offer)
  const areaOnly = getAreaOnlyLabel(offer)
  const eligibility = offer.card_eligibility
  const phones = extractPhoneNumbers(offer.merchant_location)
  const title = decodeHtmlEntities(offer.title)

  const currentIndex = siblingOffers.findIndex((o) => o.id === offer.id)
  const prevOffer = currentIndex > 0 ? siblingOffers[currentIndex - 1] : null
  const nextOffer = currentIndex >= 0 && currentIndex < siblingOffers.length - 1 ? siblingOffers[currentIndex + 1] : null

  const sourceLink =
    offer.source_url && isValidUrl(offer.source_url) ? (
      <Button variant="outline" asChild className="w-full">
        <a href={offer.source_url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-4" aria-hidden="true" />
          {t('offer.viewSource')}
        </a>
      </Button>
    ) : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <nav aria-label={t('nav.breadcrumb')} className="mb-4 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/explore" className="shrink-0 hover:text-foreground">
          {t('nav.explore')}
        </Link>
        <ChevronRight className="size-3 shrink-0" aria-hidden="true" />
        <span className="truncate text-foreground">{merchant}</span>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
        <div className="min-w-0 space-y-4">
          <OfferImage imageUrl={offer.image_url} alt={`${merchant} promotion`} priority className="rounded-2xl" />

          <div className="space-y-3">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{merchant}</h1>
            {offer.bank && <BankBadge bankName={offer.bank} />}
            <p className="text-sm text-pretty text-muted-foreground">{title}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {offer.category && <Badge variant="secondary">{offer.category}</Badge>}
              {offer.location_scope && <LocationScopeBadge scope={offer.location_scope} />}
              {offer.valid_to && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="size-3" aria-hidden="true" />
                  {t('offer.validUntil')} {formatDate(offer.valid_to, lang)}
                </span>
              )}
            </div>
          </div>

          {isExpired(offer.valid_to) && (
            <p role="status" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {t('offer.expiredNotice')}
            </p>
          )}

          {offer.description && (
            <section className="rounded-2xl border bg-card p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold">{t('offer.description')}</h2>
              <p className="text-sm leading-relaxed text-pretty whitespace-pre-line text-muted-foreground">
                {decodeHtmlEntities(offer.description)}
              </p>
            </section>
          )}

          {eligibility && (
            <section className="rounded-2xl border bg-card p-4 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <CreditCard className="size-4" aria-hidden="true" />
                {t('offer.eligibleCards')}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {eligibility.cardTypes?.map((ct) => (
                  <Badge key={ct} variant="outline" className="text-xs capitalize">
                    {ct}
                  </Badge>
                ))}
                {eligibility.networks?.map((n) => (
                  <Badge key={n} variant="outline" className="text-xs uppercase">
                    {n}
                  </Badge>
                ))}
                {eligibility.includedCards?.map((card) => (
                  <Badge key={card} variant="outline" className="text-xs">
                    {card}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          <LocationSection offer={offer} merchant={merchant} geoLocations={geoLocations} areaOnly={areaOnly} phones={phones} />

          {offer.terms && (
            <section className="rounded-2xl border bg-card p-4 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <FileText className="size-4" aria-hidden="true" />
                {t('offer.terms')}
              </h2>
              <Separator className="mb-3" />
              <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{offer.terms}</p>
            </section>
          )}

          {(prevOffer || nextOffer) && (
            <div className="flex items-center justify-between gap-2 border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                disabled={!prevOffer}
                onClick={() => {
                  if (!prevOffer) return
                  const qs = searchParams?.toString()
                  router.push(`/offers/${prevOffer.id}${qs ? `?${qs}` : ''}`)
                }}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {t('offer.previous')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={!nextOffer}
                onClick={() => {
                  if (!nextOffer) return
                  const qs = searchParams?.toString()
                  router.push(`/offers/${nextOffer.id}${qs ? `?${qs}` : ''}`)
                }}
              >
                {t('offer.next')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>

        <aside className="h-fit space-y-3 rounded-2xl border bg-primary-soft/40 p-4 shadow-sm max-lg:order-first lg:sticky lg:top-24 lg:bg-card">
          {discount ? (
            <div className="space-y-1">
              <DiscountLabel offer={offer} size="lg" />
              <p className="text-xs text-muted-foreground">{t('offer.discountNote')}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{title}</p>
          )}
          <Button
            variant={saved ? 'default' : 'outline'}
            onClick={() => toggleSave(offer.id)}
            className="w-full"
            aria-pressed={saved}
          >
            <Heart className={saved ? 'fill-current' : ''} aria-hidden="true" />
            {saved ? t('offer.saved') : t('offer.save')}
          </Button>
          {offer.valid_to && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" aria-hidden="true" />
              {t('offer.validUntil')} {formatDate(offer.valid_to, lang)}
            </p>
          )}
          {sourceLink}
        </aside>
      </div>
    </div>
  )
}

function PhoneList({ phones }: { phones: string[] }) {
  const { t } = useI18n()
  if (phones.length === 0) return null
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
      <span className="flex items-center gap-1 font-medium text-muted-foreground">
        <Phone className="size-3" aria-hidden="true" />
        {t('offer.contact')}
      </span>
      {phones.map((phone) => (
        <a
          key={phone}
          href={`tel:${phone.replace(/\s+/g, '')}`}
          className="inline-flex items-center rounded-md border bg-card px-2 py-0.5 font-mono text-foreground transition-colors hover:text-primary"
        >
          {phone}
        </a>
      ))}
    </div>
  )
}

function LocationSection({
  offer,
  merchant,
  geoLocations,
  areaOnly,
  phones,
}: {
  offer: OfferDetail
  merchant: string
  geoLocations: NonNullable<Offer['geo_locations']>
  areaOnly: string | null
  phones: string[]
}) {
  const { t } = useI18n()

  if (offer.location_scope === 'ONLINE') {
    return (
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Globe className="size-4 text-primary" aria-hidden="true" />
          {t('location.online')}
        </h2>
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{t('offer.onlineNote')}</p>
        {offer.source_url && isValidUrl(offer.source_url) && (
          <Button variant="outline" size="sm" asChild className="mt-3">
            <a href={offer.source_url} target="_blank" rel="noopener noreferrer" className="gap-1.5">
              <ExternalLink className="size-3.5" aria-hidden="true" />
              {t('offer.redeemOnline')}
            </a>
          </Button>
        )}
      </section>
    )
  }

  if (geoLocations.length > 0) {
    return (
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            {geoLocations.length === 1
              ? t('offer.branchOne')
              : t('offer.branchMany', { count: geoLocations.length })}
          </h2>
          {offer.location_scope && <LocationScopeBadge scope={offer.location_scope} />}
        </div>
        <div className="space-y-2">
          {geoLocations.map((loc, i) => {
            const branchTitle = loc.name ? cleanLocationText(loc.name) : loc.city || merchant
            return (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3 text-sm transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 font-medium text-foreground">
                    <Store className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="truncate">{branchTitle}</span>
                  </div>
                  {loc.address && <p className="mt-0.5 pl-5 text-xs break-words text-muted-foreground">{loc.address}</p>}
                </div>
                <Button variant="outline" size="sm" asChild className="h-8 shrink-0 self-start sm:self-center">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary"
                  >
                    <Navigation className="size-3" aria-hidden="true" />
                    {t('offer.viewMap')}
                  </a>
                </Button>
              </div>
            )
          })}
        </div>
        {offer.merchant_location && (
          <div className="mt-3 border-t pt-3 text-xs text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">{t('offer.outletNotes')}</p>
            <p className="leading-relaxed whitespace-pre-line">{offer.merchant_location}</p>
          </div>
        )}
        <PhoneList phones={phones} />
      </section>
    )
  }

  if (areaOnly) {
    return (
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            {t('location.areaOnly', { area: areaOnly })}
          </h2>
          {offer.location_scope && <LocationScopeBadge scope={offer.location_scope} />}
        </div>
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{t('offer.areaOnlyNote')}</p>
      </section>
    )
  }

  if (offer.location_scope === 'NATIONWIDE') {
    return (
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Globe className="size-4 text-primary" aria-hidden="true" />
          {t('location.nationwide')}
        </h2>
        <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{t('offer.nationwideNote')}</p>
        {offer.merchant_location && (
          <div className="mt-2.5 rounded-xl bg-muted/30 p-2.5 text-xs text-muted-foreground">
            <p className="mb-0.5 font-medium text-foreground">{t('offer.participatingOutlets')}</p>
            <p className="whitespace-pre-line">{offer.merchant_location}</p>
          </div>
        )}
        <Button variant="outline" size="sm" asChild className="mt-3">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant + ' Sri Lanka')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-1.5"
          >
            <Navigation className="size-3.5" aria-hidden="true" />
            {t('offer.openInMaps')}
          </a>
        </Button>
      </section>
    )
  }

  if (offer.merchant_location) {
    return (
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4 text-primary" aria-hidden="true" />
            {t('offer.participatingOutlets')}
          </h2>
          {offer.location_scope && <LocationScopeBadge scope={offer.location_scope} />}
        </div>
        <div className="rounded-xl bg-muted/40 p-3 text-sm leading-relaxed text-foreground">
          <p className="font-medium whitespace-pre-line">{offer.merchant_location}</p>
        </div>
        <PhoneList phones={phones} />
        <Button variant="outline" size="sm" asChild className="mt-3">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(merchant + ' ' + cleanLocationText(offer.merchant_location) + ' Sri Lanka')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="gap-1.5"
          >
            <Navigation className="size-3.5" aria-hidden="true" />
            {t('offer.openInMaps')}
          </a>
        </Button>
      </section>
    )
  }

  return null
}
