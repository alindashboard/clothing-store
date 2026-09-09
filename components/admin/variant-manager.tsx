'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Save, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { ProductVariant } from '@/lib/types'
import { upsertVariant, deleteVariant } from '@/lib/actions/products'
import { toast } from 'sonner'
import { SITE_CONFIG } from '@/lib/config'

interface VariantManagerProps {
  productId: string
  initialVariants: ProductVariant[]
  /** Slug of the product's category — used to show the right size quick-add buttons. */
  categorySlug?: string
}

const SHOE_SIZES    = ['37','38','39','40','41','42','43','44','45']
const CLOTH_SIZES   = ['S','M','L','XL']
const CLOTH_SIZES_XS = ['XS','S','M','L','XL']

type DraftVariant = Partial<ProductVariant> & {
  product_id: string
  _dirty?: boolean
  _new?: boolean
  _saving?: boolean
}

/**
 * Numeric cell that keeps its own string draft while focused.
 *
 * A plain controlled `type="number"` bound to `parseInt(x) || fallback` snaps back
 * to the fallback the instant the field is emptied, so the value can never be
 * cleared and retyped — fatal on mobile, where there are no spinner arrows.
 * Here the field may legitimately be empty mid-edit; the fallback is only
 * applied on blur.
 */
function NumberCell({
  value,
  onCommit,
  onBlurCommit,
  fallback,
  min,
  className,
  disabled,
}: {
  value: number | null | undefined
  onCommit: (value: number) => void
  /** Called on blur with the resolved value, only when it differs from the value at focus. */
  onBlurCommit?: (value: number) => void
  fallback: number
  min?: number
  className?: string
  disabled?: boolean
}) {
  const [draft, setDraft] = useState(value == null ? '' : String(value))
  const [focused, setFocused] = useState(false)
  const valueAtFocus = useRef<number | null | undefined>(value)

  // Adopt external updates (e.g. a save round-trip) unless the user is typing.
  useEffect(() => {
    if (!focused) setDraft(value == null ? '' : String(value))
  }, [value, focused])

  return (
    <Input
      type="number"
      inputMode="numeric"
      value={draft}
      onFocus={(e) => {
        setFocused(true)
        valueAtFocus.current = value
        e.currentTarget.select()
      }}
      onChange={(e) => {
        const next = e.target.value
        setDraft(next)
        if (next !== '') {
          const parsed = parseInt(next, 10)
          if (!Number.isNaN(parsed)) onCommit(parsed)
        }
      }}
      onBlur={() => {
        setFocused(false)
        const parsed = parseInt(draft, 10)
        const resolved = Number.isNaN(parsed) ? fallback : parsed
        setDraft(String(resolved))
        if (resolved !== value) onCommit(resolved)
        if (resolved !== valueAtFocus.current) onBlurCommit?.(resolved)
      }}
      className={className}
      min={min}
      disabled={disabled}
    />
  )
}

