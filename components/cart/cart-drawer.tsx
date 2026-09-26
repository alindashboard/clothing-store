'use client'

import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCartStore } from '@/lib/store/cart'
import { CartItemRow } from './cart-item'
import { CartSummary } from './cart-summary'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { KayaCta } from '@/components/layout/kaya-cta'

export function CartDrawer() {
  const { items, isOpen, closeCart, getTotal, getItemCount } = useCartStore()
  const total = getTotal()
  const count = getItemCount()
  const t = useTranslations('cart')
  const tCommon = useTranslations('common')

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && closeCart()}>
      <SheetContent
        side="right"
        className="dark kaya-dark flex flex-col w-full sm:max-w-md p-0 border-l border-[#2B2924]"
        showCloseButton={false}
      >
        <SheetHeader className="px-5 py-4 border-b border-[#2B2924] flex flex-row items-center justify-between">
          <SheetTitle
            className="text-xs font-semibold tracking-[0.22em] uppercase text-[#EDE9E1]"
            style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {t('title')} {count > 0 && <span className="text-[#8C8577] font-normal">({count})</span>}
          </SheetTitle>
          <button onClick={closeCart} className="p-1 text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors" aria-label={tCommon('close')}>
            <X className="w-5 h-5" />
          </button>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-5">
            <p className="text-[#8C8577] text-sm">{t('empty')}</p>
            <KayaCta href="/products" onClick={closeCart} variant="outline">
              {t('continueShopping')}
            </KayaCta>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </div>

            <div className="px-5 py-5 border-t border-[#2B2924] space-y-4">
              <CartSummary subtotal={total} showShippingBar />

              <div className="flex flex-col gap-2.5">
                <KayaCta href="/checkout" onClick={closeCart}>
                  {t('checkout')}
                </KayaCta>
                <Link
                  href="/cart"
                  prefetch={false}
                  onClick={closeCart}
                  className="py-2 text-center text-xs tracking-[0.18em] uppercase text-[#c7c3b8] hover:text-[#EDE9E1] underline-offset-4 hover:underline transition-colors"
                  style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
                >
                  {t('viewCart')}
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
