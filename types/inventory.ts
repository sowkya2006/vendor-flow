// ─────────────────────────────────────────────────────────────
// Inventory module TypeScript types
// ─────────────────────────────────────────────────────────────

export type ProductStatus = 'active' | 'inactive' | 'discontinued'

export type InventoryTransactionType =
  | 'stock_in'
  | 'stock_out'
  | 'adjustment'
  | 'grn'
  | 'reservation'
  | 'reservation_release'

export type GrnStatus = 'draft' | 'completed' | 'cancelled'

// ── Product Category ──────────────────────────────────────────
export interface ProductCategory {
  id: string
  company_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

// ── Product ───────────────────────────────────────────────────
export interface Product {
  id: string
  company_id: string
  category_id: string | null
  preferred_vendor_id: string | null
  name: string
  sku: string
  description: string | null
  unit: string
  unit_cost: number
  status: ProductStatus
  min_stock_level: number
  max_stock_level: number | null
  reorder_level: number
  lead_time_days: number | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joins
  category?: { id: string; name: string } | null
  preferred_vendor?: { id: string; name: string } | null
}

// ── Warehouse ─────────────────────────────────────────────────
export interface Warehouse {
  id: string
  company_id: string
  name: string
  code: string
  address: string | null
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Inventory (stock levels) ──────────────────────────────────
export interface InventoryRecord {
  id: string
  company_id: string
  product_id: string
  warehouse_id: string
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  valuation: number
  last_updated: string
  created_at: string
  // Joins
  product?: Product
  warehouse?: Warehouse
}

// ── Inventory with product + warehouse (for list views) ───────
export interface InventoryListItem {
  id: string
  product_id: string
  warehouse_id: string
  quantity_on_hand: number
  quantity_reserved: number
  quantity_available: number
  valuation: number
  last_updated: string
  product: {
    id: string
    name: string
    sku: string
    unit: string
    unit_cost: number
    status: ProductStatus
    min_stock_level: number
    reorder_level: number
    category: { id: string; name: string } | null
    preferred_vendor: { id: string; name: string } | null
  }
  warehouse: {
    id: string
    name: string
    code: string
  }
}

// ── GRN ───────────────────────────────────────────────────────
export interface GrnItem {
  id: string
  grn_id: string
  product_id: string
  ordered_quantity: number
  received_quantity: number
  unit_cost: number
  notes: string | null
  product?: { id: string; name: string; sku: string; unit: string }
}

export interface Grn {
  id: string
  company_id: string
  grn_number: string
  purchase_order_id: string | null
  warehouse_id: string
  received_by: string
  received_date: string
  status: GrnStatus
  notes: string | null
  created_at: string
  updated_at: string
  // Joins
  warehouse?: { id: string; name: string; code: string }
  purchase_order?: { id: string; po_number: string } | null
  grn_items?: GrnItem[]
}

// ── Inventory Transaction ─────────────────────────────────────
export interface InventoryTransaction {
  id: string
  company_id: string
  product_id: string
  warehouse_id: string
  transaction_type: InventoryTransactionType
  quantity: number
  quantity_before: number
  quantity_after: number
  reference_type: string | null
  reference_id: string | null
  notes: string | null
  created_by: string
  created_at: string
  // Joins
  product?: { id: string; name: string; sku: string }
  warehouse?: { id: string; name: string; code: string }
}

// ── Dashboard stats ───────────────────────────────────────────
export interface InventoryStats {
  total_products: number
  total_stock_value: number
  low_stock_count: number
  out_of_stock_count: number
  total_warehouses: number
  recent_grn_count: number
}

// ── Stock status helper ───────────────────────────────────────
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstocked'

export function getStockStatus(
  available: number,
  reorderLevel: number,
  maxStock?: number | null,
): StockStatus {
  if (available <= 0) return 'out_of_stock'
  if (available <= reorderLevel) return 'low_stock'
  if (maxStock != null && available > maxStock) return 'overstocked'
  return 'in_stock'
}

// ── Labels / display maps ─────────────────────────────────────
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  discontinued: 'Discontinued',
}

export const GRN_STATUS_LABELS: Record<GrnStatus, string> = {
  draft: 'Draft',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const TRANSACTION_TYPE_LABELS: Record<InventoryTransactionType, string> = {
  stock_in: 'Stock In',
  stock_out: 'Stock Out',
  adjustment: 'Adjustment',
  grn: 'GRN Receipt',
  reservation: 'Reservation',
  reservation_release: 'Reservation Release',
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  overstocked: 'Overstocked',
}
