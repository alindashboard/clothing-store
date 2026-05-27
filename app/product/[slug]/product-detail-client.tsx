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

  return (
    <div className="space-y-5">
      <VariantSelector
        variants={variants}
        onSelect={setSelectedVariant}
      />
      <AddToCartButton product={product} variant={selectedVariant} />
    </div>
  )
}
