import * as React from 'react'

import en from '@/i18n/en.json'
import si from '@/i18n/si.json'
import ta from '@/i18n/ta.json'
import { getLanguage, setLanguage as persistLanguage } from '@/services/storage'

export type Language = 'en' | 'si' | 'ta'

const messages: Record<Language, Record<string, string>> = { en, si, ta }

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = React.createContext<I18nContextValue | undefined>(undefined)

function detectInitialLang(): Language {
  const stored = getLanguage()
  if (stored === 'en' || stored === 'si' || stored === 'ta') return stored
  return 'en'
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''))
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Language>(detectInitialLang)

  const setLang = React.useCallback((next: Language) => {
    persistLanguage(next)
    setLangState(next)
    document.documentElement.lang = next
  }, [])

  React.useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const msg = messages[lang]?.[key] ?? messages.en[key] ?? key
      return interpolate(msg, vars)
    },
    [lang]
  )

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = React.useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
