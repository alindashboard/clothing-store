'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { OrderSummary } from '@/components/checkout/order-summary'
import { useCartStore } from '@/lib/store/cart'
import { SITE_CONFIG } from '@/lib/config'
import { TrackInitiateCheckout } from '@/components/analytics/track-initiate-checkout'
import { DarkPageHeader } from '@/components/layout/dark-page-header'

export function CheckoutPageClient() {
  const { items, getTotal, hasHydrated } = useCartStore()
  const router = useRouter()
  const subtotal = getTotal()
  const shippingCost = subtotal >= SITE_CONFIG.shipping.freeShippingThreshold
    ? 0
    : SITE_CONFIG.shipping.standardShippingCost
  const t = useTranslations('checkout')

  // Wait for the persisted cart to rehydrate (see Header) before deciding the
  // cart is empty — otherwise a direct load of /checkout (refresh, or Stripe's
  // cancel_url) bounces a full cart to /cart.
  useEffect(() => {
    if (hasHydrated && items.length === 0) router.push('/cart')
  }, [hasHydrated, items.length])

  if (!hasHydrated || items.length === 0) return null

  return (
    <main className="dark kaya-dark flex-1 pb-20 md:pb-28">
      <TrackInitiateCheckout
        items={items}
        value={subtotal + shippingCost}
        currency={SITE_CONFIG.brand.currency}
      />
      <DarkPageHeader title={t('title')} eyebrow={SITE_CONFIG.brand.name}>
        <Link
          href="/cart"
          prefetch={false}
          className="text-xs text-[#8C8577] hover:text-[#EDE9E1] underline-offset-4 underline transition-colors"
        >
          {t('backToCart')}
        </Link>
      </DarkPageHeader>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-14">
        {/* Summary first on mobile so the total is visible before the long form. */}
        <div className="order-first lg:order-last lg:sticky lg:top-24 h-fit border border-[#2B2924] bg-[#1A1917] p-6">
          <OrderSummary items={items} subtotal={subtotal} shippingCost={shippingCost} />
        </div>
        <CheckoutForm items={items} subtotal={subtotal} shippingCost={shippingCost} />
      </div>
    </main>
  )
}
