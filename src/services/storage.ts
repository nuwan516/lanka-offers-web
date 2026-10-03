import type { CardPreference } from '@/types'

const SAVED_OFFERS_KEY = 'lanka_offers_saved'
const LANGUAGE_KEY = 'lanka_offers_lang'
const CARD_PREFS_KEY = 'lanka_offers_card_prefs'

export function getSavedOfferIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_OFFERS_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function saveOfferId(id: string): void {
  const ids = getSavedOfferIds()
  if (!ids.includes(id)) {
    localStorage.setItem(SAVED_OFFERS_KEY, JSON.stringify([...ids, id]))
  }
}

export function removeSavedOfferId(id: string): void {
  const ids = getSavedOfferIds().filter((i) => i !== id)
  localStorage.setItem(SAVED_OFFERS_KEY, JSON.stringify(ids))
}

export function isOfferSaved(id: string): boolean {
  return getSavedOfferIds().includes(id)
}

export function getLanguage(): string {
  return localStorage.getItem(LANGUAGE_KEY) || 'en'
}

export function setLanguage(lang: string): void {
  localStorage.setItem(LANGUAGE_KEY, lang)
}

export function getCardPreferences(): CardPreference {
  try {
    const raw = localStorage.getItem(CARD_PREFS_KEY)
    return raw ? (JSON.parse(raw) as CardPreference) : {}
  } catch {
    return {}
  }
}

export function setCardPreferences(prefs: CardPreference): void {
  localStorage.setItem(CARD_PREFS_KEY, JSON.stringify(prefs))
}
