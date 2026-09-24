'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth/require-admin'
import { PAGE_GROUPS, PAGE_GROUP_LABELS, pageGroupForPath, type PageGroup } from '@/lib/analytics/page-groups'
import { SOURCES, SOURCE_LABELS, sourceFor, type Source } from '@/lib/analytics/sources'
import { brandFromProductName } from '@/lib/brand-names'

// Fetched-and-aggregated-in-JS rather than a Postgres RPC — simplest thing
// that works for a single-store site's traffic volume (thousands, not
// millions, of events/month). Revisit with a materialized view or RPC if this
// query ever gets slow.
const ROW_LIMIT = 20000

// visitor_hash rotates every UTC day (see the analytics_events migration), so
// one hash = one visitor on one day. Every "visitors" figure below is therefore
// a count of visitor-days: someone who comes back on three days counts three
// times. That is the price of not storing a persistent id.

interface EventRow {
  event: string
  path: string | null
  product_id: string | null
  referrer: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  device: string | null
  country: string | null
  visitor_hash: string | null
  created_at: string
}

interface OrderRow {
  id: string
  status: string
  payment_status: string
  payment_method: string
  total: number
  created_at: string
  items: { product_id: string | null; quantity: number; total_price: number }[] | null
}

/**
 * Sales come from the orders table, never from `purchase` events: deleting,
 * cancelling or refunding an order must take it out of the numbers, and the
 * events table has no link back to the order. A card order only counts once
 * Stripe confirmed the payment (an unpaid one is an abandoned payment page).
 */
function isCountedOrder(o: OrderRow): boolean {
  if (o.status === 'cancelled' || o.status === 'refunded' || o.payment_status === 'refunded') return false
  if (o.payment_method === 'stripe' && o.payment_status !== 'paid') return false
  return true
}

async function countedOrders(from: Date, to: Date): Promise<OrderRow[]> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, payment_status, payment_method, total, created_at, items:order_items(product_id, quantity, total_price)')
    .gte('created_at', from.toISOString())
    .lte('created_at', to.toISOString())
  if (error) {
    console.error('[analytics] orders query failed:', error.message)
    return []
  }
  return ((data ?? []) as OrderRow[]).filter(isCountedOrder)
}

async function fetchEvents(from: Date, to: Date, columns: string, filter?: { events?: string[]; productId?: string }) {
  const supabase = createSupabaseAdminClient()
  const run = (cols: string) => {
    let query = supabase
      .from('analytics_events')
      .select(cols)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .order('created_at', { ascending: true })
      .limit(ROW_LIMIT)
    if (filter?.events) query = query.in('event', filter.events)
    if (filter?.productId) query = query.eq('product_id', filter.productId)
    return query
  }
  let { data, error } = await run(columns)
  // utm_* arrive with migration 20260925000000; read without them until it is applied.
  if (error && columns.includes('utm_')) {
    ;({ data, error } = await run(columns.replace(/,\s*utm_\w+/g, '')))
  }
  if (error) {
    console.error('[analytics] events query failed:', error.message)
    return []
  }
  return (data ?? []) as unknown as EventRow[]
}

/**
 * Retention stated in the privacy policy (13 months for the visitor-id link,
 * 25 months for events), enforced by a DB function. Run opportunistically
 * whenever an admin opens analytics rather than by a cron job — see
 * docs/legal/tracking-and-cookies.md. Missing function (migration not applied)
 * is ignored.
 */
async function purgeExpired() {
  const { error } = await createSupabaseAdminClient().rpc('purge_expired_visitor_ids')
  if (error && error.code !== 'PGRST202') console.error('[analytics] purge failed:', error.message)
}

function inc<K>(map: Map<K, number>, key: K, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by)
}

function sortedEntries<K>(map: Map<K, number>, limit?: number) {
  const entries = [...map.entries()].sort((a, b) => b[1] - a[1])
  return limit ? entries.slice(0, limit) : entries
}

// ── Overview ─────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  from: string
  to: string
  totals: {
    pageViews: number
    visitorDays: number
    viewProduct: number
    addToCart: number
    checkoutStart: number
    orders: number
    revenue: number
  }
  daily: { date: string; pageViews: number; visitors: number }[]
  pageGroups: { group: PageGroup; label: string; views: number; visitors: number }[]
  topPagesByGroup: Partial<Record<PageGroup, { path: string; views: number }[]>>
  landingPages: { path: string; visitors: number; addedToCart: number }[]
  sources: { source: Source; label: string; visitors: number; viewedProduct: number; addedToCart: number; checkout: number }[]
  campaigns: { source: string; medium: string; campaign: string; visitors: number }[]
  paymentMethods: { method: string; count: number }[]
  deviceSplit: { device: string; visitors: number }[]
  countrySplit: { country: string; visitors: number }[]
}

