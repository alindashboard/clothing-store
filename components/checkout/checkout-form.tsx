'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { MessageCircle, Building2, Loader2, Lock } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useCartStore, type CartItem } from '@/lib/store/cart'
import { createOrder, createStripeCheckoutSession } from '@/lib/actions/orders'
import { SITE_CONFIG } from '@/lib/config'
import { formatPrice } from '@/lib/utils'
import type { CheckoutFormData } from '@/lib/types'
import { stashOrderForPixel } from '@/lib/analytics/order-tracking'
import { TrustBadges } from '@/components/trust/trust-badges'
import { PaymentLogos } from '@/components/trust/payment-logos'
import { KayaCta } from '@/components/layout/kaya-cta'
import { ITALIAN_PROVINCES } from '@/lib/italy/provinces'
import type { CheckoutField } from '@/lib/orders/validate-checkout'

// Dark checkout styling (page is wrapped in `dark kaya-dark`, which themes Input/Label/Checkbox).
const GOLD = SITE_CONFIG.brand.darkAccent
const grotesk = { fontFamily: 'var(--font-grotesk, var(--font-sans))' }
const sectionHeading = 'text-xs font-semibold uppercase tracking-[0.22em] text-[#EDE9E1]'

type PaymentMethod = 'stripe' | 'bank_transfer' | 'whatsapp'

// Same look as <Input>; a native select keeps the OS picker on phones.
const selectClass =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm dark:bg-input/30 invalid:text-muted-foreground'

/** Province as a closed list: FatturaPA rejects anything that isn't a valid sigla. */
function ProvinceSelect({ id, invalid, placeholder }: { id: string; invalid: boolean; placeholder: string }) {
  return (
    <select id={id} name={id} required defaultValue="" aria-invalid={invalid || undefined} className={selectClass}>
      <option value="" disabled>{placeholder}</option>
      {ITALIAN_PROVINCES.map(([code, name]) => (
        <option key={code} value={code}>{code} — {name}</option>
      ))}
    </select>
  )
}

