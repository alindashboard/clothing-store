import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase'
import { SITE_CONFIG } from '@/lib/config'
import type { Order, OrderItem } from '@/lib/types'
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
