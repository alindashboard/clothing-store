import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getCategories } from '@/lib/actions/categories'
import { ContactFormClient } from './contact-form-client'
import { SITE_CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: `Contact | ${SITE_CONFIG.brand.name}`,
}

export default async function ContactPage() {
  const [categories, t] = await Promise.all([
    getCategories(),
    getTranslations('contact'),
  ])

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="max-w-2xl mx-auto px-4 py-16 flex-1">
        <h1 className="text-2xl font-light tracking-wider mb-2">{t('title')}</h1>
        <p className="text-sm text-gray-500 mb-10">{t('subtitle')}</p>
        <ContactFormClient />

        <div className="mt-10 pt-8 border-t border-gray-100 space-y-3">
          {SITE_CONFIG.contact.email && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">{t('emailLabel')}:</span>{' '}
              <a href={`mailto:${SITE_CONFIG.contact.email}`} className="underline">{SITE_CONFIG.contact.email}</a>
            </p>
          )}
          {SITE_CONFIG.contact.phone && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">{t('phoneLabel')}:</span>{' '}
              <a href={`tel:${SITE_CONFIG.contact.phone}`} className="underline">{SITE_CONFIG.contact.phone}</a>
            </p>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
