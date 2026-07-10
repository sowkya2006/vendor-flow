'use server'

import { redirect } from 'next/navigation'
import { getUser, getCompanyId } from '@/lib/supabase/get-auth'
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createProductCategory,
  deleteProductCategory,
} from '@/lib/supabase/inventory'
import { createProductSchema, updateProductSchema, createProductCategorySchema } from '@/lib/validations/inventory'
import type { CreateProductInput, UpdateProductInput } from '@/lib/validations/inventory'

export async function createProductAction(values: CreateProductInput) {
  const parsed = createProductSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid form data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const companyId = await getCompanyId()
  const product = await createProduct(companyId, parsed.data)
  redirect(`/products/${product.id}`)
}

export async function updateProductAction(id: string, values: UpdateProductInput) {
  const parsed = updateProductSchema.safeParse(values)
  if (!parsed.success) {
    throw new Error('Invalid form data: ' + JSON.stringify(parsed.error.flatten()))
  }
  const companyId = await getCompanyId()
  await updateProduct(id, companyId, parsed.data)
  redirect(`/products/${id}`)
}

export async function deleteProductAction(id: string) {
  const companyId = await getCompanyId()
  await deleteProduct(id, companyId)
  redirect('/products')
}

export async function createProductCategoryAction(name: string, description?: string) {
  const parsed = createProductCategorySchema.safeParse({ name, description })
  if (!parsed.success) throw new Error('Invalid category data')
  const companyId = await getCompanyId()
  return await createProductCategory(companyId, parsed.data)
}

export async function deleteProductCategoryAction(id: string) {
  const companyId = await getCompanyId()
  await deleteProductCategory(id, companyId)
}