export function VariantManager({ productId, initialVariants, categorySlug = '' }: VariantManagerProps) {
  const isShoeCategory = SITE_CONFIG.brand.shoeCategorySlugs.includes(categorySlug)
  const [variants, setVariants] = useState<DraftVariant[]>(
    initialVariants.map((v) => ({ ...v, _dirty: false, _new: false }))
  )

  function addRow() {
    setVariants((prev) => [
      ...prev,
      {
        product_id: productId,
        size: '',
        color_name: 'Black',
        color_hex: '#000000',
        stock_quantity: 0,
        low_stock_threshold: 3,
        is_active: true,
        sort_order: prev.length,
        _dirty: true,
        _new: true,
      },
    ])
  }

  function updateRow(idx: number, field: string, value: string | number | boolean) {
    setVariants((prev) =>
      prev.map((v, i) => (i === idx ? { ...v, [field]: value, _dirty: true } : v))
    )
  }

  async function persistRow(idx: number, patch: Partial<DraftVariant>, successMessage: string) {
    // Strip local-only bookkeeping flags — they are not columns on product_variants.
    const { _dirty, _new, _saving, ...v } = { ...variants[idx], ...patch }
    setVariants((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch, _saving: true } : r)))

    const result = await upsertVariant(v as ProductVariant & { product_id: string })

    if (result.error) {
      toast.error(result.error)
      // Keep the edit and the dirty flag so the row can be retried via the save button.
      setVariants((prev) => prev.map((r, i) => (i === idx ? { ...r, _saving: false, _dirty: true } : r)))
      return
    }

    toast.success(successMessage)
    setVariants((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...result.data!, product_id: productId, _dirty: false, _new: false, _saving: false }
          : r
      )
    )
  }

  function saveRow(idx: number) {
    return persistRow(idx, {}, 'Variant saved')
  }

  /**
   * Persist a stock/threshold edit as soon as the field loses focus.
   *
   * Rows that have never been saved are skipped: they usually still have an empty
   * size and SKU, and inserting them on a stray blur would litter the catalog.
   * Those stay dirty and go through the explicit save button as before.
   */
  function autoSaveRow(idx: number, patch: Partial<DraftVariant>) {
    const v = variants[idx]
    if (!v?.id || v._saving) {
      setVariants((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch, _dirty: true } : r)))
      return
    }
    void persistRow(idx, patch, 'Stock updated')
  }

  async function removeRow(idx: number) {
    const v = variants[idx]
    if (v.id) {
      if (!confirm('Delete this variant?')) return
      const result = await deleteVariant(v.id)
      if (result.error) { toast.error(result.error); return }
    }
    setVariants((prev) => prev.filter((_, i) => i !== idx))
    toast.success('Variant removed')
  }

  function quickAddSizes(sizes: string[], color: string, hex: string) {
    const newRows: DraftVariant[] = sizes.map((size, i) => ({
      product_id: productId,
      size,
      color_name: color,
      color_hex: hex,
      stock_quantity: 0,
      low_stock_threshold: 3,
      is_active: true,
      sort_order: variants.length + i,
      _dirty: true,
      _new: true,
    }))
    setVariants((prev) => [...prev, ...newRows])
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
          Variants
          {isShoeCategory && (
            <span className="ml-2 text-[10px] font-medium text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded tracking-normal normal-case">
              Shoe sizes
            </span>
          )}
        </h3>
        <div className="flex flex-wrap gap-2">
          {isShoeCategory ? (
            <button
              type="button"
              onClick={() => quickAddSizes(SHOE_SIZES, 'Standard', '#808080')}
              className="text-xs px-3 py-1.5 border border-gray-300 hover:border-gray-500 transition-colors"
            >
              Quick add 37–45
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => quickAddSizes(CLOTH_SIZES, 'Black', '#000000')}
                className="text-xs px-3 py-1.5 border border-gray-300 hover:border-gray-500 transition-colors"
              >
                Quick add S–XL
              </button>
              <button
                type="button"
                onClick={() => quickAddSizes(CLOTH_SIZES_XS, 'Black', '#000000')}
                className="text-xs px-3 py-1.5 border border-gray-300 hover:border-gray-500 transition-colors"
              >
                + XS
              </button>
            </>
          )}
          <button
            type="button"
            onClick={addRow}
            className="text-xs px-3 py-1.5 bg-black text-white flex items-center gap-1 hover:bg-gray-800"
          >
            <Plus className="w-3 h-3" /> Add Variant
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              {['Size', 'Color', 'Hex', 'SKU', 'Stock', 'Threshold', 'Price Override', 'Active', ''].map((h) => (
                <th key={h} className="pb-2 pr-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {variants.map((v, idx) => (
              <tr key={idx} className={`border-b border-gray-100 ${v._dirty ? 'bg-yellow-50' : ''}`}>
                <td className="py-1.5 pr-2">
                  <Input
                    value={v.size ?? ''}
                    onChange={(e) => updateRow(idx, 'size', e.target.value)}
                    className="h-7 text-xs w-16"
                    placeholder="M"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <Input
                    value={v.color_name ?? ''}
                    onChange={(e) => updateRow(idx, 'color_name', e.target.value)}
                    className="h-7 text-xs w-28"
                    placeholder="Black"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={v.color_hex ?? '#000000'}
                      onChange={(e) => updateRow(idx, 'color_hex', e.target.value)}
                      className="w-7 h-7 cursor-pointer rounded border border-gray-200 p-0.5"
                    />
                  </div>
                </td>
                <td className="py-1.5 pr-2">
                  <Input
                    value={v.sku ?? ''}
                    onChange={(e) => updateRow(idx, 'sku', e.target.value)}
                    className="h-7 text-xs w-24"
                    placeholder="TSH-BLK-M"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <NumberCell
                    value={v.stock_quantity ?? 0}
                    onCommit={(n) => updateRow(idx, 'stock_quantity', Math.max(0, n))}
                    onBlurCommit={(n) => autoSaveRow(idx, { stock_quantity: Math.max(0, n) })}
                    fallback={0}
                    className="h-7 text-xs w-16"
                    min={0}
                    disabled={v._saving}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <NumberCell
                    value={v.low_stock_threshold ?? 3}
                    onCommit={(n) => updateRow(idx, 'low_stock_threshold', Math.max(0, n))}
                    onBlurCommit={(n) => autoSaveRow(idx, { low_stock_threshold: Math.max(0, n) })}
                    fallback={3}
                    className="h-7 text-xs w-16"
                    min={0}
                    disabled={v._saving}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <Input
                    type="number"
                    value={v.price_override ?? ''}
                    onChange={(e) => updateRow(idx, 'price_override', e.target.value ? parseFloat(e.target.value) : null as any)}
                    className="h-7 text-xs w-20"
                    placeholder="—"
                    step="0.01"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="checkbox"
                    checked={v.is_active ?? true}
                    onChange={(e) => updateRow(idx, 'is_active', e.target.checked)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="py-1.5">
                  <div className="flex gap-1">
                    {v._saving ? (
                      <span className="p-1 text-gray-400" title="Saving…">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </span>
                    ) : (
                      v._dirty && (
                        <button
                          type="button"
                          onClick={() => saveRow(idx)}
                          className="p-1 text-green-600 hover:text-green-700"
                          title="Save"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={v._saving}
                      className="p-1 text-red-400 hover:text-red-600 disabled:opacity-40"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {variants.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No variants yet. Add one above.</p>
        )}
      </div>
    </div>
  )
}
