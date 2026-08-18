'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import type { Category } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/utils'
import { SITE_CONFIG } from '@/lib/config'

export async function getCategories(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) return []
  return data ?? []
}

/** Categories shown on the homepage landing grid, in admin-defined order. */
export async function getCategoriesForLanding(): Promise<Category[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .eq('show_on_landing', true)
    .order('sort_order', { ascending: true })

  if (error) return []
  return data ?? []
}

export async function getAllCategoriesAdmin(): Promise<Category[]> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) return []
  return data ?? []
}

export async function createCategory(formData: FormData) {
  const supabase = createSupabaseAdminClient()
  const name = formData.get('name') as string
  const slug = (formData.get('slug') as string) || slugify(name)

  // New categories always go last; position is changed afterwards with the
  // up/down controls in the table, so the form never asks for a raw number.
  const { data: last } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase
    .from('categories')
    .insert({
      name,
      slug,
      description: formData.get('description') as string || null,
      sort_order: (last?.sort_order ?? 0) + 1,
      is_active: formData.get('is_active') !== 'false',
    })
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  revalidatePath('/')
  return { data }
}

/** Shows/hides a category on the homepage landing grid. */
export async function setCategoryOnLanding(id: string, show: boolean) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('categories')
    .update({ show_on_landing: show })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  revalidatePath('/')
  return { success: true }
}

/** Rewrites sort_order to match the given id order (1-based, gap-free). */
export async function reorderCategories(orderedIds: string[]) {
  const supabase = createSupabaseAdminClient()

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from('categories').update({ sort_order: index + 1 }).eq('id', id)
    )
  )

  const failed = results.find((r) => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidatePath('/admin/categories')
  revalidatePath('/')
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = createSupabaseAdminClient()
  const name = formData.get('name') as string
  const slug = (formData.get('slug') as string) || slugify(name)

  const { data, error } = await supabase
    .from('categories')
    .update({
      name,
      slug,
      description: formData.get('description') as string || null,
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
      is_active: formData.get('is_active') !== 'false',
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  revalidatePath('/')
  return { data }
}

export async function deleteCategory(id: string) {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  return { success: true }
}

/**
 * Replaces a category's landing slideshow. Array order is slideshow order, so
 * reordering and removing are both just a new list. Saves immediately rather
 * than waiting for the modal's Save, like the product image uploader.
 */
export async function setCategoryImages(
  id: string,
  imageUrls: string[]
): Promise<{ error?: string }> {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('categories')
    .update({ image_urls: imageUrls })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  revalidatePath('/', 'layout')
  return {}
}

export async function updateCategoryDirect(
  id: string,
  data: {
    name: string
    slug: string
    description: string
    sort_order: number
    is_active: boolean
  }
): Promise<{ error?: string; data?: Category }> {
  const supabase = createSupabaseAdminClient()
  const { data: result, error } = await supabase
    .from('categories')
    .update({
      name: data.name,
      slug: data.slug || slugify(data.name),
      description: data.description || null,
      sort_order: data.sort_order,
      is_active: data.is_active,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
  revalidatePath('/')
  return { data: result }
}
