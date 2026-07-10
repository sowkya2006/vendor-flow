'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Construction, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ComingSoonProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export function ComingSoon({
  title,
  description = 'This feature is currently under development and will be available in an upcoming release.',
  icon,
}: ComingSoonProps) {
  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="border-b border-[--color-border] bg-[--color-background] px-6 py-5">
        <div className="mx-auto max-w-screen-2xl">
          <h1 className="text-xl font-bold text-[--color-foreground]">{title}</h1>
          <p className="mt-0.5 text-sm text-[--color-foreground-muted]">Manage and track your {title.toLowerCase()}</p>
        </div>
      </div>

      <div className="mx-auto max-w-screen-2xl p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[--color-border] bg-[--color-card] px-8 py-20 text-center shadow-[--shadow-sm]"
        >
          {/* Icon */}
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[--color-primary]/10 text-[--color-primary]">
            {icon ?? <Construction className="h-8 w-8" />}
          </div>

          <h2 className="text-lg font-semibold text-[--color-foreground]">{title} — Coming in Stage 4+</h2>
          <p className="mt-2 max-w-md text-sm text-[--color-foreground-muted] leading-relaxed">{description}</p>

          {/* Progress indicator */}
          <div className="mt-8 w-full max-w-xs">
            <div className="mb-1.5 flex items-center justify-between text-xs text-[--color-foreground-muted]">
              <span>Stage 3</span>
              <span>Stage 4+</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[--color-background-muted]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '30%' }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                className="h-2 rounded-full bg-gradient-to-r from-[--color-primary] to-purple-500"
              />
            </div>
            <p className="mt-1.5 text-center text-[11px] text-[--color-foreground-subtle]">
              Foundation complete — full feature in next stage
            </p>
          </div>

          <Link
            href="/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-lg border border-[--color-border] bg-[--color-background-subtle] px-4 py-2 text-sm font-medium text-[--color-foreground] hover:bg-[--color-accent] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
