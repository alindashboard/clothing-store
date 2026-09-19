import * as React from 'react'
import { resend } from './client'
import { FROM, REPLY_TO, OWNER_NOTIFICATION_EMAIL } from './config'
import { OrderConfirmation } from '@/emails/order-confirmation'
import { NewOrderNotification } from '@/emails/new-order-notification'
import { ShippingConfirmation } from '@/emails/shipping-confirmation'
import { ContactNotification } from '@/emails/contact-notification'

export interface OrderEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  paymentMethod?: string | null
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

export interface ShippingEmailData {
  orderNumber: string
  customerName: string
  customerEmail: string
  trackingNumber?: string | null
  trackingUrl?: string | null
  locale: 'it' | 'en'
}

export async function sendShippingConfirmation(
  data: ShippingEmailData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM,
      to: data.customerEmail,
      replyTo: REPLY_TO,
      subject:
        data.locale === 'it'
          ? `Ordine Spedito — ${data.orderNumber}`
          : `Order Shipped — ${data.orderNumber}`,
      react: React.createElement(ShippingConfirmation, data),
    })
    if (error) {
      console.error('[email] sendShippingConfirmation error:', error)
      return { success: false, error: error.message }
    }
    return { success: true, id: result?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[email] sendShippingConfirmation threw:', msg)
    return { success: false, error: msg }
  }
}

export interface ContactEmailData {
  name: string
  email?: string | null
  phone?: string | null
  message: string
}

export async function sendContactNotification(
  data: ContactEmailData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const { data: result, error } = await resend.emails.send({
      from: FROM,
      to: OWNER_NOTIFICATION_EMAIL,
      replyTo: data.email ?? REPLY_TO,
      subject: `New Contact Request from ${data.name}`,
      react: React.createElement(ContactNotification, data),
    })
    if (error) {
      console.error('[email] sendContactNotification error:', error)
      return { success: false, error: error.message }
    }
    return { success: true, id: result?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[email] sendContactNotification threw:', msg)
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
