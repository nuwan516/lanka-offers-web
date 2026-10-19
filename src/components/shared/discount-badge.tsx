'use client'

import { useI18n } from '@/i18n'
import { getDiscountPresentation } from '@/lib/offers'
import { cn } from '@/lib/utils'
import type { Offer } from '@/types'

interface DiscountLabelProps {
  offer: Offer
  size?: 'md' | 'lg'
  className?: string
}

/**
 * Renders the discount exactly as the source states it: "Up to 30% off" only
 * when the bank's own wording says "up to", otherwise "30% off".
 */
export function DiscountLabel({ offer, size = 'md', className }: DiscountLabelProps) {
  const { t } = useI18n()
  const discount = getDiscountPresentation(offer)
  if (!discount) return null

  const text = t(discount.isUpTo ? 'offer.discountUpTo' : 'offer.discountFixed', {
    value: discount.value,
  })

  return (
    <p
      className={cn(
        'font-semibold tracking-tight text-primary',
        size === 'lg' ? 'text-3xl' : 'text-xl',
        className
      )}
    >
      {text}
    </p>
  )
}
