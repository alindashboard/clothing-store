'use client'

import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import type { Product, ProductVariant } from '@/lib/types'
import { toast } from 'sonner'

interface AddToCartButtonProps {
  product: Product
  variant: ProductVariant | null
  allOutOfStock?: boolean
}

export function AddToCartButton({ product, variant, allOutOfStock = false }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false)
  const { addItem, openCart } = useCartStore()

  const isOutOfStock = allOutOfStock || (variant ? variant.stock_quantity <= 0 : false)
  const noVariantSelected = !allOutOfStock && !variant

  function handleAdd() {
    if (!variant || variant.stock_quantity <= 0) return

    const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0]

    addItem({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      productSlug: product.slug,
      variantSize: variant.size,
      variantColor: variant.color_name,
      price: variant.price_override ?? product.base_price,
      imageUrl: primaryImage?.url ?? '/images/placeholder-product.svg',
      maxStock: variant.stock_quantity,
    })

    setAdded(true)
    toast.success(`${product.name} added to cart`, {
      description: `${variant.color_name} / ${variant.size}`,
    })
    setTimeout(() => {
      setAdded(false)
      openCart()
    }, 800)
  }

  let label = 'Add to Cart'
  let disabled = false

  if (isOutOfStock) {
    label = 'Out of Stock'
    disabled = true
  } else if (noVariantSelected) {
    label = 'Select size'
    disabled = true
  } else if (added) {
    label = 'Added!'
  }

  return (
    <button
      onClick={handleAdd}
      disabled={disabled}
      className={`w-full h-12 flex items-center justify-center gap-2 font-semibold text-sm tracking-wider uppercase transition-all ${
        disabled
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : added
          ? 'bg-green-600 text-white'
          : 'bg-black text-white hover:bg-gray-800'
      }`}
    >
      {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
      {label}
    </button>
  )
}
