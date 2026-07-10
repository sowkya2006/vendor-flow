import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { QueryProvider } from '@/components/shared/query-provider'
import { AuthProvider } from '@/components/auth/auth-provider'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'VendorFlow',
    template: '%s | VendorFlow',
  },
  description: 'Enterprise vendor and procurement management platform',
  keywords: ['vendor management', 'procurement', 'purchase orders', 'RFQ', 'inventory'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1e' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  'bg-[--color-card] border border-[--color-border] text-[--color-foreground] shadow-lg',
                title: 'text-[--color-foreground] font-medium',
                description: 'text-[--color-foreground-muted]',
                success: 'border-[--color-success]/30',
                error: 'border-[--color-error]/30',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
