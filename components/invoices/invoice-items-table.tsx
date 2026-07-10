import { formatCurrency } from '@/lib/utils'
import type { InvoiceItem } from '@/types/invoice'

interface InvoiceItemsTableProps {
  items: InvoiceItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
}

export function InvoiceItemsTable({
  items,
  subtotal,
  taxAmount,
  discountAmount,
  totalAmount,
}: InvoiceItemsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[--color-border] shadow-[--shadow-sm]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[--color-border] bg-[--color-background-subtle]">
            <th className="px-4 py-3 text-left text-xs font-semibold text-[--color-foreground-muted]">Description</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[--color-foreground-muted] whitespace-nowrap">Qty</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[--color-foreground-muted] whitespace-nowrap">Unit Price</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[--color-foreground-muted] whitespace-nowrap">Tax %</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[--color-foreground-muted] whitespace-nowrap">Line Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[--color-border] bg-[--color-card]">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 text-[--color-foreground]">
                <p className="font-medium">{item.description}</p>
                {item.product && (
                  <p className="text-xs text-[--color-foreground-muted]">{item.product.sku} · {item.product.unit}</p>
                )}
              </td>
              <td className="px-4 py-3 text-right text-[--color-foreground]">{item.quantity}</td>
              <td className="px-4 py-3 text-right text-[--color-foreground]">{formatCurrency(item.unit_price)}</td>
              <td className="px-4 py-3 text-right text-[--color-foreground-muted]">
                {item.tax_percentage > 0 ? `${item.tax_percentage}%` : '—'}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-[--color-foreground]">
                {formatCurrency(item.line_total)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t border-[--color-border] bg-[--color-background-subtle]">
          <tr>
            <td colSpan={4} className="px-4 py-2 text-right text-xs text-[--color-foreground-muted]">Subtotal</td>
            <td className="px-4 py-2 text-right text-sm font-medium text-[--color-foreground]">{formatCurrency(subtotal)}</td>
          </tr>
          <tr>
            <td colSpan={4} className="px-4 py-2 text-right text-xs text-[--color-foreground-muted]">Tax</td>
            <td className="px-4 py-2 text-right text-sm font-medium text-[--color-foreground]">{formatCurrency(taxAmount)}</td>
          </tr>
          {discountAmount > 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-2 text-right text-xs text-emerald-600">Discount</td>
              <td className="px-4 py-2 text-right text-sm font-medium text-emerald-600">−{formatCurrency(discountAmount)}</td>
            </tr>
          )}
          <tr className="border-t border-[--color-border]">
            <td colSpan={4} className="px-4 py-3 text-right text-sm font-bold text-[--color-foreground]">Total</td>
            <td className="px-4 py-3 text-right text-base font-bold text-[--color-foreground]">{formatCurrency(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
