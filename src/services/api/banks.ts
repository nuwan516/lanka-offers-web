import { apiFetch } from './client'
import type { Bank } from '@/types'

export async function fetchBanks(): Promise<Bank[]> {
  const result = await apiFetch<Bank[] | { data?: Bank[]; banks?: Bank[] }>('/api/banks')
  if (Array.isArray(result)) return result
  if (result && typeof result === 'object') {
    if ('data' in result && Array.isArray(result.data)) return result.data
    if ('banks' in result && Array.isArray(result.banks)) return result.banks
  }
  return []
}
