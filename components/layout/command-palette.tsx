'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, FileText, ShoppingCart, Building2, Package,
  CreditCard, Loader2, ArrowRight, Bell, ClipboardList, Warehouse,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui-store'
import { useDebounce } from '@/hooks/use-debounce'

// ── Types ──────────────────────────────────────────────────────────────────
interface SearchResult {
  id: string
  type: 'rfq' | 'purchase_order' | 'vendor' | 'product' | 'invoice' | 'quotation' | 'approval' | 'employee' | 'warehouse'
  title: string
  subtitle: string
  href: string
}

// ── Icon per result type ───────────────────────────────────────────────────
const TYPE_ICON: Record<SearchResult['type'], React.ElementType> = {
  rfq:            FileText,
  purchase_order: ShoppingCart,
  vendor:         Building2,
  product:        Package,
  invoice:        CreditCard,
  quotation:      FileText,
  approval:       ClipboardList,
  employee:       Building2,
  warehouse:      Warehouse,
}

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  rfq:            'RFQ',
  purchase_order: 'Purchase Order',
  vendor:         'Vendor',
  product:        'Product',
  invoice:        'Invoice',
  quotation:      'Quotation',
  approval:       'Approval',
  employee:       'Employee',
  warehouse:      'Warehouse',
}

const TYPE_COLOR: Record<SearchResult['type'], string> = {
  rfq:            'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
  purchase_order: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  vendor:         'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
  product:        'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400',
  invoice:        'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400',
  quotation:      'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400',
  approval:       'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
  employee:       'bg-pink-100 text-pink-600 dark:bg-pink-900/40 dark:text-pink-400',
  warehouse:      'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400',
}

// ── Main component ─────────────────────────────────────────────────────────
export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState(0)
  const [isPending, startTransition] = useTransition()
  const debouncedQuery = useDebounce(query, 250)

  // ── Close on Escape, open on ⌘K ──────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [setCommandPaletteOpen])

  // ── Reset when closed ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!commandPaletteOpen) {
      setQuery('')
      setResults([])
      setSelected(0)
    }
  }, [commandPaletteOpen])

  // ── Search API call ───────────────────────────────────────────────────────
  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults([])
      return
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        if (!res.ok) return
        const data = await res.json()
        setResults(data.results ?? [])
        setSelected(0)
      } catch { /* silent */ }
    })
  }, [])

  useEffect(() => { search(debouncedQuery) }, [debouncedQuery, search])

  // ── Keyboard navigation ───────────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && results[selected]) {
      navigate(results[selected])
    }
  }

  function navigate(result: SearchResult) {
    setCommandPaletteOpen(false)
    router.push(result.href)
  }

  if (!commandPaletteOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setCommandPaletteOpen(false)}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-xl rounded-2xl border border-[--color-border] bg-[--color-card] shadow-[0_24px_64px_rgba(0,0,0,0.18)] overflow-hidden"
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-[--color-border] px-4 py-3.5">
            {isPending
              ? <Loader2 className="h-4 w-4 shrink-0 text-[--color-foreground-muted] animate-spin" />
              : <Search className="h-4 w-4 shrink-0 text-[--color-foreground-muted]" />
            }
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search vendors, RFQs, POs, invoices…"
              className="flex-1 bg-transparent text-sm text-[--color-foreground] placeholder:text-[--color-foreground-subtle] outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="rounded p-0.5 hover:bg-[--color-background-muted]">
                <X className="h-3.5 w-3.5 text-[--color-foreground-muted]" />
              </button>
            )}
            <kbd className="hidden sm:flex items-center rounded border border-[--color-border] bg-[--color-background-subtle] px-1.5 py-0.5 text-[10px] font-mono text-[--color-foreground-subtle]">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[360px] overflow-y-auto">
            {query.length >= 2 && results.length === 0 && !isPending && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-8 w-8 text-[--color-foreground-subtle] mb-2" />
                <p className="text-sm font-medium text-[--color-foreground-muted]">No matching records found.</p>
                <p className="text-xs text-[--color-foreground-subtle] mt-0.5">Try a different search term.</p>
              </div>
            )}

            {results.length === 0 && query.length < 2 && (
              <div className="px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[--color-foreground-subtle] mb-2">Quick access</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'RFQs',            href: '/rfqs',            icon: FileText     },
                    { label: 'Purchase Orders',  href: '/purchase-orders', icon: ShoppingCart },
                    { label: 'Vendors',          href: '/vendors',         icon: Building2    },
                    { label: 'Invoices',         href: '/payments/invoices', icon: CreditCard },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.href}
                        onClick={() => { setCommandPaletteOpen(false); router.push(item.href) }}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[--color-foreground-muted] hover:bg-[--color-background-subtle] hover:text-[--color-foreground] transition-colors text-left"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {results.length > 0 && (
              <ul className="py-1.5">
                {results.map((result, idx) => {
                  const Icon = TYPE_ICON[result.type]
                  const isSelected = idx === selected
                  return (
                    <li key={result.id}>
                      <button
                        onClick={() => navigate(result)}
                        onMouseEnter={() => setSelected(idx)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isSelected ? 'bg-[--color-background-subtle]' : 'hover:bg-[--color-background-subtle]',
                        )}
                      >
                        <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px]', TYPE_COLOR[result.type])}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[--color-foreground] truncate">{result.title}</p>
                          <p className="text-xs text-[--color-foreground-muted] truncate">{result.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium', TYPE_COLOR[result.type])}>
                            {TYPE_LABEL[result.type]}
                          </span>
                          <ArrowRight className="h-3 w-3 text-[--color-foreground-subtle]" />
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 border-t border-[--color-border] px-4 py-2 text-[11px] text-[--color-foreground-subtle]">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[--color-border] px-1 py-0.5 font-mono">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[--color-border] px-1 py-0.5 font-mono">↵</kbd> open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-[--color-border] px-1 py-0.5 font-mono">ESC</kbd> close
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
