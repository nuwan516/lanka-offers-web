'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Heart, Menu, Search, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LanguageSelector } from '@/components/shared/language-selector'
import { ModeToggle } from '@/components/mode-toggle'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

export function Header() {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname() || ''
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { href: '/explore', label: t('nav.explore') },
    { href: '/nearby', label: t('nav.nearby') },
    { href: '/merchants', label: t('nav.merchants') },
    { href: '/saved', label: t('nav.saved') },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    if (!q) return
    router.push(`/explore?search=${encodeURIComponent(q)}`)
    setMenuOpen(false)
  }

  const searchForm = (
    <form onSubmit={handleSearch} role="search">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('search.placeholder')}
          className="h-9 bg-surface pl-9"
          aria-label={t('search.placeholder')}
        />
      </div>
    </form>
  )

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        {t('nav.skip')}
      </a>
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={t('app.name')}>
          <span
            aria-hidden="true"
            className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
          >
            L
          </span>
          <span className="text-base font-semibold tracking-tight">{t('app.name')}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden w-full max-w-xs md:block">{searchForm}</div>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <LanguageSelector />
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={t('nav.menu')}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t md:hidden">
          <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
            {searchForm}
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium',
                    isActive(item.href) ? 'bg-primary-soft text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.href === '/saved' && <Heart className="size-4" aria-hidden="true" />}
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
