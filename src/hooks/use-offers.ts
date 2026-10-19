import * as React from 'react'

import { fetchOffers, type OffersQuery } from '@/services/api/offers'
import type { Offer } from '@/types'

interface UseOffersState {
  offers: Offer[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function useOffers(query: OffersQuery = {}): UseOffersState {
  const [offers, setOffers] = React.useState<Offer[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const [nonce, setNonce] = React.useState(0)
  const queryKey = JSON.stringify(query)

  React.useEffect(() => {
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
  }, [queryKey, nonce])

  const refetch = React.useCallback(() => setNonce((n) => n + 1), [])

  return { offers, loading, error, refetch }
}
