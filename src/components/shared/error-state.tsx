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
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-surface/60 p-10 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-7 text-destructive" />
      </div>
      <div className="max-w-sm space-y-1.5">
        <p className="text-base font-semibold text-foreground">{title || t('common.error')}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{hint || t('common.errorHint')}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1 gap-1.5">
          <RotateCw className="size-3.5" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
