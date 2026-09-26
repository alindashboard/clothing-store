'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { CartItemRow } from '@/components/cart/cart-item'
import { CartSummary } from '@/components/cart/cart-summary'
import { DarkPageHeader } from '@/components/layout/dark-page-header'
import { KayaCta } from '@/components/layout/kaya-cta'
import { useCartStore } from '@/lib/store/cart'
import { SITE_CONFIG } from '@/lib/config'

const summaryHeading = 'text-xs font-semibold uppercase tracking-[0.22em] text-[#EDE9E1]'

export function CartPageClient() {
  const { items, getTotal, hasHydrated } = useCartStore()
  const subtotal = getTotal()
  const shippingCost = subtotal >= SITE_CONFIG.shipping.freeShippingThreshold
    ? 0
    : SITE_CONFIG.shipping.standardShippingCost
  const t = useTranslations('cart')
  const tProduct = useTranslations('product')

  return (
    <main className="dark kaya-dark flex-1 pb-20 md:pb-28">
      <DarkPageHeader title={t('yourCart')} eyebrow={SITE_CONFIG.brand.name} homeLabel={tProduct('breadcrumbHome')} />

      <div className="max-w-7xl mx-auto px-4">
        {/* Until the persisted cart rehydrates the server render (empty) is shown; gate
            the empty state on hasHydrated so a full cart doesn't flash "empty". */}
        {!hasHydrated ? null : items.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-7">
            <p className="text-[#8C8577]">{t('empty')}</p>
            <KayaCta href="/products" variant="outline">{t('continueShopping')}</KayaCta>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-14">
            <div>
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
              <div className="mt-6">
                <Link
                  href="/products"
                  prefetch={false}
                  className="text-xs text-[#8C8577] hover:text-[#EDE9E1] underline underline-offset-4 transition-colors"
                >
                  {t('backToContinue')}
                </Link>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 h-fit">
              <div className="border border-[#2B2924] bg-[#1A1917] p-6 space-y-6">
                <h2 className={summaryHeading} style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}>
                  {t('orderSummary')}
                </h2>
                <CartSummary subtotal={subtotal} shippingCost={shippingCost} showShippingBar />
                <KayaCta href="/checkout" className="w-full">{t('proceedToCheckout')}</KayaCta>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
