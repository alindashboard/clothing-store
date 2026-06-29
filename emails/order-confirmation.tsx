import * as React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Hr,
  Link,
  Preview,
} from '@react-email/components'

type Locale = 'it' | 'en'

export interface OrderConfirmationProps {
  orderNumber: string
  customerName: string
  locale: Locale
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

const dict = {
  it: {
    preview: (n: string) => `Il tuo ordine ${n} è confermato — KAYA Studio Outlet`,
    title: 'Ordine Confermato',
    greeting: (name: string) => `Ciao ${name},`,
    thanks: (n: string) => `Grazie per il tuo acquisto! Il tuo ordine ${n} è stato ricevuto e verrà elaborato a breve.`,
    orderLabel: 'Ordine',
    product: 'Prodotto',
    size: 'Taglia',
    color: 'Colore',
    qty: 'Qnt',
    amount: 'Importo',
    subtotal: 'Subtotale',
    shipping: 'Spedizione',
    freeShipping: 'Gratuita',
    total: 'Totale',
    deliveryTitle: 'Indirizzo di consegna',
    shippingMethodLabel: 'Metodo di spedizione',
    contact: 'Domande? Scrivici a',
    footer: '© 2025 KAYA Studio Outlet · Str. Acque Alte 12, 04100 LT, Italy',
    unsubscribe: 'Questo è un messaggio transazionale relativo al tuo ordine.',
  },
  en: {
    preview: (n: string) => `Your order ${n} is confirmed — KAYA Studio Outlet`,
    title: 'Order Confirmed',
    greeting: (name: string) => `Hi ${name},`,
    thanks: (n: string) => `Thank you for your purchase! Your order ${n} has been received and will be processed shortly.`,
    orderLabel: 'Order',
    product: 'Product',
    size: 'Size',
    color: 'Color',
    qty: 'Qty',
    amount: 'Amount',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    freeShipping: 'Free',
    total: 'Total',
    deliveryTitle: 'Delivery address',
    shippingMethodLabel: 'Shipping method',
    contact: 'Questions? Contact us at',
    footer: '© 2025 KAYA Studio Outlet · Str. Acque Alte 12, 04100 LT, Italy',
    unsubscribe: 'This is a transactional message related to your order.',
  },
}

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function OrderConfirmation({
  orderNumber,
  customerName,
  locale = 'it',
  items,
  subtotal,
  shippingCost,
  total,
  currency,
  shippingAddress,
  shippingMethod,
}: OrderConfirmationProps) {
  const tr = dict[locale]

  const addr = [
    shippingAddress.line1,
    shippingAddress.line2,
    [
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.postalCode,
    ]
      .filter(Boolean)
      .join(', '),
    shippingAddress.country,
  ]
    .filter(Boolean)
    .join('\n')

  return (
    <Html lang={locale} dir="ltr">
      <Head />
      <Preview>{tr.preview(orderNumber)}</Preview>
      <Body style={body}>
        {/* ── Header ── */}
        <Container style={wrapper}>
          <Section style={header}>
            <Img
              src="https://kayaoutlet.com/kaya-logo.png"
              alt="KAYA Studio Outlet"
              width={110}
              height="auto"
              style={logoImg}
            />
          </Section>

          {/* ── Intro ── */}
          <Section style={section}>
            <Text style={h1}>{tr.title}</Text>
            <Text style={para}>{tr.greeting(customerName)}</Text>
            <Text style={para}>{tr.thanks(orderNumber)}</Text>
            <Text style={orderTag}>
              {tr.orderLabel}: <span style={orderTagValue}>{orderNumber}</span>
            </Text>
          </Section>

          <Hr style={rule} />

          {/* ── Products table ── */}
          <Section style={section}>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: 'left' }}>{tr.product}</th>
                  <th style={{ ...th, textAlign: 'center', width: '60px' }}>{tr.size}</th>
                  <th style={{ ...th, textAlign: 'center', width: '70px' }}>{tr.color}</th>
                  <th style={{ ...th, textAlign: 'center', width: '40px' }}>{tr.qty}</th>
                  <th style={{ ...th, textAlign: 'right', width: '80px' }}>{tr.amount}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={td}>{item.name}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{item.size}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{item.color}</td>
                    <td style={{ ...td, textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      {fmt(item.price * item.quantity, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <table style={{ ...tbl, marginTop: '20px' }}>
              <tbody>
                <tr>
                  <td style={sumLabel}>{tr.subtotal}</td>
                  <td style={sumValue}>{fmt(subtotal, currency)}</td>
                </tr>
                <tr>
                  <td style={sumLabel}>{tr.shipping}</td>
                  <td style={sumValue}>
                    {shippingCost === 0 ? tr.freeShipping : fmt(shippingCost, currency)}
                  </td>
                </tr>
                <tr>
                  <td style={sumLabelBold}>{tr.total}</td>
                  <td style={sumValueBold}>{fmt(total, currency)}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={rule} />

          {/* ── Shipping address ── */}
          <Section style={section}>
            <Text style={labelHeading}>{tr.deliveryTitle}</Text>
            <Text style={addrText}>{addr}</Text>
            <Text style={para}>
              <span style={metaLabel}>{tr.shippingMethodLabel}: </span>
              {shippingMethod}
            </Text>
          </Section>

          <Hr style={rule} />

          {/* ── Footer ── */}
          <Section style={footerSection}>
            <Text style={footerPara}>
              {tr.contact}{' '}
              <Link href="mailto:orders@kayaoutlet.com" style={accentLink}>
                orders@kayaoutlet.com
              </Link>
            </Text>
            <Text style={footerPara}>
              <Link href="https://kayaoutlet.com" style={accentLink}>
                kayaoutlet.com
              </Link>
            </Text>
            <Text style={footerSmall}>{tr.footer}</Text>
            <Text style={footerSmall}>{tr.unsubscribe}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default OrderConfirmation

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#f4f4f4',
  margin: '0',
  padding: '0',
  fontFamily: 'Georgia, "Times New Roman", serif',
}

const wrapper: React.CSSProperties = {
  backgroundColor: '#ffffff',
  maxWidth: '600px',
  margin: '24px auto',
  borderRadius: '2px',
  overflow: 'hidden',
}

const header: React.CSSProperties = {
  backgroundColor: '#111111',
  padding: '28px 32px',
  textAlign: 'center',
}

const logoImg: React.CSSProperties = {
  display: 'block',
  margin: '0 auto',
}

const section: React.CSSProperties = {
  padding: '28px 36px',
}

const footerSection: React.CSSProperties = {
  padding: '20px 36px 28px',
  backgroundColor: '#fafafa',
}

const h1: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: '700',
  color: '#111111',
  margin: '0 0 16px 0',
  letterSpacing: '0.03em',
}

const para: React.CSSProperties = {
  fontSize: '15px',
  color: '#333333',
  lineHeight: '1.65',
  margin: '0 0 10px 0',
}

const orderTag: React.CSSProperties = {
  display: 'inline-block',
  fontSize: '13px',
  color: '#555555',
  backgroundColor: '#f5f5f5',
  padding: '6px 12px',
  borderLeft: '3px solid #c2a04a',
  margin: '6px 0 0 0',
}

const orderTagValue: React.CSSProperties = {
  fontWeight: '700',
  color: '#111111',
  letterSpacing: '0.05em',
}

const rule: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #e8e8e8',
  margin: '0',
}

const tbl: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const th: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: '700',
  color: '#888888',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '0 4px 10px',
  borderBottom: '1px solid #e0e0e0',
}

const td: React.CSSProperties = {
  fontSize: '14px',
  color: '#222222',
  padding: '10px 4px',
  borderBottom: '1px solid #f0f0f0',
  verticalAlign: 'top',
}

const sumLabel: React.CSSProperties = {
  fontSize: '14px',
  color: '#555555',
  padding: '4px 4px 4px 0',
  width: '80%',
}

const sumValue: React.CSSProperties = {
  fontSize: '14px',
  color: '#222222',
  padding: '4px 0',
  textAlign: 'right',
  whiteSpace: 'nowrap',
}

const sumLabelBold: React.CSSProperties = {
  ...sumLabel,
  fontWeight: '700',
  color: '#111111',
  fontSize: '16px',
  paddingTop: '10px',
  borderTop: '1px solid #e0e0e0',
}

const sumValueBold: React.CSSProperties = {
  ...sumValue,
  fontWeight: '700',
  color: '#111111',
  fontSize: '16px',
  paddingTop: '10px',
  borderTop: '1px solid #e0e0e0',
}

const labelHeading: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: '700',
  color: '#888888',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  margin: '0 0 10px 0',
}

const addrText: React.CSSProperties = {
  fontSize: '14px',
  color: '#333333',
  lineHeight: '1.7',
  margin: '0 0 12px 0',
  whiteSpace: 'pre-line',
}

const metaLabel: React.CSSProperties = {
  fontWeight: '600',
  color: '#555555',
}

const footerPara: React.CSSProperties = {
  fontSize: '13px',
  color: '#666666',
  margin: '0 0 6px 0',
}

const footerSmall: React.CSSProperties = {
  fontSize: '11px',
  color: '#aaaaaa',
  margin: '4px 0 0 0',
}

const accentLink: React.CSSProperties = {
  color: '#c2a04a',
  textDecoration: 'none',
}
