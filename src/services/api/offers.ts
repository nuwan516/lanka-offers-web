import { apiFetch } from './client'
import type { Offer, OfferDetail } from '@/types'

export interface OffersQuery {
  status?: string
  bank?: string
  search?: string
  limit?: number
  offset?: number
}

export async function fetchOffers(query: OffersQuery = {}): Promise<Offer[]> {
  const params: Record<string, string | number | boolean | undefined> = {
    status: query.status,
    bank: query.bank,
    search: query.search,
    limit: query.limit,
    offset: query.offset,
  }
  const result = await apiFetch<Offer[] | { data?: Offer[]; offers?: Offer[] }>('/api/offers', {
    params,
  })
  if (Array.isArray(result)) return result
  if (result && typeof result === 'object') {
    if ('data' in result && Array.isArray(result.data)) return result.data
    if ('offers' in result && Array.isArray(result.offers)) return result.offers
  }
  return []
}

export async function fetchOffer(id: string): Promise<OfferDetail> {
  return apiFetch<OfferDetail>(`/api/offers/${id}`)
}
