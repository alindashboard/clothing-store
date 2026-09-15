import { createSupabaseAdminClient } from '@/lib/supabase'
import type { Product } from '@/lib/types'

export interface StockExportRow {
  sku: string
  productName: string
  category: string
  color: string
  size: string
  price: number
  compareAtPrice: number | null
  currency: string
  stock: number
  lowStockThreshold: number | null
  variantStatus: string
  productStatus: string
  productId: string
}

export interface StockExportFilters {
  categoryId?: string
  search?: string
  status?: 'active' | 'draft' | 'incomplete'
}

/** Category ids to filter by: the given id plus its children (products hang off
 *  leaf categories, so filtering a parent like "Uomo" must reach its children too). */
async function categoryIdsForId(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  categoryId: string
): Promise<string[]> {
  const { data: children } = await admin
    .from('categories')
    .select('id')
    .eq('parent_id', categoryId)
  return [categoryId, ...(children ?? []).map((c) => c.id)]
}

/** One row per variant (placeholder products with no variants get a single
 *  zero-stock row), shared by both the flat CSV export and the by-brand XLSX export. */
export async function getStockExportRows(
  filters: StockExportFilters = {}
): Promise<StockExportRow[]> {
  const admin = createSupabaseAdminClient()

  let query = admin
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `)
    .order('name', { ascending: true })
    .range(0, 9999)

  if (filters.categoryId) {
    const ids = await categoryIdsForId(admin, filters.categoryId)
    query = query.in('category_id', ids)
  }
  if (filters.search?.trim()) {
    const term = filters.search.trim()
    query = query.or(`name.ilike.%${term}%,sku_prefix.ilike.%${term}%`)
  }
  if (filters.status === 'active') {
    query = query.eq('is_active', true)
  } else if (filters.status === 'draft') {
    query = query.eq('is_active', false)
  } else if (filters.status === 'incomplete') {
    query = query.eq('base_price', 0)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const products = (data ?? []) as Product[]
  const rows: StockExportRow[] = []

  for (const product of products) {
    const categoryName = product.category?.name ?? ''
    const productStatus = product.is_active ? 'Active' : 'Draft'
    const variants = [...(product.variants ?? [])].sort((a, b) => a.sort_order - b.sort_order)

    if (variants.length === 0) {
      rows.push({
        sku: product.sku_prefix ?? '',
        productName: product.name,
        category: categoryName,
        color: '',
        size: '',
        price: product.base_price,
        compareAtPrice: product.compare_at_price,
        currency: product.currency,
        stock: 0,
        lowStockThreshold: null,
        variantStatus: '',
        productStatus,
        productId: product.id,
      })
      continue
    }

    for (const variant of variants) {
      rows.push({
        sku: variant.sku ?? product.sku_prefix ?? '',
        productName: product.name,
        category: categoryName,
        color: variant.color_name,
        size: variant.size,
        price: variant.price_override ?? product.base_price,
        compareAtPrice: product.compare_at_price,
        currency: product.currency,
        stock: variant.stock_quantity,
        lowStockThreshold: variant.low_stock_threshold,
        variantStatus: variant.is_active ? 'Active' : 'Draft',
        productStatus,
        productId: product.id,
      })
    }
  }

  return rows
}

/** First two SKU characters, uppercased — the brand code from the owner's stock
 *  spreadsheets (e.g. "BRusd127-" -> "BR"). Rows with no/short SKU fall into "ALTELE". */
export function brandCodeForSku(sku: string): string {
  const code = sku.trim().slice(0, 2).toUpperCase()
  return code.length === 2 ? code : 'ALTELE'
}
