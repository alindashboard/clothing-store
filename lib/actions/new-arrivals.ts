'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import type { Product } from '@/lib/types'

export interface NewArrivalEntry {
  id: string
  product_id: string
  position: number
  created_at: string
  product: Product
}

/** Public: fetch curated list ordered by position asc, then created_at asc. */
export async function getNewArrivals(): Promise<NewArrivalEntry[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('new_arrivals')
    .select(`
      *,
      product:products(
        *,
        images:product_images(*),
        variants:product_variants(*)
      )
    `)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) { console.error(error); return [] }
  return (data ?? []).filter((r) => r.product) as NewArrivalEntry[]
}

/** Admin: add a product to the curated list. Position = current count + 1. */
export async function addToNewArrivals(productId: string) {
  const supabase = createSupabaseAdminClient()

  const { count } = await supabase
    .from('new_arrivals')
    .select('*', { count: 'exact', head: true })

  const position = (count ?? 0) + 1
  const { error } = await supabase
    .from('new_arrivals')
    .insert({ product_id: productId, position })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/new-arrivals')
  revalidatePath('/admin/new-arrivals')
  return { success: true }
}

/** Admin: remove a single entry by its new_arrivals.id (not product_id). */
export async function removeFromNewArrivals(id: string) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('new_arrivals').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/new-arrivals')
  revalidatePath('/admin/new-arrivals')
  return { success: true }
}

/** Admin: remove all entries (weekly reset). */
export async function clearAllNewArrivals() {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('new_arrivals').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/new-arrivals')
  revalidatePath('/admin/new-arrivals')
  return { success: true }
}

/** Admin: full-text search on product name / sku_prefix for the add dialog. */
export async function searchProductsForNewArrivals(query: string): Promise<Product[]> {
  if (!query.trim()) return []
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, images:product_images(*), variants:product_variants(*)')
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,sku_prefix.ilike.%${query}%`)
    .order('name')
    .limit(10)

  if (error) { console.error(error); return [] }
  return data ?? []
}
