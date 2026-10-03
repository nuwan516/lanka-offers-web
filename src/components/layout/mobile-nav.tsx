import { NavLink } from 'react-router-dom'
import { Home, Compass, MapPin, Heart } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

export function MobileNav() {
  const { t } = useI18n()

  const items = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/explore', label: t('nav.explore'), icon: Compass },
    { to: '/nearby', label: t('nav.nearby'), icon: MapPin },
    { to: '/saved', label: t('nav.saved'), icon: Heart },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
      <div className="grid grid-cols-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )
            }
          >
            <item.icon className="size-5" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
