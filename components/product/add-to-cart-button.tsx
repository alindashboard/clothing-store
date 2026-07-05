'use client'

import { useState } from 'react'
import { useCartStore } from '@/lib/store/cart'
import { useTranslations } from 'next-intl'
import type { Product, ProductVariant } from '@/lib/types'
import { toast } from 'sonner'

interface AddToCartButtonProps {
  product: Product
  variant: ProductVariant | null
  allOutOfStock?: boolean
  /** 'compact' = smaller corner brackets/padding, for the mobile sticky bar. */
  size?: 'default' | 'compact'
}

export function AddToCartButton({ product, variant, allOutOfStock = false, size = 'default' }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false)
  const { addItem, openCart } = useCartStore()
  const t = useTranslations('common')

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

  let label = t('addToCart')
  let disabled = false

  if (isOutOfStock) {
    label = t('outOfStock')
    disabled = true
  } else if (noVariantSelected) {
    label = t('selectSize')
    disabled = true
  } else if (added) {
    label = t('added')
  }

  const ready = !disabled
  const cornerSize = size === 'compact' ? 9 : 12
  const cornerColor = ready ? '#D9B679' : '#3a3833'

  return (
    <button
      onClick={handleAdd}
      disabled={disabled}
      className={`relative w-full box-border text-center transition-colors ${
        size === 'compact' ? 'py-[15px]' : 'py-5'
      }`}
      style={{ background: ready ? '#D9B679' : 'transparent', cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <span
        className="absolute top-0 left-0"
        style={{ width: cornerSize, height: cornerSize, borderTop: `2px solid ${cornerColor}`, borderLeft: `2px solid ${cornerColor}` }}
      />
      <span
        className="absolute top-0 right-0"
        style={{ width: cornerSize, height: cornerSize, borderTop: `2px solid ${cornerColor}`, borderRight: `2px solid ${cornerColor}` }}
      />
      <span
        className="absolute bottom-0 left-0"
        style={{ width: cornerSize, height: cornerSize, borderBottom: `2px solid ${cornerColor}`, borderLeft: `2px solid ${cornerColor}` }}
      />
      <span
        className="absolute bottom-0 right-0"
        style={{ width: cornerSize, height: cornerSize, borderBottom: `2px solid ${cornerColor}`, borderRight: `2px solid ${cornerColor}` }}
      />
      <span
        className={`font-semibold uppercase ${size === 'compact' ? 'text-[11px] tracking-[1.5px]' : 'text-[13px] tracking-[2px]'}`}
        style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))', color: ready ? '#141412' : '#6b6862' }}
      >
        {label}
      </span>
    </button>
  )
}
