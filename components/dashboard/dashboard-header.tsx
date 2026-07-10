'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CalendarDays } from 'lucide-react'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())
}

export function DashboardHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border-b border-[--color-border] bg-[--color-background] px-6 py-5"
    >
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[--color-foreground]">
            {getGreeting()}, Alex 👋
          </h1>
          <p className="mt-0.5 text-sm text-[--color-foreground-muted]">
            Here&apos;s what&apos;s happening across your procurement workspace.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-[--color-border] bg-[--color-background-subtle] px-3 py-2">
          <CalendarDays className="h-3.5 w-3.5 text-[--color-foreground-muted]" />
          <span className="text-xs font-medium text-[--color-foreground-muted]">{formatDate()}</span>
        </div>
      </div>
    </motion.div>
  )
}
