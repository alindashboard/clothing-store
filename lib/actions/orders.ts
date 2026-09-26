'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'
import type { Order, OrderItem, CheckoutFormData } from '@/lib/types'
import type { CartItem } from '@/lib/store/cart'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { SITE_CONFIG } from '@/lib/config'
import { stripe } from '@/lib/stripe'
import {
  sendOrderConfirmation,
  sendNewOrderNotification,
  sendShippingConfirmation,
  type OrderEmailData,
} from '@/lib/email/send'
import { buildOrderEmailData, type OrderEmailItemInput } from '@/lib/orders/payment'
import { VISITOR_COOKIE, parseVisitorId } from '@/lib/analytics/visitor-cookie'
import { requireAdmin } from '@/lib/auth/require-admin'
import { priceCart, type CartUpdates } from '@/lib/orders/cart-pricing'

export async function getOrdersAdmin(options?: {
  status?: string
  search?: string
  limit?: number
}): Promise<Order[]> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })

  if (options?.status) query = query.eq('status', options.status)
  if (options?.limit) query = query.limit(options.limit)
  if (options?.search) {
    query = query.or(
      `order_number.ilike.%${options.search}%,customer_email.ilike.%${options.search}%,customer_name.ilike.%${options.search}%`
    )
  }

  const { data, error } = await query
  if (error) { console.error(error); return [] }
  return data ?? []
}

/** Public lookup for the checkout success page — only the fields it needs to render. */
export async function getOrderByNumber(
  orderNumber: string
): Promise<
  | (Pick<Order, 'order_number' | 'payment_method' | 'payment_status' | 'total' | 'currency'> & {
      items: Pick<OrderItem, 'product_id' | 'quantity' | 'unit_price'>[]
    })
  | null
> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select('order_number, payment_method, payment_status, total, currency, items:order_items(product_id, quantity, unit_price)')
    .eq('order_number', orderNumber)
    .single()

  if (error) return null
  return data
}

export async function getOrderAdmin(id: string): Promise<Order | null> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function updateOrderStatus(id: string, status: string) {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()

  const { data: existing } = await supabase
    .from('orders')
    .select('status, order_number, customer_name, customer_email, tracking_number, tracking_url')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) return { error: error.message }

  // Only on an actual transition — re-saving the same status must not log a
  // duplicate history entry or (for 'shipped') re-send the email.
  if (existing && existing.status !== status) {
    const { error: historyError } = await supabase
      .from('order_status_history')
      .insert({ order_id: id, status })
    if (historyError) console.error('[order_status_history] insert failed:', historyError.message)

    if (status === 'shipped') {
      await sendShippingConfirmation({
        orderNumber: existing.order_number,
        customerName: existing.customer_name,
        customerEmail: existing.customer_email,
        trackingNumber: existing.tracking_number,
        trackingUrl: existing.tracking_url,
        locale: 'it',
      })
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
  return { success: true }
}

/**
 * Deletes an order and restores the stock its items had reserved — the
 * undo for a test order or a cancelled/fraudulent one that never shipped.
 * Does NOT touch stock for items whose variant was since deleted.
 */
export async function deleteOrder(id: string) {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()

  const { data: items } = await supabase
    .from('order_items')
    .select('variant_id, quantity')
    .eq('order_id', id)

  for (const item of items ?? []) {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', item.variant_id)
      .single()
    if (variant) {
      await supabase
        .from('product_variants')
        .update({ stock_quantity: variant.stock_quantity + item.quantity })
        .eq('id', item.variant_id)
    }
  }

  // Explicit, rather than relying on an FK cascade that may or may not be there.
  await supabase.from('order_status_history').delete().eq('order_id', id)
  await supabase.from('order_items').delete().eq('order_id', id)

  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/orders')
  return { success: true }
}

/** Chronological status history for the admin order Timeline. */
export async function getOrderStatusHistory(
  orderId: string
): Promise<{ status: string; created_at: string }[]> {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('order_status_history')
    .select('status, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (error) return []
  return data
}

export async function updateOrderTracking(id: string, trackingNumber: string, trackingUrl: string) {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ tracking_number: trackingNumber, tracking_url: trackingUrl })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/admin/orders/${id}`)
  return { success: true }
}

export async function updateOrderNotes(id: string, notes: string) {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('orders').update({ notes }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/admin/orders/${id}`)
  return { success: true }
}

