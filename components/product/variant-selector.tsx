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
    <div className="space-y-6">
      {/* Color selector */}
      {distinctColors.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3 text-[#EDE9E1]" style={{ fontFamily: 'var(--font-sans)' }}>
            {t('color')}: <span className="font-normal text-[#8C8577]">{selectedColor}</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {distinctColors.map((v) => (
              <button
                key={v.color_name}
                onClick={() => handleColorSelect(v.color_name)}
                title={v.color_name}
                className="w-[34px] h-[34px] rounded-full transition-all box-border"
                style={{
                  backgroundColor: v.color_hex,
                  border: `2px solid ${selectedColor === v.color_name ? '#D9B679' : '#2B2924'}`,
                  boxShadow: selectedColor === v.color_name ? '0 0 0 2px #141412' : undefined,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      <div>
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-sm font-medium text-[#EDE9E1]" style={{ fontFamily: 'var(--font-sans)' }}>{t('size')}</p>
          <button className="text-xs underline text-[#8C8577] hover:text-[#EDE9E1] transition-colors">{t('sizeGuide')}</button>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {sizesForColor.map((v) => {
            const outOfStock = v.stock_quantity <= 0
            const selected = selectedSize === v.size
            const lowStock = !outOfStock && v.stock_quantity <= v.low_stock_threshold
            return (
              <button
                key={v.id}
                onClick={() => !outOfStock && setSelectedSize(v.size)}
                disabled={outOfStock}
                title={outOfStock ? tCommon('outOfStock') : undefined}
                className="relative w-14 h-[52px] flex items-center justify-center font-semibold text-sm box-border transition-all"
                style={{
                  fontFamily: 'var(--font-grotesk, var(--font-sans))',
                  border: `1.5px solid ${outOfStock ? '#2B2924' : selected ? '#D9B679' : '#2B2924'}`,
                  background: outOfStock ? '#141412' : selected ? '#D9B679' : 'transparent',
                  color: outOfStock ? '#4a4740' : selected ? '#141412' : '#c7c3b8',
                  cursor: outOfStock ? 'not-allowed' : 'pointer',
                }}
              >
                {v.size}
                {outOfStock && (
                  <span
                    className="absolute left-1 right-1 top-1/2 h-px"
                    style={{ background: '#6b6862', transform: 'rotate(-8deg)' }}
                  />
                )}
                {lowStock && (
                  <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full" style={{ background: '#D9B679' }} title="Low stock" />
                )}
              </button>
            )
          })}
        </div>

        {/* Low stock warning */}
        {selectedSize && sizesForColor.find((v) => v.size === selectedSize && v.stock_quantity > 0 && v.stock_quantity <= v.low_stock_threshold) && (
          <p className="text-xs mt-2" style={{ color: '#D9B679' }}>
            {t('lowStock', { count: sizesForColor.find((v) => v.size === selectedSize)?.stock_quantity ?? 0 })}
          </p>
        )}
      </div>
    </div>
  )
}