interface VisitorDay {
  landingPath: string | null
  source: Source
  utm: { source: string; medium: string; campaign: string } | null
  device: string | null
  country: string | null
  viewedProduct: boolean
  addedToCart: boolean
  checkout: boolean
}

export async function getAnalyticsSummary(options?: { from?: Date; to?: Date }): Promise<AnalyticsSummary> {
  await requireAdmin()
  const to = options?.to ?? new Date()
  const from = options?.from ?? new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

  await purgeExpired()
  const [events, orders] = await Promise.all([
    fetchEvents(from, to, 'event, path, product_id, referrer, utm_source, utm_medium, utm_campaign, device, country, visitor_hash, created_at'),
    countedOrders(from, to),
  ])

  // Events are ascending by time, so the first event seen for a hash is that
  // visitor-day's landing.
  const visits = new Map<string, VisitorDay>()
  const pageViewsByPath = new Map<string, number>()
  const groupViews = new Map<PageGroup, number>()
  const groupVisitors = new Map<PageGroup, Set<string>>()
  const daily = new Map<string, { pageViews: number; visitors: Set<string> }>()
  let pageViews = 0, viewProduct = 0, addToCart = 0, checkoutStart = 0

  for (const e of events) {
    const hash = e.visitor_hash
    let visit = hash ? visits.get(hash) : undefined
    if (hash && !visit) {
      const utm = e.utm_source
        ? { source: e.utm_source, medium: e.utm_medium ?? '', campaign: e.utm_campaign ?? '' }
        : null
      visit = {
        landingPath: e.event === 'page_view' ? e.path : null,
        source: sourceFor(e.referrer, e.utm_source),
        utm,
        device: e.device,
        country: e.country,
        viewedProduct: false,
        addedToCart: false,
        checkout: false,
      }
      visits.set(hash, visit)
    } else if (visit && !visit.landingPath && e.event === 'page_view') {
      visit.landingPath = e.path
    }

    const day = e.created_at.slice(0, 10)
    const d = daily.get(day) ?? { pageViews: 0, visitors: new Set<string>() }
    if (hash) d.visitors.add(hash)
    daily.set(day, d)

    switch (e.event) {
      case 'page_view': {
        pageViews++
        d.pageViews++
        if (e.path) inc(pageViewsByPath, e.path)
        const group = pageGroupForPath(e.path)
        inc(groupViews, group)
        if (hash) {
          const set = groupVisitors.get(group) ?? new Set<string>()
          set.add(hash)
          groupVisitors.set(group, set)
        }
        break
      }
      case 'view_product':
        viewProduct++
        if (visit) visit.viewedProduct = true
        break
      case 'add_to_cart':
        addToCart++
        if (visit) visit.addedToCart = true
        break
      case 'checkout_start':
        checkoutStart++
        if (visit) visit.checkout = true
        break
    }
  }

  const topPagesByGroup: AnalyticsSummary['topPagesByGroup'] = {}
  for (const [path, views] of sortedEntries(pageViewsByPath)) {
    const group = pageGroupForPath(path)
    const list = (topPagesByGroup[group] ??= [])
    if (list.length < 15) list.push({ path, views })
  }

  const landing = new Map<string, { visitors: number; addedToCart: number }>()
  const sourceAgg = new Map<Source, { visitors: number; viewedProduct: number; addedToCart: number; checkout: number }>()
  const campaigns = new Map<string, number>()
  const devices = new Map<string, number>()
  const countries = new Map<string, number>()
  for (const v of visits.values()) {
    if (v.landingPath) {
      const l = landing.get(v.landingPath) ?? { visitors: 0, addedToCart: 0 }
      l.visitors++
      if (v.addedToCart) l.addedToCart++
      landing.set(v.landingPath, l)
    }
    const s = sourceAgg.get(v.source) ?? { visitors: 0, viewedProduct: 0, addedToCart: 0, checkout: 0 }
    s.visitors++
    if (v.viewedProduct) s.viewedProduct++
    if (v.addedToCart) s.addedToCart++
    if (v.checkout) s.checkout++
    sourceAgg.set(v.source, s)
    if (v.utm) inc(campaigns, JSON.stringify([v.utm.source, v.utm.medium, v.utm.campaign]))
    if (v.device) inc(devices, v.device)
    if (v.country) inc(countries, v.country)
  }

  const paymentMethods = new Map<string, number>()
  for (const o of orders) inc(paymentMethods, o.payment_method)

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totals: {
      pageViews,
      visitorDays: visits.size,
      viewProduct,
      addToCart,
      checkoutStart,
      orders: orders.length,
      revenue: orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0),
    },
    daily: [...daily.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, d]) => ({ date, pageViews: d.pageViews, visitors: d.visitors.size })),
    pageGroups: PAGE_GROUPS
      .map((group) => ({
        group,
        label: PAGE_GROUP_LABELS[group],
        views: groupViews.get(group) ?? 0,
        visitors: groupVisitors.get(group)?.size ?? 0,
      }))
      .filter((g) => g.views > 0)
      .sort((a, b) => b.views - a.views),
    topPagesByGroup,
    landingPages: [...landing.entries()]
      .sort((a, b) => b[1].visitors - a[1].visitors)
      .slice(0, 15)
      .map(([path, l]) => ({ path, ...l })),
    sources: SOURCES
      .map((source) => ({ source, label: SOURCE_LABELS[source], visitors: 0, viewedProduct: 0, addedToCart: 0, checkout: 0, ...sourceAgg.get(source) }))
      .filter((s) => s.visitors > 0)
      .sort((a, b) => b.visitors - a.visitors),
    campaigns: sortedEntries(campaigns, 20).map(([key, visitors]) => {
      const [source, medium, campaign] = JSON.parse(key) as string[]
      return { source, medium, campaign, visitors }
    }),
    paymentMethods: sortedEntries(paymentMethods).map(([method, count]) => ({ method, count })),
    deviceSplit: sortedEntries(devices).map(([device, visitors]) => ({ device, visitors })),
    countrySplit: sortedEntries(countries, 10).map(([country, visitors]) => ({ country, visitors })),
  }
}