export async function createOrder(
  formData: CheckoutFormData,
  cartItems: CartItem[]
): Promise<{
  orderId?: string
  orderNumber?: string
  error?: string
  /** Set when the cart no longer matches the DB; the client resyncs and asks to review. */
  cartUpdates?: CartUpdates
}> {
  // The checkout UI fixes the country; this guards a hand-crafted request.
  if (!SITE_CONFIG.shipping.countries.includes(formData.country)) {
    return { error: 'Shipping destination not available' }
  }

  const supabase = createSupabaseAdminClient()

  // Prices, names and stock come from the DB — the cart is client-controlled.
  const pricing = await priceCart(supabase, cartItems)
  if (!pricing.ok) return { error: 'cart_changed', cartUpdates: pricing.updates }
  const lines = pricing.lines

  const subtotal = lines.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const shippingCost =
    subtotal >= SITE_CONFIG.shipping.freeShippingThreshold
      ? 0
      : SITE_CONFIG.shipping.standardShippingCost
  const taxAmount = subtotal * SITE_CONFIG.checkout.taxRate
  const total = subtotal + shippingCost

  const orderPayload = {
    status: 'pending' as const,
    customer_email: formData.email,
    customer_name: formData.name,
    customer_phone: formData.phone || null,
    shipping_address_line1: formData.address_line1,
    shipping_address_line2: formData.address_line2 || null,
    shipping_city: formData.city,
    shipping_state: formData.state || null,
    shipping_postal_code: formData.postal_code,
    shipping_country: formData.country,
    billing_same_as_shipping: formData.billing_same_as_shipping,
    billing_address_line1: formData.billing_same_as_shipping ? null : formData.billing_address_line1,
    billing_address_line2: formData.billing_same_as_shipping ? null : formData.billing_address_line2,
    billing_city: formData.billing_same_as_shipping ? null : formData.billing_city,
    billing_state: formData.billing_same_as_shipping ? null : formData.billing_state,
    billing_postal_code: formData.billing_same_as_shipping ? null : formData.billing_postal_code,
    billing_country: formData.billing_same_as_shipping ? null : formData.billing_country,
    subtotal,
    shipping_cost: shippingCost,
    tax_amount: taxAmount,
    discount_amount: 0,
    total,
    currency: 'EUR',
    payment_method: formData.payment_method as string,
    payment_status: 'unpaid' as const,
    order_number: 'TEMP',
  }

  // Consent-based analytics id: only set when the visitor accepted cookies.
  // Links the order to that visitor's browsing for attribution (see
  // docs/legal/tracking-and-cookies.md).
  const visitorId = parseVisitorId((await cookies()).get(VISITOR_COOKIE)?.value)

  let { data: order, error: orderError } = await supabase
    .from('orders')
    // Cast: visitor_id isn't in the inferred payload type, it's an optional extra column.
    .insert((visitorId ? { ...orderPayload, visitor_id: visitorId } : orderPayload) as typeof orderPayload)
    .select()
    .single()
  // PGRST204 = orders.visitor_id doesn't exist yet (migration 20260926000000 not
  // applied). Never let analytics block a sale: retry without it.
  if (orderError?.code === 'PGRST204' && visitorId) {
    ;({ data: order, error: orderError } = await supabase.from('orders').insert(orderPayload).select().single())
  }

  if (orderError || !order) return { error: orderError?.message ?? 'Could not create order' }

  const { error: historyError } = await supabase
    .from('order_status_history')
    .insert({ order_id: order.id, status: order.status })
  if (historyError) console.error('[order_status_history] insert failed:', historyError.message)

  const orderItems = lines.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    variant_id: item.variantId,
    product_name: item.productName,
    variant_size: item.variantSize,
    variant_color: item.variantColor,
    sku: item.sku,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) return { error: itemsError.message }

  // Decrement stock via direct update
  for (const item of lines) {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', item.variantId)
      .single()
    if (variant) {
      await supabase
        .from('product_variants')
        .update({ stock_quantity: Math.max(0, variant.stock_quantity - item.quantity) })
        .eq('id', item.variantId)
    }
  }

  // Send emails (don't block on failure). Stripe orders are unpaid at this point —
  // their confirmation/notification emails fire from the webhook once payment
  // actually succeeds (see markStripeOrderPaid), not here.
  if (order.payment_method !== 'stripe') {
    const emailData = buildOrderEmailData(order, lines)
    await Promise.allSettled([
      sendOrderConfirmation(emailData),
      sendNewOrderNotification(emailData),
    ])
  }

  revalidatePath('/admin/orders')
  return { orderId: order.id, orderNumber: order.order_number }
}

