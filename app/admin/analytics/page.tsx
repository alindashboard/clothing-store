import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getAnalyticsSummary, getProductAnalytics, getVisitorAnalytics, type AnalyticsSummary, type VisitorAnalytics } from '@/lib/actions/analytics'
import { formatPrice } from '@/lib/utils'
import { DailyBars } from '@/components/admin/analytics/daily-bars'
import { ProductTable } from '@/components/admin/analytics/product-table'

interface Props {
  searchParams: Promise<{ days?: string; tab?: string }>
}

const RANGE_OPTIONS = [7, 30, 90]
const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Products' },
  { key: 'pages', label: 'Pages' },
  { key: 'sources', label: 'Sources' },
  { key: 'visitors', label: 'Visitors & orders' },
] as const
type Tab = (typeof TABS)[number]['key']

function pct(part: number, whole: number) {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : '—'
}

function Card({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</h2>
        {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
      </div>
      {children}
    </div>
  )
}

function Empty({ cols = 2 }: { cols?: number }) {
  return <tr><td colSpan={cols} className="px-4 py-6 text-center text-gray-400">No data in this range.</td></tr>
}

/** Every day in the range, zero-filled, so quiet days show as gaps rather than disappearing. */
function fillDays(daily: AnalyticsSummary['daily'], from: Date, to: Date) {
  const byDay = new Map(daily.map((d) => [d.date, d.pageViews]))
  const out: { date: string; value: number }[] = []
  for (let t = new Date(from.toISOString().slice(0, 10)); t <= to; t = new Date(t.getTime() + 86400000)) {
    const date = t.toISOString().slice(0, 10)
    out.push({ date, value: byDay.get(date) ?? 0 })
  }
  return out
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const { days: daysParam, tab: tabParam } = await searchParams
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const days = RANGE_OPTIONS.includes(Number(daysParam)) ? Number(daysParam) : 30
  const tab: Tab = TABS.some((t) => t.key === tabParam) ? (tabParam as Tab) : 'overview'
  const to = new Date()
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)

  const [summary, products, visitors] = await Promise.all([
    tab === 'products' || tab === 'visitors' ? null : getAnalyticsSummary({ from, to }),
    tab === 'products' || tab === 'overview' ? getProductAnalytics({ from, to }) : null,
    tab === 'visitors' ? getVisitorAnalytics({ from, to }) : null,
  ])

  const href = (next: { tab?: Tab; days?: number }) =>
    `/admin/analytics?tab=${next.tab ?? tab}&days=${next.days ?? days}`

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-black underline">Dashboard</Link>
            <h1 className="text-xl font-semibold mt-1">Analytics</h1>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              First-party, cookieless tracking. “Visitors” are visitor-days: with no persistent id,
              someone who comes back on three days counts three times. Orders and revenue come from
              the orders table, so deleted, cancelled or refunded orders are not counted.
            </p>
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {RANGE_OPTIONS.map((opt) => (
              <Link
                key={opt}
                href={href({ days: opt })}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  days === opt ? 'bg-black text-white' : 'text-gray-500 hover:text-black'
                }`}
              >
                {opt}d
              </Link>
            ))}
          </div>
        </div>

        <nav className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={href({ tab: t.key })}
              className={`px-4 py-2.5 text-sm -mb-px border-b-2 whitespace-nowrap transition-colors ${
                tab === t.key ? 'border-black text-black font-medium' : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {tab === 'overview' && summary && <Overview summary={summary} products={products ?? []} from={from} to={to} productsHref={href({ tab: 'products' })} />}
        {tab === 'products' && products && <ProductTable rows={products} from={from.toISOString()} to={to.toISOString()} />}
        {tab === 'pages' && summary && <Pages summary={summary} />}
        {tab === 'sources' && summary && <Sources summary={summary} />}
        {tab === 'visitors' && visitors && <Visitors data={visitors} />}
      </div>
    </div>
  )
}

function Overview({
  summary, products, from, to, productsHref,
}: {
  summary: AnalyticsSummary
  products: Awaited<ReturnType<typeof getProductAnalytics>>
  from: Date
  to: Date
  productsHref: string
}) {
  const t = summary.totals
  const kpis = [
    { label: 'Page views', value: t.pageViews.toLocaleString('en-GB') },
    { label: 'Visitors (visitor-days)', value: t.visitorDays.toLocaleString('en-GB') },
    { label: 'Product views', value: t.viewProduct.toLocaleString('en-GB') },
    { label: 'Add to cart', value: t.addToCart.toLocaleString('en-GB') },
    { label: 'Checkouts started', value: t.checkoutStart.toLocaleString('en-GB') },
    { label: 'Orders', value: `${t.orders} · ${formatPrice(t.revenue)}` },
  ]

  // Funnel in visitor-days, so each step is "how many of the same people".
  const reached = summary.sources.reduce(
    (acc, s) => ({ viewed: acc.viewed + s.viewedProduct, cart: acc.cart + s.addedToCart, checkout: acc.checkout + s.checkout }),
    { viewed: 0, cart: 0, checkout: 0 }
  )
  const funnel = [
    { label: 'Visited', value: t.visitorDays },
    { label: 'Viewed a product', value: reached.viewed },
    { label: 'Added to cart', value: reached.cart },
    { label: 'Started checkout', value: reached.checkout },
    { label: 'Ordered', value: t.orders },
  ]
  const topProducts = [...products].sort((a, b) => b.views - a.views).filter((p) => p.views > 0).slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl font-semibold mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <Card title="Page views per day">
        <div className="p-4"><DailyBars data={fillDays(summary.daily, from, to)} unit="page views" /></div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Funnel" note="Share of visitors who reached each step.">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {funnel.map((step, i) => (
                <tr key={step.label}>
                  <td className="px-4 py-2.5">{step.label}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">{step.value}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums w-20">{i === 0 ? '' : pct(step.value, funnel[0].value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Most viewed products">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {topProducts.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5 truncate max-w-0">{p.name}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{p.views} views · {p.addToCart} to cart</td>
                </tr>
              ))}
              {topProducts.length === 0 && <Empty />}
            </tbody>
          </table>
          <Link href={productsHref} className="block px-4 py-2.5 text-xs text-gray-500 hover:text-black border-t border-gray-100">
            All products, filters and drill-down →
          </Link>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card title="Orders by payment method">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {summary.paymentMethods.map((m) => (
                <tr key={m.method}>
                  <td className="px-4 py-2.5 capitalize">{m.method.replace('_', ' ')}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">{m.count}</td>
                </tr>
              ))}
              {summary.paymentMethods.length === 0 && <Empty />}
            </tbody>
          </table>
        </Card>
        <Card title="Devices" note="Visitors">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {summary.deviceSplit.map((d) => (
                <tr key={d.device}>
                  <td className="px-4 py-2.5 capitalize">{d.device}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">{d.visitors}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums w-16">{pct(d.visitors, t.visitorDays)}</td>
                </tr>
              ))}
              {summary.deviceSplit.length === 0 && <Empty />}
            </tbody>
          </table>
        </Card>
        <Card title="Countries" note="Visitors">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {summary.countrySplit.map((c) => (
                <tr key={c.country}>
                  <td className="px-4 py-2.5">{c.country}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">{c.visitors}</td>
                </tr>
              ))}
              {summary.countrySplit.length === 0 && <Empty />}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}

function Pages({ summary }: { summary: AnalyticsSummary }) {
  const totalViews = summary.totals.pageViews
  return (
    <div className="space-y-6">
      <Card title="Page types" note="Click a type to see its pages.">
        <div className="divide-y divide-gray-100">
          {summary.pageGroups.map((g) => (
            <details key={g.group} className="group">
              <summary className="flex items-center gap-4 px-4 py-3 cursor-pointer list-none hover:bg-gray-50 text-sm">
                <span className="text-gray-400 transition-transform group-open:rotate-90">›</span>
                <span className="flex-1 font-medium">{g.label}</span>
                <span className="tabular-nums w-24 text-right">{g.views} views</span>
                <span className="tabular-nums w-28 text-right text-gray-500">{g.visitors} visitors</span>
                <span className="tabular-nums w-12 text-right text-gray-500">{pct(g.views, totalViews)}</span>
              </summary>
              <table className="w-full text-sm bg-gray-50/60">
                <tbody className="divide-y divide-gray-100">
                  {(summary.topPagesByGroup[g.group] ?? []).map((p) => (
                    <tr key={p.path}>
                      <td className="pl-12 pr-4 py-2 truncate max-w-0 text-gray-600">{p.path}</td>
                      <td className="px-4 py-2 text-right tabular-nums w-24">{p.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          ))}
          {summary.pageGroups.length === 0 && <p className="px-4 py-6 text-center text-sm text-gray-400">No data in this range.</p>}
        </div>
      </Card>

      <Card title="Landing pages" note="The first page of each visit, and how many of those visitors added something to the cart.">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Page</th>
              <th className="px-4 py-2.5 text-right font-medium">Visitors</th>
              <th className="px-4 py-2.5 text-right font-medium">Added to cart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {summary.landingPages.map((l) => (
              <tr key={l.path}>
                <td className="px-4 py-2.5 truncate max-w-0">{l.path}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{l.visitors}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-gray-500">{l.addedToCart} · {pct(l.addedToCart, l.visitors)}</td>
              </tr>
            ))}
            {summary.landingPages.length === 0 && <Empty cols={3} />}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function Sources({ summary }: { summary: AnalyticsSummary }) {
  return (
    <div className="space-y-6">
      <Card title="Traffic sources" note="Where each visit started (UTM tag if present, else the referring site), and how far those visitors got.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Source</th>
                <th className="px-4 py-2.5 text-right font-medium">Visitors</th>
                <th className="px-4 py-2.5 text-right font-medium">Viewed a product</th>
                <th className="px-4 py-2.5 text-right font-medium">Added to cart</th>
                <th className="px-4 py-2.5 text-right font-medium">Started checkout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {summary.sources.map((s) => (
                <tr key={s.source}>
                  <td className="px-4 py-2.5 font-medium">{s.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{s.visitors}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{s.viewedProduct} <span className="text-gray-400">· {pct(s.viewedProduct, s.visitors)}</span></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{s.addedToCart} <span className="text-gray-400">· {pct(s.addedToCart, s.visitors)}</span></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{s.checkout} <span className="text-gray-400">· {pct(s.checkout, s.visitors)}</span></td>
                </tr>
              ))}
              {summary.sources.length === 0 && <Empty cols={5} />}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Campaigns (UTM)"
        note="Links tagged ?utm_source=…&utm_medium=…&utm_campaign=… — tag every ad and bio link so it shows up here."
      >
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Source</th>
              <th className="px-4 py-2.5 text-left font-medium">Medium</th>
              <th className="px-4 py-2.5 text-left font-medium">Campaign</th>
              <th className="px-4 py-2.5 text-right font-medium">Visitors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {summary.campaigns.map((c) => (
              <tr key={`${c.source}|${c.medium}|${c.campaign}`}>
                <td className="px-4 py-2.5">{c.source}</td>
                <td className="px-4 py-2.5 text-gray-500">{c.medium || '—'}</td>
                <td className="px-4 py-2.5 text-gray-500">{c.campaign || '—'}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{c.visitors}</td>
              </tr>
            ))}
            {summary.campaigns.length === 0 && <Empty cols={4} />}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

function Visitors({ data }: { data: VisitorAnalytics }) {
  const answered = data.consent.granted + data.consent.denied
  const kpis = [
    { label: 'Accepted cookies', value: answered ? `${pct(data.consent.granted, answered)} of ${answered}` : '—' },
    { label: 'Tracked visitors', value: data.visitors.total.toLocaleString('en-GB') },
    { label: 'Returning', value: data.visitors.total ? `${data.visitors.returning} · ${pct(data.visitors.returning, data.visitors.total)}` : '—' },
    { label: 'Orders with journey', value: data.orders.counted ? `${data.orders.linked} of ${data.orders.counted}` : '—' },
  ]

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500 max-w-3xl">
        Only visitors who accepted cookies get a persistent anonymous id (cookie <code>kaya_vid</code>, 13 months), so
        everything on this tab covers that share of traffic — see “Accepted cookies”. Unlike the other tabs, a visitor
        here is one person across days (per browser/device), not a visitor-day.
      </p>
      {!data.migrationApplied && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-4 py-3">
          Migration <code>20260926000000_analytics_visitor_id.sql</code> is not applied yet — run{' '}
          <code>supabase db push --linked</code>. Consent answers are already being counted.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wider">{kpi.label}</p>
            <p className="text-xl font-semibold mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      <Card title="Orders and the visits that led to them" note="First visit = how they discovered the shop; last visit = the visit that ended in the order.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Order</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5 text-left font-medium">First visit from</th>
                <th className="px-4 py-2.5 text-left font-medium">Last visit from</th>
                <th className="px-4 py-2.5 text-right font-medium">Visits</th>
                <th className="px-4 py-2.5 text-right font-medium">Days to buy</th>
                <th className="px-4 py-2.5 text-right font-medium">Products viewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.attributions.map((a) => (
                <tr key={a.orderNumber}>
                  <td className="px-4 py-2.5 font-medium">{a.orderNumber}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatPrice(a.total)}</td>
                  <td className="px-4 py-2.5">{a.firstSource}</td>
                  <td className="px-4 py-2.5">{a.lastSource}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{a.visitDays}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{a.daysToPurchase}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{a.productsViewed}</td>
                </tr>
              ))}
              {data.attributions.length === 0 && <Empty cols={7} />}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {([['Revenue by first visit source', data.byFirstSource], ['Revenue by last visit source', data.byLastSource]] as const).map(([title, rows]) => (
          <Card key={title} title={title}>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {rows.map((r) => (
                  <tr key={r.source}>
                    <td className="px-4 py-2.5">{r.source}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-500">{r.orders} orders</td>
                    <td className="px-4 py-2.5 text-right font-medium tabular-nums">{formatPrice(r.revenue)}</td>
                  </tr>
                ))}
                {rows.length === 0 && <Empty cols={3} />}
              </tbody>
            </table>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Days active in this period" note="How many different days each tracked visitor came to the site.">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {data.activeDays.map((d) => (
                <tr key={d.bucket}>
                  <td className="px-4 py-2.5">{d.bucket}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">{d.visitors}</td>
                  <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums w-16">{pct(d.visitors, data.visitors.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card title="Products people came back for" note="Viewed by the same visitor on two or more different days.">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {data.reviewedProducts.map((p) => (
                <tr key={p.productId}>
                  <td className="px-4 py-2.5 truncate max-w-0">{p.name}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums whitespace-nowrap">{p.visitors} visitors</td>
                </tr>
              ))}
              {data.reviewedProducts.length === 0 && <Empty />}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  )
}
