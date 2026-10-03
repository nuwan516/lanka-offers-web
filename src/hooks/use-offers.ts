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

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchOffers(query)
      .then((data) => {
        if (!cancelled) {
          setOffers(data)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(query), nonce])

  const refetch = React.useCallback(() => setNonce((n) => n + 1), [])

  return { offers, loading, error, refetch }
}
