import * as React from 'react'

import { fetchOffersPage, type OffersQuery } from '@/services/api/offers'
import type { Offer } from '@/types'

export const PAGE_SIZE = 24

interface PagedState {
  items: Offer[]
  /** Server-reported number of offers matching the query. */
  total: number
  /** Rows requested so far, counted before de-duplication, so the next offset is never wrong. */
  fetched: number
  loading: boolean
  loadingMore: boolean
  error: Error | null
  moreError: Error | null
}

const EMPTY: PagedState = {
  items: [],
  total: 0,
  fetched: 0,
  loading: true,
  loadingMore: false,
  error: null,
  moreError: null,
}

interface Options {
  pageSize?: number
  enabled?: boolean
}

/**
 * Loads offers one server page at a time. The first page replaces the list; each
 * `loadMore()` appends the next page. A failed "load more" keeps what is already
 * on screen and can be retried, and a change of query cancels any request in flight.
 *
 * The API orders by `updated_at DESC` without a unique tiebreaker, so offset paging
 * can occasionally repeat a row across pages; rows are de-duplicated by id.
 */
export function usePagedOffers(query: OffersQuery = {}, { pageSize = PAGE_SIZE, enabled = true }: Options = {}) {
  const queryKey = JSON.stringify(query)
  const [state, setState] = React.useState<PagedState>(EMPTY)
  const [nonce, setNonce] = React.useState(0)
  const stateRef = React.useRef(state)
  stateRef.current = state
  const controllerRef = React.useRef<AbortController | null>(null)

  React.useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    controllerRef.current = controller
    setState(EMPTY)

    fetchOffersPage({ ...(JSON.parse(queryKey) as OffersQuery), limit: pageSize, offset: 0 }, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return
        setState({ ...EMPTY, items: page.items, total: page.total, fetched: page.items.length, loading: false })
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return
        setState({ ...EMPTY, loading: false, error: err })
      })

    return () => controller.abort()
  }, [queryKey, pageSize, enabled, nonce])

  const loadMore = React.useCallback(() => {
    const current = stateRef.current
    const controller = controllerRef.current
    if (!controller || controller.signal.aborted) return
    if (current.loading || current.loadingMore || current.error || current.fetched >= current.total) return

    setState((s) => ({ ...s, loadingMore: true, moreError: null }))
    fetchOffersPage(
      { ...(JSON.parse(queryKey) as OffersQuery), limit: pageSize, offset: current.fetched },
      controller.signal
    )
      .then((page) => {
        if (controller.signal.aborted) return
        setState((s) => {
          const seen = new Set(s.items.map((o) => o.id))
          const items = [...s.items, ...page.items.filter((o) => !seen.has(o.id))]
          // An empty page means the server has nothing more, whatever `total` said.
          const exhausted = page.items.length === 0
          return {
            ...s,
            items,
            total: exhausted ? s.fetched : page.total,
            fetched: s.fetched + page.items.length,
            loadingMore: false,
          }
        })
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return
        setState((s) => ({ ...s, loadingMore: false, moreError: err }))
      })
  }, [queryKey, pageSize])

  const refetch = React.useCallback(() => setNonce((n) => n + 1), [])

  return {
    offers: state.items,
    total: state.total,
    loading: enabled ? state.loading : false,
    loadingMore: state.loadingMore,
    error: state.error,
    moreError: state.moreError,
    hasMore: state.fetched < state.total,
    loadMore,
    refetch,
  }
}
