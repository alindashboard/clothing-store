import type { Metadata } from 'next'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { StoreGallery } from '@/components/magazin/store-gallery'
import { getCategories } from '@/lib/actions/categories'
import { STORE_INFO } from '@/lib/store-info'
import { SITE_CONFIG } from '@/lib/config'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export const metadata: Metadata = {
  title: `Store / Magazin | ${SITE_CONFIG.brand.name}`,
  description: `Visit ${STORE_INFO.name} at ${STORE_INFO.address}. Open Mon–Fri ${STORE_INFO.schedule.morning} & ${STORE_INFO.schedule.afternoon}.`,
}

export default async function MagazinPage() {
  const categories = await getCategories()

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="flex-1">

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section
          className="relative flex items-center justify-center py-20 px-4"
          style={{ background: '#0b0b0c', minHeight: 260 }}
        >
          <div className="text-center z-10">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-4"
              style={{ fontFamily: 'var(--font-sans)', color: '#c2a04a' }}
            >
              KAYA Studio Outlet
            </p>
            <h1
              className="text-4xl md:text-5xl font-light tracking-tight text-white"
              style={{ fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)' }}
            >
              Our Store
            </h1>
            <p
              className="mt-2 text-lg font-light italic"
              style={{
                fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
                color: 'rgba(236,230,218,0.55)',
              }}
            >
              Magazinul nostru
            </p>
            <p
              className="mt-4 text-sm font-light max-w-xs mx-auto"
              style={{ color: 'rgba(236,230,218,0.45)', fontFamily: 'var(--font-sans)' }}
            >
              {STORE_INFO.address}
            </p>
          </div>
        </section>

        {/* ── INFO ────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Contact */}
            <div className="space-y-6">
              <div>
                <h2
                  className="text-2xl font-light tracking-tight text-[#111]"
                  style={{ fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)' }}
                >
                  Contact
                </h2>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                  Informații contact
                </p>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                <span>{STORE_INFO.address}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 shrink-0 text-gray-400" aria-hidden="true" />
                <a
                  href={`tel:${STORE_INFO.phone}`}
                  className="text-gray-700 hover:text-black transition-colors underline underline-offset-2"
                >
                  {STORE_INFO.phone}
                </a>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 shrink-0 text-gray-400" aria-hidden="true" />
                <a
                  href={`mailto:${STORE_INFO.email}`}
                  className="text-gray-700 hover:text-black transition-colors underline underline-offset-2"
                >
                  {STORE_INFO.email}
                </a>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <InstagramIcon className="w-4 h-4 shrink-0 text-gray-400" />
                <a
                  href={STORE_INFO.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-black transition-colors underline underline-offset-2"
                >
                  {STORE_INFO.instagramHandle}
                </a>
              </div>
            </div>

            {/* Opening hours */}
            <div className="space-y-6">
              <div>
                <h2
                  className="text-2xl font-light tracking-tight text-[#111]"
                  style={{ fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)' }}
                >
                  Opening Hours
                </h2>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                  Program
                </p>
              </div>

              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                <div className="space-y-2 w-full">
                  <div>
                    <p className="font-medium text-gray-800">{STORE_INFO.schedule.weekdaysLabel}</p>
                    <p className="mt-0.5">
                      {STORE_INFO.schedule.morning}
                      <span className="text-gray-400 mx-2">·</span>
                      {STORE_INFO.schedule.afternoon}
                    </p>
                  </div>
                  <p className="text-gray-400 text-xs pt-1 border-t border-gray-100">
                    {STORE_INFO.schedule.weekend}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <a
              href={STORE_INFO.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 text-xs tracking-[0.24em] uppercase font-medium bg-black text-white hover:bg-gray-800 transition-colors"
            >
              <MapPin className="w-4 h-4" aria-hidden="true" />
              Get Directions / Obține direcții
            </a>
            <a
              href={STORE_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 text-xs tracking-[0.24em] uppercase font-medium border border-black text-black hover:bg-black hover:text-white transition-colors"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Chat on WhatsApp / Scrie-ne pe WhatsApp
            </a>
          </div>
        </section>

        {/* ── IN-STORE CALLOUT ────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 pb-10">
          <div
            className="px-6 py-5 rounded-lg"
            style={{
              borderLeft: '3px solid #c2a04a',
              background: 'linear-gradient(to right, rgba(194,160,74,0.07), transparent)',
            }}
          >
            <p className="text-sm font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-sans)' }}>
              More in store than online
            </p>
            <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: 'var(--font-sans)' }}>
              Many of our pieces are exclusive to the physical store. Visit us to discover the full collection.
            </p>
          </div>
        </section>

        {/* ── GALLERY ─────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="mb-6">
            <h2
              className="text-2xl font-light tracking-tight text-[#111]"
              style={{ fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)' }}
            >
              Gallery
            </h2>
            <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
              Galerie
            </p>
          </div>
          <StoreGallery />
        </section>

        {/* ── MAP ─────────────────────────────────────────────────────── */}
        <section className="pb-20" aria-label="Store location map / Hartă locație magazin">
          <div className="max-w-5xl mx-auto px-4">
            <div className="overflow-hidden rounded-2xl shadow-md border border-gray-100">
              <iframe
                src={STORE_INFO.googleMapsEmbedUrl}
                width="100%"
                height="400"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map – ${STORE_INFO.name}`}
              />
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
