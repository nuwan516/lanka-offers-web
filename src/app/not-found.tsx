import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <h2 className="text-2xl font-bold tracking-tight">Page Not Found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Could not find the requested page.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  )
}
