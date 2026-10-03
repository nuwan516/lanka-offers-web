import { AlertCircle, RotateCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

interface ErrorStateProps {
  title?: string
  hint?: string
  onRetry?: () => void
}

export function ErrorState({ title, hint, onRetry }: ErrorStateProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <AlertCircle className="size-8 text-muted-foreground" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title || t('common.error')}</p>
        <p className="text-sm text-muted-foreground">{hint || t('common.errorHint')}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RotateCw className="size-3.5" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
