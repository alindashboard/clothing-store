import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { StoreGallery } from '@/components/store/store-gallery'
import { getCategories } from '@/lib/actions/categories'
import { STORE_INFO } from '@/lib/store-info'
import { SITE_CONFIG } from '@/lib/config'
import { MapPin, Phone, Mail } from 'lucide-react'
import { getAlternates } from '@/lib/seo/alternates'

interface MetaProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: MetaProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: t('store.title'),
    description: t('store.description'),
    alternates: getAlternates(locale, '/store'),
  }
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

/** Corner-bracket decoration used by the landing hero CTA, AddToCartButton, and this page's CTAs. */
function CornerBrackets({ color = '#D9B679', size = 10 }: { color?: string; size?: number }) {
  return (
    <>
      <span className="absolute top-0 left-0" style={{ width: size, height: size, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <span className="absolute top-0 right-0" style={{ width: size, height: size, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
      <span className="absolute bottom-0 left-0" style={{ width: size, height: size, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` }} />
      <span className="absolute bottom-0 right-0" style={{ width: size, height: size, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` }} />
    </>
  )
}

export default async function StorePage() {
  const [categories, t, tProduct] = await Promise.all([
    getCategories(),
    getTranslations('store'),
    getTranslations('product'),
  ])

  const siteUrl = SITE_CONFIG.brand.url
  const storeJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ClothingStore',
    name: STORE_INFO.name,
    url: siteUrl,
    telephone: STORE_INFO.phone,
    email: STORE_INFO.email,
    priceRange: '€€',
    image: `${siteUrl}/og-image.jpg`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Str. Acque Alte, 12',
      addressLocality: 'Borgo Podgora',
      postalCode: '04100',
      addressRegion: 'LT',
      addressCountry: 'IT',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: STORE_INFO.coordinates.latitude,
      longitude: STORE_INFO.coordinates.longitude,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '13:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '15:30',
        closes: '20:00',
      },
    ],
    sameAs: [STORE_INFO.instagram],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="bg-[#141412] flex-1">
        {/* Breadcrumb */}
        <div
          className="max-w-7xl mx-auto px-4 pt-6 text-xs tracking-wide"
          style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))', color: '#6b6862' }}
        >
          <span>{tProduct('breadcrumbHome')}</span>
          <span className="mx-2" style={{ color: '#3a3833' }}>/</span>
          <span style={{ color: '#c7c3b8' }}>{t('ourStore')}</span>
        </div>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 pt-7 pb-11 md:pb-14 mb-9 md:mb-16 border-b" style={{ borderColor: '#2B2924' }}>
          <p
            className="text-[10px] md:text-xs tracking-[0.3em] uppercase mb-2.5 md:mb-3.5"
            style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {SITE_CONFIG.brand.name}
          </p>
          <h1
            className="font-black uppercase leading-none text-[#EDE9E1] mb-3.5 md:mb-4.5"
            style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', fontSize: 'clamp(34px, 4.5vw, 56px)', letterSpacing: '-0.02em' }}
          >
            {t('ourStore')}
          </h1>
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: SITE_CONFIG.brand.darkAccent }} aria-hidden="true" />
            <span className="text-sm" style={{ color: '#a9a598' }}>{STORE_INFO.address}</span>
          </div>
        </section>

        {/* Contact + Hours */}
        <section className="max-w-7xl mx-auto px-4 pb-11 md:pb-14 grid grid-cols-1 md:grid-cols-2 gap-9 md:gap-16">
          {/* Contact */}
          <div>
            <p
              className="font-semibold text-xs tracking-[2px] mb-5 md:mb-6"
              style={{ color: '#EDE9E1', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {t('contactTitle').toUpperCase()}
            </p>

            <div className="flex gap-3.5 mb-5">
              <MapPin className="w-[18px] h-[18px] mt-0.5 shrink-0" style={{ color: SITE_CONFIG.brand.darkAccent }} aria-hidden="true" />
              <span className="text-sm leading-relaxed" style={{ color: '#c7c3b8' }}>{STORE_INFO.address}</span>
            </div>

            <div className="flex gap-3.5 mb-5">
              <Phone className="w-[18px] h-[18px] mt-0.5 shrink-0" style={{ color: SITE_CONFIG.brand.darkAccent }} aria-hidden="true" />
              <a href={`tel:${STORE_INFO.phone}`} className="text-sm hover:opacity-80 transition-opacity" style={{ color: '#c7c3b8' }}>
                {STORE_INFO.phone}
              </a>
            </div>

            <div className="flex gap-3.5">
              <Mail className="w-[18px] h-[18px] mt-0.5 shrink-0" style={{ color: SITE_CONFIG.brand.darkAccent }} aria-hidden="true" />
              <a href={`mailto:${STORE_INFO.email}`} className="text-sm hover:opacity-80 transition-opacity" style={{ color: '#c7c3b8' }}>
                {STORE_INFO.email}
              </a>
            </div>
          </div>

          {/* Opening hours */}
          <div>
            <p
              className="font-semibold text-xs tracking-[2px] mb-5 md:mb-6"
              style={{ color: '#EDE9E1', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {t('openingHours').toUpperCase()}
            </p>
            <div className="flex justify-between py-3.5 border-b" style={{ borderColor: '#2B2924' }}>
              <span className="text-sm" style={{ color: '#c7c3b8' }}>{t('weekdays')}</span>
              <span className="text-[13px]" style={{ color: '#EDE9E1', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}>
                {STORE_INFO.schedule.morning} · {STORE_INFO.schedule.afternoon}
              </span>
            </div>
            <div className="py-3.5">
              <span className="text-sm" style={{ color: '#6b6862' }}>{t('weekend')}</span>
            </div>
          </div>
        </section>

        {/* CTAs */}
        <section className="max-w-7xl mx-auto px-4 pb-11 md:pb-16 flex flex-col sm:flex-row gap-3">
          <a
            href={STORE_INFO.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative px-7 py-4 text-center hover:opacity-80 transition-opacity"
          >
            <CornerBrackets />
            <span
              className="font-semibold text-xs tracking-[1.5px]"
              style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {t('getDirections')} →
            </span>
          </a>
          <a
            href={STORE_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative px-7 py-4 flex items-center justify-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <CornerBrackets />
            <WhatsAppIcon className="w-[15px] h-[15px] text-[#EDE9E1]" />
            <span
              className="font-semibold text-xs tracking-[1.5px]"
              style={{ color: '#EDE9E1', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {t('whatsapp').toUpperCase()}
            </span>
          </a>
        </section>

        {/* In-store callout */}
        <section className="max-w-7xl mx-auto px-4 pb-16 md:pb-20">
          <div className="flex items-center gap-7 p-8 md:p-10" style={{ border: `1px solid ${SITE_CONFIG.brand.darkAccent}` }}>
            <div
              className="font-black leading-none shrink-0 hidden sm:block"
              style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', fontSize: '44px', color: SITE_CONFIG.brand.darkAccent }}
            >
              ＋
            </div>
            <div>
              <p
                className="font-black uppercase mb-2 text-lg"
                style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', color: '#EDE9E1', letterSpacing: '-0.01em' }}
              >
                {t('moreInStoreTitle')}
              </p>
              <p className="text-sm leading-relaxed max-w-[640px]" style={{ color: '#a9a598' }}>
                {t('moreInStoreDesc')}
              </p>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="max-w-7xl mx-auto px-4 pb-16 md:pb-20">
          <p
            className="text-xs tracking-[0.3em] uppercase mb-6"
            style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {t('gallery')}
          </p>
          <StoreGallery />
        </section>

        {/* Map */}
        <section className="max-w-7xl mx-auto px-4 pb-16 md:pb-20" aria-label="Store location map">
          <p
            className="text-xs tracking-[0.3em] uppercase mb-6"
            style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {t('findUs')}
          </p>
          <div className="h-[220px] md:h-[420px] overflow-hidden" style={{ border: '1px solid #2B2924' }}>
            <iframe
              src={STORE_INFO.googleMapsEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Map – ${STORE_INFO.name}`}
            />
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
