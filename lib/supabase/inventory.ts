import { createClient } from '@/lib/supabase/server'
import type {
  Product,
  ProductCategory,
  Warehouse,
  InventoryRecord,
  InventoryListItem,
  Grn,
  InventoryTransaction,
  InventoryStats,
  ProductStatus,
  GrnStatus,
} from '@/types/inventory'
import type {
  CreateProductInput,
  UpdateProductInput,
  CreateProductCategoryInput,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  AdjustInventoryInput,
  CreateGrnInput,
  UpdateGrnInput,
} from '@/lib/validations/inventory'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function db() {
  return (await createClient()) as unknown as {
    from: (table: string) => any
    rpc: (fn: string, args?: any) => any
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CATEGORIES
// ─────────────────────────────────────────────────────────────────────────────

export async function getProductCategories(companyId: string): Promise<ProductCategory[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('company_id', companyId)
    .order('name')
  if (error) throw error
  return (data ?? []) as ProductCategory[]
}

export async function createProductCategory(
  companyId: string,
  input: CreateProductCategoryInput,
): Promise<ProductCategory> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('product_categories')
    .insert({ ...input, company_id: companyId })
    .select()
    .single()
  if (error) throw error
  return data as ProductCategory
}

export async function deleteProductCategory(id: string, companyId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCT_DETAIL_SELECT = `
  *,
  category:product_categories ( id, name ),
  preferred_vendor:vendors ( id, name )
`

export interface ProductFilters {
  search?: string
  status?: ProductStatus
  category_id?: string
  page?: number
  pageSize?: number
}

export interface ProductListResult {
  data: Product[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

export async function getProducts(
  companyId: string,
  filters: ProductFilters = {},
): Promise<ProductListResult> {
  const supabase = await db()
  const { search, status, category_id, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('products')
    .select(PRODUCT_DETAIL_SELECT, { count: 'exact' })
    .eq('company_id', companyId)
    .order('name')
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (category_id) query = query.eq('category_id', category_id)
  if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as Product[],
    total: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

export async function getProductById(id: string, companyId: string): Promise<Product | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_DETAIL_SELECT)
    .eq('id', id)
    .eq('company_id', companyId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Product
}

export async function createProduct(
  companyId: string,
  input: CreateProductInput,
): Promise<Product> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('products')
    .insert({
      ...input,
      company_id: companyId,
      category_id: input.category_id ?? null,
      preferred_vendor_id: input.preferred_vendor_id ?? null,
    })
    .select(PRODUCT_DETAIL_SELECT)
    .single()
  if (error) throw error
  return data as Product
}

export async function updateProduct(
  id: string,
  companyId: string,
  input: UpdateProductInput,
): Promise<Product> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('products')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select(PRODUCT_DETAIL_SELECT)
    .single()
  if (error) throw error
  return data as Product
}

export async function deleteProduct(id: string, companyId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────────
// WAREHOUSES
// ─────────────────────────────────────────────────────────────────────────────

export async function getWarehouses(companyId: string, activeOnly = false): Promise<Warehouse[]> {
  const supabase = await db()
  let query = supabase
    .from('warehouses')
    .select('*')
    .eq('company_id', companyId)
    .order('is_default', { ascending: false })
    .order('name')
  if (activeOnly) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Warehouse[]
}

export async function getWarehouseById(id: string, companyId: string): Promise<Warehouse | null> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .eq('id', id)
    .eq('company_id', companyId)
    .single()
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Warehouse
}

export async function createWarehouse(
  companyId: string,
  input: CreateWarehouseInput,
): Promise<Warehouse> {
  const supabase = await db()

  // If setting as default, unset existing defaults
  if (input.is_default) {
    await supabase
      .from('warehouses')
      .update({ is_default: false })
      .eq('company_id', companyId)
      .eq('is_default', true)
  }

  const { data, error } = await supabase
    .from('warehouses')
    .insert({ ...input, company_id: companyId })
    .select()
    .single()
  if (error) throw error
  return data as Warehouse
}

export async function updateWarehouse(
  id: string,
  companyId: string,
  input: UpdateWarehouseInput,
): Promise<Warehouse> {
  const supabase = await db()

  // If setting as default, unset existing defaults (except this one)
  if (input.is_default) {
    await supabase
      .from('warehouses')
      .update({ is_default: false })
      .eq('company_id', companyId)
      .eq('is_default', true)
      .neq('id', id)
  }

  const { data, error } = await supabase
    .from('warehouses')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()
  if (error) throw error
  return data as Warehouse
}

export async function deleteWarehouse(id: string, companyId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('warehouses')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY (stock levels)
// ─────────────────────────────────────────────────────────────────────────────

const INVENTORY_LIST_SELECT = `
  id, product_id, warehouse_id, quantity_on_hand, quantity_reserved, quantity_available, valuation, last_updated,
  product:products ( id, name, sku, unit, unit_cost, status, min_stock_level, reorder_level,
    category:product_categories ( id, name ),
    preferred_vendor:vendors ( id, name )
  ),
  warehouse:warehouses ( id, name, code )
`

export interface InventoryFilters {
  search?: string
  warehouse_id?: string
  low_stock?: boolean
  out_of_stock?: boolean
  page?: number
  pageSize?: number
}

export interface InventoryListResult {
  data: InventoryListItem[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

export async function getInventory(
  companyId: string,
  filters: InventoryFilters = {},
): Promise<InventoryListResult> {
  const supabase = await db()
  const { search, warehouse_id, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('inventory')
    .select(INVENTORY_LIST_SELECT, { count: 'exact' })
    .eq('company_id', companyId)
    .order('last_updated', { ascending: false })
    .range(from, to)

  if (warehouse_id) query = query.eq('warehouse_id', warehouse_id)
  if (filters.out_of_stock) query = query.lte('quantity_available', 0)

  const { data, error, count } = await query
  if (error) throw error

  let results = (data ?? []) as InventoryListItem[]

  // Client-side search on joined product name/sku (Supabase can't filter on joined columns easily)
  if (search) {
    const s = search.toLowerCase()
    results = results.filter(
      (r) =>
        r.product.name.toLowerCase().includes(s) || r.product.sku.toLowerCase().includes(s),
    )
  }

  // Low stock filter: available <= reorder_level
  if (filters.low_stock) {
    results = results.filter(
      (r) => r.quantity_available > 0 && r.quantity_available <= r.product.reorder_level,
    )
  }

  return {
    data: results,
    total: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

export async function getInventoryByProduct(
  productId: string,
  companyId: string,
): Promise<InventoryRecord[]> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('inventory')
    .select(`*, warehouse:warehouses ( id, name, code )`)
    .eq('product_id', productId)
    .eq('company_id', companyId)
  if (error) throw error
  return (data ?? []) as InventoryRecord[]
}

type InternalTransactionType = 'stock_in' | 'stock_out' | 'adjustment' | 'grn'

interface InternalAdjustInput {
  product_id: string
  warehouse_id: string
  quantity: number
  transaction_type: InternalTransactionType
  notes?: string | null
}

/** Ensure an inventory row exists for product+warehouse, then adjust stock */
export async function adjustInventory(
  companyId: string,
  userId: string,
  input: AdjustInventoryInput | InternalAdjustInput,
): Promise<InventoryRecord> {
  const supabase = await db()

  // Upsert the inventory row (create if not exists)
  const { data: existing } = await supabase
    .from('inventory')
    .select('id, quantity_on_hand, quantity_reserved')
    .eq('product_id', input.product_id)
    .eq('warehouse_id', input.warehouse_id)
    .single()

  const currentQty = existing?.quantity_on_hand ?? 0
  let newQty: number

  if (input.transaction_type === 'stock_in' || input.transaction_type === 'grn') {
    newQty = currentQty + input.quantity
  } else if (input.transaction_type === 'stock_out') {
    newQty = Math.max(0, currentQty - Math.abs(input.quantity))
  } else {
    // adjustment — quantity can be positive or negative
    newQty = Math.max(0, currentQty + input.quantity)
  }

  let inventoryRow: InventoryRecord
  if (existing) {
    // Fetch product unit_cost for valuation update
    let unitCost = 0
    try {
      const { data: prod } = await supabase
        .from('products').select('unit_cost').eq('id', input.product_id).maybeSingle()
      unitCost = Number((prod as { unit_cost: number } | null)?.unit_cost) || 0
    } catch { /* non-critical */ }

    const { data, error } = await supabase
      .from('inventory')
      .update({
        quantity_on_hand: newQty,
        valuation: newQty * unitCost,
        last_updated: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    inventoryRow = data as InventoryRecord
  } else {
    // Fetch product unit_cost for valuation
    let unitCost = 0
    try {
      const { data: prod } = await supabase
        .from('products').select('unit_cost').eq('id', input.product_id).maybeSingle()
      unitCost = Number((prod as { unit_cost: number } | null)?.unit_cost) || 0
    } catch { /* non-critical */ }

    const { data, error } = await supabase
      .from('inventory')
      .insert({
        company_id: companyId,
        product_id: input.product_id,
        warehouse_id: input.warehouse_id,
        quantity_on_hand: newQty,
        quantity_reserved: 0,
        valuation: newQty * unitCost,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    inventoryRow = data as InventoryRecord
  }

  // Log the transaction
  await supabase.from('inventory_transactions').insert({
    company_id: companyId,
    product_id: input.product_id,
    warehouse_id: input.warehouse_id,
    transaction_type: input.transaction_type,
    quantity: input.quantity,
    quantity_before: currentQty,
    quantity_after: newQty,
    reference_type: 'manual',
    notes: input.notes ?? null,
    created_by: userId,
  })

  return inventoryRow
}

// ─────────────────────────────────────────────────────────────────────────────
// GRN
// ─────────────────────────────────────────────────────────────────────────────

const GRN_DETAIL_SELECT = `
  *,
  warehouse:warehouses ( id, name, code ),
  purchase_order:purchase_orders (
    id, po_number, vendor_id,
    vendor:vendors ( id, name ),
    items:purchase_order_items ( id, description, quantity, unit, unit_price )
  ),
  grn_items (
    id, grn_id, product_id,
    item_name, description, sku, unit,
    tax_percentage, ordered_quantity, received_quantity,
    accepted_quantity, rejected_quantity,
    damage_notes, batch_number, serial_numbers, warehouse_location,
    unit_cost, notes,
    product:products ( id, name, sku, unit )
  )
`

const GRN_DETAIL_SELECT_MINIMAL = `
  *,
  warehouse:warehouses ( id, name, code ),
  purchase_order:purchase_orders (
    id, po_number, vendor_id,
    vendor:vendors ( id, name ),
    items:purchase_order_items ( id, description, quantity, unit, unit_price )
  ),
  grn_items (
    id, grn_id, product_id,
    ordered_quantity, received_quantity,
    unit_cost, notes
  )
`

const GRN_DETAIL_SELECT_BARE = `
  *,
  warehouse:warehouses ( id, name, code ),
  purchase_order:purchase_orders ( id, po_number ),
  grn_items (
    id, grn_id, product_id,
    ordered_quantity, received_quantity,
    unit_cost, notes
  )
`

export interface GrnFilters {
  search?: string
  status?: GrnStatus
  warehouse_id?: string
  page?: number
  pageSize?: number
}

export interface GrnListResult {
  data: Grn[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

export async function getGrns(companyId: string, filters: GrnFilters = {}): Promise<GrnListResult> {
  const supabase = await db()
  const { search, status, warehouse_id, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('grn')
    .select(
      `id, grn_number, received_date, status, notes, created_at, warehouse_id, purchase_order_id,
       warehouse:warehouses ( id, name, code ),
       purchase_order:purchase_orders ( id, po_number )`,
      { count: 'exact' },
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (warehouse_id) query = query.eq('warehouse_id', warehouse_id)
  if (search) query = query.ilike('grn_number', `%${search}%`)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as Grn[],
    total: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

export async function getGrnById(id: string, companyId: string): Promise<Grn | null> {
  const supabase = await db()

  // Try full select first (extended columns from migration 20240118000000)
  let { data, error } = await supabase
    .from('grn')
    .select(GRN_DETAIL_SELECT)
    .eq('id', id)
    .eq('company_id', companyId)
    .single()

  // 42703 = column does not exist — migration not run, try minimal
  if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
    ;({ data, error } = await supabase
      .from('grn')
      .select(GRN_DETAIL_SELECT_MINIMAL)
      .eq('id', id)
      .eq('company_id', companyId)
      .single())
  }

  // If still failing (e.g. products table has schema issues), try bare select
  if (error && (error.code === '42703' || error.message?.includes('does not exist'))) {
    ;({ data, error } = await supabase
      .from('grn')
      .select(GRN_DETAIL_SELECT_BARE)
      .eq('id', id)
      .eq('company_id', companyId)
      .single())
  }

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Grn
}

export async function createGrn(
  companyId: string,
  userId: string,
  input: CreateGrnInput,
): Promise<Grn> {
  const supabase = await db()

  // grn_number is auto-generated by DB trigger; pass empty string to trigger it
  const { data: grn, error } = await supabase
    .from('grn')
    .insert({
      company_id: companyId,
      grn_number: '',
      purchase_order_id: input.purchase_order_id ?? null,
      warehouse_id: input.warehouse_id,
      received_by: userId,
      received_date: input.received_date,
      status: 'draft',
      notes: input.notes ?? null,
    })
    .select()
    .single()
  if (error) throw error

  // Insert items
  if (input.items.length > 0) {
    const itemRows = input.items.map((item) => ({
      grn_id: grn.id,
      // product_id may be null — grn_items.product_id is nullable
      product_id: item.product_id ?? null,
      // Always store a display name so the detail page is never blank
      item_name: item.item_name ?? item.description ?? item.notes ?? null,
      description: item.description ?? item.notes ?? null,
      sku: item.sku ?? null,
      unit: item.unit ?? null,
      tax_percentage: item.tax_percentage ?? 0,
      ordered_quantity: item.ordered_quantity ?? 0,
      received_quantity: item.received_quantity,
      accepted_quantity: item.accepted_quantity ?? item.received_quantity,
      rejected_quantity: item.rejected_quantity ?? 0,
      damage_notes: item.damage_notes ?? null,
      batch_number: item.batch_number ?? null,
      serial_numbers: item.serial_numbers ?? null,
      warehouse_location: item.warehouse_location ?? null,
      unit_cost: item.unit_cost,
      notes: item.notes ?? null,
    }))
    const { error: itemsErr } = await supabase.from('grn_items').insert(itemRows)
    if (itemsErr) {
      console.error('[createGrn] grn_items insert error:', itemsErr)

      // Determine if error is due to missing columns (migration not run)
      const isMissingCol = itemsErr.code === '42703' || itemsErr.message?.includes('does not exist')
      // Determine if error is due to NOT NULL on product_id
      const isNullConstraint = itemsErr.code === '23502' || itemsErr.message?.includes('product_id')

      if (isMissingCol || isNullConstraint) {
        // Fallback: only insert items that have a product_id (pre-migration schema requires it)
        const itemsWithProduct = input.items.filter((item) => item.product_id)
        if (itemsWithProduct.length > 0) {
          const minimalRows = itemsWithProduct.map((item) => ({
            grn_id: grn.id,
            product_id: item.product_id!,
            ordered_quantity: item.ordered_quantity ?? 0,
            received_quantity: item.received_quantity,
            unit_cost: item.unit_cost,
            notes: item.item_name ?? item.description ?? item.notes ?? null,
          }))
          const { error: fallbackErr } = await supabase.from('grn_items').insert(minimalRows)
          if (fallbackErr) {
            console.error('[createGrn] minimal insert also failed:', fallbackErr)
            // Non-fatal — GRN created without items; user sees "No items" message
          }
        }
        // If no items have product_id (all from PO without products), GRN is created empty
        // User needs to run the migration to fix this permanently
      } else {
        throw itemsErr
      }
    }
  }

  const created = await getGrnById(grn.id, companyId)
  return created as Grn
}

/** Public alias for syncInventoryFromGRN — used by resyncGrnInventoryAction */
export async function syncInventoryFromGRNPublic(grnId: string, companyId: string, userId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return syncInventoryFromGRN(grnId, companyId, userId, null as any)
}

/**
 * syncInventoryFromGRN — The core ERP sync engine.
 *
 * Called when a GRN is marked completed. Uses admin client to bypass ALL
 * RLS restrictions so this always works regardless of who triggered it.
 *
 * Strategy (in order of priority):
 * 1. Read grn_items directly with admin client
 *    — if they have item_name/notes, use that as the product name
 * 2. If grn_items are empty or have no names, fall back to PO items
 *    — fetched directly from purchase_order_items via the GRN's purchase_order_id
 *
 * For each item:
 * A. Find or auto-create a product (no duplicates by name)
 * B. Upsert inventory row (create or increase stock)
 * C. Log inventory transaction
 * D. Update product.unit_cost to latest purchase price
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function syncInventoryFromGRN(grnId: string, companyId: string, userId: string, _supabase: any): Promise<void> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any

  // ── Step 1: Read GRN base data ──────────────────────────────────────────
  const { data: grn, error: grnErr } = await admin
    .from('grn')
    .select('id, grn_number, warehouse_id, purchase_order_id, received_date')
    .eq('id', grnId)
    .maybeSingle()

  if (grnErr || !grn) {
    console.error('[syncInventoryFromGRN] GRN not found:', grnErr?.message)
    return
  }

  const warehouseId: string | null = grn.warehouse_id
  const poId: string | null = grn.purchase_order_id
  const grnNumber: string = grn.grn_number ?? grnId.slice(0, 8)

  if (!warehouseId) {
    console.error('[syncInventoryFromGRN] GRN has no warehouse_id — cannot sync inventory')
    return
  }

  // ── Step 2: Try to get items from grn_items (base columns only, no migration needed) ──
  const { data: grnItems } = await admin
    .from('grn_items')
    .select('id, product_id, ordered_quantity, received_quantity, unit_cost, notes')
    .eq('grn_id', grnId)

  type GrnItemRaw = {
    id: string; product_id: string | null
    ordered_quantity: number; received_quantity: number; unit_cost: number; notes: string | null
  }

  const rawGrnItems = (grnItems ?? []) as GrnItemRaw[]

  // ── Step 3: Build the canonical item list ────────────────────────────────
  // Each entry: { name, sku, unit, quantity, unitCost, vendorId }
  type SyncItem = {
    name: string
    sku: string | null
    unit: string
    quantity: number
    unitCost: number
    vendorId: string | null
    grnItemId: string | null
    existingProductId: string | null
  }

  const syncItems: SyncItem[] = []

  // Get PO data regardless — we always need it for vendor_id and as fallback
  let poItems: Array<{ id: string; description: string; quantity: number; unit: string | null; unit_price: number }> = []
  let vendorId: string | null = null
  let poNumber: string | null = null

  if (poId) {
    const { data: po } = await admin
      .from('purchase_orders')
      .select('po_number, vendor_id, items:purchase_order_items(id, description, quantity, unit, unit_price)')
      .eq('id', poId)
      .maybeSingle()

    if (po) {
      vendorId = po.vendor_id ?? null
      poNumber = po.po_number ?? null
      poItems = (po.items ?? []) as typeof poItems
    }
  }

  if (rawGrnItems.length > 0) {
    // Case A: grn_items exist — use them, enrich names from notes or PO items
    for (let i = 0; i < rawGrnItems.length; i++) {
      const gi = rawGrnItems[i]
      const qty = Number(gi.received_quantity) || 0
      if (qty <= 0) continue

      // Name resolution: notes field = item name (fallback saved in createGrn)
      // OR match by index to PO item
      const notesName = gi.notes?.trim() || null
      const poItemByIndex = poItems[i]
      const name = notesName ?? poItemByIndex?.description ?? `Item ${i + 1}`
      const unit = poItemByIndex?.unit ?? 'pcs'
      const unitCost = Number(gi.unit_cost) > 0 ? Number(gi.unit_cost) : (poItemByIndex?.unit_price ?? 0)
      const sku = poNumber ? `${poNumber}-${String(i + 1).padStart(3, '0')}` : null

      syncItems.push({
        name,
        sku,
        unit,
        quantity: qty,
        unitCost,
        vendorId,
        grnItemId: gi.id,
        existingProductId: gi.product_id,
      })
    }
  } else if (poItems.length > 0) {
    // Case B: no grn_items — use PO line items directly
    for (let i = 0; i < poItems.length; i++) {
      const pi = poItems[i]
      if (!pi.description?.trim()) continue
      const sku = poNumber ? `${poNumber}-${String(i + 1).padStart(3, '0')}` : null

      syncItems.push({
        name: pi.description.trim(),
        sku,
        unit: pi.unit ?? 'pcs',
        quantity: pi.quantity,
        unitCost: pi.unit_price,
        vendorId,
        grnItemId: null,
        existingProductId: null,
      })
    }
  }

  if (syncItems.length === 0) {
    console.warn('[syncInventoryFromGRN] No items found for GRN', grnNumber)
    return
  }

  // ── Step 4: Process each item ────────────────────────────────────────────
  for (const item of syncItems) {
    try {
      let productId: string | null = item.existingProductId

      // A. Find existing product — by name (case-insensitive)
      if (!productId) {
        const { data: existingByName } = await admin
          .from('products')
          .select('id, name, sku')
          .eq('company_id', companyId)
          .ilike('name', item.name)
          .limit(1)
          .maybeSingle()

        if (existingByName) {
          productId = existingByName.id
        } else if (item.sku) {
          // Also try by SKU
          const { data: existingBySku } = await admin
            .from('products')
            .select('id')
            .eq('company_id', companyId)
            .eq('sku', item.sku)
            .limit(1)
            .maybeSingle()
          if (existingBySku) productId = existingBySku.id
        }
      }

      // B. Auto-create product if it doesn't exist
      if (!productId) {
        // Generate a unique SKU: use provided or generate from GRN
        let finalSku = item.sku ?? `GRN-${grnNumber}-${String(syncItems.indexOf(item) + 1).padStart(3, '0')}`

        // Check SKU uniqueness — if taken, append suffix
        const { data: skuCheck } = await admin
          .from('products').select('id').eq('company_id', companyId).eq('sku', finalSku).maybeSingle()
        if (skuCheck) finalSku = `${finalSku}-${Date.now().toString(36).slice(-4)}`

        const { data: newProduct, error: createErr } = await admin
          .from('products')
          .insert({
            company_id: companyId,
            name: item.name,
            sku: finalSku,
            description: `Auto-created from GRN ${grnNumber} on ${new Date().toLocaleDateString('en-IN')}`,
            unit: item.unit,
            unit_cost: item.unitCost,
            status: 'active',
            min_stock_level: 0,
            reorder_level: 5,
            preferred_vendor_id: item.vendorId ?? null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (createErr) {
          console.error('[syncInventoryFromGRN] Product create failed for', item.name, ':', createErr.message)
          continue
        }
        productId = (newProduct as { id: string }).id
        console.log(`[syncInventoryFromGRN] ✓ Created product "${item.name}" (${finalSku})`)
      } else {
        // C. Update existing product's unit_cost to latest purchase price
        await admin
          .from('products')
          .update({ unit_cost: item.unitCost, updated_at: new Date().toISOString() })
          .eq('id', productId)
      }

      // D. Link product_id back to grn_item if it was null
      if (item.grnItemId && !item.existingProductId) {
        await admin.from('grn_items').update({ product_id: productId }).eq('id', item.grnItemId)
      }

      // E. Upsert inventory row
      // IMPORTANT: Use SET not ADD — this makes the sync idempotent.
      // The inventory quantity for a GRN item should always equal the
      // received quantity from that GRN (plus any other GRNs via separate runs).
      // To avoid double-counting on re-sync, we track via transaction records.
      const { data: existingInv } = await admin
        .from('inventory')
        .select('id, quantity_on_hand')
        .eq('product_id', productId)
        .eq('warehouse_id', warehouseId)
        .maybeSingle()

      // Check if we already have a transaction for this GRN + product
      // If yes, skip the inventory update (already synced)
      const { data: existingTxn } = await admin
        .from('inventory_transactions')
        .select('id, quantity')
        .eq('company_id', companyId)
        .eq('product_id', productId)
        .eq('reference_type', 'grn')
        .eq('reference_id', grnId)
        .maybeSingle()

      if (existingTxn) {
        // Already synced — skip to avoid double-counting
        console.log(`[syncInventoryFromGRN] ⏭ Skipped (already synced): "${item.name}" — txn ${existingTxn.id}`)
        continue
      }

      const prevQty = Number(existingInv?.quantity_on_hand) || 0
      const newQty = prevQty + item.quantity
      const newValuation = newQty * item.unitCost

      if (existingInv) {
        await admin
          .from('inventory')
          .update({ quantity_on_hand: newQty, valuation: newValuation, last_updated: new Date().toISOString() })
          .eq('id', existingInv.id)
      } else {
        await admin
          .from('inventory')
          .insert({
            company_id: companyId,
            product_id: productId,
            warehouse_id: warehouseId,
            quantity_on_hand: newQty,
            quantity_reserved: 0,
            valuation: newValuation,
            last_updated: new Date().toISOString(),
          })
      }

      // F. Log inventory transaction
      await admin.from('inventory_transactions').insert({
        company_id: companyId,
        product_id: productId,
        warehouse_id: warehouseId,
        transaction_type: 'grn',
        quantity: item.quantity,
        quantity_before: prevQty,
        quantity_after: newQty,
        reference_type: 'grn',
        reference_id: grnId,
        notes: `GRN ${grnNumber} — ${item.name}`,
        created_by: userId,
      })

      console.log(`[syncInventoryFromGRN] ✓ Inventory updated: "${item.name}" +${item.quantity} → total ${newQty} | value ₹${newValuation.toLocaleString('en-IN')}`)

    } catch (itemErr) {
      console.error(`[syncInventoryFromGRN] Failed for item "${item.name}":`, itemErr)
    }
  }

  console.log(`[syncInventoryFromGRN] ✓ GRN ${grnNumber} sync complete — ${syncItems.length} items processed`)
}

export async function updateGrnStatus(
  id: string,
  companyId: string,
  userId: string,
  input: UpdateGrnInput,
): Promise<Grn> {
  const supabase = await db()

  const { data, error } = await supabase
    .from('grn')
    .update({ status: input.status, notes: input.notes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('company_id', companyId)
    .select()
    .single()
  if (error) throw error

  // ────────────────────────────────────────────────────────────────────────────
  // GRN COMPLETION — The single source of truth for product/inventory sync.
  // Uses admin client throughout to bypass all RLS restrictions.
  // Works regardless of whether grn_items migration has been run.
  // ────────────────────────────────────────────────────────────────────────────
  if (input.status === 'completed') {
    await syncInventoryFromGRN(id, companyId, userId, supabase)
  }

  const updated = await getGrnById(id, companyId)
  return updated as Grn
}

export async function deleteGrn(id: string, companyId: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase
    .from('grn')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface TransactionFilters {
  product_id?: string
  warehouse_id?: string
  transaction_type?: string
  page?: number
  pageSize?: number
}

export interface TransactionListResult {
  data: InventoryTransaction[]
  total: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

export async function getInventoryTransactions(
  companyId: string,
  filters: TransactionFilters = {},
): Promise<TransactionListResult> {
  const supabase = await db()
  const { product_id, warehouse_id, transaction_type, page = 1, pageSize = 30 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('inventory_transactions')
    .select(
      `*,
       product:products ( id, name, sku ),
       warehouse:warehouses ( id, name, code )`,
      { count: 'exact' },
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (product_id) query = query.eq('product_id', product_id)
  if (warehouse_id) query = query.eq('warehouse_id', warehouse_id)
  if (transaction_type) query = query.eq('transaction_type', transaction_type)

  const { data, error, count } = await query
  if (error) throw error

  return {
    data: (data ?? []) as InventoryTransaction[],
    total: count ?? 0,
    page,
    pageSize,
    hasNextPage: (count ?? 0) > to + 1,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function getInventoryStats(companyId: string): Promise<InventoryStats> {
  const supabase = await db()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

  const [products, totalStockValue, lowStock, outOfStock, warehouses, recentGrn] =
    await Promise.all([
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active'),

      supabase
        .from('inventory')
        .select('valuation')
        .eq('company_id', companyId),

      supabase
        .from('inventory')
        .select('id, product:products!inner(reorder_level)', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gt('quantity_available', 0),

      supabase
        .from('inventory')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .lte('quantity_available', 0),

      supabase
        .from('warehouses')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true),

      supabase
        .from('grn')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo),
    ])

  const stockValue = (totalStockValue.data ?? []).reduce(
    (sum: number, row: { valuation: number | null }) => sum + (Number(row.valuation) || 0),
    0,
  )

  // For low_stock we need to compare quantity_available against reorder_level per product
  // The count query above isn't precise — do a simple client-side pass on a limited set
  const { data: inventoryRows } = await supabase
    .from('inventory')
    .select('quantity_available, product:products ( reorder_level )')
    .eq('company_id', companyId)
    .gt('quantity_available', 0)
    .limit(1000)

  const lowStockCount = (inventoryRows ?? []).filter(
    (r: { quantity_available: number; product: { reorder_level: number } }) =>
      r.quantity_available <= r.product.reorder_level,
  ).length

  return {
    total_products: products.count ?? 0,
    total_stock_value: stockValue,
    low_stock_count: lowStockCount,
    out_of_stock_count: outOfStock.count ?? 0,
    total_warehouses: warehouses.count ?? 0,
    recent_grn_count: recentGrn.count ?? 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Light vendor list for dropdowns */
export async function getVendorOptions(
  companyId: string,
): Promise<Array<{ id: string; name: string }>> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('name')
    .limit(200)
  if (error) throw error
  return (data ?? []) as Array<{ id: string; name: string }>
}

/** Open purchase orders for GRN dropdown */
export async function getOpenPurchaseOrders(
  companyId: string,
): Promise<Array<{
  id: string
  po_number: string
  vendor: { name: string } | null
  items: Array<{
    id: string
    description: string
    quantity: number
    unit: string | null
    unit_price: number
  }> | null
}>> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      id, po_number,
      vendor:vendors(name),
      items:purchase_order_items(id, description, quantity, unit, unit_price)
    `)
    .eq('company_id', companyId)
    .in('status', ['approved', 'sent', 'acknowledged', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as Array<{
    id: string
    po_number: string
    vendor: { name: string } | null
    items: Array<{
      id: string
      description: string
      quantity: number
      unit: string | null
      unit_price: number
    }> | null
  }>
}
