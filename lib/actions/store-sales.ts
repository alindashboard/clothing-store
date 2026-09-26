'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth/require-admin'

export interface StoreSaleVariant {
  id: string
  size: string
  sku: string | null
  stock: number
}

export interface StoreSaleProduct {
  id: string
  name: string
  skuPrefix: string | null
  price: number
  imageUrl: string | null
  variants: StoreSaleVariant[]
}

export interface StoreSale {
  id: string
  product_name: string
  variant_size: string
  sku: string | null
  quantity: number
  unit_price: number | null
  sold_at: string
  undone_at: string | null
}

interface ProductRow {
  id: string
  name: string
  sku_prefix: string | null
  base_price: number
  images: { url: string; is_primary: boolean; sort_order: number }[] | null
  variants: { id: string; size: string; sku: string | null; stock_quantity: number; is_active: boolean; sort_order: number }[] | null
}

const PRODUCT_SELECT =
  'id, name, sku_prefix, base_price, images:product_images(url, is_primary, sort_order), variants:product_variants(id, size, sku, stock_quantity, is_active, sort_order)'

/**
 * Finds products to sell in store by name, product SKU ("VS-0007") or variant
 * SKU ("VS-0007-44"). Variants come back in size order; inactive ones are left out.
 */
export async function searchStoreSaleProducts(query: string): Promise<StoreSaleProduct[]> {
  await requireAdmin()
  // Strip characters with meaning in PostgREST filter syntax (, ( ) *) and LIKE wildcards.
  const q = query.replace(/[,()*%_\\]/g, ' ').replace(/\s+/g, ' ').trim()
  if (q.length < 2) return []

  const supabase = createSupabaseAdminClient()
  const [byProduct, byVariant] = await Promise.all([
    supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .or(`name.ilike.%${q}%,sku_prefix.ilike.%${q}%`)
      .order('sku_prefix', { ascending: true })
      .limit(20),
    supabase.from('product_variants').select('product_id').ilike('sku', `%${q}%`).limit(20),
  ])

  const rows = (byProduct.data ?? []) as unknown as ProductRow[]
  const seen = new Set(rows.map((r) => r.id))
  const extraIds = [...new Set((byVariant.data ?? []).map((v) => v.product_id as string))].filter((id) => !seen.has(id))
  if (extraIds.length) {
    const { data } = await supabase.from('products').select(PRODUCT_SELECT).in('id', extraIds)
    rows.unshift(...((data ?? []) as unknown as ProductRow[]))
  }

  return rows.map((p) => {
    const images = [...(p.images ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    return {
      id: p.id,
      name: p.name,
      skuPrefix: p.sku_prefix,
      price: Number(p.base_price),
      imageUrl: images[0]?.url ?? null,
      variants: [...(p.variants ?? [])]
        .filter((v) => v.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((v) => ({ id: v.id, size: v.size, sku: v.sku, stock: v.stock_quantity })),
    }
  })
}

const SALE_ERRORS: Record<string, string> = {
  insufficient_stock: 'No stock left for this size — it may have just been sold online.',
  variant_not_found: 'This size no longer exists.',
  invalid_quantity: 'Invalid quantity.',
  sale_not_found_or_undone: 'This sale was already undone.',
}

function saleError(message: string): string {
  const key = Object.keys(SALE_ERRORS).find((k) => message.includes(k))
  return key ? SALE_ERRORS[key] : message
}

/** Records an in-store sale: atomically decrements stock and logs it (record_store_sale). */
export async function recordStoreSale(variantId: string, quantity = 1): Promise<{ sale?: StoreSale; error?: string }> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('record_store_sale', { p_variant_id: variantId, p_quantity: quantity })
  if (error) return { error: saleError(error.message) }
  revalidatePath('/admin/store-sales')
  revalidatePath('/admin/products')
  return { sale: data as StoreSale }
}

/** Reverses a mis-recorded sale and puts the stock back (undo_store_sale). */
export async function undoStoreSale(saleId: string): Promise<{ error?: string }> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.rpc('undo_store_sale', { p_sale_id: saleId })
  if (error) return { error: saleError(error.message) }
  revalidatePath('/admin/store-sales')
  revalidatePath('/admin/products')
  return {}
}

export async function getRecentStoreSales(limit = 50): Promise<StoreSale[]> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('store_sales')
    .select('id, product_name, variant_size, sku, quantity, unit_price, sold_at, undone_at')
    .order('sold_at', { ascending: false })
    .limit(limit)
  if (error) { console.error('[store_sales]', error.message); return [] }
  return data
}
