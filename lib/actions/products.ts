'use server'

import { hideProductsWithoutImages } from '@/lib/site-settings'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Product, ProductVariant, ProductImage } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/utils'
import { deleteProductImageFromStorage } from './upload'

const PAGE_LIMIT = 48

/**
 * Category ids a listing should cover: the category itself plus its children.
 * Products sit on the leaf categories, so a parent page ("uomo") would come
 * back empty without this.
 */
async function categoryIdsForSlug(
  supabase: SupabaseClient,
  slug: string
): Promise<string[] | null> {
  const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .single()
  if (!cat) return null

  const { data: children } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', cat.id)

  return [cat.id, ...(children ?? []).map((c) => c.id)]
}

/**
 * The product embed, in two literal forms so PostgREST can still infer the row
 * type (a computed string collapses the inference to GenericStringError).
 *
 * The `!inner` variant inner-joins product_images, which drops parent rows with
 * no matching child — exactly "products with at least one image".
 */
const PRODUCT_SELECT = `
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `

const PRODUCT_SELECT_WITH_IMAGE = `
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images!inner(*)
    `

function productSelect(hideImageless: boolean) {
  return hideImageless ? PRODUCT_SELECT_WITH_IMAGE : PRODUCT_SELECT
}

export async function getProducts(options?: {
  categorySlug?: string
  featured?: boolean
  isNew?: boolean
  limit?: number
}): Promise<Product[]> {
  const supabase = await createSupabaseServerClient()
  const hideImageless = await hideProductsWithoutImages()
  let query = supabase
    .from('products')
    .select(productSelect(hideImageless))
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (options?.featured) query = query.eq('is_featured', true)
  if (options?.isNew) query = query.eq('is_new', true)
  if (options?.limit) query = query.limit(options.limit)

  if (options?.categorySlug) {
    const ids = await categoryIdsForSlug(supabase, options.categorySlug)
    if (ids) query = query.in('category_id', ids)
  }

  const { data, error } = await query
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient()
  // A hidden product must 404 on its own URL too, or it stays linkable and indexable.
  const hideImageless = await hideProductsWithoutImages()
  const { data, error } = await supabase
    .from('products')
    .select(productSelect(hideImageless))
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}

/** Paginated product fetch for public catalog pages (/products, /category/[slug]). */
export async function getProductsPage(options?: {
  categorySlug?: string
  offset?: number
  limit?: number
}): Promise<{ products: Product[]; hasMore: boolean }> {
  const supabase = createSupabaseAdminClient()
  const limit = options?.limit ?? PAGE_LIMIT
  const offset = options?.offset ?? 0

  const hideImageless = await hideProductsWithoutImages()
  let query = supabase
    .from('products')
    .select(productSelect(hideImageless))
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit) // fetches limit+1 rows to detect hasMore

  if (options?.categorySlug) {
    const ids = await categoryIdsForSlug(supabase, options.categorySlug)
    if (!ids) return { products: [], hasMore: false }
    query = query.in('category_id', ids)
  }

  const { data, error } = await query
  if (error) { console.error(error); return { products: [], hasMore: false } }

  const rows = data ?? []
  const hasMore = rows.length > limit
  return { products: hasMore ? rows.slice(0, limit) : rows, hasMore }
}

/** Server Action called by ProductGridInfinite client component to load next page. */
export async function loadMoreProducts(options: {
  categorySlug?: string
  offset: number
}): Promise<{ products: Product[]; hasMore: boolean }> {
  return getProductsPage({ ...options, limit: PAGE_LIMIT })
}

export async function getAllProductsAdmin(options?: {
  categoryId?: string
  page?: number
  pageSize?: number
  search?: string
  status?: 'active' | 'draft' | 'incomplete' | 'all'
}): Promise<{ products: Product[]; totalCount: number }> {
  const supabase = createSupabaseAdminClient()
  const pageSize = options?.pageSize ?? 50
  const page = Math.max(1, options?.page ?? 1)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (options?.categoryId) {
    query = query.eq('category_id', options.categoryId)
  }
  if (options?.search?.trim()) {
    const term = options.search.trim()
    query = query.or(`name.ilike.%${term}%,sku_prefix.ilike.%${term}%`)
  }
  if (options?.status === 'active') {
    query = query.eq('is_active', true)
  } else if (options?.status === 'draft') {
    query = query.eq('is_active', false)
  } else if (options?.status === 'incomplete') {
    // Bulk-imported placeholders still waiting for real data (price left at 0).
    query = query.eq('base_price', 0)
  }

  const { data, error, count } = await query
  if (error) { console.error(error); return { products: [], totalCount: 0 } }
  return { products: data ?? [], totalCount: count ?? 0 }
}

/** Returns up to `limit` image URLs per category (for landing card carousels).
 *  One small query per category instead of fetching all products at once. */
