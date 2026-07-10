'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Circle,
  Clock,
  Package,
  Truck,
  PackageCheck,
  FileText,
  Building2,
  MapPin,
  Calendar,
  Hash,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShoppingCart,
  Send,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PurchaseOrder, POStatus } from '@/types/purchase-order'
import { formatDistanceToNow } from 'date-fns'

// ── Order stages ──────────────────────────────────────────────────────────────

interface OrderStage {
  id: POStatus | 'received'
  label: string
  description: string
  icon: LucideIcon
}

const STAGES: OrderStage[] = [
  {
    id: 'draft',
    label: 'Draft',
    description: 'Purchase order created and saved as draft',
    icon: FileText,
  },
  {
    id: 'pending_approval',
    label: 'Pending Approval',
    description: 'Awaiting manager sign-off before sending to vendor',
    icon: Clock,
  },
  {
    id: 'approved',
    label: 'Approved',
    description: 'Order approved internally and ready to send',
    icon: CheckCircle2,
  },
  {
    id: 'sent',
    label: 'Sent to Vendor',
    description: 'Purchase order dispatched to the vendor',
    icon: Send,
  },
  {
    id: 'acknowledged',
    label: 'Acknowledged',
    description: 'Vendor has confirmed receipt of the order',
    icon: Building2,
  },
  {
    id: 'in_progress',
    label: 'In Progress',
    description: 'Vendor is fulfilling and preparing your order',
    icon: Package,
  },
  {
    id: 'completed',
    label: 'Delivered',
    description: 'Goods received and delivery confirmed',
    icon: PackageCheck,
  },
]

const STATUS_ORDER: Record<POStatus, number> = {
  draft: 0,
  pending_approval: 1,
  approved: 2,
  sent: 3,
  acknowledged: 4,
  in_progress: 5,
  completed: 6,
  cancelled: -1,
}

// ── Shipment mock helper ──────────────────────────────────────────────────────

interface ShipmentInfo {
  carrier: string
  trackingNumber: string
  estimatedDelivery: string
  origin: string
  destination: string
  lastEvent: string
  lastEventTime: string
  events: { time: string; location: string; event: string; done: boolean }[]
}

function getMockShipment(poNumber: string): ShipmentInfo {
  return {
    carrier: 'BlueDart Express',
    trackingNumber: `BD${poNumber.replace(/\D/g, '').slice(-8).padStart(8, '0')}`,
    estimatedDelivery: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    origin: 'Vendor Warehouse, Mumbai',
    destination: 'Delivery Address, Delhi',
    lastEvent: 'In Transit — Sorting Hub',
    lastEventTime: new Date(Date.now() - 6 * 3600000).toISOString(),
    events: [
      {
        time: new Date(Date.now() - 24 * 3600000).toISOString(),
        location: 'Mumbai, MH',
        event: 'Shipment picked up from vendor',
        done: true,
      },
      {
        time: new Date(Date.now() - 18 * 3600000).toISOString(),
        location: 'Mumbai Hub',
        event: 'Arrived at sorting facility',
        done: true,
      },
      {
        time: new Date(Date.now() - 12 * 3600000).toISOString(),
        location: 'Nagpur, MH',
        event: 'In transit — en route to destination',
        done: true,
      },
      {
        time: new Date(Date.now() - 6 * 3600000).toISOString(),
        location: 'Bhopal Hub',
        event: 'Departed sorting facility',
        done: true,
      },
      {
        time: new Date(Date.now() + 12 * 3600000).toISOString(),
        location: 'Delhi Hub',
        event: 'Expected at destination hub',
        done: false,
      },
      {
        time: new Date(Date.now() + 36 * 3600000).toISOString(),
        location: 'Delhi, DL',
        event: 'Out for delivery',
        done: false,
      },
    ],
  }
}

// ── Stage step ────────────────────────────────────────────────────────────────

interface StageStepProps {
  stage: OrderStage
  state: 'done' | 'active' | 'upcoming'
  isLast: boolean
  index: number
}

function StageStep({ stage, state, isLast, index }: StageStepProps) {
  const Icon = stage.icon

  return (
    <div className="flex gap-4">
      {/* Connector + icon */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.07 }}
          className={cn(
            'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all',
            state === 'done' &&
              'border-[--color-primary] bg-[--color-primary] text-white shadow-md shadow-[--color-primary]/30',
            state === 'active' &&
              'border-[--color-primary] bg-[--color-background] text-[--color-primary] shadow-lg shadow-[--color-primary]/20 ring-4 ring-[--color-primary]/10',
            state === 'upcoming' &&
              'border-[--color-border] bg-[--color-background-subtle] text-[--color-foreground-subtle]',
          )}
        >
          {state === 'done' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : state === 'active' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-2 border-[--color-primary]/30 border-t-[--color-primary]"
            />
          ) : null}
          {state !== 'done' && <Icon className="h-4 w-4" />}
        </motion.div>

        {/* Vertical connector */}
        {!isLast && (
          <div
            className={cn(
              'mt-1 w-0.5 flex-1 min-h-[32px] rounded-full transition-colors duration-500',
              state === 'done' ? 'bg-[--color-primary]' : 'bg-[--color-border]',
            )}
          />
        )}
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.07 + 0.05 }}
        className={cn('pb-6 min-w-0', isLast && 'pb-0')}
      >
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <p
            className={cn(
              'text-sm font-semibold',
              state === 'done' && 'text-[--color-foreground]',
              state === 'active' && 'text-[--color-primary]',
              state === 'upcoming' && 'text-[--color-foreground-muted]',
            )}
          >
            {stage.label}
          </p>
          {state === 'active' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[--color-primary]/10 px-2 py-0.5 text-[10px] font-semibold text-[--color-primary]">
              <span className="h-1.5 w-1.5 rounded-full bg-[--color-primary] animate-pulse" />
              Current
            </span>
          )}
          {state === 'done' && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Done
            </span>
          )}
        </div>
        <p className="text-xs text-[--color-foreground-muted]">{stage.description}</p>
      </motion.div>
    </div>
  )
}

