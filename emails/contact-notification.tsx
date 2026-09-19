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

export interface ContactNotificationProps {
  name: string
  email?: string | null
  phone?: string | null
  message: string
}

export function ContactNotification({
  name,
  email,
  phone,
  message,
}: ContactNotificationProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New contact request from {name}</Preview>
      <Body style={body}>
        <Container style={wrapper}>
          <Section style={section}>
            <Text style={heading}>New Contact Request</Text>
          </Section>

          <Hr style={rule} />

          <Section style={section}>
            <Text style={sectionTitle}>From</Text>
            <Text style={row}><span style={label}>Name:</span> {name}</Text>
            {email && (
              <Text style={row}><span style={label}>Email:</span> {email}</Text>
            )}
            {phone && (
              <Text style={row}><span style={label}>Phone:</span> {phone}</Text>
            )}
          </Section>

          <Hr style={rule} />

          <Section style={section}>
            <Text style={sectionTitle}>Message</Text>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerNote}>KAYA Studio Outlet — internal contact notification</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ContactNotification

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

const messageText: React.CSSProperties = {
  fontSize: '14px',
  color: '#222222',
  margin: '0',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
}

const rule: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #e8e8e8',
  margin: '0',
}

const footerNote: React.CSSProperties = {
  fontSize: '11px',
  color: '#aaaaaa',
  margin: '0',
}
