import { Resend } from 'resend'
import { formatPrice } from '@/lib/utils'
import { SITE_CONFIG } from '@/lib/config'
import type { Order } from '@/lib/types'
import type { CartItem } from '@/lib/store/cart'

const FROM = `${SITE_CONFIG.brand.name} <noreply@resend.dev>`
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || SITE_CONFIG.contact.email

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function itemsHtml(items: CartItem[]) {
  return items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${i.productName} — ${i.variantColor} / ${i.variantSize}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">× ${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(i.price * i.quantity)}</td>
      </tr>`
    )
    .join('')
}

export async function sendOrderConfirmation(order: Order, items: CartItem[]) {
  if (!process.env.RESEND_API_KEY) return

  await getResend().emails.send({
    from: FROM,
    to: order.customer_email,
    subject: `Order Confirmed — ${order.order_number}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
        <h1 style="font-size:24px;margin-bottom:4px">${SITE_CONFIG.brand.name}</h1>
        <p style="color:#666;margin-top:0">Thank you for your order!</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <h2 style="font-size:18px">Order ${order.order_number}</h2>
        <table style="width:100%;border-collapse:collapse">
          ${itemsHtml(items)}
        </table>
        <div style="margin-top:16px;text-align:right">
          <p style="margin:4px 0;color:#666">Subtotal: ${formatPrice(order.subtotal)}</p>
          ${order.shipping_cost > 0 ? `<p style="margin:4px 0;color:#666">Shipping: ${formatPrice(order.shipping_cost)}</p>` : '<p style="margin:4px 0;color:#666">Shipping: Free</p>'}
          <p style="margin:8px 0;font-weight:bold;font-size:18px">Total: ${formatPrice(order.total)}</p>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <h3 style="font-size:14px">Shipping to</h3>
        <p style="color:#666;margin:0">${order.customer_name}<br/>
        ${order.shipping_address_line1}${order.shipping_address_line2 ? ', ' + order.shipping_address_line2 : ''}<br/>
        ${order.shipping_city}, ${order.shipping_postal_code}<br/>
        ${order.shipping_country}</p>
        <p style="margin-top:24px;color:#666;font-size:13px">
          Estimated delivery: ${SITE_CONFIG.shipping.estimatedDays.standard} business days.<br/>
          Questions? Contact us at <a href="mailto:${SITE_CONFIG.contact.email}">${SITE_CONFIG.contact.email}</a>
        </p>
      </div>
    `,
  })
}

export async function sendOrderNotification(order: Order, items: CartItem[]) {
  if (!process.env.RESEND_API_KEY || !ADMIN_EMAIL) return

  await getResend().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `New Order — ${order.order_number} — ${formatPrice(order.total)}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#111">
        <h2>New Order: ${order.order_number}</h2>
        <p><strong>Customer:</strong> ${order.customer_name} (${order.customer_email})${order.customer_phone ? ' — ' + order.customer_phone : ''}</p>
        <p><strong>Payment:</strong> ${order.payment_method}</p>
        <table style="width:100%;border-collapse:collapse">
          ${itemsHtml(items)}
        </table>
        <p style="text-align:right;font-weight:bold">Total: ${formatPrice(order.total)}</p>
        <p><strong>Ship to:</strong><br/>
        ${order.shipping_address_line1}, ${order.shipping_city} ${order.shipping_postal_code}, ${order.shipping_country}</p>
      </div>
    `,
  })
}
