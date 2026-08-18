'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { HIDE_PRODUCTS_WITHOUT_IMAGES } from '@/lib/site-settings'

export async function setHideProductsWithoutImages(
  enabled: boolean
): Promise<{ error?: string }> {
  // The admin client bypasses RLS, so confirm there is a logged-in admin first.
  const authClient = await createSupabaseServerClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return { error: 'Not authorised.' }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('site_settings')
    .upsert(
      { key: HIDE_PRODUCTS_WITHOUT_IMAGES, value: String(enabled), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

  if (error) return { error: error.message }

  // Every public surface reads this flag, so drop the whole cached tree.
  revalidatePath('/', 'layout')
  return {}
}
