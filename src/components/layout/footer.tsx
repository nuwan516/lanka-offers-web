'use client'

import Link from 'next/link'
import { useI18n } from '@/i18n'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <p className="text-lg font-bold tracking-tight">
              Lanka<span className="text-primary">Offers</span>
            </p>
            <p className="text-sm text-muted-foreground">{t('footer.about')}</p>
          </div>

          <nav className="flex flex-col gap-2 text-sm">
            <Link href="/explore" className="text-muted-foreground hover:text-foreground">
              {t('nav.explore')}
            </Link>
            <Link href="/merchants" className="text-muted-foreground hover:text-foreground">
              {t('nav.merchants')}
            </Link>
            <Link href="/nearby" className="text-muted-foreground hover:text-foreground">
              {t('nav.nearby')}
            </Link>
            <Link href="/saved" className="text-muted-foreground hover:text-foreground">
              {t('nav.saved')}
            </Link>
          </nav>

          <div className="text-sm text-muted-foreground">
            <p>{t('footer.disclaimer')}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
