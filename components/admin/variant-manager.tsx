'use client'

import { useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { ProductVariant } from '@/lib/types'
import { upsertVariant, deleteVariant } from '@/lib/actions/products'
import { toast } from 'sonner'

interface VariantManagerProps {
  productId: string
  initialVariants: ProductVariant[]
}

type DraftVariant = Partial<ProductVariant> & {
  product_id: string
  _dirty?: boolean
  _new?: boolean
}

export function VariantManager({ productId, initialVariants }: VariantManagerProps) {
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

  async function saveRow(idx: number) {
    const v = variants[idx]
    const result = await upsertVariant(v as ProductVariant & { product_id: string })
    if (result.error) { toast.error(result.error); return }
    toast.success('Variant saved')
    setVariants((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...result.data!, product_id: productId, _dirty: false, _new: false } : r
      )
    )
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

  function quickAddSizes(color: string, hex: string) {
    const sizes = ['XS', 'S', 'M', 'L', 'XL']
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
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600">Variants</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => quickAddSizes('Black', '#000000')}
            className="text-xs px-3 py-1.5 border border-gray-300 hover:border-gray-500 transition-colors"
          >
            Quick add XS–XL (Black)
          </button>
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
                  <Input
                    type="number"
                    value={v.stock_quantity ?? 0}
                    onChange={(e) => updateRow(idx, 'stock_quantity', parseInt(e.target.value) || 0)}
                    className="h-7 text-xs w-16"
                    min={0}
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <Input
                    type="number"
                    value={v.low_stock_threshold ?? 3}
                    onChange={(e) => updateRow(idx, 'low_stock_threshold', parseInt(e.target.value) || 3)}
                    className="h-7 text-xs w-16"
                    min={1}
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
                    {v._dirty && (
                      <button
                        type="button"
                        onClick={() => saveRow(idx)}
                        className="p-1 text-green-600 hover:text-green-700"
                        title="Save"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="p-1 text-red-400 hover:text-red-600"
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
