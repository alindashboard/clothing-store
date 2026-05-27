'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'

const BUCKET = 'product-images'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function uploadProductImage(
  formData: FormData,
  productId: string
): Promise<{ url?: string; error?: string }> {
  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided.' }
  if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Only JPG, PNG, and WebP are allowed.' }
  if (file.size > MAX_SIZE) return { error: 'File must be under 5MB.' }

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
