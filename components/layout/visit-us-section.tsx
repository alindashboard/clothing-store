import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { MapPin, Clock } from 'lucide-react'
import { STORE_INFO } from '@/lib/store-info'
import { SITE_CONFIG } from '@/lib/config'

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

export async function VisitUsSection() {
  const t = await getTranslations('store')
  const accent = SITE_CONFIG.brand.darkAccent

  return (
    <section className="relative bg-[#1B1917] py-16 px-4">
      {/* Mobile-only background image */}
      <div className="absolute inset-0 md:hidden" aria-hidden="true">
        <Image
          src="/store-background.png"
          alt=""
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#1B1917]/85" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Text + buttons */}
          <div>
            <p
              className="text-xs tracking-[0.3em] uppercase mb-3"
              style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))', color: accent }}
            >
              {t('physicalStore')}
            </p>
            <h2
              className="text-3xl md:text-4xl font-black tracking-tight text-[#EDE9E1]"
              style={{ fontFamily: 'var(--font-archivo, var(--font-sans))' }}
            >
              {t('visitUs')}
            </h2>
            <p
              className="text-sm mt-1 mb-8 text-[#8C8577]"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {t('subtitle')}
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 text-sm text-[#c7c3b8]">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} aria-hidden="true" />
                <span>{STORE_INFO.address}</span>
              </div>

              <div className="flex items-start gap-3 text-sm text-[#c7c3b8]">
                <Clock className="w-4 h-4 mt-1 shrink-0" style={{ color: accent }} aria-hidden="true" />
                <div className="space-y-1">
                  <p>
                    <span className="font-medium text-[#EDE9E1]">{t('weekdays')}:</span>
                  </p>
                  <p>
                    {STORE_INFO.schedule.morning}{' '}
                    <span className="text-[#6b6862] mx-1">·</span>{' '}
                    {STORE_INFO.schedule.afternoon}
                  </p>
                  <p className="text-[#6b6862] text-xs mt-1">{t('weekend')}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={STORE_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-medium transition-opacity hover:opacity-80"
                style={{ background: accent, color: '#141412', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {t('getDirections')} →
              </a>
              <a
                href={STORE_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-medium border border-[#EDE9E1] text-[#EDE9E1] hover:bg-[#EDE9E1] hover:text-[#141412] transition-colors"
                style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <Link
                href="/store"
                className="inline-flex items-center justify-center px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-medium border border-[#2B2924] text-[#8C8577] hover:border-[#EDE9E1] hover:text-[#EDE9E1] transition-colors"
                style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {t('storeDetails')}
              </Link>
            </div>
          </div>

          {/* Store image */}
          <div className="hidden md:block">
            <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', maxHeight: '400px' }}>
              <Image
                src="/store-background.png"
                alt="KAYA Studio Outlet store"
                fill
                className="object-cover"
                style={{ filter: 'contrast(1.1) brightness(0.95) saturate(1.05)' }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
