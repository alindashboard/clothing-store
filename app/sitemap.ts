import type { MetadataRoute } from 'next'
import { SITE_CONFIG } from '@/lib/config'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { hideProductsWithoutImages } from '@/lib/site-settings'

const base = SITE_CONFIG.brand.url
const locales = ['it', 'en'] as const

type SitemapEntry = MetadataRoute.Sitemap[0]

function localizedEntries(
  path: string,
  opts: {
    changeFrequency?: SitemapEntry['changeFrequency']
    priority?: number
    lastModified?: string | Date
  }
): MetadataRoute.Sitemap {
  const langAlts = Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`]))

  return locales.map((locale) => ({
    url: `${base}/${locale}${path}`,
    ...(opts.lastModified ? { lastModified: opts.lastModified } : {}),
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages: langAlts },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return localizedEntries('', { changeFrequency: 'daily', priority: 1 })
  }

  const supabase = createSupabaseAdminClient()

  // Products hidden for having no photo must stay out of the sitemap, or Google
  // is pointed at URLs that 404.
  const hideImageless = await hideProductsWithoutImages()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(`slug, updated_at, images:product_images${hideImageless ? '!inner' : ''}(id)`)
      .eq('is_active', true),
    supabase.from('categories').select('slug').eq('is_active', true),
  ])

  const staticRoutes: Array<{
    path: string
    changeFrequency: SitemapEntry['changeFrequency']
    priority: number
  }> = [
    { path: '',              changeFrequency: 'daily',   priority: 1.0 },
    { path: '/products',     changeFrequency: 'daily',   priority: 0.9 },
    { path: '/new-arrivals', changeFrequency: 'daily',   priority: 0.8 },
    { path: '/events',       changeFrequency: 'weekly',  priority: 0.7 },
    { path: '/store',        changeFrequency: 'monthly', priority: 0.6 },
    { path: '/contact',      changeFrequency: 'monthly', priority: 0.5 },
  ]

  const staticEntries = staticRoutes.flatMap(({ path, changeFrequency, priority }) =>
    localizedEntries(path, { changeFrequency, priority })
  )

  const productEntries = (products ?? []).flatMap((p) =>
    localizedEntries(`/product/${p.slug}`, {
      lastModified: p.updated_at,
      changeFrequency: 'weekly',
      priority: 0.8,
    })
  )

  const categoryEntries = (categories ?? []).flatMap((c) =>
    localizedEntries(`/category/${c.slug}`, {
      changeFrequency: 'weekly',
      priority: 0.7,
    })
  )

  return [...staticEntries, ...productEntries, ...categoryEntries]
}
