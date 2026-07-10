'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useUIStore } from '@/store/ui-store'
import { Sidebar } from './sidebar'
import { Button } from '@/components/ui/button'

export function MobileSidebar() {
  const { sidebarMobileOpen, setSidebarMobileOpen } = useUIStore()

  // Close on route change via escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarMobileOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [setSidebarMobileOpen])

  return (
    <AnimatePresence>
      {sidebarMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[49] bg-black/60 md:hidden"
            onClick={() => setSidebarMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 left-0 z-[50] md:hidden"
          >
            <div className="relative">
              <Sidebar />
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-2 text-[--color-sidebar-muted] hover:text-[--color-sidebar-fg]"
                onClick={() => setSidebarMobileOpen(false)}
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
