import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getCategories } from '@/lib/actions/categories'
import { ContactFormClient } from './contact-form-client'
import { SITE_CONFIG } from '@/lib/config'
import { getAlternates } from '@/lib/seo/alternates'
import { DarkPageHeader } from '@/components/layout/dark-page-header'

interface MetaProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: MetaProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: t('contact.title'),
    description: t('contact.description'),
    alternates: getAlternates(locale, '/contact'),
  }
}

export default async function ContactPage() {
  const [categories, t, tProduct] = await Promise.all([
    getCategories(),
    getTranslations('contact'),
    getTranslations('product'),
  ])

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="dark kaya-dark flex-1 pb-20 md:pb-28">
        <DarkPageHeader title={t('title')} eyebrow={SITE_CONFIG.brand.name} homeLabel={tProduct('breadcrumbHome')} narrow>
          {t('subtitle')}
        </DarkPageHeader>
        <div className="max-w-3xl mx-auto px-4">
          <ContactFormClient />

          <div className="mt-10 pt-8 border-t border-[#2B2924] space-y-3">
            {SITE_CONFIG.contact.email && (
              <p className="text-sm text-[#8C8577]">
                <span className="font-medium text-[#c7c3b8]">{t('emailLabel')}:</span>{' '}
                <a href={`mailto:${SITE_CONFIG.contact.email}`} className="underline underline-offset-4 text-[#EDE9E1] hover:text-[#D9B679] transition-colors">{SITE_CONFIG.contact.email}</a>
              </p>
            )}
            {SITE_CONFIG.contact.phone && (
              <p className="text-sm text-[#8C8577]">
                <span className="font-medium text-[#c7c3b8]">{t('phoneLabel')}:</span>{' '}
                <a href={`tel:${SITE_CONFIG.contact.phone}`} className="underline underline-offset-4 text-[#EDE9E1] hover:text-[#D9B679] transition-colors">{SITE_CONFIG.contact.phone}</a>
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
