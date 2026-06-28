import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { getBrandAccent } from '@/lib/brand-accent'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { routing } from '@/i18n/routing'
import { notFound } from 'next/navigation'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
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
