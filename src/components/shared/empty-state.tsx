import { SearchX } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  hint?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, hint, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-5" aria-hidden="true" />
      </span>
      <div className="max-w-sm space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
