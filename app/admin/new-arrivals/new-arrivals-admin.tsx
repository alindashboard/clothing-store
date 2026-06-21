'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import {
  addToNewArrivals,
  removeFromNewArrivals,
  clearAllNewArrivals,
  searchProductsForNewArrivals,
  type NewArrivalEntry,
} from '@/lib/actions/new-arrivals'
import type { Product } from '@/lib/types'

interface Props {
  initialItems: NewArrivalEntry[]
}

export function NewArrivalsAdmin({ initialItems }: Props) {
  const [items, setItems] = useState<NewArrivalEntry[]>(initialItems)
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [clearing, setClearing] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addedProductIds = new Set(items.map((i) => i.product_id))

  function handleQueryChange(q: string) {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const found = await searchProductsForNewArrivals(q)
      setResults(found)
      setSearching(false)
    }, 300)
  }

  async function handleAdd(product: Product) {
    setAdding(product.id)
    const res = await addToNewArrivals(product.id)
    if (!res.error) {
      const newEntry: NewArrivalEntry = {
        id: crypto.randomUUID(),
        product_id: product.id,
        position: items.length + 1,
        created_at: new Date().toISOString(),
        product,
      }
      setItems((prev) => [...prev, newEntry])
    }
    setAdding(null)
  }

  async function handleRemove(entry: NewArrivalEntry) {
    setRemoving(entry.id)
    const res = await removeFromNewArrivals(entry.id)
    if (!res.error) {
      setItems((prev) => prev.filter((i) => i.id !== entry.id))
    }
    setRemoving(null)
  }

  async function handleClearAll() {
    setClearing(true)
    const res = await clearAllNewArrivals()
    if (!res.error) setItems([])
    setClearing(false)
    setClearConfirm(false)
  }

  const primaryImage = (p: Product) =>
    p.images?.find((x) => x.is_primary) ?? p.images?.[0]

  return (
    <div className="space-y-6">
      {/* ── Action bar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          onClick={() => { setShowSearch((v) => !v); setQuery(''); setResults([]) }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-medium tracking-wider uppercase hover:bg-gray-800 transition-colors"
        >
          {showSearch ? '✕ Close' : '+ Add Product'}
        </button>

        {items.length > 0 && (
          clearConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-600">Remove all {items.length} products?</span>
              <button
                onClick={handleClearAll}
                disabled={clearing}
                className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {clearing ? 'Clearing…' : 'Confirm'}
              </button>
              <button
                onClick={() => setClearConfirm(false)}
                className="px-3 py-1.5 border border-gray-300 text-xs hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setClearConfirm(true)}
              className="text-xs text-red-400 hover:text-red-600 underline underline-offset-2 transition-colors"
            >
              Clear All
            </button>
          )
        )}
      </div>

      {/* ── Search panel ── */}
      {showSearch && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="relative">
            <input
              autoFocus
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search by product name or SKU…"
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 pr-8"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                …
              </span>
            )}
          </div>

          {results.length > 0 && (
            <ul className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
              {results.map((p) => {
                const img = primaryImage(p)
                const alreadyAdded = addedProductIds.has(p.id)
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <div className="w-10 h-10 relative shrink-0 bg-gray-100 rounded overflow-hidden">
                      <Image
                        src={img?.url ?? '/images/placeholder-product.svg'}
                        alt={p.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {p.sku_prefix ?? '—'} · €{p.base_price.toFixed(2)}
                      </p>
                    </div>
                    {alreadyAdded ? (
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded shrink-0">
                        Added
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(p)}
                        disabled={adding === p.id}
                        className="text-xs px-3 py-1 bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-40 shrink-0"
                      >
                        {adding === p.id ? '…' : 'Add'}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {query.trim() && !searching && results.length === 0 && (
            <p className="text-sm text-gray-400 py-2">No products found.</p>
          )}
        </div>
      )}

      {/* ── Curated list ── */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {items.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-400">
            No products in the curated list yet. Use "+ Add Product" to get started.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-12">#</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden sm:table-cell">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 hidden sm:table-cell">Price</th>
                <th className="px-4 py-3 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((entry, idx) => {
                const img = primaryImage(entry.product)
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative shrink-0 bg-gray-100 rounded overflow-hidden">
                          <Image
                            src={img?.url ?? '/images/placeholder-product.svg'}
                            alt={entry.product.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[180px]">
                          {entry.product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs font-mono hidden sm:table-cell">
                      {entry.product.sku_prefix ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 hidden sm:table-cell">
                      €{entry.product.base_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleRemove(entry)}
                        disabled={removing === entry.id}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                      >
                        {removing === entry.id ? '…' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {items.length > 0 && (
        <p className="text-xs text-gray-400">
          {items.length} product{items.length !== 1 ? 's' : ''} in the list.
          {items.length > 8 && (
            <span className="text-amber-600 ml-2">
              Recommended max is ~8 for best carousel performance.
            </span>
          )}
          {/* Ordering note: list is ordered by position asc, then created_at asc.
              Drag-and-drop reordering is not yet implemented — positions can be
              updated manually via Supabase or by removing and re-adding products. */}
        </p>
      )}
    </div>
  )
}
