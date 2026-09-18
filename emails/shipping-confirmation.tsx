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
  Button,
  Preview,
} from '@react-email/components'

type Locale = 'it' | 'en'

export interface ShippingConfirmationProps {
  orderNumber: string
  customerName: string
  trackingNumber?: string | null
  trackingUrl?: string | null
  locale: Locale
}

const dict = {
  it: {
    preview: (n: string) => `Il tuo ordine ${n} è stato spedito — KAYA Studio Outlet`,
    title: 'Ordine Spedito',
    greeting: (name: string) => `Ciao ${name},`,
    shipped: (n: string) => `Buone notizie! Il tuo ordine ${n} è stato spedito ed è in viaggio verso di te.`,
    orderLabel: 'Ordine',
    trackingNumberLabel: 'Numero di tracciamento',
    trackButton: 'Traccia il tuo pacco',
    noTrackingYet: 'Riceverai i dettagli di tracciamento a breve.',
    contact: 'Domande? Scrivici a',
    footer: '© 2025 KAYA Studio Outlet · Str. Acque Alte 12, 04100 LT, Italy',
    unsubscribe: 'Questo è un messaggio transazionale relativo al tuo ordine.',
  },
  en: {
    preview: (n: string) => `Your order ${n} has shipped — KAYA Studio Outlet`,
    title: 'Order Shipped',
    greeting: (name: string) => `Hi ${name},`,
    shipped: (n: string) => `Good news! Your order ${n} has shipped and is on its way to you.`,
    orderLabel: 'Order',
    trackingNumberLabel: 'Tracking number',
    trackButton: 'Track your package',
    noTrackingYet: "You'll receive tracking details shortly.",
    contact: 'Questions? Contact us at',
    footer: '© 2025 KAYA Studio Outlet · Str. Acque Alte 12, 04100 LT, Italy',
    unsubscribe: 'This is a transactional message related to your order.',
  },
}

export function ShippingConfirmation({
  orderNumber,
  customerName,
  trackingNumber,
  trackingUrl,
  locale = 'it',
}: ShippingConfirmationProps) {
  const tr = dict[locale]

  return (
    <Html lang={locale} dir="ltr">
      <Head />
      <Preview>{tr.preview(orderNumber)}</Preview>
      <Body style={body}>
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

          <Section style={section}>
            <Text style={h1}>{tr.title}</Text>
            <Text style={para}>{tr.greeting(customerName)}</Text>
            <Text style={para}>{tr.shipped(orderNumber)}</Text>
            <Text style={orderTag}>
              {tr.orderLabel}: <span style={orderTagValue}>{orderNumber}</span>
            </Text>
          </Section>

          <Hr style={rule} />

          <Section style={section}>
            {trackingNumber && (
              <Text style={orderTag}>
                {tr.trackingNumberLabel}: <span style={orderTagValue}>{trackingNumber}</span>
              </Text>
            )}
            {trackingUrl ? (
              <Button href={trackingUrl} style={trackButtonStyle}>
                {tr.trackButton}
              </Button>
            ) : (
              !trackingNumber && <Text style={para}>{tr.noTrackingYet}</Text>
            )}
          </Section>

          <Hr style={rule} />

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

export default ShippingConfirmation

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

const trackButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#111111',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  padding: '12px 28px',
  marginTop: '16px',
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
