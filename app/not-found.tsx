import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <p className="text-7xl font-bold text-[--color-primary]">404</p>
      <h1 className="text-2xl font-semibold text-[--color-foreground]">Page not found</h1>
      <p className="text-[--color-muted-foreground]">
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    </div>
  )
}
