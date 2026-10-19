import * as React from 'react'

import { fetchOffers, type OffersQuery } from '@/services/api/offers'
import type { Offer } from '@/types'

interface UseOffersState {
  offers: Offer[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * Every offer matching the query (all server pages). Prefer `usePagedOffers` for lists;
 * use this only where the whole set is needed, such as sorting by a field the API cannot sort on.
 */
export function useOffers(query: OffersQuery = {}, enabled = true): UseOffersState {
  const [offers, setOffers] = React.useState<Offer[]>([])
  const [loading, setLoading] = React.useState(enabled)
  const [error, setError] = React.useState<Error | null>(null)
  const [nonce, setNonce] = React.useState(0)
  const queryKey = JSON.stringify(query)

  React.useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchOffers(JSON.parse(queryKey) as OffersQuery, controller.signal)
      .then((data) => {
        setOffers(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return
        setError(err)
        setLoading(false)
      })

    return () => controller.abort()
  }, [queryKey, nonce, enabled])

  const refetch = React.useCallback(() => setNonce((n) => n + 1), [])

  return { offers, loading, error, refetch }
}
