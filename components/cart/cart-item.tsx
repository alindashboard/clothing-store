'use client'

import Image from 'next/image'
import { Minus, Plus, X } from 'lucide-react'
import { useCartStore, type CartItem } from '@/lib/store/cart'
import { formatPrice } from '@/lib/utils'

interface CartItemProps {
  item: CartItem
  compact?: boolean
}

export function CartItemRow({ item, compact }: CartItemProps) {
  const { removeItem, updateQuantity } = useCartStore()

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="relative w-16 h-20 shrink-0 bg-gray-50">
        <Image
          src={item.imageUrl}
          alt={item.productName}
          fill
          sizes="64px"
          className="object-cover"
          unoptimized={item.imageUrl.startsWith('/')}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <p className="text-sm font-medium leading-snug truncate">{item.productName}</p>
          {!compact && (
            <button onClick={() => removeItem(item.variantId)} className="text-gray-400 hover:text-gray-700 shrink-0">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {item.variantColor} / {item.variantSize}
        </p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-gray-200">
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              disabled={item.quantity >= item.maxStock}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 disabled:opacity-30"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
        </div>
      </div>
    </div>
  )
}