// ── Products ─────────────────────────────────────────────────────────────────

export interface ProductAnalyticsRow {
  id: string
  name: string
  slug: string
  brand: string | null
  category: string | null
  gender: string | null
  price: number
  stock: number
  hasPhoto: boolean
  isActive: boolean
  views: number
  viewers: number
  addToCart: number
  cartVisitors: number
  unitsSold: number
  revenue: number
}

interface ProductRow {
  id: string
  name: string
  slug: string
  base_price: number
  is_active: boolean
  category: { name: string; parent_id: string | null } | null
  variants: { stock_quantity: number; is_active: boolean }[] | null
  images: { id: string }[] | null
}

/** One row per product (including never-viewed ones), for the sortable Products tab. */
export async function getProductAnalytics(options: { from: Date; to: Date }): Promise<ProductAnalyticsRow[]> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()

  const [events, orders, productsRes, categoriesRes] = await Promise.all([
    fetchEvents(options.from, options.to, 'event, product_id, visitor_hash', { events: ['view_product', 'add_to_cart'] }),
    countedOrders(options.from, options.to),
    supabase
      .from('products')
      .select('id, name, slug, base_price, is_active, category:categories(name, parent_id), variants:product_variants(stock_quantity, is_active), images:product_images(id)'),
    supabase.from('categories').select('id, name'),
  ])
  if (productsRes.error) {
    console.error('[analytics] products query failed:', productsRes.error.message)
    return []
  }

  const categoryNames = new Map((categoriesRes.data ?? []).map((c) => [c.id, c.name as string]))

  const agg = new Map<string, { views: number; viewers: Set<string>; addToCart: number; cartVisitors: Set<string> }>()
  for (const e of events) {
    if (!e.product_id) continue
    const a = agg.get(e.product_id) ?? { views: 0, viewers: new Set(), addToCart: 0, cartVisitors: new Set() }
    if (e.event === 'view_product') {
      a.views++
      if (e.visitor_hash) a.viewers.add(e.visitor_hash)
    } else {
      a.addToCart++
      if (e.visitor_hash) a.cartVisitors.add(e.visitor_hash)
    }
    agg.set(e.product_id, a)
  }

  const sales = new Map<string, { units: number; revenue: number }>()
  for (const o of orders) {
    for (const item of o.items ?? []) {
      if (!item.product_id) continue
      const s = sales.get(item.product_id) ?? { units: 0, revenue: 0 }
      s.units += item.quantity
      s.revenue += Number(item.total_price ?? 0)
      sales.set(item.product_id, s)
    }
  }

  return ((productsRes.data ?? []) as unknown as ProductRow[]).map((p) => {
    const a = agg.get(p.id)
    const s = sales.get(p.id)
    const variants = (p.variants ?? []).filter((v) => v.is_active)
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: brandFromProductName(p.name),
      category: p.category?.name ?? null,
      gender: p.category?.parent_id ? categoryNames.get(p.category.parent_id) ?? null : p.category?.name ?? null,
      price: Number(p.base_price ?? 0),
      stock: variants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0),
      hasPhoto: (p.images ?? []).length > 0,
      isActive: p.is_active,
      views: a?.views ?? 0,
      viewers: a?.viewers.size ?? 0,
      addToCart: a?.addToCart ?? 0,
      cartVisitors: a?.cartVisitors.size ?? 0,
      unitsSold: s?.units ?? 0,
      revenue: s?.revenue ?? 0,
    }
  })
}

