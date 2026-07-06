'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { OrderSummary } from '@/components/checkout/order-summary'
import { useCartStore } from '@/lib/store/cart'
import { SITE_CONFIG } from '@/lib/config'

export function CheckoutPageClient() {
  const { items, getTotal } = useCartStore()
  const router = useRouter()
  const subtotal = getTotal()
  const shippingCost = subtotal >= SITE_CONFIG.shipping.freeShippingThreshold
    ? 0
    : SITE_CONFIG.shipping.standardShippingCost
  const t = useTranslations('checkout')

  useEffect(() => {
    if (items.length === 0) router.push('/cart')
  }, [items.length])

  if (items.length === 0) return null

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 flex-1">
      <div className="mb-6">
        <Link href="/cart" className="text-xs text-gray-400 hover:text-black underline-offset-4 underline">
          {t('backToCart')}
        </Link>
        <h1 className="text-2xl font-light tracking-wider mt-3">{t('title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
        <CheckoutForm items={items} subtotal={subtotal} shippingCost={shippingCost} />

        <div className="lg:sticky lg:top-20 h-fit border border-gray-200 p-6">
          <OrderSummary items={items} subtotal={subtotal} shippingCost={shippingCost} />
        </div>
      </div>
    </main>
  )
}
