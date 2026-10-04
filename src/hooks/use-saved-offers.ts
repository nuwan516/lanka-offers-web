'use client'

import * as React from 'react'

import {
  getSavedOfferIds,
  saveOfferId,
  removeSavedOfferId,
  isOfferSaved,
} from '@/services/storage'

interface UseSavedOffersState {
  savedIds: string[]
  isSaved: (id: string) => boolean
  toggleSave: (id: string) => void
  refresh: () => void
}

export function useSavedOffers(): UseSavedOffersState {
  const [savedIds, setSavedIds] = React.useState<string[]>([])

  React.useEffect(() => {
    setSavedIds(getSavedOfferIds())
  }, [])

  const refresh = React.useCallback(() => {
    setSavedIds(getSavedOfferIds())
  }, [])

  const isSaved = React.useCallback(
    (id: string) => savedIds.includes(id) || isOfferSaved(id),
    [savedIds]
  )

  const toggleSave = React.useCallback((id: string) => {
    if (isOfferSaved(id)) {
      removeSavedOfferId(id)
    } else {
      saveOfferId(id)
    }
    setSavedIds(getSavedOfferIds())
  }, [])

  return { savedIds, isSaved, toggleSave, refresh }
}
