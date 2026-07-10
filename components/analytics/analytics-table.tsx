import { cn } from '@/lib/utils'

interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  align?: 'left' | 'right' | 'center'
  className?: string
}

interface AnalyticsTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  keyField: keyof T
  emptyMessage?: string
  className?: string
}

export function AnalyticsTable<T>({
  columns, rows, keyField, emptyMessage = 'No data available', className,
}: AnalyticsTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-[--color-border] bg-[--color-card] shadow-[--shadow-sm]', className)}>
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-[--color-foreground-muted]">{emptyMessage}</p>
      ) : (
        <table className="w-full min-w-[400px]">
          <thead className="bg-[--color-background-subtle]">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[--color-foreground-muted]',
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[--color-border]">
            {rows.map((row, ri) => (
              <tr key={String(row[keyField])} className={cn('transition-colors hover:bg-[--color-background-subtle]', ri % 2 === 0 ? '' : '')}>
                {columns.map((col, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      'px-4 py-3 text-sm text-[--color-foreground]',
                      col.align === 'right' ? 'text-right tabular-nums' : col.align === 'center' ? 'text-center' : '',
                      col.className,
                    )}
                  >
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : String(row[col.accessor] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
