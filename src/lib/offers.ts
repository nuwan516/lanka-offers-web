import type { Offer, LocationScope, CardEligibility, CardPreference } from '@/types'

export function formatDiscount(value?: number | string): string | null {
  if (value === undefined || value === null || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return null
  return `${Math.round(num)}%`
}

export function formatDate(dateString?: string, lang = 'en'): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const localeMap: Record<string, string> = { en: 'en-LK', si: 'si-LK', ta: 'ta-LK' }
  return date.toLocaleDateString(localeMap[lang] || 'en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function isEndingSoon(validTo?: string): boolean {
  if (!validTo) return false
  const date = new Date(validTo)
  if (isNaN(date.getTime())) return false
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= 7
}

export function isExpired(validTo?: string): boolean {
  if (!validTo) return false
  const date = new Date(validTo)
  if (isNaN(date.getTime())) return false
  return date.getTime() < Date.now()
}

const PHYSICAL_SCOPES: LocationScope[] = ['EXPLICIT_BRANCH', 'MULTIPLE_BRANCHES', 'DISTRICT_REGION']

export function hasPhysicalLocations(offer: Offer): boolean {
  const scope = offer.location_scope
  if (scope && PHYSICAL_SCOPES.includes(scope)) {
    return !!(offer.geo_locations && offer.geo_locations.length > 0)
  }
  return false
}

export function getValidGeoLocations(offer: Offer): NonNullable<Offer['geo_locations']> {
  if (!offer.geo_locations) return []
  return offer.geo_locations.filter(
    (loc): loc is NonNullable<typeof loc> =>
      typeof loc.lat === 'number' && typeof loc.lng === 'number' && !isNaN(loc.lat) && !isNaN(loc.lng)
  )
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatDistance(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000)
    return `${meters} m`
  }
  return `${km.toFixed(1)} km`
}

export type CardMatchResult = 'MATCH' | 'MISMATCH' | 'UNKNOWN'

export function matchCardEligibility(
  eligibility: CardEligibility | undefined,
  prefs: CardPreference
): CardMatchResult {
  if (!prefs.bank && !prefs.cardType && !prefs.network) return 'UNKNOWN'
  if (!eligibility) return 'UNKNOWN'

  const checks: boolean[] = []
  let hasAnyData = false

  if (prefs.bank) {
    hasAnyData = true
  }

  if (prefs.cardType && eligibility.cardTypes && eligibility.cardTypes.length > 0) {
    hasAnyData = true
    const typeMatch = eligibility.cardTypes.some((ct) =>
      ct.toLowerCase().includes(prefs.cardType!)
    )
    checks.push(typeMatch)
  }

  if (prefs.network && eligibility.networks && eligibility.networks.length > 0) {
    hasAnyData = true
    const netMatch = eligibility.networks.some((nw) =>
      nw.toLowerCase().includes(prefs.network!.toLowerCase())
    )
    checks.push(netMatch)
  }

  if (!hasAnyData || checks.length === 0) return 'UNKNOWN'
  return checks.every((c) => c) ? 'MATCH' : 'MISMATCH'
}

export function deriveCategories(offers: Offer[]): string[] {
  const set = new Set<string>()
  for (const offer of offers) {
    if (offer.category && offer.category.trim()) {
      set.add(offer.category.trim())
    }
  }
  return Array.from(set).sort()
}

export function deriveCardTypes(offers: Offer[]): string[] {
  const set = new Set<string>()
  for (const offer of offers) {
    if (offer.card_type && offer.card_type.trim()) {
      set.add(offer.card_type.trim())
    }
  }
  return Array.from(set).sort()
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function getMerchantName(offer: Offer): string {
  return offer.merchant_name || offer.canonical_merchant || 'Unknown merchant'
}

export function sortOffers(offers: Offer[], sortBy: string): Offer[] {
  const sorted = [...offers]
  switch (sortBy) {
    case 'endingSoon':
      return sorted.sort((a, b) => {
        const da = a.valid_to ? new Date(a.valid_to).getTime() : Infinity
        const db = b.valid_to ? new Date(b.valid_to).getTime() : Infinity
        return da - db
      })
    case 'discount':
      return sorted.sort((a, b) => {
        const pa = typeof a.discount_percentage === 'number' ? a.discount_percentage : 0
        const pb = typeof b.discount_percentage === 'number' ? b.discount_percentage : 0
        return pb - pa
      })
    default:
      return sorted
  }
}

export function filterOffers(
  offers: Offer[],
  filters: {
    bank?: string
    category?: string
    cardType?: string
    locationScope?: string
    search?: string
  }
): Offer[] {
  return offers.filter((offer) => {
    if (filters.bank && offer.bank?.toLowerCase() !== filters.bank.toLowerCase()) return false
    if (filters.category && offer.category !== filters.category) return false
    if (filters.cardType && offer.card_type !== filters.cardType) return false
    if (filters.locationScope && offer.location_scope !== filters.locationScope) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const haystack = [
        offer.title,
        offer.merchant_name,
        offer.canonical_merchant,
        offer.bank,
        offer.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })
}
