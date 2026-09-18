'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'

export interface AnalyticsSummary {
  from: string
  to: string
  totals: {
    pageViews: number
    uniqueVisitors: number
    viewProduct: number
    addToCart: number
    checkoutStart: number
    purchases: number
    purchaseValue: number
  }
  topPages: { path: string; views: number }[]
  topProducts: { productId: string; name: string; views: number; addToCart: number }[]
  paymentMethods: { method: string; count: number }[]
  deviceSplit: { device: string; count: number }[]
  countrySplit: { country: string; count: number }[]
  dailyPageViews: { date: string; count: number }[]
}

// Fetched-and-aggregated-in-JS rather than a Postgres RPC — simplest thing
// that works for a single-store site's traffic volume (thousands, not
// millions, of events/month). Revisit with a materialized view or RPC if this
// query ever gets slow.
const ROW_LIMIT = 20000

export async function getAnalyticsSummary(options?: { from?: Date; to?: Date }): Promise<AnalyticsSummary> {
  const to = options?.to ?? new Date()
  const from = options?.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

  const supabase = createSupabaseAdminClient()
  const { data: rows, error } = await supabase
    .from('analytics_events')
    .select('event, path, product_id, category, payment_method, value, device, country, visitor_hash, created_at')
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())
    .order('created_at', { ascending: false })
    .limit(ROW_LIMIT)

  if (error) {
    console.error('[analytics] summary query failed:', error.message)
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      totals: { pageViews: 0, uniqueVisitors: 0, viewProduct: 0, addToCart: 0, checkoutStart: 0, purchases: 0, purchaseValue: 0 },
      topPages: [],
      topProducts: [],
      paymentMethods: [],
      deviceSplit: [],
      countrySplit: [],
      dailyPageViews: [],
    }
  }

  const events = rows ?? []

  const uniqueVisitors = new Set(events.map((e) => e.visitor_hash).filter(Boolean)).size

  const pageViewsByPath = new Map<string, number>()
  const productAgg = new Map<string, { views: number; addToCart: number }>()
  const paymentMethods = new Map<string, number>()
  const devices = new Map<string, number>()
  const countries = new Map<string, number>()
  const dailyPageViews = new Map<string, number>()

  let pageViews = 0
  let viewProduct = 0
  let addToCart = 0
  let checkoutStart = 0
  let purchases = 0
  let purchaseValue = 0

  for (const e of events) {
    if (e.device) devices.set(e.device, (devices.get(e.device) ?? 0) + 1)
    if (e.country) countries.set(e.country, (countries.get(e.country) ?? 0) + 1)

    switch (e.event) {
      case 'page_view': {
        pageViews++
        if (e.path) pageViewsByPath.set(e.path, (pageViewsByPath.get(e.path) ?? 0) + 1)
        const day = e.created_at.slice(0, 10)
        dailyPageViews.set(day, (dailyPageViews.get(day) ?? 0) + 1)
        break
      }
      case 'view_product': {
        viewProduct++
        if (e.product_id) {
          const cur = productAgg.get(e.product_id) ?? { views: 0, addToCart: 0 }
          cur.views++
          productAgg.set(e.product_id, cur)
        }
        break
      }
      case 'add_to_cart': {
        addToCart++
        if (e.product_id) {
          const cur = productAgg.get(e.product_id) ?? { views: 0, addToCart: 0 }
          cur.addToCart++
          productAgg.set(e.product_id, cur)
        }
        break
      }
      case 'checkout_start':
        checkoutStart++
        break
      case 'purchase':
        purchases++
        purchaseValue += e.value ?? 0
        if (e.payment_method) paymentMethods.set(e.payment_method, (paymentMethods.get(e.payment_method) ?? 0) + 1)
        break
    }
  }

  const topPages = [...pageViewsByPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }))

  const topProductIds = [...productAgg.entries()]
    .sort((a, b) => b[1].views - a[1].views)
    .slice(0, 10)

  let productNames = new Map<string, string>()
  if (topProductIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name')
      .in('id', topProductIds.map(([id]) => id))
    productNames = new Map((products ?? []).map((p) => [p.id, p.name]))
  }

  const topProducts = topProductIds.map(([productId, agg]) => ({
    productId,
    name: productNames.get(productId) ?? productId,
    views: agg.views,
    addToCart: agg.addToCart,
  }))

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totals: { pageViews, uniqueVisitors, viewProduct, addToCart, checkoutStart, purchases, purchaseValue },
    topPages,
    topProducts,
    paymentMethods: [...paymentMethods.entries()].map(([method, count]) => ({ method, count })),
    deviceSplit: [...devices.entries()].map(([device, count]) => ({ device, count })),
    countrySplit: [...countries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([country, count]) => ({ country, count })),
    dailyPageViews: [...dailyPageViews.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count })),
  }
}
