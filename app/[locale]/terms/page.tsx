import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Link } from '@/i18n/navigation'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'
import { STORE_INFO } from '@/lib/store-info'
import { getAlternates } from '@/lib/seo/alternates'
import { DarkPageHeader } from '@/components/layout/dark-page-header'

/**
 * Date these terms were last substantively revised — bump it by hand whenever
 * the wording changes (same reasoning as the privacy page's constant).
 *
 * Owner-confirmed 2026-09-26: return shipping is at the customer's expense, and
 * the site ships to Italy only (SITE_CONFIG.shipping.countries; EU by WhatsApp).
 * Keep the returns wording in sync with `trust.returnsBody`. Still pending a
 * lawyer's review, like the privacy policy.
 */
const LAST_UPDATED = '2026-09-26'

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'terms' })
  return {
    title: { absolute: `${t('title')} | ${SITE_CONFIG.brand.name}` },
    alternates: getAlternates(locale, '/terms'),
  }
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params
  const [categories, t, tProduct] = await Promise.all([
    getCategories(),
    getTranslations({ locale, namespace: 'terms' }),
    getTranslations({ locale, namespace: 'product' }),
  ])

  const email = SITE_CONFIG.contact.email
  const formattedDate = new Date(LAST_UPDATED).toLocaleDateString(
    locale === 'it' ? 'it-IT' : 'en-GB',
    { day: 'numeric', month: 'long', year: 'numeric' }
  )
  const money = (n: number) =>
    n.toLocaleString(locale === 'it' ? 'it-IT' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const seller = {
    name: STORE_INFO.legalName,
    brand: SITE_CONFIG.brand.name,
    address: STORE_INFO.legalAddress,
    vat: STORE_INFO.vatNumber,
    rea: STORE_INFO.reaNumber,
    pec: STORE_INFO.pec,
    phone: STORE_INFO.phone,
    email,
    mail: (chunks: React.ReactNode) => <a href={`mailto:${email}`}>{chunks}</a>,
  }
  const { shipping } = SITE_CONFIG

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />
      <main className="bg-[#141412] flex-1">
        <DarkPageHeader title={t('title')} eyebrow={SITE_CONFIG.brand.name} homeLabel={tProduct('breadcrumbHome')} narrow>
          {t('lastUpdated', { date: formattedDate })}
        </DarkPageHeader>
        <div className="legal-prose max-w-3xl mx-auto px-4 pb-20 md:pb-28">
        <p>{t('intro', { site: 'kayaoutlet.com' })}</p>

        <h2>{t('seller.heading')}</h2>
        <p>{t.rich('seller.body', seller)}</p>

        <h2>{t('contract.heading')}</h2>
        <p>{t('contract.body')}</p>

        <h2>{t('prices.heading')}</h2>
        <p>{t('prices.body')}</p>

        <h2>{t('payment.heading')}</h2>
        <ul>
          {t.raw('payment.items').map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h2>{t('shipping.heading')}</h2>
        <p>
          {t('shipping.body', {
            standardCost: money(shipping.standardShippingCost),
            standardDays: shipping.estimatedDays.standard,
            expressCost: money(shipping.expressShippingCost),
            expressDays: shipping.estimatedDays.express,
            freeThreshold: money(shipping.freeShippingThreshold),
          })}
        </p>

        <h2>{t('withdrawal.heading')}</h2>
        <p>{t('withdrawal.intro')}</p>
        <ul>
          {(t.raw('withdrawal.items') as string[]).map((_, i) => (
            <li key={i}>{t.rich(`withdrawal.items.${i}`, seller)}</li>
          ))}
        </ul>
        <h3>{t('withdrawal.formHeading')}</h3>
        <p className="legal-box">{t('withdrawal.form', { name: seller.name, brand: seller.brand, address: seller.address, email })}</p>

        <h2>{t('warranty.heading')}</h2>
        <ul>
          {(t.raw('warranty.items') as string[]).map((_, i) => (
            <li key={i}>{t.rich(`warranty.items.${i}`, seller)}</li>
          ))}
        </ul>

        <h2>{t('law.heading')}</h2>
        <p>{t.rich('law.body', seller)}</p>

        <h2>{t('privacy.heading')}</h2>
        <p>
          {t.rich('privacy.body', {
            privacy: (chunks) => <Link href="/privacy">{chunks}</Link>,
          })}
        </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
