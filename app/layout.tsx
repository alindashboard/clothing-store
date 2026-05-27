import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { SITE_CONFIG } from '@/lib/config'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { Toaster } from '@/components/ui/sonner'

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[#111111]">
        {children}
        <CartDrawer />
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