export interface ProductAnalyticsDetail {
  daily: { date: string; views: number; addToCart: number }[]
  sources: { source: Source; label: string; visitors: number }[]
  devices: { device: string; visitors: number }[]
}

/** Drill-down for one product: daily views/adds and where its viewers came from. */
export async function getProductAnalyticsDetail(options: { productId: string; from: Date; to: Date }): Promise<ProductAnalyticsDetail> {
  await requireAdmin()
  const events = await fetchEvents(options.from, options.to, 'event, visitor_hash, device, created_at', {
    productId: options.productId,
    events: ['view_product', 'add_to_cart'],
  })

  const daily = new Map<string, { views: number; addToCart: number }>()
  const viewers = new Set<string>()
  const devices = new Map<string, Set<string>>()
  for (const e of events) {
    const day = e.created_at.slice(0, 10)
    const d = daily.get(day) ?? { views: 0, addToCart: 0 }
    if (e.event === 'view_product') d.views++
    else d.addToCart++
    daily.set(day, d)
    if (e.visitor_hash) {
      viewers.add(e.visitor_hash)
      if (e.device) {
        const set = devices.get(e.device) ?? new Set<string>()
        set.add(e.visitor_hash)
        devices.set(e.device, set)
      }
    }
  }

  // A viewer's source is the referrer/UTM of their first event that day.
  const sources = new Map<Source, number>()
  const hashes = [...viewers].slice(0, 300)
  if (hashes.length > 0) {
    const supabase = createSupabaseAdminClient()
    const run = (cols: string) =>
      supabase
        .from('analytics_events')
        .select(cols)
        .in('visitor_hash', hashes)
        .gte('created_at', options.from.toISOString())
        .lte('created_at', options.to.toISOString())
        .order('created_at', { ascending: true })
        .limit(ROW_LIMIT)
    let { data, error } = await run('visitor_hash, referrer, utm_source')
    if (error) ({ data, error } = await run('visitor_hash, referrer'))
    const seen = new Set<string>()
    for (const row of (data ?? []) as unknown as EventRow[]) {
      if (!row.visitor_hash || seen.has(row.visitor_hash)) continue
      seen.add(row.visitor_hash)
      inc(sources, sourceFor(row.referrer, row.utm_source))
    }
  }

  // Fill empty days so the chart shows gaps as zero, not as missing columns.
  const series: ProductAnalyticsDetail['daily'] = []
  for (let t = new Date(options.from.toISOString().slice(0, 10)); t <= options.to; t = new Date(t.getTime() + 86400000)) {
    const date = t.toISOString().slice(0, 10)
    series.push({ date, ...(daily.get(date) ?? { views: 0, addToCart: 0 }) })
  }

  return {
    daily: series,
    sources: sortedEntries(sources).map(([source, visitors]) => ({ source, label: SOURCE_LABELS[source], visitors })),
    devices: [...devices.entries()].map(([device, set]) => ({ device, visitors: set.size })).sort((a, b) => b.visitors - a.visitors),
  }
}

// ── Consented visitors (persistent id) ───────────────────────────────────────

export interface OrderAttribution {
  orderNumber: string
  total: number
  createdAt: string
  firstSource: string
  lastSource: string
  visitDays: number
  daysToPurchase: number
  productsViewed: number
}

