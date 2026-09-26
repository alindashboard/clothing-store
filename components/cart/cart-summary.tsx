'use client'

import { useTranslations } from 'next-intl'
import { formatPrice } from '@/lib/utils'
import { SITE_CONFIG } from '@/lib/config'

interface CartSummaryProps {
  subtotal: number
  shippingCost?: number
  showShippingBar?: boolean
}

export function CartSummary({ subtotal, shippingCost, showShippingBar }: CartSummaryProps) {
  const { freeShippingThreshold, standardShippingCost } = SITE_CONFIG.shipping
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - subtotal)
  const progress = Math.min(100, (subtotal / freeShippingThreshold) * 100)
  const shipping = shippingCost ?? (subtotal >= freeShippingThreshold ? 0 : standardShippingCost)
  const t = useTranslations('cart')
  const tCommon = useTranslations('common')

  return (
    <div className="space-y-4">
      {showShippingBar && (
        <div className="text-xs space-y-2">
          {freeShippingRemaining > 0 ? (
            <p className="text-[#c7c3b8]">{t('addMore', { amount: formatPrice(freeShippingRemaining) })}</p>
          ) : (
            <p className="font-medium" style={{ color: SITE_CONFIG.brand.darkAccent }}>{t('freeShippingEarned')}</p>
          )}
          <div className="h-[3px] bg-[#2B2924] overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, background: SITE_CONFIG.brand.darkAccent }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#8C8577]">{t('subtotal')}</span>
          <span className="text-[#EDE9E1]">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8C8577]">{t('shipping')}</span>
          <span className="text-[#EDE9E1]">{shipping === 0 ? tCommon('free') : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base pt-3 border-t border-[#2B2924] text-[#EDE9E1]">
          <span>{t('total')}</span>
          <span>{formatPrice(subtotal + shipping)}</span>
        </div>
      </div>
    </div>
  )
}
