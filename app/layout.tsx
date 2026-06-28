import type { Metadata } from 'next'
import { DM_Sans, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { SITE_CONFIG } from '@/lib/config'
import { Toaster } from '@/components/ui/sonner'
import { headers } from 'next/headers'

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

const cormorant = Cormorant_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.brand.url),
  title: {
    default: `${SITE_CONFIG.brand.name} — ${SITE_CONFIG.brand.tagline}`,
    template: `%s | ${SITE_CONFIG.brand.name}`,
  },
  description: SITE_CONFIG.brand.tagline,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: SITE_CONFIG.brand.name,
    url: SITE_CONFIG.brand.url,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  // next-intl middleware sets x-next-intl-locale on every public request
  const locale = h.get('x-next-intl-locale') ?? 'it'

  return (
    <html
      lang={locale}
      className={`${dmSans.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#111111]">
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
