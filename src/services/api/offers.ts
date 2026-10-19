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
  bank?: string
  category?: string
  search?: string
  merchant?: string
  locationScope?: string
  /** Fetch a single page of this size. Omit to load every matching offer. */
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

export interface OffersPage {
  items: Offer[]
  total: number
}

/** Server-side maximum page size (backend PAGINATION.MAX_LIMIT). */
const MAX_PAGE_SIZE = 500
const CACHE_TTL_MS = 60_000

function unwrap(result: PaginatedApiResponse<Offer> | Offer[]): OffersPage {
  if (Array.isArray(result)) return { items: result, total: result.length }
  const items = result?.items ?? result?.data ?? result?.offers ?? []
  return { items, total: typeof result?.total === 'number' ? result.total : items.length }
}

export async function fetchOffersPage(query: OffersQuery = {}, signal?: AbortSignal): Promise<OffersPage> {
  const result = await apiFetch<PaginatedApiResponse<Offer> | Offer[]>('/api/offers', {
    params: { ...query },
    signal,
  })
  return unwrap(result)
}

const allCache = new Map<string, { at: number; items: Offer[] }>()

/** Every offer matching the query, fetched in server-sized pages. */
export async function fetchAllOffers(query: OffersQuery = {}, signal?: AbortSignal): Promise<Offer[]> {
  const key = JSON.stringify(query)
  const hit = allCache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.items

  const items: Offer[] = []
  let offset = 0
  for (;;) {
    const page = await fetchOffersPage({ ...query, limit: MAX_PAGE_SIZE, offset }, signal)
    items.push(...page.items)
    offset += page.items.length
    if (page.items.length === 0 || offset >= page.total) break
  }
  allCache.set(key, { at: Date.now(), items })
  return items
}

export async function fetchOffers(query: OffersQuery = {}, signal?: AbortSignal): Promise<Offer[]> {
  if (query.limit !== undefined) return (await fetchOffersPage(query, signal)).items
  return fetchAllOffers(query, signal)
}

export async function fetchNearbyOffers(query: NearbyOffersQuery, signal?: AbortSignal): Promise<Offer[]> {
  const result = await apiFetch<PaginatedApiResponse<Offer> | Offer[]>('/api/offers/nearby', {
    params: { ...query },
    signal,
  })
  return unwrap(result).items
}

export async function fetchOffer(id: string, signal?: AbortSignal): Promise<OfferDetail> {
  return apiFetch<OfferDetail>(`/api/offers/${encodeURIComponent(id)}`, { signal })
}