export interface VisitorAnalytics {
  migrationApplied: boolean
  consent: { granted: number; denied: number }
  visitors: { total: number; returning: number; new: number }
  activeDays: { bucket: string; visitors: number }[]
  reviewedProducts: { productId: string; name: string; visitors: number }[]
  orders: { counted: number; linked: number }
  attributions: OrderAttribution[]
  byFirstSource: { source: string; orders: number; revenue: number }[]
  byLastSource: { source: string; orders: number; revenue: number }[]
}

interface IdEvent {
  visitor_id: string
  event: string
  product_id: string | null
  referrer: string | null
  utm_source: string | null
  created_at: string
}

async function eventsForVisitorIds(ids: string[], until?: Date): Promise<IdEvent[]> {
  const supabase = createSupabaseAdminClient()
  const out: IdEvent[] = []
  // Chunked: the id list goes into the query string.
  for (let i = 0; i < ids.length; i += 150) {
    let query = supabase
      .from('analytics_events')
      .select('visitor_id, event, product_id, referrer, utm_source, created_at')
      .in('visitor_id', ids.slice(i, i + 150))
      .order('created_at', { ascending: true })
      .limit(ROW_LIMIT)
    if (until) query = query.lte('created_at', until.toISOString())
    const { data, error } = await query
    if (error) {
      console.error('[analytics] visitor events query failed:', error.message)
      continue
    }
    out.push(...((data ?? []) as IdEvent[]))
  }
  return out
}

/** Source of a visit = the referrer/UTM of the first event of that day. */
function sourceOfDay(events: IdEvent[], day: string): string {
  const first = events.find((e) => e.created_at.slice(0, 10) === day)
  return SOURCE_LABELS[sourceFor(first?.referrer, first?.utm_source)]
}

