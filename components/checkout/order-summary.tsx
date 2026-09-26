'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { formatPrice } from '@/lib/utils'
import { SITE_CONFIG } from '@/lib/config'
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
      <h2
        className="text-xs font-semibold uppercase tracking-[0.22em] text-[#EDE9E1]"
        style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
      >
        {t('orderSummary')}
      </h2>

      <div className="divide-y divide-[#2B2924]">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-3 py-3">
            <div className="relative w-14 h-[72px] shrink-0 bg-[#141412]">
              <Image
                src={item.imageUrl}
                alt={item.productName}
                fill
                sizes="56px"
                className="object-cover"
                unoptimized={item.imageUrl.startsWith('/')}
              />
              <span
                className="absolute -top-1.5 -right-1.5 w-5 h-5 text-[10px] rounded-full flex items-center justify-center font-bold text-[#141412]"
                style={{ background: SITE_CONFIG.brand.darkAccent }}
              >
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-[#EDE9E1]">{item.productName}</p>
              <p className="text-xs text-[#8C8577]">{item.variantColor} / {item.variantSize}</p>
              <p className="text-sm font-semibold mt-1 text-[#EDE9E1]">{formatPrice(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-3 border-t border-[#2B2924]">
        <div className="flex justify-between text-sm">
          <span className="text-[#8C8577]">{t('subtotal')}</span>
          <span className="text-[#EDE9E1]">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#8C8577]">{t('shipping')}</span>
          <span className="text-[#EDE9E1]">{shippingCost === 0 ? tCommon('free') : formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base pt-3 border-t border-[#2B2924] text-[#EDE9E1]">
          <span>{t('total')}</span>
          <span>{formatPrice(subtotal + shippingCost)}</span>
        </div>
        <p className="text-xs text-[#6b6862]">{t('taxesIncluded')}</p>
      </div>
    </div>
  )
}
