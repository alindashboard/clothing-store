import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getAnalyticsSummary } from '@/lib/actions/analytics'
import { formatPrice } from '@/lib/utils'

interface Props {
  searchParams: Promise<{ days?: string }>
}

const RANGE_OPTIONS = [7, 30, 90]

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const { days: daysParam } = await searchParams
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const days = RANGE_OPTIONS.includes(Number(daysParam)) ? Number(daysParam) : 30
  const to = new Date()
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
  const summary = await getAnalyticsSummary({ from, to })

  const kpis: { label: string; value: string }[] = [
    { label: 'Page views', value: summary.totals.pageViews.toLocaleString('en-GB') },
    { label: 'Unique visitors (approx.)', value: summary.totals.uniqueVisitors.toLocaleString('en-GB') },
    { label: 'Product views', value: summary.totals.viewProduct.toLocaleString('en-GB') },
    { label: 'Add to cart', value: summary.totals.addToCart.toLocaleString('en-GB') },
    { label: 'Checkouts started', value: summary.totals.checkoutStart.toLocaleString('en-GB') },
    { label: 'Purchases', value: `${summary.totals.purchases} · ${formatPrice(summary.totals.purchaseValue)}` },
  ]

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <Link href="/admin" className="text-xs text-gray-400 hover:text-black underline">Dashboard</Link>
            <h1 className="text-xl font-semibold mt-1">Analytics</h1>
            <p className="text-xs text-gray-400 mt-1">
              First-party, cookieless site tracking — see also{' '}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline hover:text-black">
                Vercel Web Analytics
              </a>
              {' '}for referrers/countries/devices at a glance.
            </p>
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {RANGE_OPTIONS.map((opt) => (
              <Link
                key={opt}
                href={`/admin/analytics?days=${opt}`}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  days === opt ? 'bg-black text-white' : 'text-gray-500 hover:text-black'
                }`}
              >
                {opt}d
              </Link>
            ))}
          </div>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-xl font-semibold mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Top pages */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <h2 className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Top pages</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {summary.topPages.map((p) => (
                  <tr key={p.path}>
                    <td className="px-4 py-2.5 truncate max-w-0">{p.path}</td>
                    <td className="px-4 py-2.5 text-right font-medium whitespace-nowrap">{p.views}</td>
                  </tr>
                ))}
                {summary.topPages.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-gray-400">No data in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Top products */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <h2 className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Top products (views · add to cart)</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {summary.topProducts.map((p) => (
                  <tr key={p.productId}>
                    <td className="px-4 py-2.5 truncate max-w-0">{p.name}</td>
                    <td className="px-4 py-2.5 text-right font-medium whitespace-nowrap">{p.views} · {p.addToCart}</td>
                  </tr>
                ))}
                {summary.topProducts.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-gray-400">No data in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payment method split */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <h2 className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Purchases by payment method</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {summary.paymentMethods.map((m) => (
                  <tr key={m.method}>
                    <td className="px-4 py-2.5 capitalize">{m.method.replace('_', ' ')}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{m.count}</td>
                  </tr>
                ))}
                {summary.paymentMethods.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-gray-400">No purchases in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Device split */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <h2 className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Devices</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {summary.deviceSplit.map((d) => (
                  <tr key={d.device}>
                    <td className="px-4 py-2.5 capitalize">{d.device}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{d.count}</td>
                  </tr>
                ))}
                {summary.deviceSplit.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-gray-400">No data in this range.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Countries */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-8">
          <h2 className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">Top countries</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {summary.countrySplit.map((c) => (
                <tr key={c.country}>
                  <td className="px-4 py-2.5">{c.country}</td>
                  <td className="px-4 py-2.5 text-right font-medium">{c.count}</td>
                </tr>
              ))}
              {summary.countrySplit.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-gray-400">No data in this range (local dev has no country header).</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
