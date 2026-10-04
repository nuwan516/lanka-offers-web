'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Heart, Menu, Search } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LanguageSelector } from '@/components/shared/language-selector'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'

export function Header() {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { href: '/', label: t('nav.home') },
    { href: '/explore', label: t('nav.explore') },
    { href: '/nearby', label: t('nav.nearby') },
    { href: '/merchants', label: t('nav.merchants') },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/explore?search=${encodeURIComponent(search.trim())}`)
      setMobileMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 lg:h-16">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-foreground">
            Lanka<span className="text-primary">Offers</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
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
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <form onSubmit={handleSearch} className="hidden flex-1 md:block md:max-w-xs lg:max-w-sm">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search.placeholder')}
              className="pl-9 transition-all duration-200 focus:shadow-md focus:ring-2 focus:ring-primary/20"
              aria-label={t('search.placeholder')}
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild className="hidden md:inline-flex">
            <Link href="/saved" aria-label={t('nav.saved')}>
              <Heart className="size-4" />
            </Link>
          </Button>
          <LanguageSelector />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground transition-colors duration-200" />
                <Input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search.placeholder')}
                  className="pl-9 transition-all duration-200 focus:shadow-md focus:ring-2 focus:ring-primary/20"
                  aria-label={t('search.placeholder')}
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1 pt-2">
              {navItems.map((item) => {
                const currentPath = pathname || ''
                const isActive =
                  item.href === '/'
                    ? currentPath === '/'
                    : currentPath === item.href || currentPath.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50'
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <Link
                href="/saved"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium',
                  (pathname || '') === '/saved'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50'
                )}
              >
                {t('nav.saved')}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
