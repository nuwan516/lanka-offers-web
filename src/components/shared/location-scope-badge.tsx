import { Globe, MapPin, Store, Navigation, HelpCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'
import type { LocationScope } from '@/types'

interface LocationScopeBadgeProps {
  scope?: LocationScope
  className?: string
}

const scopeIconMap: Record<string, typeof Globe> = {
  ONLINE: Globe,
  NATIONWIDE: Globe,
  EXPLICIT_BRANCH: MapPin,
  MULTIPLE_BRANCHES: Store,
  SELECTED_OUTLETS: Store,
  DISTRICT_REGION: Navigation,
  UNRESOLVED: HelpCircle,
}

export function LocationScopeBadge({ scope, className }: LocationScopeBadgeProps) {
  const { t } = useI18n()

  if (!scope) return null

  const key = `location.${scope
    .split('_')
    .map((w, i) => (i === 0 ? w.toLowerCase() : w[0] + w.slice(1).toLowerCase()))
    .join('')}`

  const label = t(key)
  const Icon = scopeIconMap[scope] || HelpCircle

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs text-muted-foreground',
        className
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  )
}
