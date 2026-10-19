import * as React from 'react'

import { fetchMerchants } from '@/services/api/merchants'

let cache: { at: number; categories: string[] } | null = null
const TTL_MS = 10 * 60_000

/**
 * Category options for the filters. The API has no categories endpoint and the
 * offers list is now paged, so they are derived from the merchants directory
 * (one small request, cached) ordered by how many merchants use each.
 */
export function useCategories(): string[] {
  const [categories, setCategories] = React.useState<string[]>(cache?.categories ?? [])

  React.useEffect(() => {
    if (cache && Date.now() - cache.at < TTL_MS) return
    let cancelled = false
    fetchMerchants()
      .then((merchants) => {
        const counts = new Map<string, number>()
        for (const m of merchants) {
          const c = m.category?.trim()
          if (c && c.toLowerCase() !== 'all') counts.set(c, (counts.get(c) ?? 0) + 1)
        }
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c)
        cache = { at: Date.now(), categories: sorted }
        if (!cancelled) setCategories(sorted)
      })
      .catch(() => {
        // Filters still work without the list; the category select just has no options.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return categories
}