export async function getVisitorAnalytics(options: { from: Date; to: Date }): Promise<VisitorAnalytics> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const empty: VisitorAnalytics = {
    migrationApplied: false,
    consent: { granted: 0, denied: 0 },
    visitors: { total: 0, returning: 0, new: 0 },
    activeDays: [],
    reviewedProducts: [],
    orders: { counted: 0, linked: 0 },
    attributions: [],
    byFirstSource: [],
    byLastSource: [],
  }

  await purgeExpired()

  const [consentRes, rangeRes, ordersRes] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('event')
      .in('event', ['consent_granted', 'consent_denied'])
      .gte('created_at', options.from.toISOString())
      .lte('created_at', options.to.toISOString())
      .limit(ROW_LIMIT),
    supabase
      .from('analytics_events')
      .select('visitor_id, event, product_id, created_at')
      .not('visitor_id', 'is', null)
      .gte('created_at', options.from.toISOString())
      .lte('created_at', options.to.toISOString())
      .limit(ROW_LIMIT),
    supabase
      .from('orders')
      .select('id, order_number, status, payment_status, payment_method, total, created_at, visitor_id')
      .gte('created_at', options.from.toISOString())
      .lte('created_at', options.to.toISOString()),
  ])

  const consent = { granted: 0, denied: 0 }
  for (const row of consentRes.data ?? []) {
    if (row.event === 'consent_granted') consent.granted++
    else consent.denied++
  }
  if (rangeRes.error || ordersRes.error) {
    // Most likely migration 20260926000000 (visitor_id columns) isn't applied yet.
    return { ...empty, consent }
  }

  // Visitors active in the range: distinct days each, and whether they were
  // first seen before the range started.
  const rangeEvents = (rangeRes.data ?? []) as { visitor_id: string; event: string; product_id: string | null; created_at: string }[]
  const daysByVisitor = new Map<string, Set<string>>()
  const productDays = new Map<string, Map<string, Set<string>>>() // product -> visitor -> days
  for (const e of rangeEvents) {
    const day = e.created_at.slice(0, 10)
    const set = daysByVisitor.get(e.visitor_id) ?? new Set<string>()
    set.add(day)
    daysByVisitor.set(e.visitor_id, set)
    if (e.event === 'view_product' && e.product_id) {
      const byVisitor = productDays.get(e.product_id) ?? new Map<string, Set<string>>()
      const days = byVisitor.get(e.visitor_id) ?? new Set<string>()
      days.add(day)
      byVisitor.set(e.visitor_id, days)
      productDays.set(e.product_id, byVisitor)
    }
  }

  const ids = [...daysByVisitor.keys()]
  const firstSeen = new Map<string, string>()
  if (ids.length > 0) {
    for (let i = 0; i < ids.length; i += 150) {
      const { data } = await supabase
        .from('analytics_events')
        .select('visitor_id, created_at')
        .in('visitor_id', ids.slice(i, i + 150))
        .lt('created_at', options.from.toISOString())
        .order('created_at', { ascending: true })
        .limit(ROW_LIMIT)
      for (const row of (data ?? []) as { visitor_id: string; created_at: string }[]) {
        if (!firstSeen.has(row.visitor_id)) firstSeen.set(row.visitor_id, row.created_at)
      }
    }
  }

  let returning = 0
  const buckets = new Map<string, number>([['1 day', 0], ['2 days', 0], ['3–5 days', 0], ['6+ days', 0]])
  for (const [id, days] of daysByVisitor) {
    if (days.size >= 2 || firstSeen.has(id)) returning++
    const bucket = days.size === 1 ? '1 day' : days.size === 2 ? '2 days' : days.size <= 5 ? '3–5 days' : '6+ days'
    inc(buckets, bucket)
  }

  // Products the same visitor came back to on different days.
  const reviewed = [...productDays.entries()]
    .map(([productId, byVisitor]) => ({ productId, visitors: [...byVisitor.values()].filter((d) => d.size >= 2).length }))
    .filter((p) => p.visitors > 0)
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10)
  let names = new Map<string, string>()
  if (reviewed.length > 0) {
    const { data } = await supabase.from('products').select('id, name').in('id', reviewed.map((p) => p.productId))
    names = new Map((data ?? []).map((p) => [p.id, p.name as string]))
  }

  // Orders: attribution for the ones placed by a consented visitor.
  const counted = ((ordersRes.data ?? []) as (OrderRow & { order_number: string; visitor_id: string | null })[]).filter(isCountedOrder)
  const linked = counted.filter((o) => o.visitor_id)
  const history = await eventsForVisitorIds([...new Set(linked.map((o) => o.visitor_id!))], options.to)
  const historyByVisitor = new Map<string, IdEvent[]>()
  for (const e of history) {
    const list = historyByVisitor.get(e.visitor_id) ?? []
    list.push(e)
    historyByVisitor.set(e.visitor_id, list)
  }

  const attributions: OrderAttribution[] = linked.map((o) => {
    const before = (historyByVisitor.get(o.visitor_id!) ?? []).filter((e) => e.created_at <= o.created_at)
    const days = [...new Set(before.map((e) => e.created_at.slice(0, 10)))]
    const firstDay = days[0]
    const lastDay = days[days.length - 1]
    return {
      orderNumber: o.order_number,
      total: Number(o.total ?? 0),
      createdAt: o.created_at,
      firstSource: firstDay ? sourceOfDay(before, firstDay) : SOURCE_LABELS.direct,
      lastSource: lastDay ? sourceOfDay(before, lastDay) : SOURCE_LABELS.direct,
      visitDays: days.length,
      daysToPurchase: before[0]
        ? Math.floor((new Date(o.created_at).getTime() - new Date(before[0].created_at).getTime()) / 86400000)
        : 0,
      productsViewed: new Set(before.filter((e) => e.event === 'view_product').map((e) => e.product_id)).size,
    }
  })

  const bySource = (key: 'firstSource' | 'lastSource') => {
    const agg = new Map<string, { orders: number; revenue: number }>()
    for (const a of attributions) {
      const cur = agg.get(a[key]) ?? { orders: 0, revenue: 0 }
      cur.orders++
      cur.revenue += a.total
      agg.set(a[key], cur)
    }
    return [...agg.entries()].map(([source, v]) => ({ source, ...v })).sort((a, b) => b.revenue - a.revenue)
  }

  return {
    migrationApplied: true,
    consent,
    visitors: { total: daysByVisitor.size, returning, new: daysByVisitor.size - returning },
    activeDays: [...buckets.entries()].map(([bucket, visitors]) => ({ bucket, visitors })),
    reviewedProducts: reviewed.map((p) => ({ ...p, name: names.get(p.productId) ?? p.productId })),
    orders: { counted: counted.length, linked: linked.length },
    attributions: attributions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    byFirstSource: bySource('firstSource'),
    byLastSource: bySource('lastSource'),
  }
}
