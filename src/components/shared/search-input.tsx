import * as React from 'react'
import { Search, X } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { useI18n } from '@/i18n'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  const { t } = useI18n()
  const [local, setLocal] = React.useState(value)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (local !== value) onChange(local)
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local])

  React.useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <div className="relative flex-1">
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder || t('search.placeholder')}
        className="pl-9 pr-9"
        aria-label={t('search.placeholder')}
      />
      {local && (
        <button
          onClick={() => {
            setLocal('')
            onChange('')
          }}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={t('search.clear')}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
