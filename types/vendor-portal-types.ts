/**
 * vendor-portal-types.ts
 * Shared types for vendor portal — safe to import in both client and server components.
 * No server-only imports here.
 */

export interface POForInvoice {
  id: string
  po_number: string
  total_amount: number | null
  vendor_id: string
  company_id: string
  status: string
  vendor_acceptance: string | null
  vendor: { name: string; email: string | null } | null
  items: Array<{
    id: string
    description: string
    quantity: number
    unit: string | null
    unit_price: number
  }>
  completed_grn: {
    id: string
    grn_number: string
    received_date: string
    grn_items: Array<{
      id: string
      item_name: string | null
      description: string | null
      ordered_quantity: number
      received_quantity: number
      accepted_quantity: number | null
      unit: string | null
      unit_cost: number
      tax_percentage: number | null
    }>
  } | null
}
