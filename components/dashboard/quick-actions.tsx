'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserPlus, FileText, ShoppingCart, BarChart3, FileSearch, ArrowRight } from 'lucide-react'

const actions = [
  { title: 'Add Vendor',      description: 'Onboard a new vendor',    href: '/vendors/new',         icon: UserPlus,   gradient: 'from-blue-500 to-blue-600'    },
  { title: 'Create RFQ',      description: 'Send a request for quote', href: '/rfqs/new',             icon: FileText,   gradient: 'from-violet-500 to-violet-600' },
  { title: 'New Quotation',   description: 'Record a vendor quote',    href: '/quotations/new',       icon: FileSearch, gradient: 'from-cyan-500 to-cyan-600'     },
  { title: 'Purchase Order',  description: 'Raise a new PO',           href: '/purchase-orders/new',  icon: ShoppingCart, gradient: 'from-emerald-500 to-emerald-600' },
  { title: 'View Analytics',  description: 'Access reports',           href: '/analytics',            icon: BarChart3,  gradient: 'from-orange-500 to-orange-600' },
]

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08 }}
      className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[var(--shadow-sm)]"
    >
      <div className="border-b border-[--color-border] px-5 py-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Quick Actions</h3>
        <p className="mt-0.5 text-xs text-[--color-foreground-muted]">Common tasks at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((action, i) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ scale: 1.02, y: -2, transition: { duration: 0.14 } }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href={action.href}
                className="group flex flex-col rounded-xl border border-[--color-border] bg-[--color-background-subtle] p-3.5 transition-all hover:border-[--color-primary]/30 hover:bg-[--color-primary]/5 hover:shadow-[var(--shadow-sm)]"
              >
                <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${action.gradient}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-xs font-semibold leading-snug text-[--color-foreground]">{action.title}</p>
                <p className="mt-0.5 text-[11px] text-[--color-foreground-muted]">{action.description}</p>
                <ArrowRight className="mt-2 h-3 w-3 text-[--color-foreground-subtle] transition-transform group-hover:translate-x-0.5 group-hover:text-[--color-primary]" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
