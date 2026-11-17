'use client'

import * as React from 'react'
import { Loader2, Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  onPendingChange?: (pending: boolean) => void
}

export function SearchInput({ value, onChange, placeholder, ariaLabel, onPendingChange }: SearchInputProps) {
  const { t } = useI18n()
  const [local, setLocal] = React.useState(value)
  const focused = React.useRef(false)
  const onChangeRef = React.useRef(onChange)
  const onPendingRef = React.useRef(onPendingChange)
  onChangeRef.current = onChange
  onPendingRef.current = onPendingChange

  const pending = local !== value

  React.useEffect(() => {
    if (!focused.current) setLocal(value)
  }, [value])

  React.useEffect(() => {
    onPendingRef.current?.(pending)
  }, [pending])

  React.useEffect(() => {
    if (local === value) return
    const timer = setTimeout(() => onChangeRef.current(local), 280)
    return () => clearTimeout(timer)
  }, [local, value])

  const label = ariaLabel || placeholder || t('search.placeholder')

  return (
    <div className="relative flex-1">
      {pending ? (
        <Loader2
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary motion-safe:animate-spin"
          aria-hidden="true"
        />
      ) : (
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      )}
      <Input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onFocus={() => {
          focused.current = true
        }}
        onBlur={() => {
          focused.current = false
        }}
        placeholder={placeholder || t('search.placeholder')}
        className="h-11 rounded-xl bg-card pr-10 pl-9"
        aria-label={label}
        aria-busy={pending}
      />
      {local && (
        <button
          type="button"
          onClick={() => {
            setLocal('')
            onChangeRef.current('')
          }}
          className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={t('search.clear')}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
