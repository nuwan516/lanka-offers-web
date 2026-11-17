import { bankTone, getBankInfo } from '@/lib/banks'
import { cn } from '@/lib/utils'

interface BankBadgeProps {
  bankName: string
  className?: string
}

export function BankMonogram({
  bankName,
  className,
}: {
  bankName: string
  className?: string
}) {
  const info = getBankInfo(bankName)
  const name = info?.name ?? bankName
  const mark = info?.short ?? name.slice(0, 3).toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex h-5 min-w-8 shrink-0 items-center justify-center rounded-md px-1 text-[10px] font-semibold tracking-wide',
        `bank-tone-${bankTone(bankName)}`,
        className
      )}
    >
      {mark}
    </span>
  )
}

export function BankBadge({ bankName, className }: BankBadgeProps) {
  const info = getBankInfo(bankName)
  const name = info?.name ?? bankName

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2 text-xs text-muted-foreground', className)}>
      <BankMonogram bankName={bankName} />
      <span className="truncate">{name}</span>
    </span>
  )
}