/**
 * Creates a Stripe Checkout Session for an order already saved as
 * pending/unpaid by createOrder, and stashes the session id on
 * `payment_intent_id` so the webhook can find the order again.
 * Line items come from the persisted order_items (priced server-side by
 * createOrder) — never from the browser's cart, which is client-controlled.
 * Refuses non-Stripe or already-paid orders: this is a public action and the
 * order id travels through the client.
 */
export async function createStripeCheckoutSession(
  orderId: string,
  locale: string
): Promise<{ url?: string; error?: string }> {
  const supabase = createSupabaseAdminClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select('order_number, customer_email, shipping_cost, currency, payment_method, payment_status, items:order_items(product_name, variant_size, variant_color, quantity, unit_price)')
    .eq('id', orderId)
    .single()
  if (error || !order) return { error: error?.message ?? 'Order not found' }
  if (order.payment_method !== 'stripe' || order.payment_status === 'paid' || !order.items?.length) {
    return { error: 'Order cannot be paid by card' }
  }

  const hdrs = await headers()
  const host = hdrs.get('host')
  const proto = hdrs.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  const origin = host ? `${proto}://${host}` : SITE_CONFIG.brand.url

  const lineItems: Array<{
    price_data: {
      currency: string
      product_data: { name: string; description?: string }
      unit_amount: number
    }
    quantity: number
  }> = order.items.map((item) => ({
    price_data: {
      currency: order.currency.toLowerCase(),
      product_data: {
        name: item.product_name,
        description: [item.variant_color, item.variant_size].filter(Boolean).join(' / ') || undefined,
      },
      unit_amount: Math.round(Number(item.unit_price) * 100),
    },
    quantity: item.quantity,
  }))

  if (order.shipping_cost > 0) {
    lineItems.push({
      price_data: {
        currency: order.currency.toLowerCase(),
        product_data: { name: 'Shipping' },
        unit_amount: Math.round(order.shipping_cost * 100),
      },
      quantity: 1,
    })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: order.customer_email,
      client_reference_id: orderId,
      line_items: lineItems,
      metadata: { order_id: orderId, order_number: order.order_number },
      success_url: `${origin}/${locale}/checkout/success?order=${order.order_number}`,
      cancel_url: `${origin}/${locale}/checkout`,
    })

    if (!session.url) return { error: 'Stripe did not return a checkout URL' }

    // Stash the Checkout Session id here so the webhook can find this order by
    // it (see markStripeOrderPaid) — it's overwritten with the real
    // PaymentIntent id once payment actually succeeds.
    await supabase
      .from('orders')
      .update({ payment_intent_id: session.id })
      .eq('id', orderId)

    return { url: session.url }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[stripe] createStripeCheckoutSession failed:', msg)
    return { error: msg }
  }
}

export async function getDashboardStats() {
  await requireAdmin()
  const supabase = createSupabaseAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()

  const [ordersToday, ordersWeek, activeProducts, lowStock] = await Promise.all([
    supabase.from('orders').select('total', { count: 'exact' }).gte('created_at', today),
    supabase.from('orders').select('total', { count: 'exact' }).gte('created_at', weekAgo),
    supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true),
    supabase
      .from('product_variants')
      .select('id, product_id, size, color_name, stock_quantity, products(name)', { count: 'exact' })
      .gt('stock_quantity', 0)
      .lte('stock_quantity', 3)
      .eq('is_active', true),
  ])

  const revenueToday = (ordersToday.data ?? []).reduce((s, o) => s + Number(o.total), 0)
  const revenueWeek = (ordersWeek.data ?? []).reduce((s, o) => s + Number(o.total), 0)

  return {
    ordersToday: ordersToday.count ?? 0,
    ordersWeek: ordersWeek.count ?? 0,
    revenueToday,
    revenueWeek,
    activeProducts: activeProducts.count ?? 0,
    lowStockItems: lowStock.data ?? [],
    lowStockCount: lowStock.count ?? 0,
  }
}
