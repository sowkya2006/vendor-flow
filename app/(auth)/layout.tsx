import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'radial-gradient(ellipse at 20% 15%, rgba(139,159,232,0.13) 0%, transparent 50%), radial-gradient(ellipse at 80% 85%, rgba(201,168,76,0.08) 0%, transparent 50%), #080C18',
      }}
    >
      {/* Header */}
      <header
        className="h-16 flex items-center px-6 shrink-0 border-b"
        style={{ borderColor: 'rgba(139,159,232,0.15)', background: 'rgba(8,12,24,0.8)', backdropFilter: 'blur(12px)' }}
      >
        <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-ring] rounded-sm">
          <div
            className="flex items-center justify-center size-8 rounded-lg"
            style={{ background: 'linear-gradient(135deg, #8B9FE8, #C9A84C)', boxShadow: '0 2px 12px rgba(139,159,232,0.5)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 4h10M3 8h7M3 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-base font-bold text-white tracking-tight">
            VendorFlow
          </span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div
            className="rounded-2xl px-8 py-10"
            style={{
              background: 'rgba(10,15,38,0.85)',
              border: '1px solid rgba(139,159,232,0.25)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(139,159,232,0.1)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {children}
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs" style={{ color: '#8B96B4' }}>
            By using VendorFlow you agree to our{' '}
            <Link href="/legal/terms" className="hover:text-white underline underline-offset-2 focus-visible:outline-none" style={{ color: '#A5B6F0' }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/legal/privacy" className="hover:text-white underline underline-offset-2 focus-visible:outline-none" style={{ color: '#A5B6F0' }}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
