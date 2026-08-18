/**
 * Admin-toggleable flags stored in the site_settings table.
 *
 * Reads go through the request-scoped React cache so a page that checks a flag
 * in several queries still hits the DB once per render.
 */
import { cache } from 'react'
import { createSupabaseAdminClient } from '@/lib/supabase'

export const HIDE_PRODUCTS_WITHOUT_IMAGES = 'hide_products_without_images'

/**
 * Reads a boolean flag. Defaults to false when the row or the table is missing,
 * so a missing migration degrades to current behaviour rather than an empty shop.
 */
export const getBooleanSetting = cache(async (key: string): Promise<boolean> => {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error || !data) return false
  return data.value === 'true'
})

export function hideProductsWithoutImages(): Promise<boolean> {
  return getBooleanSetting(HIDE_PRODUCTS_WITHOUT_IMAGES)
}