export async function getCategoryImages(
  categoryIds: string[],
  limit = 3,
): Promise<Record<string, string[]>> {
  if (categoryIds.length === 0) return {}
  const supabase = createSupabaseAdminClient()

  // Landing cards show the gender parents, but products hang off their children,
  // so a bare category_id match would find nothing. Resolve each parent to itself
  // plus its children, the same way categoryIdsForSlug does for the listing pages.
  const { data: childRows } = await supabase
    .from('categories')
    .select('id, parent_id')
    .in('parent_id', categoryIds)

  const entries = await Promise.all(
    categoryIds.map(async (categoryId) => {
      const ids = [
        categoryId,
        ...(childRows ?? []).filter((c) => c.parent_id === categoryId).map((c) => c.id),
      ]

      // !inner drops products with no image, so `limit` rows are always usable
      // rather than a guess at how many of the newest happen to be photographed.
      const { data } = await supabase
        .from('products')
        .select('category_id, images:product_images!inner(url, is_primary, sort_order)')
        .eq('is_active', true)
        .in('category_id', ids)
        .order('created_at', { ascending: false })
        .limit(limit)

      const urls: string[] = []
      for (const product of data ?? []) {
        if (urls.length >= limit) break
        const imgs = product.images as { url: string; is_primary: boolean; sort_order: number }[]
        if (!imgs?.length) continue
        const sorted = [...imgs].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0) || a.sort_order - b.sort_order)
        // One image per product, so a card cycles through different products.
        urls.push(sorted[0].url)
      }
      return [categoryId, urls] as const
    })
  )

  return Object.fromEntries(entries)
}

export async function getProductAdmin(id: string): Promise<Product | null> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function createProduct(formData: FormData) {
  const supabase = createSupabaseAdminClient()
  const name = formData.get('name') as string
  const slug = (formData.get('slug') as string) || slugify(name)

  const payload = {
    name,
    slug,
    description: formData.get('description') as string || null,
    short_description: formData.get('short_description') as string || null,
    base_price: parseFloat(formData.get('base_price') as string),
    compare_at_price: formData.get('compare_at_price') ? parseFloat(formData.get('compare_at_price') as string) : null,
    category_id: formData.get('category_id') as string || null,
    is_active: formData.get('is_active') === 'true',
    is_featured: formData.get('is_featured') === 'true',
    is_new: formData.get('is_new') === 'true',
    sku_prefix: formData.get('sku_prefix') as string || null,
    meta_title: formData.get('meta_title') as string || null,
    meta_description: formData.get('meta_description') as string || null,
  }

  const { data, error } = await supabase.from('products').insert(payload).select().single()
  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/products')
  return { data }
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = createSupabaseAdminClient()
  const name = formData.get('name') as string
  const slug = (formData.get('slug') as string) || slugify(name)

  const payload = {
    name,
    slug,
    description: formData.get('description') as string || null,
    short_description: formData.get('short_description') as string || null,
    base_price: parseFloat(formData.get('base_price') as string),
    compare_at_price: formData.get('compare_at_price') ? parseFloat(formData.get('compare_at_price') as string) : null,
    category_id: formData.get('category_id') as string || null,
    is_active: formData.get('is_active') === 'true',
    is_featured: formData.get('is_featured') === 'true',
    is_new: formData.get('is_new') === 'true',
    sku_prefix: formData.get('sku_prefix') as string || null,
    meta_title: formData.get('meta_title') as string || null,
    meta_description: formData.get('meta_description') as string || null,
  }

  const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single()
  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}`)
  revalidatePath('/products')
  return { data }
}

export async function deleteProduct(id: string) {
  const supabase = createSupabaseAdminClient()

  const { data: images } = await supabase
    .from('product_images')
    .select('url')
    .eq('product_id', id)

  if (images?.length) {
    await Promise.all(
      images.map(async (img) => {
        const result = await deleteProductImageFromStorage(img.url)
        if (result.error) console.error('Storage cleanup failed for', img.url, ':', result.error)
      })
    )
  }

  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/products')
  return { success: true }
}

export async function upsertVariant(variant: Partial<ProductVariant> & { product_id: string; _dirty?: boolean; _new?: boolean }) {
  const supabase = createSupabaseAdminClient()
  const { _dirty, _new, ...payload } = variant

  if (payload.id) {
    const { data, error } = await supabase
      .from('product_variants')
      .update(payload)
      .eq('id', payload.id)
      .select()
      .single()
    if (error) return { error: error.message }
    revalidatePath('/admin/products')
    return { data }
  }

  const { data, error } = await supabase.from('product_variants').insert(payload).select().single()
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { data }
}

export async function deleteVariant(id: string) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('product_variants').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { success: true }
}

export async function upsertImage(image: Partial<ProductImage> & { product_id: string }) {
  const supabase = createSupabaseAdminClient()

  if (image.id) {
    const { data, error } = await supabase
      .from('product_images')
      .update(image)
      .eq('id', image.id)
      .select()
      .single()
    if (error) return { error: error.message }
    return { data }
  }

  const { data, error } = await supabase.from('product_images').insert(image).select().single()
  if (error) return { error: error.message }
  return { data }
}

export async function deleteImage(id: string) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('product_images').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function setImageAsPrimary(productId: string, imageId: string) {
  const supabase = createSupabaseAdminClient()
  await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
  const { error } = await supabase.from('product_images').update({ is_primary: true }).eq('id', imageId)
  if (error) return { error: error.message }
  return { success: true }
}
