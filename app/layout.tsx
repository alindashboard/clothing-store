import type { Metadata } from 'next'
import { DM_Sans, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { SITE_CONFIG } from '@/lib/config'
import { getBrandAccent } from '@/lib/brand-accent'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { Toaster } from '@/components/ui/sonner'

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

// Luxury display serif — used for ticker, hero headings, product card names.
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
    locale: 'en_US',
    siteName: SITE_CONFIG.brand.name,
    url: SITE_CONFIG.brand.url,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const accent = await getBrandAccent()

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${cormorant.variable} h-full antialiased`}
      style={{ '--brand-accent': accent } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col bg-white text-[#111111]">
        {children}
        <CartDrawer />
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
