'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'
import { MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_LABEL } from './upload-limits'

const BUCKET = 'product-images'
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadProductImage(
  formData: FormData,
  productId: string
): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided.' }
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Only JPG, PNG, and WebP are allowed.' }
  if (file.size > MAX_UPLOAD_SIZE) return { error: `File must be under ${MAX_UPLOAD_SIZE_LABEL}.` }

  const supabase = createSupabaseAdminClient()
  const ext = file.name.split('.').pop()
  const path = `${productId}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}

export async function deleteProductImageFromStorage(url: string): Promise<{ error?: string }> {
  const supabase = createSupabaseAdminClient()
  const path = url.split(`${BUCKET}/`)[1]
  if (!path) return { error: 'Invalid URL.' }

  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) return { error: error.message }
  return {}
}

/**
 * Category images live in the product-images bucket under a `categories/` prefix.
 * A stock re-import wipes that bucket *and* the categories table, so the file and
 * the row it belongs to are discarded together -- a separate bucket would only
 * leave orphans behind.
 */
const CATEGORY_PREFIX = 'categories'

export async function uploadCategoryImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided.' }
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Only JPG, PNG, and WebP are allowed.' }
  if (file.size > MAX_UPLOAD_SIZE) return { error: `File must be under ${MAX_UPLOAD_SIZE_LABEL}.` }

  const supabase = createSupabaseAdminClient()
  const ext = file.name.split('.').pop()
  const path = `${CATEGORY_PREFIX}/${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}

const EVENT_BUCKET = 'event-images'

export async function uploadEventImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided.' }
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Only JPG, PNG, and WebP are allowed.' }
  if (file.size > MAX_UPLOAD_SIZE) return { error: `File must be under ${MAX_UPLOAD_SIZE_LABEL}.` }

  const supabase = createSupabaseAdminClient()
  const ext = file.name.split('.').pop()
  const path = `${Date.now()}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage.from(EVENT_BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: false,
  })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from(EVENT_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl }
}

export async function deleteEventImageFromStorage(url: string): Promise<{ error?: string }> {
  const supabase = createSupabaseAdminClient()
  const path = url.split(`${EVENT_BUCKET}/`)[1]
  if (!path) return { error: 'Invalid URL.' }

  const { error } = await supabase.storage.from(EVENT_BUCKET).remove([path])
  if (error) return { error: error.message }
  return {}
}
