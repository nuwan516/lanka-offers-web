import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Heart, Menu, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LanguageSelector } from '@/components/shared/language-selector'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function Header() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    { to: '/', label: t('nav.home') },
    { to: '/explore', label: t('nav.explore') },
    { to: '/nearby', label: t('nav.nearby') },
    { to: '/merchants', label: t('nav.merchants') },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      navigate(`/explore?search=${encodeURIComponent(search.trim())}`)
      setMobileMenuOpen(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 lg:h-16">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-foreground">
            Lanka<span className="text-primary">Offers</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
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
            <Link to="/saved" aria-label={t('nav.saved')}>
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
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/saved"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50'
                  )
                }
              >
                {t('nav.saved')}
              </NavLink>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
