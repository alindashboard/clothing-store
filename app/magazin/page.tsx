import type { Metadata } from 'next'
import Image from 'next/image'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
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

export const metadata: Metadata = {
  title: `Magazin | ${SITE_CONFIG.brand.name}`,
  description: `Vizitează ${STORE_INFO.name} în ${STORE_INFO.address}. Program: L–V ${STORE_INFO.schedule.weekdays}, S ${STORE_INFO.schedule.saturday}.`,
}

const GALLERY = [
  { src: '/images/placeholder-product.svg', alt: 'Interior magazin KAYA Studio Outlet – zona de intrare' },
  { src: '/images/placeholder-product.svg', alt: 'Colecție expusă – rafturi cu haine premium' },
  { src: '/images/placeholder-product.svg', alt: 'Cabine de probă și zona de fitting' },
  { src: '/images/placeholder-product.svg', alt: 'Detaliu display – accesorii și piese selectate' },
]

export default async function MagazinPage() {
  const categories = await getCategories()
  const embedUrl = `https://maps.google.com/maps?q=${STORE_INFO.coordinates.lat},${STORE_INFO.coordinates.lng}&hl=ro&z=16&output=embed`

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="flex-1">

        {/* ── HERO MIC ────────────────────────────────────────────────── */}
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
              Magazinul nostru
            </h1>
            <p
              className="mt-4 text-sm font-light max-w-xs mx-auto"
              style={{ color: 'rgba(236,230,218,0.6)', fontFamily: 'var(--font-sans)' }}
            >
              Premium labels, outlet prices — în inima Clujului.
            </p>
          </div>
        </section>

        {/* ── HARTĂ ───────────────────────────────────────────────────── */}
        <section className="w-full" aria-label="Locație pe hartă">
          <iframe
            src={embedUrl}
            width="100%"
            height="400"
            style={{ border: 0, display: 'block' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Hartă ${STORE_INFO.name}`}
          />
        </section>

        {/* ── INFO ────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* Coloana stângă: adresă, telefon, email */}
            <div className="space-y-6">
              <h2
                className="text-2xl font-light tracking-tight text-[#111]"
                style={{ fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)' }}
              >
                Informații contact
              </h2>

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

            {/* Coloana dreaptă: program */}
            <div className="space-y-6">
              <h2
                className="text-2xl font-light tracking-tight text-[#111]"
                style={{ fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)' }}
              >
                Program
              </h2>

              <div className="flex items-start gap-3 text-sm text-gray-600">
                <Clock className="w-4 h-4 mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                <div className="space-y-2">
                  <div className="flex justify-between gap-8">
                    <span className="font-medium text-gray-800">Luni–Vineri</span>
                    <span>{STORE_INFO.schedule.weekdays}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="font-medium text-gray-800">Sâmbătă</span>
                    <span>{STORE_INFO.schedule.saturday}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="font-medium text-gray-800">Duminică</span>
                    <span className="text-gray-400">{STORE_INFO.schedule.sunday}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buton direcții */}
          <div className="mt-10">
            <a
              href={STORE_INFO.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-10 py-4 text-xs tracking-[0.24em] uppercase font-medium bg-black text-white hover:bg-gray-800 transition-colors"
            >
              <MapPin className="w-4 h-4" aria-hidden="true" />
              Obține direcții
            </a>
          </div>
        </section>

        {/* ── GALERIE ─────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <h2
            className="text-2xl font-light tracking-tight text-[#111] mb-6"
            style={{ fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)' }}
          >
            Galerie
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {GALLERY.map((item, i) => (
              <div key={i} className="relative aspect-square bg-gray-100 overflow-hidden">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Fotografii din magazin — în curând.
          </p>
        </section>

      </main>

      <Footer />
    </>
  )
}
