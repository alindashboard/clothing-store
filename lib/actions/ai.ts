'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth/require-admin'
import {
  generateProductCopy,
  DescriptionGenerationError,
  type ProductCopy,
} from '@/lib/ai/product-description'
import type { Product } from '@/lib/types'

async function loadProduct(productId: string): Promise<{ product: Product; parentName: string | null } | null> {
  const supabase = createSupabaseAdminClient()
  const { data: product, error } = await supabase
    .from('products')
    .select('*, category:categories(*), variants:product_variants(*), images:product_images(*)')
    .eq('id', productId)
    .single()
  if (error || !product) return null

  let parentName: string | null = null
  if (product.category?.parent_id) {
    const { data: parent } = await supabase
      .from('categories')
      .select('name')
      .eq('id', product.category.parent_id)
      .single()
    parentName = parent?.name ?? null
  }
  return { product: product as Product, parentName }
}

async function runGenerator(productId: string): Promise<{ data?: ProductCopy; error?: string }> {
  const loaded = await loadProduct(productId)
  if (!loaded) return { error: 'Product not found.' }
  try {
    return { data: await generateProductCopy(loaded.product, loaded.parentName) }
  } catch (err) {
    if (err instanceof DescriptionGenerationError) return { error: err.message }
    console.error('[ai description]', err)
    return { error: 'Description generation failed. Retry.' }
  }
}

/** Draft for the product form — returned, not saved, so the owner reviews it first. */
export async function generateProductCopyDraft(productId: string) {
  await requireAdmin()
  return runGenerator(productId)
}

/** Products that have photos but no Italian description yet (the bulk generator's work list). */
export async function listProductsMissingDescription(): Promise<{ id: string; name: string }[]> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku_prefix, images:product_images!inner(id)')
    .or('description.is.null,description.eq.')
    .order('sku_prefix', { ascending: true, nullsFirst: false })
  if (error) { console.error(error); return [] }
  return (data ?? []).map((p) => ({ id: p.id, name: p.name }))
}

/**
 * Bulk step: generates and saves copy for one product, filling only fields
 * that are still empty so nothing the owner wrote is overwritten.
 */
export async function generateAndSaveMissingCopy(productId: string): Promise<{ error?: string; skipped?: boolean }> {
  await requireAdmin()
  const loaded = await loadProduct(productId)
  if (!loaded) return { error: 'Product not found.' }
  if (loaded.product.description?.trim()) return { skipped: true }

  const result = await runGenerator(productId)
  if (!result.data) return { error: result.error }

  const current = loaded.product
  const update: Partial<ProductCopy> = {}
  for (const key of ['short_description', 'description', 'short_description_en', 'description_en'] as const) {
    if (!current[key]?.trim()) update[key] = result.data[key]
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('products').update(update).eq('id', productId)
  if (error) return { error: error.message }

  revalidatePath('/[locale]/product/[slug]', 'page')
  return {}
}
