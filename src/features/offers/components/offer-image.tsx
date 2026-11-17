'use client'

import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import { API_BASE_URL } from '@/services/api/client'
import { cn } from '@/lib/utils'

interface OfferImageProps {
  imageUrl?: string | null
  alt: string
  className?: string
  priority?: boolean
}

function resolveImageUrl(value?: string | null): string | null {
  if (!value) return null
  // Root-relative paths use the same-origin /api rewrite, which is the default setup.
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try {
    const base = API_BASE_URL ? `${API_BASE_URL.replace(/\/$/, '')}/` : undefined
    const resolved = base ? new URL(value, base) : new URL(value)
    return resolved.protocol === 'http:' || resolved.protocol === 'https:' ? resolved.toString() : null
  } catch {
    return null
  }
}

export function OfferImage({ imageUrl, alt, className, priority = false }: OfferImageProps) {
  const [failed, setFailed] = useState(false)
  const src = failed ? null : resolveImageUrl(imageUrl)

  return (
    <div className={cn('relative aspect-[16/9] overflow-hidden rounded-md bg-muted', className)}>
      {src ? (
        // Native image is intentional: approved assets can be served by the separately deployed public API.
        // Dimensions/aspect ratio are reserved by the wrapper to prevent layout shift.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div role="img" aria-label={`${alt} image unavailable`} className="flex h-full items-center justify-center text-muted-foreground">
          <ImageOff className="size-7" aria-hidden="true" />
        </div>
      )}
    </div>
  )
}
