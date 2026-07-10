import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Vendor Portal — VendorFlow', template: '%s — Vendor Portal' },
  description: 'VendorFlow Vendor Portal',
}

export default function VendorRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
