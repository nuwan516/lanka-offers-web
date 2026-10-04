import type { CardPreference } from '@/types'

const SAVED_OFFERS_KEY = 'lanka_offers_saved'
const LANGUAGE_KEY = 'lanka_offers_lang'
const CARD_PREFS_KEY = 'lanka_offers_card_prefs'

const isBrowser = typeof window !== 'undefined'

export function getSavedOfferIds(): string[] {
  if (!isBrowser) return []
  try {
    const raw = localStorage.getItem(SAVED_OFFERS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function saveOfferId(id: string): void {
  if (!isBrowser) return
  const ids = getSavedOfferIds()
  if (!ids.includes(id)) {
    localStorage.setItem(SAVED_OFFERS_KEY, JSON.stringify([...ids, id]))
  }
}

export function removeSavedOfferId(id: string): void {
  if (!isBrowser) return
  const ids = getSavedOfferIds().filter((i) => i !== id)
  localStorage.setItem(SAVED_OFFERS_KEY, JSON.stringify(ids))
}

export function isOfferSaved(id: string): boolean {
  if (!isBrowser) return false
  return getSavedOfferIds().includes(id)
}

export function getLanguage(): string {
  if (!isBrowser) return 'en'
  try {
    return localStorage.getItem(LANGUAGE_KEY) || 'en'
  } catch {
    return 'en'
  }
}

export function setLanguage(lang: string): void {
  if (!isBrowser) return
  try {
    localStorage.setItem(LANGUAGE_KEY, lang)
  } catch {}
}

export function getCardPreferences(): CardPreference {
  if (!isBrowser) return {}
  try {
    const raw = localStorage.getItem(CARD_PREFS_KEY)
    return raw ? (JSON.parse(raw) as CardPreference) : {}
  } catch {
    return {}
  }
}

export function setCardPreferences(prefs: CardPreference): void {
  if (!isBrowser) return
  try {
    localStorage.setItem(CARD_PREFS_KEY, JSON.stringify(prefs))
  } catch {}
}
