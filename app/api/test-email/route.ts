// TEMPORARY test endpoint — remove or keep protected before production launch.
import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmation, sendNewOrderNotification } from '@/lib/email/send'
import type { OrderEmailData } from '@/lib/email/send'

const MOCK_ORDER: Omit<OrderEmailData, 'locale'> = {
  orderNumber: 'ORD-20260629-TEST',
  customerName: 'Giulia Rossi',
  customerEmail: '',
  customerPhone: '+39 333 123 4567',
  items: [
    { name: 'Blazer Structuré Noir', size: 'M', color: 'Nero', quantity: 1, price: 89.0 },
    { name: 'Pantaloni Wide Leg Ivory', size: 'S', color: 'Ivory', quantity: 2, price: 65.0 },
    { name: 'Camicia Lino Oversize', size: 'S', color: 'Sabbia', quantity: 1, price: 55.0 },
  ],
  subtotal: 274.0,
  shippingCost: 0,
  total: 274.0,
  currency: 'EUR',
  shippingAddress: {
    line1: 'Via Roma 42',
    line2: 'Interno 3',
    city: 'Milano',
    state: 'MI',
    postalCode: '20121',
    country: 'Italia',
  },
  shippingMethod: 'Standard · 3-5 giorni lavorativi',
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const key = searchParams.get('key')
  if (!key || key !== process.env.EMAIL_TEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const to = searchParams.get('to') ?? process.env.OWNER_EMAIL ?? 'orders@kayaoutlet.com'
  const locale = (searchParams.get('locale') ?? 'it') as 'it' | 'en'
  const template = searchParams.get('template') ?? 'both'

  const orderData: OrderEmailData = {
    ...MOCK_ORDER,
    customerEmail: to,
    locale,
  }

  const results: Record<string, unknown> = {}

  if (template === 'confirmation' || template === 'both') {
    results.confirmation = await sendOrderConfirmation(orderData)
  }

  if (template === 'notification' || template === 'both') {
    results.notification = await sendNewOrderNotification(orderData)
  }

  const allOk = Object.values(results).every(
    (r) => (r as { success: boolean }).success
  )

  return NextResponse.json(
    { ok: allOk, locale, to, results },
    { status: allOk ? 200 : 500 }
  )
}