// ── Shipment events ───────────────────────────────────────────────────────────

function ShipmentTracker({ shipment }: { shipment: ShipmentInfo }) {
  const [expanded, setExpanded] = useState(false)
  const visibleEvents = expanded ? shipment.events : shipment.events.slice(0, 3)

  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm] overflow-hidden">
      <div className="border-b border-[--color-border] px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[--color-primary]/10 text-[--color-primary]">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[--color-foreground]">
                {shipment.carrier}
              </p>
              <p className="text-xs font-mono text-[--color-foreground-muted]">
                {shipment.trackingNumber}
              </p>
            </div>
          </div>
          <Badge variant="info" className="shrink-0">In Transit</Badge>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-px bg-[--color-border] sm:grid-cols-4">
        {[
          { icon: MapPin, label: 'Origin', value: shipment.origin },
          { icon: MapPin, label: 'Destination', value: shipment.destination },
          { icon: Calendar, label: 'Est. Delivery', value: formatDate(shipment.estimatedDelivery) },
          { icon: RefreshCw, label: 'Last Update', value: formatDistanceToNow(new Date(shipment.lastEventTime), { addSuffix: true }) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[--color-card] px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3.5 w-3.5 text-[--color-foreground-muted]" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-[--color-foreground-muted]">
                {label}
              </span>
            </div>
            <p className="text-xs font-medium text-[--color-foreground] leading-snug">{value}</p>
          </div>
        ))}
      </div>

      {/* Event timeline */}
      <div className="px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[--color-foreground-muted]">
          Shipment Events
        </p>
        <div className="relative space-y-0">
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-[--color-border]" />
          <AnimatePresence initial={false}>
            {visibleEvents.map((ev, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative flex items-start gap-4 py-2.5"
              >
                <div
                  className={cn(
                    'relative z-10 mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-2 bg-[--color-card]',
                    ev.done
                      ? 'border-[--color-primary] bg-[--color-primary]'
                      : 'border-[--color-border]',
                  )}
                >
                  {ev.done && (
                    <CheckCircle2 className="h-full w-full text-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-xs font-medium',
                      ev.done ? 'text-[--color-foreground]' : 'text-[--color-foreground-muted]',
                    )}
                  >
                    {ev.event}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 mt-0.5 text-[11px] text-[--color-foreground-subtle]">
                    <span>{ev.location}</span>
                    <span>·</span>
                    <span>
                      {ev.done
                        ? formatDistanceToNow(new Date(ev.time), { addSuffix: true })
                        : `Expected ${formatDate(ev.time)}`}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {shipment.events.length > 3 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 text-xs text-[--color-primary] hover:underline"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> Show all {shipment.events.length} events
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

interface OrderTrackingClientProps {
  po: PurchaseOrder
}

export function OrderTrackingClient({ po }: OrderTrackingClientProps) {
  const currentStatusOrder = STATUS_ORDER[po.status]
  const isCancelled = po.status === 'cancelled'

  const shipment = po.status === 'in_progress' || po.status === 'completed'
    ? getMockShipment(po.po_number)
    : null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Cancelled banner */}
      {isCancelled && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-800 dark:bg-red-900/10"
        >
          <XCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Order Cancelled
            </p>
            <p className="text-xs text-red-600 dark:text-red-500">
              This purchase order has been cancelled and will not be fulfilled.
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left: Stage tracker ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-[--color-border] bg-[--color-card] p-6 shadow-[--shadow-sm]">
            <h2 className="mb-5 text-sm font-semibold text-[--color-foreground]">
              Order Progress
            </h2>

            {isCancelled ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <XCircle className="mb-3 h-12 w-12 text-red-400" />
                <p className="text-sm font-medium text-[--color-foreground]">Order Cancelled</p>
                <p className="mt-1 text-xs text-[--color-foreground-muted]">
                  This order was cancelled before completion.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {STAGES.map((stage, index) => {
                  const stageOrder = STATUS_ORDER[stage.id as POStatus] ?? -1
                  let state: 'done' | 'active' | 'upcoming'
                  if (stageOrder < currentStatusOrder) state = 'done'
                  else if (stageOrder === currentStatusOrder) state = 'active'
                  else state = 'upcoming'

                  return (
                    <StageStep
                      key={stage.id}
                      stage={stage}
                      state={state}
                      isLast={index === STAGES.length - 1}
                      index={index}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Shipment tracker (only when in_progress / completed) */}
          {shipment && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ShipmentTracker shipment={shipment} />
            </motion.div>
          )}

          {/* Line items fulfillment */}
          {(po.items ?? []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm] overflow-hidden"
            >
              <div className="border-b border-[--color-border] px-5 py-4">
                <h2 className="text-sm font-semibold text-[--color-foreground]">
                  Items Fulfillment
                </h2>
                <p className="mt-0.5 text-xs text-[--color-foreground-muted]">
                  Status of each line item in this order
                </p>
              </div>
              <div className="divide-y divide-[--color-border]">
                {po.items!.map((item, i) => {
                  const fulfilled =
                    po.status === 'completed' || po.status === 'in_progress'
                  const partial = po.status === 'in_progress'

                  return (
                    <div
                      key={item.id ?? i}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          fulfilled
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : partial
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-[--color-background-subtle] text-[--color-foreground-muted]',
                        )}
                      >
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[--color-foreground] truncate">
                          {item.description}
                        </p>
                        <p className="text-xs text-[--color-foreground-muted]">
                          {item.quantity} {item.unit} · {formatCurrency(item.unit_price)} / unit
                        </p>
                      </div>
                      <div className="shrink-0">
                        {po.status === 'completed' ? (
                          <Badge variant="success">Delivered</Badge>
                        ) : po.status === 'in_progress' ? (
                          <Badge variant="warning">In Transit</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* GRN link when delivered */}
          {po.status === 'completed' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-800 dark:bg-green-900/10"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <PackageCheck className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                      Goods Received
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      Create a Goods Receipt Note to update inventory stock levels.
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" className="shrink-0">
                  <Link href="/inventory/grn/new">
                    <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                    Create GRN
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Right: Info sidebar ── */}
        <div className="space-y-4">
          {/* Order info */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]"
          >
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[--color-foreground-muted]">
              Order Info
            </h3>
            <div className="space-y-3">
              {[
                { icon: Hash, label: 'PO Number', value: po.po_number },
                {
                  icon: Building2,
                  label: 'Vendor',
                  value: po.vendor?.name ?? '—',
                },
                {
                  icon: ShoppingCart,
                  label: 'Total Amount',
                  value: po.total_amount != null ? formatCurrency(po.total_amount) : '—',
                },
                {
                  icon: Calendar,
                  label: 'Delivery Date',
                  value: po.due_date ? formatDate(po.due_date) : 'Not set',
                },
                {
                  icon: Calendar,
                  label: 'Created',
                  value: formatDate(po.created_at),
                },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[--color-background-subtle] text-[--color-foreground-muted]">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-[--color-foreground-subtle]">
                      {label}
                    </p>
                    <p className="text-sm font-medium text-[--color-foreground] truncate">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Status timeline summary */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]"
          >
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[--color-foreground-muted]">
              Current Status
            </h3>
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                  isCancelled
                    ? 'bg-red-100 text-red-600'
                    : po.status === 'completed'
                    ? 'bg-green-100 text-green-600'
                    : 'bg-[--color-primary]/10 text-[--color-primary]',
                )}
              >
                {isCancelled ? (
                  <XCircle className="h-5 w-5" />
                ) : po.status === 'completed' ? (
                  <PackageCheck className="h-5 w-5" />
                ) : (
                  <Truck className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[--color-foreground] capitalize">
                  {po.status.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-[--color-foreground-muted]">
                  Updated {formatDistanceToNow(new Date(po.updated_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {po.status !== 'cancelled' && po.status !== 'completed' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="text-[--color-foreground-muted]">Progress</span>
                  <span className="font-medium text-[--color-foreground]">
                    {currentStatusOrder + 1}/{STAGES.length}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[--color-border] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((currentStatusOrder + 1) / STAGES.length) * 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-[--color-primary] to-blue-400"
                  />
                </div>
              </div>
            )}

            {po.status === 'completed' && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-100 px-3 py-2 dark:bg-green-900/20">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  Order fully fulfilled
                </span>
              </div>
            )}
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-xl border border-[--color-border] bg-[--color-card] p-5 shadow-[--shadow-sm]"
          >
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[--color-foreground-muted]">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href={`/purchase-orders/${po.id}`}>
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  View PO Details
                </Link>
              </Button>
              {po.rfq_id && (
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link href={`/rfqs/${po.rfq_id}`}>
                    <ShoppingCart className="h-3.5 w-3.5 mr-2" />
                    View Original RFQ
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href="/inventory/grn">
                  <ClipboardCheck className="h-3.5 w-3.5 mr-2" />
                  GRN History
                </Link>
              </Button>
              {po.vendor && (
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link href={`/vendors/${po.vendor.id}`}>
                    <Building2 className="h-3.5 w-3.5 mr-2" />
                    Vendor Profile
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
