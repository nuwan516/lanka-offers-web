import { apiFetch } from './client'
import type { Offer, OfferDetail } from '@/types'

export interface PaginatedApiResponse<T> {
  items?: T[]
  data?: T[]
  offers?: T[]
  total?: number
  limit?: number
  offset?: number
}

export interface OffersQuery {
  status?: string
  bank?: string
  category?: string
  search?: string
  merchant?: string
  locationScope?: string
  limit?: number
  offset?: number
}

export interface NearbyOffersQuery {
  lat: number
  lng: number
  radius?: number
  bank?: string
  category?: string
  search?: string
  limit?: number
  offset?: number
}

export async function fetchOffers(query: OffersQuery = {}): Promise<Offer[]> {
  const params: Record<string, string | number | boolean | undefined> = {
    status: query.status,
    bank: query.bank,
    category: query.category,
    search: query.search,
    merchant: query.merchant,
    locationScope: query.locationScope,
    limit: query.limit,
    offset: query.offset,
  }
  const result = await apiFetch<PaginatedApiResponse<Offer> | Offer[]>('/api/offers', {
    params,
  })
  if (Array.isArray(result)) return result
  if (result && typeof result === 'object') {
    if ('items' in result && Array.isArray(result.items)) return result.items
    if ('data' in result && Array.isArray(result.data)) return result.data
    if ('offers' in result && Array.isArray(result.offers)) return result.offers
  }
  return []
}

export async function fetchNearbyOffers(query: NearbyOffersQuery): Promise<Offer[]> {
  const params: Record<string, string | number | boolean | undefined> = {
    lat: query.lat,
    lng: query.lng,
    radius: query.radius,
    bank: query.bank,
    category: query.category,
    search: query.search,
    limit: query.limit,
    offset: query.offset,
  }
  const result = await apiFetch<PaginatedApiResponse<Offer> | Offer[]>('/api/offers/nearby', {
    params,
  })
  if (Array.isArray(result)) return result
  if (result && typeof result === 'object') {
    if ('items' in result && Array.isArray(result.items)) return result.items
    if ('data' in result && Array.isArray(result.data)) return result.data
    if ('offers' in result && Array.isArray(result.offers)) return result.offers
  }
  return []
}

export async function fetchOffer(id: string): Promise<OfferDetail> {
  return apiFetch<OfferDetail>(`/api/offers/${id}`)
}
