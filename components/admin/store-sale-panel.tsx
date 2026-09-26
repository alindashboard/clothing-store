'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Search, Undo2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { formatPrice } from '@/lib/utils'
import {
  searchStoreSaleProducts,
  recordStoreSale,
  undoStoreSale,
  type StoreSale,
  type StoreSaleProduct,
  type StoreSaleVariant,
} from '@/lib/actions/store-sales'

interface Pending {
  product: StoreSaleProduct
  variant: StoreSaleVariant
}

/**
 * In-store sale flow, built for a phone at the till: type (or scan) a name/SKU,
 * tap the size, confirm. Enter on an exact variant SKU goes straight to confirm.
 */
export function StoreSalePanel({ recentSales }: { recentSales: StoreSale[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<StoreSaleProduct[]>([])
  const [searching, setSearching] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [saving, setSaving] = useState(false)
  const [undoingId, setUndoingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const searchSeq = useRef(0)

  // Debounced search; a sequence number drops responses that arrive out of order.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResults([]); return }
    const seq = ++searchSeq.current
    const timer = setTimeout(async () => {
      setSearching(true)
      const found = await searchStoreSaleProducts(q)
      if (seq === searchSeq.current) { setResults(found); setSearching(false) }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  async function runSearchNow(q: string) {
    const seq = ++searchSeq.current
    const found = await searchStoreSaleProducts(q)
    if (seq === searchSeq.current) setResults(found)
    return found
  }

  async function handleEnter() {
    const q = query.trim().toUpperCase()
    if (q.length < 2) return
    const found = await runSearchNow(q)
    for (const product of found) {
      const variant = product.variants.find((v) => v.sku?.toUpperCase() === q)
      if (variant && variant.stock > 0) { setPending({ product, variant }); return }
    }
  }

  async function confirmSale() {
    if (!pending) return
    setSaving(true)
    const result = await recordStoreSale(pending.variant.id, 1)
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(`Sold: ${pending.product.name} — ${pending.variant.size}`)
    // Reflect the new stock locally right away, then refresh the log.
    setResults((prev) =>
      prev.map((p) => ({
        ...p,
        variants: p.variants.map((v) => (v.id === pending.variant.id ? { ...v, stock: v.stock - 1 } : v)),
      }))
    )
    setPending(null)
    startTransition(() => router.refresh())
    inputRef.current?.focus()
  }

  async function undo(sale: StoreSale) {
    if (!confirm(`Undo the sale of ${sale.product_name} — ${sale.variant_size}? Stock goes back up by ${sale.quantity}.`)) return
    setUndoingId(sale.id)
    const result = await undoStoreSale(sale.id)
    setUndoingId(null)
    if (result.error) { toast.error(result.error); return }
    toast.success('Sale undone, stock restored')
    if (query.trim().length >= 2) runSearchNow(query.trim())
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <label htmlFor="store-sale-search" className="text-xs text-gray-500">Product name or SKU</label>
        <div className="relative mt-1.5">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            id="store-sale-search"
            type="search"
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEnter() } }}
            placeholder="e.g. VS-0007 or Versace sneakers"
            className="w-full border border-gray-200 pl-9 pr-9 py-3 text-base focus:outline-none focus:border-gray-400"
          />
          {searching && <Loader2 className="w-4 h-4 animate-spin text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />}
        </div>

        <div className="mt-4 space-y-3">
          {results.map((product) => (
            <div key={product.id} className="flex gap-3 border border-gray-100 rounded p-3">
              <div className="relative w-14 h-16 bg-gray-100 shrink-0">
                <Image
                  src={product.imageUrl ?? '/images/placeholder-product.svg'}
                  alt={product.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                  unoptimized={!product.imageUrl}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="font-mono">{product.skuPrefix ?? '—'}</span> · {formatPrice(product.price)}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={variant.stock <= 0}
                      onClick={() => setPending({ product, variant })}
                      className="min-w-14 px-3 py-2 border border-gray-300 text-sm hover:border-black disabled:opacity-40 disabled:hover:border-gray-300 disabled:cursor-not-allowed"
                    >
                      <span className="font-medium">{variant.size}</span>
                      <span className="block text-[11px] text-gray-500">{variant.stock} in stock</span>
                    </button>
                  ))}
                  {product.variants.length === 0 && <p className="text-xs text-gray-400">No active sizes.</p>}
                </div>
              </div>
            </div>
          ))}
          {query.trim().length >= 2 && !searching && results.length === 0 && (
            <p className="text-sm text-gray-400">No products found.</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600 mb-4">Recent in-store sales</h2>
        {recentSales.length === 0 ? (
          <p className="text-sm text-gray-400">No in-store sales recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentSales.map((sale) => (
              <li key={sale.id} className={`flex items-center gap-3 py-3 text-sm ${sale.undone_at ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${sale.undone_at ? 'line-through' : ''}`}>
                    {sale.product_name} — {sale.variant_size}{sale.quantity > 1 ? ` × ${sale.quantity}` : ''}
                  </p>
                  <p className="text-xs text-gray-400">
                    {sale.sku && <span className="font-mono">{sale.sku} · </span>}
                    {new Date(sale.sold_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                    {sale.undone_at && ' · undone'}
                  </p>
                </div>
                {!sale.undone_at && (
                  <button
                    type="button"
                    onClick={() => undo(sale)}
                    disabled={undoingId === sale.id}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-black disabled:opacity-50"
                  >
                    {undoingId === sale.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                    Undo
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={pending !== null} onOpenChange={(open) => { if (!open && !saving) setPending(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record in-store sale</DialogTitle>
            <DialogDescription>
              {pending && (
                <>
                  <strong className="text-black">{pending.product.name}</strong> — size{' '}
                  <strong className="text-black">{pending.variant.size}</strong>
                  {pending.variant.sku && <span className="font-mono"> ({pending.variant.sku})</span>}.
                  {' '}Stock goes from {pending.variant.stock} to {pending.variant.stock - 1}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose disabled={saving} className="px-4 py-2 border border-gray-300 text-sm font-medium hover:border-gray-500">
              Cancel
            </DialogClose>
            <button
              type="button"
              onClick={confirmSale}
              disabled={saving}
              className="px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Sold — 1 piece
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
