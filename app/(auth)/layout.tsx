import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[--color-background-subtle] flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center px-6 shrink-0">
        <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] rounded-sm">
          {/* Logotype */}
          <div className="flex items-center justify-center size-8 rounded-lg bg-[--color-primary]">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 4h10M3 8h7M3 12h4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-base font-bold text-[--color-foreground] tracking-tight">
            VendorFlow
          </span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl bg-[--color-card] border border-[--color-border] shadow-lg px-8 py-10">
            {children}
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-[--color-foreground-subtle]">
            By using VendorFlow you agree to our{' '}
            <Link
              href="/legal/terms"
              className="text-[--color-foreground-muted] hover:text-[--color-foreground] underline underline-offset-2 focus-visible:outline-none"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/legal/privacy"
              className="text-[--color-foreground-muted] hover:text-[--color-foreground] underline underline-offset-2 focus-visible:outline-none"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
