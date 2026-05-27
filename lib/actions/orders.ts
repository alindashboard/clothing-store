'use server'

import { createSupabaseAdminClient } from '@/lib/supabase'
import type { Order, CheckoutFormData } from '@/lib/types'
import type { CartItem } from '@/lib/store/cart'
import { revalidatePath } from 'next/cache'
import { SITE_CONFIG } from '@/lib/config'
import { sendOrderConfirmation, sendOrderNotification } from '@/lib/email'

export async function getOrdersAdmin(options?: {
  status?: string
  search?: string
  limit?: number
}): Promise<Order[]> {
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

export async function getOrderAdmin(id: string): Promise<Order | null> {
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
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
  return { success: true }
}

export async function updateOrderTracking(id: string, trackingNumber: string, trackingUrl: string) {
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
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('orders').update({ notes }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/admin/orders/${id}`)
  return { success: true }
}

export async function createOrder(
  formData: CheckoutFormData,
  cartItems: CartItem[]
): Promise<{ orderId?: string; orderNumber?: string; error?: string }> {
  const supabase = createSupabaseAdminClient()

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
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

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select()
    .single()

  if (orderError) return { error: orderError.message }

  const orderItems = cartItems.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    variant_id: item.variantId,
    product_name: item.productName,
    variant_size: item.variantSize,
    variant_color: item.variantColor,
    sku: null,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.price * item.quantity,
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) return { error: itemsError.message }

  // Decrement stock via direct update
  for (const item of cartItems) {
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

  // Send emails (don't block on failure)
  try {
    await sendOrderConfirmation(order, cartItems)
    await sendOrderNotification(order, cartItems)
  } catch (e) {
    console.error('Email send failed:', e)
  }

  revalidatePath('/admin/orders')
  return { orderId: order.id, orderNumber: order.order_number }
}

export async function getDashboardStats() {
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
