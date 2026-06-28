'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import type { ProductVariant } from '@/lib/types'

interface VariantSelectorProps {
  variants: ProductVariant[]
  onSelect: (variant: ProductVariant | null) => void
  onColorChange?: (color: string) => void
}

function getDistinctColors(variants: ProductVariant[]) {
  const seen = new Set<string>()
  return variants.filter((v) => {
    if (!v.is_active) return false
    if (seen.has(v.color_name)) return false
    seen.add(v.color_name)
    return true
  })
}

export function VariantSelector({ variants, onSelect, onColorChange }: VariantSelectorProps) {
  const t = useTranslations('product')
  const tCommon = useTranslations('common')
  const activeVariants = variants.filter((v) => v.is_active)
  const distinctColors = getDistinctColors(activeVariants)

  const [selectedColor, setSelectedColor] = useState<string>(distinctColors[0]?.color_name ?? '')
  const [selectedSize, setSelectedSize] = useState<string>('')

  const sizesForColor = activeVariants.filter((v) => v.color_name === selectedColor)

  useEffect(() => {
    if (selectedColor && selectedSize) {
      const variant = activeVariants.find(
        (v) => v.color_name === selectedColor && v.size === selectedSize
      )
      onSelect(variant ?? null)
    } else {
      onSelect(null)
    }
  }, [selectedColor, selectedSize])

  function handleColorSelect(color: string) {
    setSelectedColor(color)
    setSelectedSize('')
    onColorChange?.(color)
  }

  return (
    <div className="space-y-5">
      {/* Color selector */}
      {distinctColors.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            {t('color')}: <span className="font-normal text-gray-500">{selectedColor}</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {distinctColors.map((v) => (
              <button
                key={v.color_name}
                onClick={() => handleColorSelect(v.color_name)}
                title={v.color_name}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === v.color_name
                    ? 'border-black ring-1 ring-black ring-offset-1'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
                style={{ backgroundColor: v.color_hex }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">{t('size')}</p>
          <button className="text-xs text-gray-400 underline hover:text-gray-600">{t('sizeGuide')}</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {sizesForColor.map((v) => {
            const outOfStock = v.stock_quantity <= 0
            const lowStock = !outOfStock && v.stock_quantity <= v.low_stock_threshold
            return (
              <button
                key={v.id}
                onClick={() => !outOfStock && setSelectedSize(v.size)}
                disabled={outOfStock}
                title={outOfStock ? tCommon('outOfStock') : undefined}
                className={`min-w-[44px] h-11 px-3 border text-sm font-medium transition-all relative ${
                  outOfStock
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                    : selectedSize === v.size
                    ? 'border-black bg-black text-white'
                    : 'border-gray-300 text-gray-700 hover:border-black'
                }`}
              >
                {v.size}
                {lowStock && (
                  <span className="absolute -top-1.5 -right-1.5 w-2 h-2 bg-amber-400 rounded-full" title="Low stock" />
                )}
              </button>
            )
          })}
        </div>

        {/* Low stock warning */}
        {selectedSize && sizesForColor.find((v) => v.size === selectedSize && v.stock_quantity > 0 && v.stock_quantity <= v.low_stock_threshold) && (
          <p className="text-xs text-amber-600 mt-2">
            {t('lowStock', { count: sizesForColor.find((v) => v.size === selectedSize)?.stock_quantity ?? 0 })}
          </p>
        )}
      </div>
    </div>
  )
}
