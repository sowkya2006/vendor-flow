'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import {
  adjustInventory,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  createGrn,
  updateGrnStatus,
  deleteGrn,
} from '@/lib/supabase/inventory'
import {
  adjustInventorySchema,
  createWarehouseSchema,
  updateWarehouseSchema,
  createGrnSchema,
  updateGrnSchema,
} from '@/lib/validations/inventory'
import type {
  AdjustInventoryInput,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  CreateGrnInput,
  UpdateGrnInput,
} from '@/lib/validations/inventory'

// ── Stock adjustment ──────────────────────────────────────────
export async function adjustInventoryAction(values: AdjustInventoryInput) {
  const parsed = adjustInventorySchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid adjustment data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const user = await getUser()
  const companyId = await getCompanyId()
  await adjustInventory(companyId, user.id, parsed.data)
  revalidatePath('/inventory')
}

// ── Warehouses ────────────────────────────────────────────────
export async function createWarehouseAction(values: CreateWarehouseInput) {
  const parsed = createWarehouseSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid warehouse data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const companyId = await getCompanyId()
  const warehouse = await createWarehouse(companyId, parsed.data)
  redirect(`/inventory/warehouses`)
}

export async function updateWarehouseAction(id: string, values: UpdateWarehouseInput) {
  const parsed = updateWarehouseSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid warehouse data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const companyId = await getCompanyId()
  await updateWarehouse(id, companyId, parsed.data)
  redirect(`/inventory/warehouses`)
}

export async function deleteWarehouseAction(id: string) {
  const companyId = await getCompanyId()
  await deleteWarehouse(id, companyId)
  redirect('/inventory/warehouses')
}

// ── GRN ───────────────────────────────────────────────────────
export async function createGrnAction(values: CreateGrnInput) {
  const parsed = createGrnSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid GRN data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const user = await getUser()
  const companyId = await getCompanyId()
  const grn = await createGrn(companyId, user.id, parsed.data)
  redirect(`/inventory/grn/${grn.id}`)
}

export async function completeGrnAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await updateGrnStatus(id, companyId, user.id, { status: 'completed' })
  revalidatePath(`/inventory/grn/${id}`)
  revalidatePath('/inventory')
}

export async function cancelGrnAction(id: string) {
  const user = await getUser()
  const companyId = await getCompanyId()
  await updateGrnStatus(id, companyId, user.id, { status: 'cancelled' })
  revalidatePath(`/inventory/grn/${id}`)
}

export async function deleteGrnAction(id: string) {
  const companyId = await getCompanyId()
  await deleteGrn(id, companyId)
  redirect('/inventory/grn')
}
