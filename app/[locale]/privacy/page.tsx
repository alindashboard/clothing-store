import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'
import { STORE_INFO } from '@/lib/store-info'
import { getAlternates } from '@/lib/seo/alternates'

/**
 * Date this policy was last substantively revised — bump it by hand whenever the
 * wording changes. Deliberately a constant rather than `new Date()`: rendering
 * today's date would claim the policy was revised on every page load, which is
 * both untrue and the kind of thing a regulator notices.
 *
 * TODO_CONFIRM: this text is a working draft pending review by the owner's
 * lawyer. It describes the site's actual behaviour accurately, but the retention
 * periods and the controller's legal identity need confirming before any paid
 * advertising goes live. See also STORE_INFO.legalName / vatNumber.
 */
const LAST_UPDATED = '2026-09-09'

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })
  return {
    title: { absolute: `${t('title')} | ${SITE_CONFIG.brand.name}` },
    alternates: getAlternates(locale, '/privacy'),
  }
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params
  const [categories, t] = await Promise.all([
    getCategories(),
    getTranslations({ locale, namespace: 'privacy' }),
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
      <main className="max-w-2xl mx-auto px-4 py-16 flex-1 prose prose-sm">
        <h1>{t('title')}</h1>
        <p className="text-gray-500">{t('lastUpdated', { date: formattedDate })}</p>
        <p>{t('intro', { store: SITE_CONFIG.brand.name })}</p>

        <h2>{t('controller.heading')}</h2>
        <p>
          {t.rich('controller.body', {
            ...withMail,
            name: STORE_INFO.legalName || STORE_INFO.name,
            address: STORE_INFO.address,
          })}
        </p>
        {STORE_INFO.vatNumber && <p>{t('controller.vatLabel', { vat: STORE_INFO.vatNumber })}</p>}

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
        <p>{t('cookies.pixel')}</p>
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
      </main>
      <Footer />
    </>
  )
}
