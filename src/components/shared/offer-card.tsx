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
  getConciseLocationLabel,
  hasConfirmedBranch,
  getMerchantName,
  isExpired,
} from '@/lib/offers'
import { cn } from '@/lib/utils'
import type { Offer } from '@/types'

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
  // A distance to a town centre is not a distance to a branch.
  const hasDistance =
    offer.distance_km !== undefined && offer.distance_km !== null && hasConfirmedBranch(offer)

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
        'group relative flex h-full flex-col gap-3 rounded-lg border bg-card p-4 transition-colors',
        'hover:border-primary/40 focus-within:border-primary/40',
        expired && 'opacity-70',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {offer.bank ? <BankBadge bankName={offer.bank} /> : <span />}
        <button
          type="button"
          onClick={() => toggleSave(offer.id)}
          aria-pressed={saved}
          aria-label={saved ? t('offer.remove') : t('offer.save')}
          className="relative z-10 -m-2 inline-flex size-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Heart className={cn('size-4', saved && 'fill-current text-destructive')} />
        </button>
      </div>

      <div className="min-w-0 space-y-1">
        <h3 className="truncate text-base font-semibold text-foreground">
          <Link
            href={`/offers/${offer.id}`}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          >
            {merchant}
          </Link>
        </h3>
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{decodeHtmlEntities(offer.title)}</p>
      </div>

      <div className="mt-auto space-y-2 border-t pt-3">
        <DiscountLabel offer={offer} />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {hasDistance ? (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <MapPin className="size-3.5 text-primary" aria-hidden="true" />
              {formatDistance(offer.distance_km as number)}
            </span>
          ) : locationLabel ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              {locationLabel.isOnline ? (
                <Globe className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">{locationLabel.text}</span>
            </span>
          ) : null}
          {offer.card_type && <span>{offer.card_type}</span>}
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
    </article>
  )
}
