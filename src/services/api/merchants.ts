import { apiFetch } from './client'
import type { Merchant } from '@/types'

export async function fetchMerchants(): Promise<Merchant[]> {
  const result = await apiFetch<Merchant[] | { data?: Merchant[]; merchants?: Merchant[] }>(
    '/api/merchants'
  )
  if (Array.isArray(result)) return result
  if (result && typeof result === 'object') {
    if ('data' in result && Array.isArray(result.data)) return result.data
    if ('merchants' in result && Array.isArray(result.merchants)) return result.merchants
  }
  return []
}

export async function fetchMerchant(name: string): Promise<Merchant | null> {
  try {
    const result = await apiFetch<Merchant>(`/api/merchants/${encodeURIComponent(name)}`)
    return result || null
  } catch {
    return null
  }
}

