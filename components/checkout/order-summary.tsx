'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { formatPrice } from '@/lib/utils'
import type { CartItem } from '@/lib/store/cart'

interface OrderSummaryProps {
  items: CartItem[]
  subtotal: number
  shippingCost: number
}

export function OrderSummary({ items, subtotal, shippingCost }: OrderSummaryProps) {
  const t = useTranslations('cart')
  const tCommon = useTranslations('common')

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">{t('orderSummary')}</h2>

      <div className="divide-y divide-gray-100">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-3 py-3">
            <div className="relative w-14 h-18 shrink-0 bg-gray-100">
              <Image
                src={item.imageUrl}
                alt={item.productName}
                fill
                sizes="56px"
                className="object-cover"
                unoptimized={item.imageUrl.startsWith('/')}
              />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.productName}</p>
              <p className="text-xs text-gray-500">{item.variantColor} / {item.variantSize}</p>
              <p className="text-sm font-semibold mt-1">{formatPrice(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-2 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t('subtotal')}</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t('shipping')}</span>
          <span>{shippingCost === 0 ? tCommon('free') : formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200">
          <span>{t('total')}</span>
          <span>{formatPrice(subtotal + shippingCost)}</span>
        </div>
        <p className="text-xs text-gray-400">{t('taxesIncluded')}</p>
      </div>
    </div>
  )
}
