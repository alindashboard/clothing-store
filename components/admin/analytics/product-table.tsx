'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ExternalLink, Loader2, X } from 'lucide-react'
import { getProductAnalyticsDetail, type ProductAnalyticsDetail, type ProductAnalyticsRow } from '@/lib/actions/analytics'
import { formatPrice } from '@/lib/utils'
import { DailyBars } from './daily-bars'

type SortKey = 'name' | 'views' | 'viewers' | 'addToCart' | 'cartRate' | 'unitsSold' | 'revenue' | 'stock' | 'price'

// Quick views answer the three questions the owner actually acts on.
const QUICK_VIEWS = {
  all: { label: 'All products', filter: () => true },
  noCart: {
    label: 'Viewed, never added',
    hint: 'Seen by 3+ visitors, never put in the cart — check price, photos and sizes.',
    filter: (r: ProductAnalyticsRow) => r.viewers >= 3 && r.addToCart === 0,
  },
  unseen: {
    label: 'Never viewed',
    hint: 'Active, in stock, zero visits in this period — promote or re-photograph.',
    filter: (r: ProductAnalyticsRow) => r.isActive && r.stock > 0 && r.views === 0,
  },
  lowStock: {
    label: 'Popular, low stock',
    hint: 'Viewed by 3+ visitors with 2 pieces or fewer left.',
    filter: (r: ProductAnalyticsRow) => r.viewers >= 3 && r.stock <= 2,
  },
} as const
type QuickView = keyof typeof QUICK_VIEWS

function cartRate(r: ProductAnalyticsRow) {
  return r.viewers > 0 ? r.cartVisitors / r.viewers : 0
}

