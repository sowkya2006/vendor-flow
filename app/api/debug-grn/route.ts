/**
 * TEMPORARY DEBUG ENDPOINT
 * GET /api/debug-grn  — full database diagnosis, no parameters needed
 * DELETE AFTER DEBUGGING
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any

  const [
    grns,
    grnItems,
    pos,
    poItems,
    products,
    inventory,
    warehouses,
    companies,
  ] = await Promise.all([
    db.from('grn').select('id, grn_number, status, warehouse_id, purchase_order_id, company_id, received_by'),
    db.from('grn_items').select('id, grn_id, product_id, ordered_quantity, received_quantity, unit_cost, notes'),
    db.from('purchase_orders').select('id, po_number, status, company_id, vendor_id'),
    db.from('purchase_order_items').select('id, purchase_order_id, description, quantity, unit, unit_price'),
    db.from('products').select('id, name, sku, unit_cost, status, company_id'),
    db.from('inventory').select('id, product_id, warehouse_id, quantity_on_hand, valuation, company_id'),
    db.from('warehouses').select('id, name, code, company_id'),
    db.from('companies').select('id, name'),
  ])

  // Diagnose the problem
  const grnList = (grns.data ?? []) as Array<{
    id: string; grn_number: string; status: string
    warehouse_id: string | null; purchase_order_id: string | null; company_id: string
  }>
  const completedGrns = grnList.filter((g) => g.status === 'completed')
  const completedWithPO = completedGrns.filter((g) => g.purchase_order_id)
  const completedWithWarehouse = completedGrns.filter((g) => g.warehouse_id)

  return NextResponse.json({
    summary: {
      companies: (companies.data ?? []).length,
      warehouses: (warehouses.data ?? []).length,
      purchase_orders: (pos.data ?? []).length,
      purchase_order_items: (poItems.data ?? []).length,
      grns_total: grnList.length,
      grns_completed: completedGrns.length,
      grns_completed_with_po: completedWithPO.length,
      grns_completed_with_warehouse: completedWithWarehouse.length,
      grn_items_total: (grnItems.data ?? []).length,
      products: (products.data ?? []).length,
      inventory_records: (inventory.data ?? []).length,
    },
    diagnosis: {
      reason_migration_returned_0_rows:
        completedGrns.length === 0
          ? 'NO completed GRNs found — either GRN status is still draft OR data was lost'
          : completedWithPO.length === 0
          ? 'Completed GRNs exist but NONE have purchase_order_id set'
          : (poItems.data ?? []).length === 0
          ? 'PO items table is empty — purchase_order_items has no rows'
          : 'GRNs and PO items exist — migration should have worked',
    },
    data: {
      companies: companies.data,
      warehouses: warehouses.data,
      grns: grns.data,
      grn_items: grnItems.data,
      purchase_orders: pos.data,
      purchase_order_items: poItems.data,
      products: products.data,
      inventory: inventory.data,
    },
  }, { status: 200 })
}
