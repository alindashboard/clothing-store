import * as React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
} from '@react-email/components'

export interface NewOrderNotificationProps {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
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

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function NewOrderNotification({
  orderNumber,
  customerName,
  customerEmail,
  customerPhone,
  items,
  subtotal,
  shippingCost,
  total,
  currency,
  shippingAddress,
  shippingMethod,
}: NewOrderNotificationProps) {
  const addr = [
    shippingAddress.line1,
    shippingAddress.line2,
    [shippingAddress.city, shippingAddress.state, shippingAddress.postalCode]
      .filter(Boolean)
      .join(', '),
    shippingAddress.country,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New order {orderNumber} — {fmt(total, currency)}</Preview>
      <Body style={body}>
        <Container style={wrapper}>
          <Section style={section}>
            <Text style={heading}>New Order: {orderNumber}</Text>
            <Text style={totalLine}>{fmt(total, currency)}</Text>
          </Section>

          <Hr style={rule} />

          <Section style={section}>
            <Text style={sectionTitle}>Customer</Text>
            <Text style={row}><span style={label}>Name:</span> {customerName}</Text>
            <Text style={row}><span style={label}>Email:</span> {customerEmail}</Text>
            {customerPhone && (
              <Text style={row}><span style={label}>Phone:</span> {customerPhone}</Text>
            )}
          </Section>

          <Hr style={rule} />

          <Section style={section}>
            <Text style={sectionTitle}>Items</Text>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: 'left' }}>Product</th>
                  <th style={{ ...th, textAlign: 'center', width: '50px' }}>Size</th>
                  <th style={{ ...th, textAlign: 'center', width: '60px' }}>Color</th>
                  <th style={{ ...th, textAlign: 'center', width: '40px' }}>Qty</th>
                  <th style={{ ...th, textAlign: 'right', width: '80px' }}>Price</th>
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

            <table style={{ ...tbl, marginTop: '12px' }}>
              <tbody>
                <tr>
                  <td style={sumLabel}>Subtotal</td>
                  <td style={sumValue}>{fmt(subtotal, currency)}</td>
                </tr>
                <tr>
                  <td style={sumLabel}>Shipping</td>
                  <td style={sumValue}>
                    {shippingCost === 0 ? 'Free' : fmt(shippingCost, currency)}
                  </td>
                </tr>
                <tr>
                  <td style={sumLabelBold}>Total</td>
                  <td style={sumValueBold}>{fmt(total, currency)}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={rule} />

          <Section style={section}>
            <Text style={sectionTitle}>Ship to</Text>
            <Text style={row}>{addr}</Text>
            <Text style={row}><span style={label}>Method:</span> {shippingMethod}</Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerNote}>KAYA Studio Outlet — internal order notification</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default NewOrderNotification

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#f4f4f4',
  margin: '0',
  padding: '0',
  fontFamily: 'Arial, Helvetica, sans-serif',
}

const wrapper: React.CSSProperties = {
  backgroundColor: '#ffffff',
  maxWidth: '600px',
  margin: '24px auto',
}

const section: React.CSSProperties = {
  padding: '20px 28px',
}

const footerSection: React.CSSProperties = {
  padding: '12px 28px 20px',
  backgroundColor: '#f9f9f9',
}

const heading: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#111111',
  margin: '0 0 4px 0',
}

const totalLine: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '700',
  color: '#1a6b3a',
  margin: '0',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: '700',
  color: '#888888',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  margin: '0 0 8px 0',
}

const row: React.CSSProperties = {
  fontSize: '14px',
  color: '#222222',
  margin: '0 0 4px 0',
  lineHeight: '1.5',
}

const label: React.CSSProperties = {
  fontWeight: '600',
  color: '#555555',
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
  letterSpacing: '0.06em',
  padding: '0 4px 8px',
  borderBottom: '1px solid #e0e0e0',
}

const td: React.CSSProperties = {
  fontSize: '13px',
  color: '#222222',
  padding: '8px 4px',
  borderBottom: '1px solid #f0f0f0',
  verticalAlign: 'top',
}

const sumLabel: React.CSSProperties = {
  fontSize: '13px',
  color: '#555555',
  padding: '3px 4px 3px 0',
  width: '80%',
}

const sumValue: React.CSSProperties = {
  fontSize: '13px',
  color: '#222222',
  padding: '3px 0',
  textAlign: 'right',
  whiteSpace: 'nowrap',
}

const sumLabelBold: React.CSSProperties = {
  ...sumLabel,
  fontWeight: '700',
  color: '#111111',
  fontSize: '15px',
  paddingTop: '8px',
  borderTop: '1px solid #e0e0e0',
}

const sumValueBold: React.CSSProperties = {
  ...sumValue,
  fontWeight: '700',
  color: '#111111',
  fontSize: '15px',
  paddingTop: '8px',
  borderTop: '1px solid #e0e0e0',
}

const footerNote: React.CSSProperties = {
  fontSize: '11px',
  color: '#aaaaaa',
  margin: '0',
}
