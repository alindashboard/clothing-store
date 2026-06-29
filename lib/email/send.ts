import * as React from 'react'
import { resend } from './client'
import { FROM, REPLY_TO, OWNER_NOTIFICATION_EMAIL } from './config'
import { OrderConfirmation } from '@/emails/order-confirmation'
import { NewOrderNotification } from '@/emails/new-order-notification'

export interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  locale: 'it' | 'en'
  items: Array<{
    name: string
    size: string
    color: string
    quantity: number
    price: number
  }>
  subtotal: number
  shippingCost: number
  total: number
  currency: string
  shippingAddress: {
    line1: string
    line2?: string | null
    city: string
    state?: string | null
    postalCode: string
    country: string
  }
  shippingMethod: string
}

export async function sendOrderConfirmation(
  data: OrderEmailData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM,
      to: data.customerEmail,
      replyTo: REPLY_TO,
      subject:
        data.locale === 'it'
          ? `Ordine Confermato — ${data.orderNumber}`
          : `Order Confirmed — ${data.orderNumber}`,
      react: React.createElement(OrderConfirmation, data),
    })
    if (error) {
      console.error('[email] sendOrderConfirmation error:', error)
      return { success: false, error: error.message }
    }
    return { success: true, id: result?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[email] sendOrderConfirmation threw:', msg)
    return { success: false, error: msg }
  }
}

export async function sendNewOrderNotification(
  data: OrderEmailData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM,
      to: OWNER_NOTIFICATION_EMAIL,
      replyTo: data.customerEmail,
      subject: `New Order: ${data.orderNumber} — ${new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: data.currency,
      }).format(data.total)}`,
      react: React.createElement(NewOrderNotification, data),
    })
    if (error) {
      console.error('[email] sendNewOrderNotification error:', error)
      return { success: false, error: error.message }
    }
    return { success: true, id: result?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[email] sendNewOrderNotification threw:', msg)
    return { success: false, error: msg }
  }
}
