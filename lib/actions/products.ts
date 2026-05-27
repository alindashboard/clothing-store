'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import type { Product, ProductVariant, ProductImage } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/utils'

export async function getProducts(options?: {
  categorySlug?: string
  featured?: boolean
  isNew?: boolean
  limit?: number
}): Promise<Product[]> {
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (options?.featured) query = query.eq('is_featured', true)
  if (options?.isNew) query = query.eq('is_new', true)
  if (options?.limit) query = query.limit(options.limit)

  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', options.categorySlug)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  const { data, error } = await query
  if (error) { console.error(error); return [] }
  return data ?? []
}

export async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) return null
  return data
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*)
    `)
    .order('created_at', { ascending: false })

  if (error) { console.error(error); return [] }
  return data ?? []
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
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/products')
  revalidatePath('/products')
  return { success: true }
}

export async function upsertVariant(variant: Partial<ProductVariant> & { product_id: string }) {
  const supabase = createSupabaseAdminClient()

  if (variant.id) {
    const { data, error } = await supabase
      .from('product_variants')
      .update(variant)
      .eq('id', variant.id)
      .select()
      .single()
    if (error) return { error: error.message }
    revalidatePath('/admin/products')
    return { data }
  }

  const { data, error } = await supabase.from('product_variants').insert(variant).select().single()
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
