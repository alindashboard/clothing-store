import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { SITE_CONFIG } from '@/lib/config'
import type { Order, OrderItem } from '@/lib/types'
import { stripe } from '@/lib/stripe'
import { formatPrice } from '@/lib/utils'
import {
  sendOrderConfirmation,
  sendNewOrderNotification,
  type OrderEmailData,
} from '@/lib/email/send'

// Deliberately NOT a 'use server' module: markStripeOrderPaid must only be
// reachable from the signature-verified Stripe webhook, never as a public
// Server Action (anyone could otherwise mark an unpaid order as paid).

export interface OrderEmailItemInput {
  productName: string
  variantSize: string
  variantColor: string
  quantity: number
  price: number
}

export function buildOrderEmailData(order: Order, items: OrderEmailItemInput[]): OrderEmailData {
  return {
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone,
    paymentMethod: order.payment_method,
    locale: 'it',
    items: items.map((item) => ({
      name: item.productName,
      size: item.variantSize,
      color: item.variantColor,
      quantity: item.quantity,
      price: item.price,
    })),
    subtotal: order.subtotal,
    shippingCost: order.shipping_cost,
    total: order.total,
    currency: order.currency,
    shippingAddress: {
      line1: order.shipping_address_line1,
      line2: order.shipping_address_line2,
      city: order.shipping_city,
      state: order.shipping_state,
      postalCode: order.shipping_postal_code,
      country: order.shipping_country,
    },
    shippingMethod: `Standard · ${SITE_CONFIG.shipping.estimatedDays.standard} giorni lavorativi`,
  }
}

/**
 * Marks an order paid from the Stripe webhook once `checkout.session.completed`
 * fires, and sends the confirmation/notification emails that createOrder held
 * back for stripe orders. Idempotent — Stripe retries webhooks, and re-delivery
 * of an already-paid session must not re-send the emails.
 *
 * Looked up by orderId (from the session's client_reference_id), not by
 * payment_intent_id — that column gets overwritten below from the session id
 * to the real PaymentIntent id, so a retried delivery of the same event would
 * no longer match if we looked it up by that column instead.
 */
export async function markStripeOrderPaid(orderId: string, paymentIntentId: string | null) {
  const supabase = createSupabaseAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', orderId)
    .single()

  if (error || !order) {
    console.error('[stripe webhook] no order found for id', orderId, error?.message)
    return { error: 'Order not found' }
  }

  if (order.payment_status === 'paid') {
    return { success: true, alreadyProcessed: true }
  }

  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_status: 'paid',
      payment_intent_id: paymentIntentId ?? order.payment_intent_id,
    })
    .eq('id', order.id)
  if (updateError) return { error: updateError.message }

  const { error: historyError } = await supabase
    .from('order_status_history')
    .insert({ order_id: order.id, status: 'paid' })
  if (historyError) console.error('[order_status_history] insert failed:', historyError.message)

  const items: OrderEmailItemInput[] = (order.items ?? []).map((item: OrderItem) => ({
    productName: item.product_name,
    variantSize: item.variant_size,
    variantColor: item.variant_color,
    quantity: item.quantity,
    price: item.unit_price,
  }))

  const emailData = buildOrderEmailData(order, items)
  await Promise.allSettled([
    sendOrderConfirmation(emailData),
    sendNewOrderNotification(emailData),
  ])

  revalidatePath('/admin/orders')
  return { success: true }
}

/**
 * Mirrors a refund issued in the Stripe Dashboard (webhook `charge.refunded`).
 * Full refund → order + payment status `refunded` (+ a timeline row), which also
 * drops it from admin sales stats. Partial refund → a dated line in the order
 * notes, status unchanged. Stock is NOT restored: a refund doesn't mean the piece
 * came back — restock by hand when it does. Idempotent for Stripe's retries.
 */
export async function markStripeOrderRefunded(
  paymentIntentId: string,
  amountRefunded: number,
  amountCaptured: number,
  currency: string
) {
  const supabase = createSupabaseAdminClient()

  let { data: order } = await supabase
    .from('orders')
    .select('id, status, payment_status, notes')
    .eq('payment_intent_id', paymentIntentId)
    .maybeSingle()

  // Fallback: an order paid while the webhook couldn't read the PaymentIntent
  // still stores the Checkout Session id — ask Stripe which session owns it.
  if (!order) {
    const sessions = await stripe.checkout.sessions.list({ payment_intent: paymentIntentId, limit: 1 })
    const orderId = sessions.data[0]?.client_reference_id
    if (orderId) {
      ;({ data: order } = await supabase
        .from('orders')
        .select('id, status, payment_status, notes')
        .eq('id', orderId)
        .maybeSingle())
    }
  }
  if (!order) {
    console.error('[stripe webhook] refund: no order for payment intent', paymentIntentId)
    return { error: 'Order not found' }
  }

  const refunded = formatPrice(amountRefunded / 100, currency.toUpperCase())
  const today = new Date().toISOString().slice(0, 10)

  if (amountRefunded < amountCaptured) {
    const line = `Stripe: rimborso parziale, totale rimborsato ${refunded}`
    if (order.notes?.includes(line)) return { success: true, alreadyProcessed: true }
    const notes = [order.notes, `[${today}] ${line}`].filter(Boolean).join('\n')
    const { error } = await supabase.from('orders').update({ notes }).eq('id', order.id)
    if (error) return { error: error.message }
    revalidatePath('/admin/orders')
    return { success: true }
  }

  if (order.payment_status === 'refunded') return { success: true, alreadyProcessed: true }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'refunded', payment_status: 'refunded' })
    .eq('id', order.id)
  if (error) return { error: error.message }

  if (order.status !== 'refunded') {
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({ order_id: order.id, status: 'refunded' })
    if (historyError) console.error('[order_status_history] insert failed:', historyError.message)
  }

  revalidatePath('/admin/orders')
  return { success: true }
}
