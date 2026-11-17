'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useI18n } from '@/i18n'

export default function NotFound() {
  const { t } = useI18n()

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-primary">{t('app.name')}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t('notFound.title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('notFound.body')}</p>
      <Button asChild className="mt-6">
        <Link href="/">{t('notFound.home')}</Link>
      </Button>
    </div>
  )
}
