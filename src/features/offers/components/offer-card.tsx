'use client'

import Link from 'next/link'
import { Globe, Heart, MapPin } from 'lucide-react'

import { BankBadge } from '@/components/shared/bank-badge'
import { DiscountLabel } from '@/components/shared/discount-badge'
import { useI18n } from '@/i18n'
import { useSavedOffers } from '@/hooks/use-saved-offers'
import {
  daysLeft,
  decodeHtmlEntities,
  formatDate,
  formatDistance,
  getAreaOnlyLabel,
  getConciseLocationLabel,
  hasConfirmedBranch,
  getMerchantName,
  isExpired,
} from '@/lib/offers'
import { cn } from '@/lib/utils'
import type { Offer } from '@/types'
import { OfferImage } from './offer-image'

interface OfferCardProps {
  offer: Offer
  className?: string
}

export function OfferCard({ offer, className }: OfferCardProps) {
  const { t, lang } = useI18n()
  const { isSaved, toggleSave } = useSavedOffers()
  const saved = isSaved(offer.id)
  const merchant = getMerchantName(offer)
  const expired = isExpired(offer.valid_to)
  const remaining = daysLeft(offer.valid_to)
  const locationLabel = getConciseLocationLabel(offer)
  const areaOnly = getAreaOnlyLabel(offer)
  // A distance to a town centre is not a distance to a branch.
  const hasDistance =
    offer.distance_km !== undefined && offer.distance_km !== null && hasConfirmedBranch(offer)

  const place = offer.location_scope === 'ONLINE'
    ? { text: t('location.onlineShort'), online: true }
    : offer.location_scope === 'NATIONWIDE'
      ? { text: t('location.nationwideShort'), online: false }
      : areaOnly
        ? { text: t('location.areaOnly', { area: areaOnly }), online: false }
        : locationLabel
          ? { text: locationLabel.text, online: locationLabel.isOnline }
          : null

  const validity = expired
    ? t('offer.expired')
    : remaining === 0
      ? t('offer.lastDay')
      : offer.valid_to
        ? `${t('offer.validUntil')} ${formatDate(offer.valid_to, lang)}`
        : null

  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-xl border bg-card shadow-sm transition duration-200',
        'motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-md',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        expired && 'opacity-75',
        className
      )}
    >
      <div className="relative">
        <OfferImage imageUrl={offer.image_url} alt={`${merchant} promotion`} className="aspect-[16/10] rounded-none rounded-t-xl" />
        <DiscountLabel
          offer={offer}
          size="sm"
          className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-full bg-card/95 px-2.5 py-1 shadow-sm ring-1 ring-foreground/10"
        />
        <button
          type="button"
          onClick={() => toggleSave(offer.id)}
          aria-pressed={saved}
          aria-label={saved ? t('offer.remove') : t('offer.save')}
          className="absolute top-2 right-2 z-10 inline-flex size-10 items-center justify-center rounded-full bg-card/95 text-muted-foreground shadow-sm ring-1 ring-foreground/10 transition-colors hover:text-foreground"
        >
          <Heart className={cn('size-4 transition-transform', saved && 'scale-110 fill-current text-destructive')} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {offer.bank ? <BankBadge bankName={offer.bank} /> : null}
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-base font-semibold text-foreground">
            <Link
              href={`/offers/${offer.id}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {merchant}
            </Link>
          </h3>
          <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
            {decodeHtmlEntities(offer.title)}
          </p>
        </div>

        <div className="mt-auto space-y-1.5 border-t pt-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {hasDistance ? (
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                {formatDistance(offer.distance_km as number)}
              </span>
            ) : place ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                {place.online ? (
                  <Globe className="size-3.5 shrink-0" aria-hidden="true" />
                ) : (
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">{place.text}</span>
              </span>
            ) : null}
            {offer.card_type && <span className="truncate">{offer.card_type}</span>}
          </div>
          {validity && (
            <p
              className={cn(
                'text-xs text-muted-foreground',
                expired && 'font-medium text-destructive',
                !expired && remaining !== null && remaining <= 7 && 'font-medium text-warning'
              )}
            >
              {validity}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
