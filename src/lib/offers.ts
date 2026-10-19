import type { Offer, LocationScope, CardEligibility, CardPreference } from '@/types'

const COLOMBO_TZ = 'Asia/Colombo'

/** Numeric discount from the API's string field, or null when absent/invalid. */
export function parseDiscount(value?: number | string | null): number | null {
  if (value === undefined || value === null || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(num) && num > 0 ? num : null
}

export function formatDiscount(value?: number | string | null): string | null {
  const num = parseDiscount(value)
  return num === null ? null : `${Math.round(num)}%`
}

const UP_TO_PERCENT = /\bup\s*to\s+(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*%/gi

export interface DiscountPresentation {
  value: string
  /** true only when the bank's own title/description says "up to". */
  isUpTo: boolean
}

/**
 * The API exposes a single discount_percentage with no "up to" flag, so the
 * qualifier is taken from the bank's own wording and never assumed.
 */
export function getDiscountPresentation(offer: Offer): DiscountPresentation | null {
  const value = formatDiscount(offer.discount_percentage)
  if (!value) return null
  const text = `${offer.title ?? ''} ${offer.description ?? ''}`
  const target = Math.round(parseDiscount(offer.discount_percentage) ?? -1)
  // "Up to 50%" counts only when the percentage after it is this offer's discount;
  // "Up to 12 months 0% installments" must not turn a plain discount into "up to".
  const isUpTo = Array.from(text.matchAll(UP_TO_PERCENT)).some((m) => Math.round(parseFloat(m[1])) === target)
  return { value, isUpTo }
}

function colomboDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: COLOMBO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function daysFromTodayColombo(dateString?: string | null): number | null {
  if (!dateString) return null
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null
  const day = (key: string) => Date.parse(`${key}T00:00:00Z`)
  return Math.round((day(colomboDateKey(date)) - day(colomboDateKey(new Date()))) / 86_400_000)
}

export function formatDate(dateString?: string | null, lang = 'en'): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  const localeMap: Record<string, string> = { en: 'en-LK', si: 'si-LK', ta: 'ta-LK' }
  return date.toLocaleDateString(localeMap[lang] || 'en-LK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: COLOMBO_TZ,
  })
}

/** Valid through the whole of the valid_to day (Sri Lanka time). */
export function isExpired(validTo?: string | null): boolean {
  const days = daysFromTodayColombo(validTo)
  return days !== null && days < 0
}

export function isEndingSoon(validTo?: string | null): boolean {
  const days = daysFromTodayColombo(validTo)
  return days !== null && days >= 0 && days <= 7
}

export function daysLeft(validTo?: string | null): number | null {
  const days = daysFromTodayColombo(validTo)
  return days !== null && days >= 0 ? days : null
}

const PHYSICAL_SCOPES: LocationScope[] = [
  'EXPLICIT_BRANCH',
  'MULTIPLE_BRANCHES',
  'SELECTED_OUTLETS',
  'DISTRICT_REGION',
  'NATIONWIDE',
]

export function hasPhysicalLocations(offer: Offer): boolean {
  if (offer.location_scope === 'ONLINE') return false
  const validGeos = getValidGeoLocations(offer)
  if (validGeos.length > 0) return true
  if (offer.merchant_location && offer.merchant_location.trim().length > 0) return true
  if (offer.location_scope && PHYSICAL_SCOPES.includes(offer.location_scope)) return true
  return false
}

export function getValidGeoLocations(offer: Offer): NonNullable<Offer['geo_locations']> {
  if (!offer.geo_locations) return []
  return offer.geo_locations.filter(
    (loc): loc is NonNullable<typeof loc> =>
      typeof loc.lat === 'number' && typeof loc.lng === 'number' && !isNaN(loc.lat) && !isNaN(loc.lng)
  )
}

const UNPINNABLE_SCOPES = new Set(['ONLINE', 'NATIONWIDE', 'SELECTED_OUTLETS', 'UNRESOLVED'])

/**
 * The geocoder sometimes resolves "Colombo, Sri Lanka" to the city centre and
 * reports it as resolved. The API carries no precision flag, so a location whose
 * address is only a place name (no street, no number, at most two words) is
 * treated as area-level: never pinned, never given a distance, because that
 * would present a town centre as a branch. Mirrors the Flutter app's rule.
 */
export function isAreaLevelLocation(loc: { address?: string; name?: string }): boolean {
  const raw = (loc.address || loc.name || '').trim()
  if (!raw) return true
  const place = raw.replace(/,?\s*sri\s*lanka\s*$/i, '').trim()
  if (!place) return true
  return !/\d/.test(place) && !place.includes(',') && place.split(/\s+/).length <= 2
}

