'use client'

import Link from 'next/link'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Footer } from '@/components/layout/footer'
import { CartItemRow } from '@/components/cart/cart-item'
import { CartSummary } from '@/components/cart/cart-summary'
import { useCartStore } from '@/lib/store/cart'
import { getCategories } from '@/lib/actions/categories'
import { Header } from '@/components/layout/header'
import { useEffect, useState } from 'react'
import type { Category } from '@/lib/types'
import { SITE_CONFIG } from '@/lib/config'

export default function CartPage() {
  const { items, getTotal } = useCartStore()
  const [categories, setCategories] = useState<Category[]>([])
  const subtotal = getTotal()
  const shippingCost = subtotal >= SITE_CONFIG.shipping.freeShippingThreshold
    ? 0
    : SITE_CONFIG.shipping.standardShippingCost

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="max-w-7xl mx-auto px-4 py-10 flex-1">
        <h1 className="text-2xl font-light tracking-wider mb-8">Your Cart</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-6">Your cart is empty.</p>
            <Link
              href="/products"
              className="text-sm font-medium border border-black px-8 py-3 hover:bg-black hover:text-white transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Items */}
            <div className="lg:col-span-2">
              {items.map((item) => (
                <CartItemRow key={item.variantId} item={item} />
              ))}
              <div className="mt-6">
                <Link href="/products" className="text-xs text-gray-400 hover:text-black underline underline-offset-4">
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-20">
              <div className="border border-gray-200 p-6 space-y-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider">Order Summary</h2>
                <CartSummary subtotal={subtotal} shippingCost={shippingCost} showShippingBar />
                <Link
                  href="/checkout"
                  className="block w-full h-11 bg-black text-white text-sm font-semibold tracking-wider uppercase flex items-center justify-center hover:bg-gray-800 transition-colors"
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
