import { Inbox } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  hint?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, hint, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <div className="space-y-1">
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
