'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, MapPin, Heart } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'

export function MobileNav() {
  const { t } = useI18n()
  const pathname = usePathname()

  const items = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/explore', label: t('nav.explore'), icon: Compass },
    { href: '/nearby', label: t('nav.nearby'), icon: MapPin },
    { href: '/saved', label: t('nav.saved'), icon: Heart },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label={t('nav.menu')}
    >
      <div className="grid grid-cols-4">
        {items.map((item) => {
          const currentPath = pathname || ''
          const isActive =
            item.href === '/'
              ? currentPath === '/'
              : currentPath === item.href || currentPath.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex min-w-0 flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-3 top-0 h-0.5 rounded-full',
                  isActive ? 'bg-primary' : 'bg-transparent'
                )}
              />
              <item.icon className="size-5" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
