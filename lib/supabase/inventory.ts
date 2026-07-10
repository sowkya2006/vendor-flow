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
    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity_on_hand: newQty })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    inventoryRow = data as InventoryRecord
  } else {
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        company_id: companyId,
        product_id: input.product_id,
        warehouse_id: input.warehouse_id,
        quantity_on_hand: newQty,
        quantity_reserved: 0,
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
  purchase_order:purchase_orders ( id, po_number ),
  grn_items (
    *,
    product:products ( id, name, sku, unit )
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
  const { data, error } = await supabase
    .from('grn')
    .select(GRN_DETAIL_SELECT)
    .eq('id', id)
    .eq('company_id', companyId)
    .single()
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
      product_id: item.product_id,
      ordered_quantity: item.ordered_quantity ?? 0,
      received_quantity: item.received_quantity,
      unit_cost: item.unit_cost,
      notes: item.notes ?? null,
    }))
    const { error: itemsErr } = await supabase.from('grn_items').insert(itemRows)
    if (itemsErr) throw itemsErr
  }

  const created = await getGrnById(grn.id, companyId)
  return created as Grn
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

  // When completing a GRN, update inventory stock levels
  if (input.status === 'completed') {
    const grn = await getGrnById(id, companyId)
    if (grn?.grn_items) {
      for (const item of grn.grn_items) {
        if (item.received_quantity > 0) {
          await adjustInventory(companyId, userId, {
            product_id: item.product_id,
            warehouse_id: grn.warehouse_id,
            quantity: item.received_quantity,
            transaction_type: 'grn',
            notes: `GRN ${grn.grn_number}`,
          })
        }
      }
    }
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
    (sum: number, row: { valuation: number }) => sum + (row.valuation ?? 0),
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
): Promise<Array<{ id: string; po_number: string; vendor: { name: string } | null }>> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('id, po_number, vendor:vendors ( name )')
    .eq('company_id', companyId)
    .in('status', ['approved', 'sent', 'acknowledged', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as Array<{ id: string; po_number: string; vendor: { name: string } | null }>
}
