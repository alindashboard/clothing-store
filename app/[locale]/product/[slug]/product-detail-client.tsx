'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Product, ProductVariant, ProductImage } from '@/lib/types'
import { VariantSelector } from '@/components/product/variant-selector'
import { AddToCartButton } from '@/components/product/add-to-cart-button'
import { formatPrice } from '@/lib/utils'

interface ProductDetailClientProps {
  product: Product
  variants: ProductVariant[]
  images: ProductImage[]
}

export function ProductDetailClient({ product, variants }: ProductDetailClientProps) {
  const t = useTranslations('product')
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const allOutOfStock = variants.filter((v) => v.is_active).every((v) => v.stock_quantity <= 0)
  const total = selectedVariant?.price_override ?? product.base_price

  return (
    <>
      <div className="space-y-6">
        {!allOutOfStock && (
          <VariantSelector variants={variants} onSelect={setSelectedVariant} />
        )}
        {/* Desktop: inline add-to-cart */}
        <div className="hidden md:block">
          <AddToCartButton product={product} variant={selectedVariant} allOutOfStock={allOutOfStock} />
        </div>
      </div>

      {/* Mobile: sticky bottom bar */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-center gap-3.5 px-5 py-3.5 box-border"
        style={{ background: '#0A0A0A', borderTop: '1px solid #2B2924' }}
      >
        <div>
          <div
            className="text-[9px] tracking-wider"
            style={{ color: '#8C8577', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {t('total')}
          </div>
          <div
            className="font-bold text-[17px]"
            style={{ color: '#EDE9E1', fontFamily: 'var(--font-archivo, var(--font-sans))' }}
          >
            {formatPrice(total)}
          </div>
        </div>
        <div className="flex-1">
          <AddToCartButton product={product} variant={selectedVariant} allOutOfStock={allOutOfStock} size="compact" />
        </div>
      </div>
    </>
  )
}
