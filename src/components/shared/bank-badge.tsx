import { cn } from '@/lib/utils'

interface BankBadgeProps {
  bankName: string
  className?: string
}

export function BankBadge({ bankName, className }: BankBadgeProps) {
  const initials = bankName
    .split(/\s+/)
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground',
        className
      )}
    >
      <span className="inline-flex size-4 items-center justify-center rounded-sm bg-foreground/10 text-[9px] font-bold">
        {initials}
      </span>
      {bankName}
    </span>
  )
}
