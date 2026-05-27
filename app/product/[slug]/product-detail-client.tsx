'use client'

import { useState } from 'react'
import type { Product, ProductVariant, ProductImage } from '@/lib/types'
import { VariantSelector } from '@/components/product/variant-selector'
import { AddToCartButton } from '@/components/product/add-to-cart-button'

interface ProductDetailClientProps {
  product: Product
  variants: ProductVariant[]
  images: ProductImage[]
}

export function ProductDetailClient({ product, variants }: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const allOutOfStock = variants.filter((v) => v.is_active).every((v) => v.stock_quantity <= 0)

  return (
    <div className="space-y-5">
      {!allOutOfStock && (
        <VariantSelector variants={variants} onSelect={setSelectedVariant} />
      )}
      <AddToCartButton product={product} variant={selectedVariant} allOutOfStock={allOutOfStock} />
    </div>
  )
}
