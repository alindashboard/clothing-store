'use client'

import Image from 'next/image'
import { Minus, Plus, X } from 'lucide-react'
import { useCartStore, type CartItem } from '@/lib/store/cart'
import { formatPrice } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface CartItemProps {
  item: CartItem
  compact?: boolean
}

export function CartItemRow({ item, compact }: CartItemProps) {
  const { removeItem, updateQuantity } = useCartStore()
  const t = useTranslations('cart')

  return (
    <div className="flex gap-4 py-5 border-b border-[#2B2924] last:border-0">
      <div className="relative w-20 h-24 shrink-0 bg-[#1A1917]">
        <Image
          src={item.imageUrl}
          alt={item.productName}
          fill
          sizes="80px"
          className="object-cover"
          unoptimized={item.imageUrl.startsWith('/')}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex justify-between gap-2">
          <p className="text-sm font-medium leading-snug text-[#EDE9E1] line-clamp-2">{item.productName}</p>
          {!compact && (
            <button
              onClick={() => removeItem(item.variantId)}
              className="text-[#6b6862] hover:text-[#EDE9E1] shrink-0 transition-colors"
              aria-label={t('remove')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-xs text-[#8C8577] mt-1">
          {item.variantColor} / {item.variantSize}
        </p>
        <div className="flex items-center justify-between mt-auto pt-3">
          <div className="flex items-center border border-[#3a3833]">
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center text-[#c7c3b8] hover:bg-[#201f1c] hover:text-[#EDE9E1] transition-colors"
              aria-label="-1"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-8 text-center text-sm text-[#EDE9E1]">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              disabled={item.quantity >= item.maxStock}
              className="w-8 h-8 flex items-center justify-center text-[#c7c3b8] hover:bg-[#201f1c] hover:text-[#EDE9E1] transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="+1"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <span className="text-sm font-semibold text-[#EDE9E1]">{formatPrice(item.price * item.quantity)}</span>
        </div>
      </div>
    </div>
  )
}
