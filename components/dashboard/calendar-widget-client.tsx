'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CalendarEvent } from '@/lib/supabase/dashboard'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const typeColors: Record<string, string> = {
  rfq:     'bg-blue-500',
  po:      'bg-orange-500',
  payment: 'bg-cyan-500',
  grn:     'bg-green-500',
}

const typeBadge: Record<string, string> = {
  rfq:     'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  po:      'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
  payment: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400',
  grn:     'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
}

interface Props { events: CalendarEvent[] }

export function CalendarWidgetClient({ events }: Props) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()
  const today = now.getDate()

  // Group events by day
  const eventsByDay: Record<number, CalendarEvent[]> = {}
  for (const ev of events) {
    const d = new Date(ev.date)
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate()
      if (!eventsByDay[day]) eventsByDay[day] = []
      eventsByDay[day].push(ev)
    }
  }

  // Upcoming events — next 60 days
  const upcoming = events
    .filter((ev) => new Date(ev.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[--color-border] px-5 py-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-[--color-foreground-muted]" />
          <h3 className="text-sm font-semibold text-[--color-foreground]">Calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} aria-label="Previous month" className="rounded-md p-1 hover:bg-[--color-border] transition-colors">
            <ChevronLeft className="h-3.5 w-3.5 text-[--color-foreground-muted]" />
          </button>
          <span className="text-xs font-medium text-[--color-foreground] px-1 min-w-[110px] text-center">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} aria-label="Next month" className="rounded-md p-1 hover:bg-[--color-border] transition-colors">
            <ChevronRight className="h-3.5 w-3.5 text-[--color-foreground-muted]" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* Day names */}
        <div className="mb-1 grid grid-cols-7 gap-1">
          {DAYS.map((d) => (
            <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[--color-foreground-muted]">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />
            const dayEvents = eventsByDay[day] ?? []
            const isToday = isCurrentMonth && day === today
            return (
              <div
                key={day}
                className={cn(
                  'relative flex flex-col items-center rounded-md py-1 transition-colors hover:bg-[--color-background-subtle]',
                  isToday && 'bg-[--color-primary] hover:bg-[--color-primary]/90',
                )}
              >
                <span className={cn('text-xs font-medium', isToday ? 'text-white' : 'text-[--color-foreground]')}>
                  {day}
                </span>
                {dayEvents.length > 0 && (
                  <div className="mt-0.5 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((ev, i) => (
                      <span key={i} className={cn('h-1 w-1 rounded-full', typeColors[ev.type] ?? 'bg-gray-400')} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Upcoming events */}
        {upcoming.length > 0 && (
          <div className="mt-4 border-t border-[--color-border] pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[--color-foreground-muted]">
              Upcoming
            </p>
            <ul className="space-y-2">
              {upcoming.map((ev) => (
                <li key={ev.id} className="flex items-center gap-2.5">
                  <span className={cn('h-2 w-2 shrink-0 rounded-full', typeColors[ev.type] ?? 'bg-gray-400')} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-[--color-foreground]">{ev.title}</p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize', typeBadge[ev.type] ?? '')}>
                    {ev.type}
                  </span>
                  <span className="shrink-0 text-[11px] text-[--color-foreground-subtle] whitespace-nowrap">
                    {ev.date.slice(5)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {events.length === 0 && (
          <p className="mt-4 text-xs text-center text-[--color-foreground-muted]">
            No upcoming events. Add due dates to RFQs, POs, and invoices.
          </p>
        )}
      </div>
    </motion.div>
  )
}
