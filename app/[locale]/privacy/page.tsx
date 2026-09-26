import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'
import { STORE_INFO } from '@/lib/store-info'
import { pageMetadata } from '@/lib/seo/page-metadata'
import { DarkPageHeader } from '@/components/layout/dark-page-header'

/**
 * Date this policy was last substantively revised — bump it by hand whenever the
 * wording changes. Deliberately a constant rather than `new Date()`: rendering
 * today's date would claim the policy was revised on every page load, which is
 * both untrue and the kind of thing a regulator notices.
 *
 * TODO_CONFIRM: this text is a working draft pending review by the owner's
 * lawyer. It describes the site's actual behaviour accurately; the retention
 * periods still need confirming. Controller identity comes from STORE_INFO
 * (Registro Imprese extract, filled 2026-09-26).
 */
const LAST_UPDATED = '2026-09-26'

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const [t, tMeta] = await Promise.all([
    getTranslations({ locale, namespace: 'privacy' }),
    getTranslations({ locale, namespace: 'meta' }),
  ])
  return pageMetadata({ locale, path: '/privacy', title: t('title'), description: tMeta('privacy.description') })
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params
  const [categories, t, tProduct] = await Promise.all([
    getCategories(),
    getTranslations({ locale, namespace: 'privacy' }),
    getTranslations({ locale, namespace: 'product' }),
  ])

  const email = SITE_CONFIG.contact.email
  const formattedDate = new Date(LAST_UPDATED).toLocaleDateString(
    locale === 'it' ? 'it-IT' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  )

  // Keeps the address inline inside the sentence rather than orphaned after it.
  const withMail = { email, mail: (chunks: React.ReactNode) => <a href={`mailto:${email}`}>{chunks}</a> }

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />
      <main className="bg-[#141412] flex-1">
        <DarkPageHeader title={t('title')} eyebrow={SITE_CONFIG.brand.name} homeLabel={tProduct('breadcrumbHome')} narrow>
          {t('lastUpdated', { date: formattedDate })}
        </DarkPageHeader>
        <div className="legal-prose max-w-3xl mx-auto px-4 pb-20 md:pb-28">
        <p>{t('intro', { store: SITE_CONFIG.brand.name })}</p>

        <h2>{t('controller.heading')}</h2>
        <p>
          {t.rich('controller.body', {
            ...withMail,
            name: STORE_INFO.legalName,
            brand: SITE_CONFIG.brand.name,
            address: STORE_INFO.legalAddress,
          })}
        </p>
        <p>
          {t('controller.vatLabel', {
            vat: STORE_INFO.vatNumber,
            rea: STORE_INFO.reaNumber,
            pec: STORE_INFO.pec,
          })}
        </p>

        <h2>{t('collect.heading')}</h2>
        <p>{t('collect.intro')}</p>
        <ul>
          {t.raw('collect.items').map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>{t('purposes.heading')}</h2>
        <p>{t('purposes.intro')}</p>
        <ul>
          {t.raw('purposes.items').map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>{t('cookies.heading')}</h2>
        <p>{t('cookies.necessary')}</p>
        <p>{t('cookies.stats')}</p>
        <p>{t('cookies.firstParty')}</p>
        <p>{t('cookies.pixel')}</p>
        <p>{t('cookies.google')}</p>
        <p>{t('cookies.maps')}</p>
        <p>{t('cookies.manage')}</p>

        <h2>{t('sharing.heading')}</h2>
        <p>{t('sharing.intro')}</p>
        <ul>
          {t.raw('sharing.items').map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{t('sharing.transfers')}</p>

        <h2>{t('retention.heading')}</h2>
        <ul>
          {t.raw('retention.items').map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>{t('rights.heading')}</h2>
        <p>{t('rights.intro')}</p>
        <ul>
          {t.raw('rights.items').map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{t.rich('rights.howTo', withMail)}</p>
        <p>{t('rights.complaint')}</p>

        <h2>{t('changes.heading')}</h2>
        <p>{t('changes.body')}</p>

        <h2>{t('contact.heading')}</h2>
        <p>{t.rich('contact.body', withMail)}</p>
        </div>
      </main>
      <Footer />
    </>
  )
}
