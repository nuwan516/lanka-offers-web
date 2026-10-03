import { Link } from 'react-router-dom'
import { Calendar, Heart } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BankBadge } from '@/components/shared/bank-badge'
import { LocationScopeBadge } from '@/components/shared/location-scope-badge'
import { useI18n } from '@/i18n'
import { useSavedOffers } from '@/hooks/use-saved-offers'
import { formatDiscount, formatDate, isEndingSoon, isExpired, getMerchantName } from '@/lib/offers'
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

  return (
    <Card className={cn('group relative gap-3 p-4 transition-shadow hover:shadow-md', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{merchant}</p>
          {offer.bank && <BankBadge bankName={offer.bank} className="mt-1.5" />}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.preventDefault()
            toggleSave(offer.id)
          }}
          aria-label={saved ? t('offer.remove') : t('offer.save')}
        >
          <Heart className={cn('size-4', saved && 'fill-current text-destructive')} />
        </Button>
      </div>

      <Link to={`/offers/${offer.id}`} className="block">
        {discount && (
          <div className="mb-2 flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {discount}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {t('offer.discountOff')}
            </span>
          </div>
        )}

        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
          {offer.title}
        </p>
      </Link>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {offer.category && (
          <Badge variant="secondary" className="text-[10px]">
            {offer.category}
          </Badge>
        )}
        {offer.location_scope && (
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
        <Badge variant="destructive" className="w-fit text-[10px]">
          {t('offer.endingSoon')}
        </Badge>
      )}
    </Card>
  )
}
