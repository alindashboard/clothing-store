'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { OrderSummary } from '@/components/checkout/order-summary'
import { useCartStore } from '@/lib/store/cart'
import type { Category } from '@/lib/types'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'
import Link from 'next/link'

export default function CheckoutPage() {
  const { items, getTotal } = useCartStore()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const subtotal = getTotal()
  const shippingCost = subtotal >= SITE_CONFIG.shipping.freeShippingThreshold
    ? 0
    : SITE_CONFIG.shipping.standardShippingCost

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (items.length === 0) router.push('/cart')
  }, [items.length])

  if (items.length === 0) return null

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="max-w-7xl mx-auto px-4 py-10 flex-1">
        <div className="mb-6">
          <Link href="/cart" className="text-xs text-gray-400 hover:text-black underline-offset-4 underline">
            ← Back to Cart
          </Link>
          <h1 className="text-2xl font-light tracking-wider mt-3">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10">
          <CheckoutForm items={items} subtotal={subtotal} shippingCost={shippingCost} />

          <div className="lg:sticky lg:top-20 h-fit border border-gray-200 p-6">
            <OrderSummary items={items} subtotal={subtotal} shippingCost={shippingCost} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
