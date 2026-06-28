'use client'

import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCartStore } from '@/lib/store/cart'
import { CartItemRow } from './cart-item'
import { CartSummary } from './cart-summary'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export function CartDrawer() {
  const { items, isOpen, closeCart, getTotal, getItemCount } = useCartStore()
  const total = getTotal()
  const count = getItemCount()
  const t = useTranslations('cart')

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && closeCart()}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0" showCloseButton={false}>
        <SheetHeader className="px-5 py-4 border-b border-gray-100 flex flex-row items-center justify-between">
          <SheetTitle className="text-base font-semibold">
            {t('title')} {count > 0 && <span className="text-gray-400 font-normal">({count})</span>}
          </SheetTitle>
          <button onClick={closeCart} className="p-1 hover:opacity-60 transition-opacity">
            <X className="w-5 h-5" />
          </button>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-5">
            <p className="text-gray-500 text-sm">{t('empty')}</p>
            <Link
              href="/products"
              onClick={closeCart}
              className="text-sm font-medium underline underline-offset-4"
            >
              {t('continueShopping')}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
            </div>

            <div className="px-5 py-5 border-t border-gray-100 space-y-4">
              <CartSummary subtotal={total} showShippingBar />

              <div className="space-y-2">
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full h-11 bg-black text-white text-sm font-semibold tracking-wider uppercase flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  {t('checkout')}
                </Link>
                <Link
                  href="/cart"
                  onClick={closeCart}
                  className="block w-full h-11 border border-gray-300 text-sm font-medium flex items-center justify-center hover:border-black transition-colors"
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