export function ProductTable({ rows, from, to }: { rows: ProductAnalyticsRow[]; from: string; to: string }) {
  const [search, setSearch] = useState('')
  const [brand, setBrand] = useState('')
  const [gender, setGender] = useState('')
  const [quick, setQuick] = useState<QuickView>('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'views', dir: 'desc' })
  const [selected, setSelected] = useState<ProductAnalyticsRow | null>(null)
  const [detail, setDetail] = useState<ProductAnalyticsDetail | null>(null)
  const [loading, startLoading] = useTransition()

  const brands = useMemo(() => [...new Set(rows.map((r) => r.brand).filter(Boolean) as string[])].sort(), [rows])
  const genders = useMemo(() => [...new Set(rows.map((r) => r.gender).filter(Boolean) as string[])].sort(), [rows])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = rows.filter(
      (r) =>
        QUICK_VIEWS[quick].filter(r) &&
        (!brand || r.brand === brand) &&
        (!gender || r.gender === gender) &&
        (!term || r.name.toLowerCase().includes(term))
    )
    const value = (r: ProductAnalyticsRow): number | string =>
      sort.key === 'cartRate' ? cartRate(r) : sort.key === 'name' ? r.name.toLowerCase() : r[sort.key]
    return list.sort((a, b) => {
      const va = value(a), vb = value(b)
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return sort.dir === 'asc' ? cmp : -cmp
    })
  }, [rows, search, brand, gender, quick, sort])

  const totals = useMemo(
    () => filtered.reduce(
      (t, r) => ({ views: t.views + r.views, addToCart: t.addToCart + r.addToCart, units: t.units + r.unitsSold, revenue: t.revenue + r.revenue }),
      { views: 0, addToCart: 0, units: 0, revenue: 0 }
    ),
    [filtered]
  )

  function toggleSort(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))
  }

  function open(row: ProductAnalyticsRow) {
    setSelected(row)
    setDetail(null)
    startLoading(async () => {
      setDetail(await getProductAnalyticsDetail({ productId: row.id, from: new Date(from), to: new Date(to) }))
    })
  }

  const header = (key: SortKey, label: string, align: 'left' | 'right' = 'right') => (
    <th className={`px-3 py-2.5 font-medium whitespace-nowrap ${align === 'left' ? 'text-left' : 'text-right'}`}>
      <button
        type="button"
        onClick={() => toggleSort(key)}
        className={`inline-flex items-center gap-1 hover:text-black ${sort.key === key ? 'text-black' : ''}`}
      >
        {label}
        {sort.key === key && (sort.dir === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />)}
      </button>
    </th>
  )

  const hint = 'hint' in QUICK_VIEWS[quick] ? (QUICK_VIEWS[quick] as { hint: string }).hint : null

  return (
    <div>
      {/* Filters: one row above the table */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="h-9 w-56 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:border-gray-400"
        />
        <select value={brand} onChange={(e) => setBrand(e.target.value)} className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm">
          <option value="">All brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm">
          <option value="">All departments</option>
          {genders.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {(Object.keys(QUICK_VIEWS) as QuickView[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setQuick(key)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              quick === key ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {QUICK_VIEWS[key].label} ({rows.filter(QUICK_VIEWS[key].filter).length})
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-500 mb-3 min-h-4">{hint}</p>

      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 border-b border-gray-100">
            <tr>
              {header('name', 'Product', 'left')}
              {header('views', 'Views')}
              {header('viewers', 'Visitors')}
              {header('addToCart', 'Added to cart')}
              {header('cartRate', 'Cart rate')}
              {header('unitsSold', 'Sold')}
              {header('revenue', 'Revenue')}
              {header('stock', 'Stock')}
              {header('price', 'Price')}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() => open(r)}
                className={`cursor-pointer hover:bg-gray-50 ${selected?.id === r.id ? 'bg-gray-50' : ''}`}
              >
                <td className="px-3 py-2.5 max-w-[320px]">
                  <p className="truncate font-medium">{r.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {[r.gender, r.category].filter(Boolean).join(' › ') || '—'}
                    {!r.hasPhoto && ' · no photo'}
                    {!r.isActive && ' · inactive'}
                  </p>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.views}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.viewers}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.addToCart}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-500">
                  {r.viewers > 0 ? `${Math.round(cartRate(r) * 100)}%` : '—'}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.unitsSold || '—'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{r.revenue ? formatPrice(r.revenue) : '—'}</td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${r.stock <= 2 ? 'text-amber-700' : ''}`}>{r.stock}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-gray-500">{formatPrice(r.price)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-400">No products match.</td></tr>
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="border-t border-gray-100 text-xs text-gray-500">
              <tr>
                <td className="px-3 py-2.5">{filtered.length} products</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{totals.views}</td>
                <td />
                <td className="px-3 py-2.5 text-right tabular-nums">{totals.addToCart}</td>
                <td />
                <td className="px-3 py-2.5 text-right tabular-nums">{totals.units || '—'}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{totals.revenue ? formatPrice(totals.revenue) : '—'}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Drill-down drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={selected.name}>
          <button type="button" aria-label="Close" className="absolute inset-0 bg-black/20" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-xl h-full overflow-y-auto bg-white shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold">{selected.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {[selected.brand, selected.gender, selected.category].filter(Boolean).join(' · ')} · {formatPrice(selected.price)} · stock {selected.stock}
                </p>
                <div className="flex gap-3 mt-2 text-xs">
                  <a href={`/it/product/${selected.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline hover:text-black text-gray-600">
                    View on site <ExternalLink className="w-3 h-3" />
                  </a>
                  <Link href={`/admin/products/${selected.id}`} className="underline hover:text-black text-gray-600">Edit product</Link>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="p-1 text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                ['Views', selected.views],
                ['Visitors', selected.viewers],
                ['Added to cart', selected.addToCart],
                ['Sold', selected.unitsSold],
              ].map(([label, value]) => (
                <div key={label} className="border border-gray-200 rounded-md p-2.5">
                  <p className="text-[11px] text-gray-500">{label}</p>
                  <p className="text-lg font-semibold tabular-nums">{value}</p>
                </div>
              ))}
            </div>

            {loading || !detail ? (
              <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : (
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Views per day</h3>
                  <DailyBars data={detail.daily.map((d) => ({ date: d.date, value: d.views }))} unit="views" height={130} />
                </section>
                <section>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Added to cart per day</h3>
                  <DailyBars data={detail.daily.map((d) => ({ date: d.date, value: d.addToCart }))} unit="adds to cart" height={100} />
                </section>
                <div className="grid grid-cols-2 gap-4">
                  <section>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Where viewers came from</h3>
                    <ul className="text-sm divide-y divide-gray-50">
                      {detail.sources.map((s) => (
                        <li key={s.source} className="flex justify-between py-1.5"><span>{s.label}</span><span className="tabular-nums">{s.visitors}</span></li>
                      ))}
                      {detail.sources.length === 0 && <li className="py-1.5 text-gray-400">No data</li>}
                    </ul>
                  </section>
                  <section>
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Devices</h3>
                    <ul className="text-sm divide-y divide-gray-50">
                      {detail.devices.map((d) => (
                        <li key={d.device} className="flex justify-between py-1.5"><span className="capitalize">{d.device}</span><span className="tabular-nums">{d.visitors}</span></li>
                      ))}
                      {detail.devices.length === 0 && <li className="py-1.5 text-gray-400">No data</li>}
                    </ul>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
