'use client'

import Link from 'next/link'
import { Calendar, Heart, MapPin, Globe } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BankBadge } from '@/components/shared/bank-badge'
import { LocationScopeBadge } from '@/components/shared/location-scope-badge'
import { useI18n } from '@/i18n'
import { useSavedOffers } from '@/hooks/use-saved-offers'
import {
  formatDiscount,
  formatDate,
  formatDistance,
  isEndingSoon,
  isExpired,
  getMerchantName,
  getConciseLocationLabel,
} from '@/lib/offers'
import type { Offer } from '@/types'
import { cn } from '@/lib/utils'

interface OfferCardProps {
  offer: Offer
  className?: string
}

export function OfferCard({ offer, className }: OfferCardProps) {
  const { t, lang } = useI18n()
  const { isSaved, toggleSave } = useSavedOffers()
  const saved = isSaved(offer.id)
  const merchant = getMerchantName(offer)
  const discount = formatDiscount(offer.discount_percentage)
  const endingSoon = isEndingSoon(offer.valid_to)
  const expired = isExpired(offer.valid_to)
  const locationLabel = getConciseLocationLabel(offer)


  return (
    <Card className={cn(
      'group relative gap-3 overflow-hidden p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
      className
    )}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200">{merchant}</p>
          {offer.bank && <BankBadge bankName={offer.bank} className="mt-1.5" />}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.preventDefault()
            toggleSave(offer.id)
          }}
          className="transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label={saved ? t('offer.remove') : t('offer.save')}
        >
          <Heart className={cn('size-4 transition-all duration-200', saved && 'fill-current text-destructive')} />
        </Button>
      </div>

      <Link href={`/offers/${offer.id}`} className="relative block">
        {discount && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
              {discount}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {t('offer.discountOff')}
            </span>
          </div>
        )}

        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground group-hover:text-foreground transition-colors duration-200">
          {offer.title}
        </p>
      </Link>

      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {offer.distance_km !== undefined && offer.distance_km !== null ? (
          <Badge variant="outline" className="text-[10px] text-primary border-primary/30 flex items-center gap-1 font-medium bg-primary/5">
            <MapPin className="size-2.5" />
            {formatDistance(offer.distance_km)}
          </Badge>
        ) : locationLabel ? (
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60 flex items-center gap-1 font-normal bg-muted/40 hover:bg-muted/60 transition-colors">
            {locationLabel.isOnline ? <Globe className="size-2.5 text-primary" /> : <MapPin className="size-2.5 text-primary" />}
            <span className="truncate max-w-[150px]">{locationLabel.text}</span>
          </Badge>
        ) : null}
        {offer.category && (
          <Badge variant="secondary" className="text-[10px] transition-colors duration-200 group-hover:bg-primary/10">
            {offer.category}
          </Badge>
        )}
        {offer.location_scope && !locationLabel && (
          <LocationScopeBadge scope={offer.location_scope} />
        )}
        {offer.valid_to && !expired && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            {t('offer.validUntil')} {formatDate(offer.valid_to, lang)}
          </span>
        )}
      </div>


      {endingSoon && (
        <Badge variant="destructive" className="relative w-fit text-[10px] animate-pulse">
          {t('offer.endingSoon')}
        </Badge>
      )}
    </Card>
  )
}
