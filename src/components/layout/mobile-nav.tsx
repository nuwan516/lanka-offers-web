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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background md:hidden">
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
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
