import { z } from 'zod'

// ── Product Category ──────────────────────────────────────────
export const createProductCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
})

export const updateProductCategorySchema = createProductCategorySchema.partial()

export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>

// ── Product ───────────────────────────────────────────────────
export const createProductSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(200),
    sku: z
      .string()
      .min(1, 'SKU is required')
      .max(100)
      .regex(
        /^[A-Za-z0-9_\-]+$/,
        'SKU can only contain letters, numbers, hyphens, and underscores',
      ),
    description: z.string().max(1000).optional().nullable(),
    category_id: z.string().uuid().optional().nullable(),
    preferred_vendor_id: z.string().uuid().optional().nullable(),
    unit: z.string().min(1, 'Unit is required').max(50),
    unit_cost: z.coerce.number().min(0, 'Unit cost must be non-negative'),
    status: z.enum(['active', 'inactive', 'discontinued']).default('active'),
    min_stock_level: z.coerce.number().min(0).default(0),
    max_stock_level: z.coerce.number().min(0).optional().nullable(),
    reorder_level: z.coerce.number().min(0).default(0),
    lead_time_days: z.coerce.number().int().min(0).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .refine((data) => !data.max_stock_level || data.max_stock_level >= data.min_stock_level, {
    message: 'Max stock must be ≥ min stock',
    path: ['max_stock_level'],
  })

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(100)
    .regex(
      /^[A-Za-z0-9_\-]+$/,
      'SKU can only contain letters, numbers, hyphens, and underscores',
    )
    .optional(),
  description: z.string().max(1000).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  preferred_vendor_id: z.string().uuid().optional().nullable(),
  unit: z.string().min(1, 'Unit is required').max(50).optional(),
  unit_cost: z.coerce.number().min(0, 'Unit cost must be non-negative').optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  min_stock_level: z.coerce.number().min(0).optional(),
  max_stock_level: z.coerce.number().min(0).optional().nullable(),
  reorder_level: z.coerce.number().min(0).optional(),
  lead_time_days: z.coerce.number().int().min(0).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

// ── Warehouse ─────────────────────────────────────────────────
export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(20)
    .regex(
      /^[A-Za-z0-9_\-]+$/,
      'Code can only contain letters, numbers, hyphens, and underscores',
    ),
  address: z.string().max(500).optional().nullable(),
  is_default: z.boolean().default(false),
  is_active: z.boolean().default(true),
})

export const updateWarehouseSchema = createWarehouseSchema.partial()

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>

// ── Inventory adjustment ──────────────────────────────────────
export const adjustInventorySchema = z.object({
  product_id: z.string().uuid('Invalid product'),
  warehouse_id: z.string().uuid('Invalid warehouse'),
  quantity: z.coerce.number({ required_error: 'Quantity is required' }),
  transaction_type: z.enum(['stock_in', 'stock_out', 'adjustment']),
  notes: z.string().max(500).optional().nullable(),
})

export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>

// ── GRN ───────────────────────────────────────────────────────
export const grnItemSchema = z.object({
  product_id: z.string().uuid('Invalid product'),
  ordered_quantity: z.coerce.number().min(0).default(0),
  received_quantity: z.coerce.number().min(0, 'Received quantity must be non-negative'),
  unit_cost: z.coerce.number().min(0, 'Unit cost must be non-negative'),
  notes: z.string().max(500).optional().nullable(),
})

export const createGrnSchema = z.object({
  purchase_order_id: z.string().uuid().optional().nullable(),
  warehouse_id: z.string().uuid('Warehouse is required'),
  received_date: z.string().min(1, 'Received date is required'),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(grnItemSchema).min(1, 'At least one item is required'),
})

export const updateGrnSchema = z.object({
  status: z.enum(['draft', 'completed', 'cancelled']),
  notes: z.string().max(2000).optional().nullable(),
})

export type CreateGrnInput = z.infer<typeof createGrnSchema>
export type UpdateGrnInput = z.infer<typeof updateGrnSchema>
export type GrnItemInput = z.infer<typeof grnItemSchema>
