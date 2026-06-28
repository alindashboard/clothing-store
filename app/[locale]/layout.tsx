import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { getBrandAccent } from '@/lib/brand-accent'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { routing } from '@/i18n/routing'
import { SITE_CONFIG } from '@/lib/config'
import { notFound } from 'next/navigation'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isIT = locale === 'it'
  return {
    openGraph: {
      type: 'website',
      siteName: SITE_CONFIG.brand.name,
      url: SITE_CONFIG.brand.url,
      locale: isIT ? 'it_IT' : 'en_US',
      alternateLocale: isIT ? ['en_US'] : ['it_IT'],
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'KAYA Studio Outlet' }],
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!routing.locales.includes(locale as 'it' | 'en')) {
    notFound()
  }

  const [messages, accent] = await Promise.all([
    getMessages(),
    getBrandAccent(),
  ])

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div
        style={{ '--brand-accent': accent } as React.CSSProperties}
        className="contents"
      >
        {children}
        <CartDrawer />
      </div>
    </NextIntlClientProvider>
  )
}
