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
    <div className="space-y-3">
      {showShippingBar && (
        <div className="text-xs text-gray-600 space-y-1.5">
          {freeShippingRemaining > 0 ? (
            <p>{t('addMore', { amount: formatPrice(freeShippingRemaining) })}</p>
          ) : (
            <p className="text-green-600 font-medium">{t('freeShippingEarned')}</p>
          )}
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">{t('subtotal')}</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">{t('shipping')}</span>
          <span>{shipping === 0 ? tCommon('free') : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base pt-2 border-t border-gray-200">
          <span>{t('total')}</span>
          <span>{formatPrice(subtotal + shipping)}</span>
        </div>
      </div>
    </div>
  )
}