/** Locations that are a real branch address rather than just an area. */
export function getConfirmedBranches(offer: Offer): NonNullable<Offer['geo_locations']> {
  return getValidGeoLocations(offer).filter((loc) => !isAreaLevelLocation(loc))
}

/** Only offers with a confirmed branch may be pinned or given a distance. */
export function hasConfirmedBranch(offer: Offer): boolean {
  if (offer.location_scope && UNPINNABLE_SCOPES.has(offer.location_scope)) return false
  return getConfirmedBranches(offer).length > 0
}

/** The area-only place name (without the country), or null if there is a branch. */
export function getAreaOnlyLabel(offer: Offer): string | null {
  const geos = getValidGeoLocations(offer)
  if (geos.length === 0 || getConfirmedBranches(offer).length > 0) return null
  const first = geos[0]
  return (first.address || first.name || '').replace(/,?\s*sri\s*lanka\s*$/i, '').trim() || null
}

export function extractPhoneNumbers(text?: string): string[] {
  if (!text) return []
  const phoneRegex = /(?:\+94|0)(?:7[0-8]|11|2[1-8]|3[1-8]|4[1-7]|5[1-7]|6[3-7]|81|91)\s?\d{3}\s?\d{4}|\b(?:07\d{8}|011\d{7}|0[2-9]\d{7,8})\b/g
  const matches = text.match(phoneRegex) || []
  return Array.from(new Set(matches.map((p) => p.trim())))
}

export function cleanLocationText(text?: string): string {
  if (!text) return ''
  return text
    .replace(/,\s*Sri\s*Lanka/gi, '')
    .replace(/\s*-\s*Contact\s*No\s*:.*$/gi, '')
    .replace(/\s*Tel\s*:.*$/gi, '')
    .trim()
}

export function getConciseLocationLabel(offer: Offer): { text: string; isOnline: boolean; isNationwide: boolean } | null {
  if (offer.location_scope === 'ONLINE') {
    return { text: 'Online', isOnline: true, isNationwide: false }
  }
  if (offer.location_scope === 'NATIONWIDE') {
    return { text: 'Islandwide', isOnline: false, isNationwide: true }
  }

  const areaOnly = getAreaOnlyLabel(offer)
  if (areaOnly) {
    return { text: `Area only: ${areaOnly}`.slice(0, 28), isOnline: false, isNationwide: false }
  }

  const validGeos = getConfirmedBranches(offer)
  if (validGeos.length > 0) {
    const first = validGeos[0]
    const cityName = first.city || first.district || cleanLocationText(first.name || first.address)
    if (cityName) {
      if (validGeos.length > 1) {
        return { text: `${cityName.split(',')[0].slice(0, 16)} +${validGeos.length - 1}`, isOnline: false, isNationwide: false }
      }
      return { text: cityName.split(',')[0].slice(0, 20), isOnline: false, isNationwide: false }
    }
  }

  if (offer.merchant_location) {
    const cleaned = cleanLocationText(offer.merchant_location)
    if (cleaned) {
      const parts = cleaned.split(/[,;\n|]/).map((s) => s.trim()).filter(Boolean)
      if (parts.length > 0) {
        const primary = parts[0]
        if (parts.length > 1) {
          return { text: `${primary.slice(0, 16)} +${parts.length - 1}`, isOnline: false, isNationwide: false }
        }
        return { text: primary.slice(0, 22), isOnline: false, isNationwide: false }
      }
    }
  }

  if (offer.location_scope === 'MULTIPLE_BRANCHES') {
    return { text: 'Multiple Branches', isOnline: false, isNationwide: false }
  }
  if (offer.location_scope === 'SELECTED_OUTLETS') {
    return { text: 'Selected Outlets', isOnline: false, isNationwide: false }
  }

  return null
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

const HTML_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/** The API occasionally passes through HTML entities from bank pages (e.g. &#x27;). */
export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(point) ? String.fromCodePoint(point) : match
    }
    return HTML_ENTITIES[code.toLowerCase()] ?? match
  })
}

export function getMerchantName(offer: Offer): string {
  return decodeHtmlEntities(offer.merchant_name || offer.canonical_merchant || 'Unknown merchant')
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
      return sorted.sort(
        (a, b) => (parseDiscount(b.discount_percentage) ?? 0) - (parseDiscount(a.discount_percentage) ?? 0)
      )
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
