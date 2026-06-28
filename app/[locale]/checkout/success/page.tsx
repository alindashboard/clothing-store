import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { CheckCircle } from 'lucide-react'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Footer } from '@/components/layout/footer'
import { getCategories } from '@/lib/actions/categories'
import { Header } from '@/components/layout/header'
import { SITE_CONFIG } from '@/lib/config'

interface Props {
  searchParams: Promise<{ order?: string; email?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order, email } = await searchParams
  const [categories, t] = await Promise.all([
    getCategories(),
    getTranslations('checkout'),
  ])

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-light mb-2">{t('orderConfirmed')}</h1>
          {order && (
            <p className="text-sm text-gray-500 mb-4">
              {t('orderNumber')}: <span className="font-semibold text-gray-900">{order}</span>
            </p>
          )}
          {email ? (
            <p className="text-sm text-gray-500 mb-8">
              {t('confirmationEmail')} <strong>{email}</strong>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-8">
              {t('confirmationSoon')}<br />
              {t('questionsContact')}{' '}
              <a href={`mailto:${SITE_CONFIG.contact.email}`} className="underline">
                {SITE_CONFIG.contact.email}
              </a>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="px-8 py-3 bg-black text-white text-sm font-medium tracking-wider uppercase hover:bg-gray-800 transition-colors"
            >
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