/** Italian CAP: exactly five digits; numeric keypad on phones. */
const capProps = { inputMode: 'numeric' as const, pattern: '\\d{5}', maxLength: 5, autoComplete: 'postal-code' }

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
  const [invalidFields, setInvalidFields] = useState<CheckoutField[]>([])
  const bad = (field: CheckoutField) => invalidFields.includes(field) || undefined
  const { enableStripe, enableBankTransfer, enableWhatsAppOrder } = SITE_CONFIG.checkout
  // Card first: it's the only method that confirms payment instantly.
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    enableStripe ? 'stripe' : enableBankTransfer ? 'bank_transfer' : 'whatsapp'
  )
  const total = formatPrice(subtotal + shippingCost)
  const muted = { color: '#8C8577' }
  const paymentOptions: Array<{ id: PaymentMethod; title: string; description: string; aside: React.ReactNode }> = [
    ...(enableStripe
      ? [{ id: 'stripe' as const, title: t('stripeTitle'), description: t('stripeDescription'), aside: <PaymentLogos variant="dark" className="shrink-0 flex-nowrap" /> }]
      : []),
    ...(enableBankTransfer
      ? [{ id: 'bank_transfer' as const, title: t('bankTransferOption'), description: t('bankTransferDescription'), aside: <Building2 className="w-4 h-4" style={muted} aria-hidden="true" /> }]
      : []),
    ...(enableWhatsAppOrder
      ? [{ id: 'whatsapp' as const, title: t('whatsappTitle'), description: t('whatsappDescription'), aside: <MessageCircle className="w-4 h-4" style={muted} aria-hidden="true" /> }]
      : []),
  ]
  // The button says what happens next, with the amount — not a generic "confirm".
  const submitLabel =
    paymentMethod === 'stripe' ? t('payNow', { amount: total })
    : paymentMethod === 'whatsapp' ? t('sendOnWhatsapp')
    : t('placeOrderTotal', { amount: total })
  const submitIcon = paymentMethod === 'stripe' ? <Lock className="w-3.5 h-3.5" aria-hidden="true" /> : undefined
  const syncCart = useCartStore((s) => s.syncCart)

  /** Shows createOrder's error; on a stale cart, resyncs prices/stock first. Returns true if it failed. */
  function orderFailed(result: Awaited<ReturnType<typeof createOrder>>): boolean {
    if (!result.error) return false
    if (result.cartUpdates) {
      syncCart(result.cartUpdates)
      setError(t('cartChanged'))
    } else if (result.invalidFields) {
      setInvalidFields(result.invalidFields)
      setError(t('invalidForm'))
    } else {
      setError(result.error)
    }
    setLoading(false)
    return true
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInvalidFields([])

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
      billing_country: 'IT',
      payment_method: paymentMethod,
    }

    if (paymentMethod === 'whatsapp') {
      // Save order first, then redirect to WhatsApp
      const result = await createOrder(data, items)
      if (orderFailed(result)) return

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
      if (orderFailed(result)) return
      if (!result.orderId) { setError(t('errorCreateOrder')); setLoading(false); return }

      const session = await createStripeCheckoutSession(result.orderId, locale)
      if (session.error || !session.url) { setError(session.error ?? t('errorStartPayment')); setLoading(false); return }

      window.location.href = session.url
      return
    }

    const result = await createOrder(data, items)
    if (orderFailed(result)) return

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
            <Input id="email" name="email" type="email" required autoComplete="email" maxLength={254} aria-invalid={bad('email')} placeholder={t('emailPlaceholder')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t('phone')}</Label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" pattern="\+?[0-9 \(\)\.\-]{6,20}" aria-invalid={bad('phone')} placeholder="+39 000 000 0000" />
          </div>
        </div>
      </section>

      {/* Shipping */}
      <section className="space-y-4">
        <h2 className={sectionHeading} style={grotesk}>{t('shippingAddress')}</h2>
        <div className="space-y-1.5">
          <Label htmlFor="name">{t('fullName')} *</Label>
          <Input id="name" name="name" required minLength={2} maxLength={120} autoComplete="name" aria-invalid={bad('name')} placeholder={t('fullNamePlaceholder')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address_line1">{t('address')} *</Label>
          <Input id="address_line1" name="address_line1" required minLength={3} maxLength={200} autoComplete="address-line1" aria-invalid={bad('address_line1')} placeholder="Via Roma 1" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address_line2">{t('address2')}</Label>
          <Input id="address_line2" name="address_line2" maxLength={200} autoComplete="address-line2" aria-invalid={bad('address_line2')} placeholder={t('address2Placeholder')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="city">{t('city')} *</Label>
            <Input id="city" name="city" required minLength={2} maxLength={80} autoComplete="address-level2" aria-invalid={bad('city')} placeholder="Milano" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postal_code">{t('postalCode')} *</Label>
            <Input id="postal_code" name="postal_code" required {...capProps} title={t('postalCodeHint')} aria-invalid={bad('postal_code')} placeholder="20100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="state">{t('province')} *</Label>
            <ProvinceSelect id="state" invalid={!!bad('state')} placeholder={t('selectProvince')} />
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
              <Input id="billing_address_line1" name="billing_address_line1" required minLength={3} maxLength={200} autoComplete="billing address-line1" aria-invalid={bad('billing_address_line1')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="billing_address_line2">{t('address2')}</Label>
              <Input id="billing_address_line2" name="billing_address_line2" maxLength={200} autoComplete="billing address-line2" aria-invalid={bad('billing_address_line2')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="billing_city">{t('city')} *</Label>
                <Input id="billing_city" name="billing_city" required minLength={2} maxLength={80} autoComplete="billing address-level2" aria-invalid={bad('billing_city')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billing_postal_code">{t('postalCode')} *</Label>
                <Input id="billing_postal_code" name="billing_postal_code" required {...capProps} autoComplete="billing postal-code" title={t('postalCodeHint')} aria-invalid={bad('billing_postal_code')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="billing_state">{t('province')} *</Label>
                <ProvinceSelect id="billing_state" invalid={!!bad('billing_state')} placeholder={t('selectProvince')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="billing_country_display">{t('country')}</Label>
                <Input id="billing_country_display" value={t('countryItaly')} readOnly />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Payment — one grouped list, card first and pre-selected; only the chosen
          option shows its description, so the section reads as a single choice. */}
      <section className="space-y-4">
        <h2 className={sectionHeading} style={grotesk}>{t('paymentMethod')}</h2>
        <div role="radiogroup" aria-label={t('paymentMethod')} className="border border-[#2B2924] divide-y divide-[#2B2924]">
          {paymentOptions.map((option) => {
            const active = paymentMethod === option.id
            return (
              <label
                key={option.id}
                className={`relative flex gap-4 px-5 py-[18px] cursor-pointer transition-colors ${
                  active ? 'bg-[#1A1917]' : 'hover:bg-[#171614]'
                }`}
              >
                {active && <span className="absolute inset-y-0 left-0 w-[2px]" style={{ background: GOLD }} aria-hidden="true" />}
                <input
                  type="radio"
                  name="payment"
                  value={option.id}
                  checked={active}
                  onChange={() => setPaymentMethod(option.id)}
                  className="peer sr-only"
                />
                <span
                  className="mt-0.5 w-[18px] h-[18px] shrink-0 rounded-full border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#D9B679]/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#141412]"
                  style={{ borderColor: active ? GOLD : '#4a4741' }}
                  aria-hidden="true"
                >
                  {active && <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
                </span>
                <span className="flex-1 min-w-0">
                  {/* Wraps as a whole: on narrow screens the logo row drops under the title. */}
                  <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <span className={`text-sm font-medium transition-colors ${active ? 'text-[#EDE9E1]' : 'text-[#c7c3b8]'}`}>
                      {option.title}
                    </span>
                    {option.aside}
                  </span>
                  {active && <span className="block text-xs leading-relaxed text-[#8C8577] mt-1.5 pr-2">{option.description}</span>}
                </span>
              </label>
            )
          })}
        </div>
      </section>

      {error && <p className="text-sm text-[#f0a39a] bg-[#3a1d1a] px-4 py-3 border border-[#6b2f28]">{error}</p>}

      <div className="space-y-3">
        <KayaCta type="submit" disabled={loading} className="w-full" icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : submitIcon}>
          {loading
            ? paymentMethod === 'stripe' ? t('redirectingToPayment') : t('placingOrder')
            : submitLabel}
        </KayaCta>
        {paymentMethod === 'stripe' && (
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#6b6862]">
            <Lock className="w-3 h-3" aria-hidden="true" />
            {t('stripeSecureNote')}
          </p>
        )}
      </div>

      <TrustBadges variant="dark" />
    </form>
  )
}
