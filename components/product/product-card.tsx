'use client'

import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { useState } from 'react'
import type { Product, ProductVariant } from '@/lib/types'
import { PriceDisplay } from './price-display'
import { ProductBadge } from './product-badge'

interface ProductCardProps {
  product: Product
  /** 'dark' = for use on dark surfaces (e.g. homepage dark sections). */
  variant?: 'light' | 'dark'
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

function getAvailableSizes(variants: ProductVariant[], colorFilter?: string) {
  return variants.filter(
    (v) => v.is_active && (!colorFilter || v.color_name === colorFilter)
  )
}

export function ProductCard({ product, variant = 'light' }: ProductCardProps) {
  const { variants = [], images = [] } = product
  const primaryImage = images.find((i) => i.is_primary) ?? images[0]
  const secondaryImage = images.find((i) => !i.is_primary && i !== primaryImage)

  const [hovered, setHovered] = useState(false)
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined)

  const activeVariants = variants.filter((v) => v.is_active)
  const isOutOfStock = activeVariants.every((v) => v.stock_quantity <= 0)
  const distinctColors = getDistinctColors(variants)
  const sizesForColor = getAvailableSizes(variants, selectedColor ?? distinctColors[0]?.color_name)

  const displayPrice =
    selectedColor
      ? variants.find((v) => v.color_name === selectedColor && v.price_override != null)?.price_override ?? product.base_price
      : product.base_price

  const imageUrl = hovered && secondaryImage ? secondaryImage.url : (primaryImage?.url ?? '/images/placeholder-product.svg')

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`relative aspect-[3/4] overflow-hidden mb-3 ${variant === 'dark' ? 'bg-[#1B1917]' : 'bg-gray-50'}`}>
        <Image
          src={imageUrl}
          alt={primaryImage?.alt_text ?? product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-all duration-500 ${isOutOfStock ? 'grayscale opacity-60' : 'group-hover:scale-105'}`}
          unoptimized={imageUrl.startsWith('/')}
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isOutOfStock && <ProductBadge type="out-of-stock" />}
          {!isOutOfStock && product.is_new && <ProductBadge type="new" />}
          {!isOutOfStock && product.compare_at_price && <ProductBadge type="sale" />}
        </div>
      </div>

      <div className="space-y-2">
        {/* Color swatches */}
        {distinctColors.length > 1 && (
          <div className="flex gap-1.5" onClick={(e) => e.preventDefault()}>
            {distinctColors.map((v) => (
              <button
                key={v.color_name}
                onClick={(e) => {
                  e.preventDefault()
                  setSelectedColor(v.color_name)
                }}
                title={v.color_name}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  (selectedColor ?? distinctColors[0]?.color_name) === v.color_name
                    ? 'border-black scale-125'
                    : 'border-transparent hover:border-gray-400'
                }`}
                style={{ backgroundColor: v.color_hex }}
              />
            ))}
          </div>
        )}

        <p className={`text-sm font-medium leading-snug ${variant === 'dark' ? 'text-[#EDE9E1]' : 'text-gray-900'}`}>{product.name}</p>

        <PriceDisplay
          price={displayPrice}
          compareAtPrice={product.compare_at_price}
          size="sm"
          variant={variant}
        />

        {/* Available sizes */}
        {sizesForColor.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {sizesForColor.map((v) => (
              <span
                key={v.id}
                className={`text-[10px] px-1.5 py-0.5 border ${
                  v.stock_quantity <= 0
                    ? variant === 'dark'
                      ? 'border-[#201f1c] text-[#4a4843] line-through'
                      : 'border-gray-200 text-gray-300 line-through'
                    : variant === 'dark'
                      ? 'border-[#2B2924] text-[#8C8577]'
                      : 'border-gray-300 text-gray-600'
                }`}
              >
                {v.size}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
