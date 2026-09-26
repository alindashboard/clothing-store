import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { markStripeOrderPaid, markStripeOrderRefunded } from '@/lib/orders/payment'

/**
 * Stripe requires the raw, unparsed request body to verify the signature —
 * Next.js route handlers give us that via request.text() as long as we don't
 * read request.json() first.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[stripe webhook] signature verification failed:', msg)
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.client_reference_id

    if (session.payment_status === 'paid' && orderId) {
      const paymentIntentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null
      const result = await markStripeOrderPaid(orderId, paymentIntentId)
      if (result.error) {
        console.error('[stripe webhook] markStripeOrderPaid failed:', result.error)
      }
    }
  }

  // Refunds are issued from the Stripe Dashboard; mirror them on the order.
  // The Dashboard endpoint must be subscribed to `charge.refunded` too.
  if (event.type === 'charge.refunded') {
    const charge = event.data.object as Stripe.Charge
    const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
    if (paymentIntentId) {
      const result = await markStripeOrderRefunded(paymentIntentId, charge.amount_refunded, charge.amount_captured, charge.currency)
      if (result.error) console.error('[stripe webhook] markStripeOrderRefunded failed:', result.error)
    }
  }

  return NextResponse.json({ received: true })
}
