'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { UserPlus, FileText, ShoppingCart, BarChart3, FileSearch, ArrowRight } from 'lucide-react'

const actions = [
  {
    title: 'Add Vendor',
    description: 'Onboard a new vendor to your network',
    href: '/vendors',
    icon: UserPlus,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Create RFQ',
    description: 'Send a request for quotation',
    href: '/rfqs',
    icon: FileText,
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    title: 'New Quotation',
    description: 'Record a vendor quotation',
    href: '/quotations/new',
    icon: FileSearch,
    color: 'cyan',
    gradient: 'from-cyan-500 to-cyan-600',
  },
  {
    title: 'New Purchase Order',
    description: 'Raise a new purchase order',
    href: '/purchase-orders',
    icon: ShoppingCart,
    color: 'green',
    gradient: 'from-green-500 to-green-600',
  },
  {
    title: 'View Reports',
    description: 'Access analytics and insights',
    href: '/analytics',
    icon: BarChart3,
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
  },
]

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]"
    >
      <div className="border-b border-[--color-border] px-5 py-4">
        <h3 className="text-sm font-semibold text-[--color-foreground]">Quick Actions</h3>
        <p className="text-xs text-[--color-foreground-muted] mt-0.5">Common tasks at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-5">
        {actions.map((action, i) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
            >
              <Link
                href={action.href}
                className="group flex flex-col items-start rounded-lg border border-[--color-border] bg-[--color-background-subtle] p-3.5 transition-all hover:border-[--color-primary]/30 hover:bg-[--color-primary]/5 hover:shadow-[--shadow-sm]"
              >
                <div className={`mb-3 rounded-lg bg-gradient-to-br ${action.gradient} p-2`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-xs font-semibold text-[--color-foreground] leading-snug">
                  {action.title}
                </p>
                <p className="mt-0.5 text-[11px] text-[--color-foreground-muted] leading-relaxed">
                  {action.description}
                </p>
                <ArrowRight className="mt-2 h-3 w-3 text-[--color-foreground-subtle] transition-transform group-hover:translate-x-0.5 group-hover:text-[--color-primary]" />
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
