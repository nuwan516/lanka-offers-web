'use client'

import { Languages, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n, type Language } from '@/i18n'

export function LanguageSelector() {
  const { lang, setLang, t } = useI18n()

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: t('language.english') },
    { code: 'si', label: t('language.sinhala') },
    { code: 'ta', label: t('language.tamil') },
  ]

  const current = languages.find((l) => l.code === lang)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Languages className="size-4" />
          <span className="hidden sm:inline">{current?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className="gap-2"
          >
            <Check className={`size-4 ${l.code === lang ? 'opacity-100' : 'opacity-0'}`} />
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
