import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Truck } from 'lucide-react'
import { getPurchaseOrderById } from '@/lib/supabase/purchase-orders'
import { getCompanyId } from '@/lib/supabase/get-company-id'
import { OrderTrackingClient } from '@/components/purchase-orders/order-tracking-client'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const companyId = await getCompanyId()
  const po = await getPurchaseOrderById(id, companyId)
  return { title: po ? `Track ${po.po_number} — VendorFlow` : 'Order Tracking — VendorFlow' }
}

export default async function OrderTrackingPage({ params }: PageProps) {
  const { id } = await params
  const companyId = await getCompanyId()
  const po = await getPurchaseOrderById(id, companyId)

  if (!po) notFound()

  return (
    <div className="min-h-full">
      <div className="border-b border-[--color-border] bg-[--color-background] px-6 py-5">
        <div className="flex items-center gap-3">
          <Link
            href={`/purchase-orders/${id}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[--color-border] text-[--color-foreground-muted] hover:bg-[--color-accent] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[--color-primary]/10 text-[--color-primary]">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[--color-foreground]">Order Tracking</h1>
            <p className="text-sm text-[--color-foreground-muted]">
              {po.po_number} · {po.vendor?.name ?? '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <OrderTrackingClient po={po} />
      </div>
    </div>
  )
}
