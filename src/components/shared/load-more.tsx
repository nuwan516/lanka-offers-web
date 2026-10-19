'use client'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

interface LoadMoreProps {
  shown: number
  total: number
  hasMore: boolean
  loading?: boolean
  error?: boolean
  onLoadMore: () => void
}

/** Footer for a paged list: how much is shown, a load-more button, and a retry if a page failed. */
export function LoadMore({ shown, total, hasMore, loading, error, onLoadMore }: LoadMoreProps) {
  const { t } = useI18n()
  if (!hasMore && !error) return null

  return (
    <div className="mt-8 flex flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {t('explore.showing', { count: shown, total })}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {t('explore.loadMoreFailed')}
        </p>
      )}
      <Button variant="outline" onClick={onLoadMore} disabled={loading}>
        {loading ? t('common.loadingMore') : error ? t('common.retry') : t('common.loadMore')}
      </Button>
    </div>
  )
}
