'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { MessageCircle, Building2, CreditCard, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { CartItem } from '@/lib/store/cart'
import { createOrder, createStripeCheckoutSession } from '@/lib/actions/orders'
import { SITE_CONFIG } from '@/lib/config'
import { formatPrice } from '@/lib/utils'
import type { CheckoutFormData } from '@/lib/types'
import { stashOrderForPixel } from '@/lib/analytics/order-tracking'
import { TrustBadges } from '@/components/trust/trust-badges'
import { PaymentLogos } from '@/components/trust/payment-logos'
import { KayaCta } from '@/components/layout/kaya-cta'

// Dark checkout styling (page is wrapped in `dark kaya-dark`, which themes Input/Label/Checkbox).
const GOLD = SITE_CONFIG.brand.darkAccent
const grotesk = { fontFamily: 'var(--font-grotesk, var(--font-sans))' }
const sectionHeading = 'text-xs font-semibold uppercase tracking-[0.22em] text-[#EDE9E1]'
const optionActive = 'border-[#D9B679] bg-[#1A1917]'
const optionIdle = 'border-[#2B2924] hover:border-[#3a3833]'

interface CheckoutFormProps {
  items: CartItem[]
  subtotal: number
  shippingCost: number
}

export function CheckoutForm({ items, subtotal, shippingCost }: CheckoutFormProps) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('checkout')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [billingSame, setBillingSame] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<'whatsapp' | 'bank_transfer' | 'stripe'>('whatsapp')

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
          t('whatsappMessage'),
          `${t('waOrder')}: ${result.orderNumber}`,
          ...items.map((i) => `- ${i.productName} (${i.variantColor} / ${i.variantSize}) × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`),
          `${t('waTotal')}: ${formatPrice(subtotal + shippingCost)}`,
          `${t('waName')}: ${data.name}`,
          `Email: ${data.email}`,
        ].join('\n')
      )

      trackPurchase(result.orderNumber)
      window.open(`https://wa.me/${SITE_CONFIG.contact.whatsapp}?text=${message}`, '_blank')
      router.push(`/checkout/success?order=${result.orderNumber}`)
      return
    }

    if (paymentMethod === 'stripe') {
      const result = await createOrder(data, items)
      if (result.error || !result.orderId) { setError(result.error ?? t('errorCreateOrder')); setLoading(false); return }

      const session = await createStripeCheckoutSession(result.orderId, items, locale)
      if (session.error || !session.url) { setError(session.error ?? t('errorStartPayment')); setLoading(false); return }

      window.location.href = session.url
      return
    }

    const result = await createOrder(data, items)
    if (result.error) { setError(result.error); setLoading(false); return }

    trackPurchase(result.orderNumber)
    router.push(`/checkout/success?order=${result.orderNumber}`)
  }

  /** Hand the order to the Meta Purchase event on the success page (see order-tracking.ts). */
  function trackPurchase(orderNumber: string | undefined) {
    if (!orderNumber) return
    stashOrderForPixel({
      orderNumber,
      value: subtotal + shippingCost,
      currency: SITE_CONFIG.brand.currency,
      numItems: items.reduce((sum, i) => sum + i.quantity, 0),
      contents: items.map((i) => ({ id: i.productId, quantity: i.quantity, item_price: i.price })),
      paymentMethod,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contact */}
      <section className="space-y-4">
        <h2 className={sectionHeading} style={grotesk}>{t('contact')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t('email')} *</Label>
            <Input id="email" name="email" type="email" required placeholder={t('emailPlaceholder')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t('phone')}</Label>
            <Input id="phone" name="phone" type="tel" placeholder="+39 000 000 0000" />
          </div>
        </div>
      </section>

      {/* Shipping */}
      <section className="space-y-4">
        <h2 className={sectionHeading} style={grotesk}>{t('shippingAddress')}</h2>
        <div className="space-y-1.5">
          <Label htmlFor="name">{t('fullName')} *</Label>
          <Input id="name" name="name" required placeholder={t('fullNamePlaceholder')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address_line1">{t('address')} *</Label>
          <Input id="address_line1" name="address_line1" required placeholder="Via Roma 1" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address_line2">{t('address2')}</Label>
          <Input id="address_line2" name="address_line2" placeholder={t('address2Placeholder')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="city">{t('city')} *</Label>
            <Input id="city" name="city" required placeholder="Milano" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postal_code">{t('postalCode')} *</Label>
            <Input id="postal_code" name="postal_code" required placeholder="20100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="state">{t('province')}</Label>
            <Input id="state" name="state" placeholder="MI" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country">{t('country')}</Label>
            {/* Italy only (SITE_CONFIG.shipping.countries) — shown read-only, submitted as the ISO code. */}
            <Input id="country" value={t('countryItaly')} readOnly aria-describedby="country-note" />
            <input type="hidden" name="country" value="IT" />
          </div>
        </div>
        <p id="country-note" className="text-xs text-muted-foreground">{t('italyOnlyNote')}</p>
      </section>

      {/* Billing */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="billing_same"
            checked={billingSame}
            onCheckedChange={(v) => setBillingSame(v === true)}
          />
          <Label htmlFor="billing_same" className="cursor-pointer">{t('sameAsShipping')}</Label>
        </div>

        {!billingSame && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="billing_address_line1">{t('billingAddress')} *</Label>
              <Input id="billing_address_line1" name="billing_address_line1" required={!billingSame} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="billing_city">{t('city')} *</Label>
                <Input id="billing_city" name="billing_city" required={!billingSame} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billing_postal_code">{t('postalCode')} *</Label>
                <Input id="billing_postal_code" name="billing_postal_code" required={!billingSame} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="billing_country">{t('country')}</Label>
              <Input id="billing_country" name="billing_country" defaultValue="IT" />
            </div>
          </div>
        )}
      </section>

      {/* Payment */}
      <section className="space-y-4">
        <h2 className={sectionHeading} style={grotesk}>{t('paymentMethod')}</h2>
        <div className="space-y-3">
          {SITE_CONFIG.checkout.enableWhatsAppOrder && (
            <label
              className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${
                paymentMethod === 'whatsapp' ? optionActive : optionIdle
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="whatsapp"
                checked={paymentMethod === 'whatsapp'}
                onChange={() => setPaymentMethod('whatsapp')}
                className="mt-0.5 accent-[#D9B679]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" style={{ color: GOLD }} />
                  <span className="text-sm font-medium text-[#EDE9E1]">{t('whatsappTitle')}</span>
                </div>
                <p className="text-xs text-[#8C8577] mt-1">{t('whatsappDescription')}</p>
              </div>
            </label>
          )}
          {SITE_CONFIG.checkout.enableBankTransfer && (
            <label
              className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${
                paymentMethod === 'bank_transfer' ? optionActive : optionIdle
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="bank_transfer"
                checked={paymentMethod === 'bank_transfer'}
                onChange={() => setPaymentMethod('bank_transfer')}
                className="mt-0.5 accent-[#D9B679]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" style={{ color: GOLD }} />
                  <span className="text-sm font-medium text-[#EDE9E1]">{t('bankTransferOption')}</span>
                </div>
                <p className="text-xs text-[#8C8577] mt-1">{t('bankTransferDescription')}</p>
              </div>
            </label>
          )}
          {SITE_CONFIG.checkout.enableStripe && (
            <label
              className={`flex items-start gap-3 p-4 border cursor-pointer transition-all ${
                paymentMethod === 'stripe' ? optionActive : optionIdle
              }`}
            >
              <input
                type="radio"
                name="payment"
                value="stripe"
                checked={paymentMethod === 'stripe'}
                onChange={() => setPaymentMethod('stripe')}
                className="mt-0.5 accent-[#D9B679]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" style={{ color: GOLD }} />
                  <span className="text-sm font-medium text-[#EDE9E1]">{t('stripeTitle')}</span>
                </div>
                <p className="text-xs text-[#8C8577] mt-1">{t('stripeDescription')}</p>
                <PaymentLogos className="mt-2" />
              </div>
            </label>
          )}
        </div>
      </section>

      {error && <p className="text-sm text-[#f0a39a] bg-[#3a1d1a] px-4 py-3 border border-[#6b2f28]">{error}</p>}

      <KayaCta type="submit" disabled={loading} className="w-full" icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
        {loading
          ? paymentMethod === 'stripe' ? t('redirectingToPayment') : t('placingOrder')
          : t('placeOrder')}
      </KayaCta>

      <TrustBadges variant="dark" />
    </form>
  )
}
