export interface CardEligibility {
  cardTypes?: string[]
  networks?: string[]
  includedCards?: string[]
  excludedCards?: string[]
  restrictions?: string[]
}

export interface GeoLocation {
  lat: number
  lng: number
  name?: string
  address?: string
  district?: string
  city?: string
  placeId?: string
  confidence?: number
}

export type LocationScope =
  | 'EXPLICIT_BRANCH'
  | 'MULTIPLE_BRANCHES'
  | 'SELECTED_OUTLETS'
  | 'DISTRICT_REGION'
  | 'NATIONWIDE'
  | 'ONLINE'
  | 'UNRESOLVED'
  | string

export type OfferStatus = 'active' | 'inactive' | 'expired' | string

export interface Offer {
  id: string
  unique_id?: string
  bank: string
  source_url?: string
  title: string
  category?: string
  card_type?: string
  merchant_name?: string
  merchant_location?: string
  canonical_merchant?: string
  location_scope?: LocationScope
  discount_percentage?: number | string
  valid_from?: string
  valid_to?: string
  card_eligibility?: CardEligibility
  geo_locations?: GeoLocation[]
  geo_status?: string
  db_status?: OfferStatus
  description?: string
  distance_km?: number
  terms?: string
  image_url?: string
}

export interface OfferDetail extends Offer {
  terms?: string
  description?: string
  original_offer?: Record<string, unknown>
  images?: string[]
  physical_locations?: GeoLocation[]
}

export interface Merchant {
  name: string
  canonical_merchant?: string
  category?: string | null
  offer_count?: number
  bank_count?: number
  banks?: string[]
  aliases?: string[]
  observed_names?: string[]
  observed_scopes?: string[]
}

export interface Bank {
  id?: string
  name: string
  code?: string
  logo_url?: string
  slug?: string
}

export interface ApiError {
  message: string
  status?: number
  code?: string
}

export interface CardPreference {
  bank?: string
  cardType?: 'credit' | 'debit' | ''
  network?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total?: number
  limit?: number
  offset?: number
  has_more?: boolean
}
