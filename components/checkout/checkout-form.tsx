'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Building2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useCartStore, type CartItem } from '@/lib/store/cart'
import { createOrder } from '@/lib/actions/orders'
import { SITE_CONFIG } from '@/lib/config'
import { formatPrice } from '@/lib/utils'
import type { CheckoutFormData } from '@/lib/types'

interface CheckoutFormProps {
  items: CartItem[]
  subtotal: number
  shippingCost: number
}

export function CheckoutForm({ items, subtotal, shippingCost }: CheckoutFormProps) {
  const router = useRouter()
  const { clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [billingSame, setBillingSame] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'bank_transfer'>('whatsapp')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value ?? ''

    const data: CheckoutFormData = {
      email: get('email'),
      phone: get('phone'),
      name: get('name'),
      address_line1: get('address_line1'),
      address_line2: get('address_line2'),
      city: get('city'),
      state: get('state'),
      postal_code: get('postal_code'),
      country: get('country') || 'IT',
      billing_same_as_shipping: billingSame,
      billing_address_line1: billingSame ? get('address_line1') : get('billing_address_line1'),
      billing_address_line2: billingSame ? get('address_line2') : get('billing_address_line2'),
      billing_city: billingSame ? get('city') : get('billing_city'),
      billing_state: billingSame ? get('state') : get('billing_state'),
      billing_postal_code: billingSame ? get('postal_code') : get('billing_postal_code'),
      billing_country: billingSame ? (get('country') || 'IT') : get('billing_country'),
      payment_method: paymentMethod,
    }

    if (paymentMethod === 'whatsapp') {
      // Save order first, then redirect to WhatsApp
      const result = await createOrder(data, items)
      if (result.error) { setError(result.error); setLoading(false); return }

      const message = encodeURIComponent(
        [
          `${SITE_CONFIG.contact.whatsappOrderMessage}`,
          `Order: ${result.orderNumber}`,
          ...items.map((i) => `- ${i.productName} (${i.variantColor} / ${i.variantSize}) × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`),
          `Total: ${formatPrice(subtotal + shippingCost)}`,
          `Name: ${data.name}`,
          `Email: ${data.email}`,
        ].join('\n')
      )

      clearCart()
      window.open(`https://wa.me/${SITE_CONFIG.contact.whatsapp}?text=${message}`, '_blank')
      router.push(`/checkout/success?order=${result.orderNumber}`)
      return
    }

    const result = await createOrder(data, items)
    if (result.error) { setError(result.error); setLoading(false); return }

    clearCart()
    router.push(`/checkout/success?order=${result.orderNumber}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contact */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Contact</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+39 000 000 0000" />
          </div>
        </div>
      </section>

      {/* Shipping */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Shipping Address</h2>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name *</Label>
          <Input id="name" name="name" required placeholder="First Last" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address_line1">Address *</Label>
          <Input id="address_line1" name="address_line1" required placeholder="Via Roma 1" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address_line2">Apartment, suite, etc.</Label>
          <Input id="address_line2" name="address_line2" placeholder="Apt 2B" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="city">City *</Label>
            <Input id="city" name="city" required placeholder="Milano" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postal_code">Postal Code *</Label>
            <Input id="postal_code" name="postal_code" required placeholder="20100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="state">Province</Label>
            <Input id="state" name="state" placeholder="MI" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" defaultValue="IT" placeholder="IT" />
          </div>
        </div>
      </section>

      {/* Billing */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="billing_same"
            checked={billingSame}
            onCheckedChange={(v) => setBillingSame(v === true)}
          />
          <Label htmlFor="billing_same" className="cursor-pointer">Billing same as shipping</Label>
        </div>

        {!billingSame && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="billing_address_line1">Billing Address *</Label>
              <Input id="billing_address_line1" name="billing_address_line1" required={!billingSame} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="billing_city">City *</Label>
                <Input id="billing_city" name="billing_city" required={!billingSame} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billing_postal_code">Postal Code *</Label>
                <Input id="billing_postal_code" name="billing_postal_code" required={!billingSame} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="billing_country">Country</Label>
              <Input id="billing_country" name="billing_country" defaultValue="IT" />
            </div>
          </div>
        )}
      </section>

      {/* Payment */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider">Payment Method</h2>
        <div className="space-y-3">
          {SITE_CONFIG.checkout.enableWhatsAppOrder && (
            <label
              className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${
                paymentMethod === 'whatsapp' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="whatsapp"
                checked={paymentMethod === 'whatsapp'}
                onChange={() => setPaymentMethod('whatsapp')}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Order via WhatsApp</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  We&apos;ll send your order details directly to WhatsApp. Payment arranged on confirmation.
                </p>
              </div>
            </label>
          )}
          {SITE_CONFIG.checkout.enableBankTransfer && (
            <label
              className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${
                paymentMethod === 'bank_transfer' ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="bank_transfer"
                checked={paymentMethod === 'bank_transfer'}
                onChange={() => setPaymentMethod('bank_transfer')}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Bank Transfer</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Transfer payment to our bank account. Order ships after payment confirmed.
                </p>
              </div>
            </label>
          )}
        </div>
      </section>

      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 border border-red-200">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 bg-black text-white font-semibold text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Placing order...' : 'Place Order'}
      </button>
    </form>
  )
}
