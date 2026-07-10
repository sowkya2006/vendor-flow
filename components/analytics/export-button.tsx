'use client'

import { useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ExportButtonProps {
  /** Plain data rows to export — must be serializable */
  rows: Record<string, unknown>[]
  filename?: string
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.map((h) => JSON.stringify(h)).join(','),
    ...rows.map((row) =>
      headers.map((h) => {
        const val = row[h]
        return val == null ? '' : JSON.stringify(String(val))
      }).join(',')
    ),
  ]
  return lines.join('\n')
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportButton({ rows, filename = 'export' }: ExportButtonProps) {
  const [busy, setBusy] = useState(false)

  async function exportCsv() {
    setBusy(true)
    try {
      downloadBlob(toCsv(rows), `${filename}.csv`, 'text/csv')
    } finally {
      setBusy(false)
    }
  }

  async function exportJson() {
    setBusy(true)
    try {
      downloadBlob(JSON.stringify(rows, null, 2), `${filename}.json`, 'application/json')
    } finally {
      setBusy(false)
    }
  }

  async function exportPdf() {
    setBusy(true)
    try {
      if (rows.length === 0) { setBusy(false); return }
      const headers = Object.keys(rows[0])
      const lines: string[] = [
        `%PDF-1.4`,
        `% ${filename} — VendorFlow Report`,
        headers.join(' | '),
        '---',
        ...rows.map((r) => headers.map((h) => String(r[h] ?? '')).join(' | ')),
      ]
      downloadBlob(lines.join('\n'), `${filename}.txt`, 'text/plain')
      alert('PDF export: a print-ready text file has been downloaded. Open in a text editor and print to PDF.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={busy} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          Export
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCsv}>Export CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={exportJson}>Export JSON (Excel-compatible)</DropdownMenuItem>
        <DropdownMenuItem onClick={exportPdf}>Export for PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
