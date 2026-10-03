import * as React from 'react'

import { fetchBanks } from '@/services/api/banks'
import { fetchMerchants } from '@/services/api/merchants'
import type { Bank, Merchant } from '@/types'

interface UseReferenceDataState {
  banks: Bank[]
  merchants: Merchant[]
  loading: boolean
  error: Error | null
}

export function useReferenceData(): UseReferenceDataState {
  const [banks, setBanks] = React.useState<Bank[]>([])
  const [merchants, setMerchants] = React.useState<Merchant[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    let cancelled = false

    Promise.all([fetchBanks(), fetchMerchants()])
      .then(([banksData, merchantsData]) => {
        if (cancelled) return
        setBanks(banksData)
        setMerchants(merchantsData)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { banks, merchants, loading, error }
}
