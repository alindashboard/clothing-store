import { getTranslations } from 'next-intl/server'
import { PhoneFrame } from './phone-frame'
import { STORE_INFO } from '@/lib/store-info'
import { SITE_CONFIG } from '@/lib/config'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export async function InstagramSection() {
  const t = await getTranslations('instagram')
  const accent = SITE_CONFIG.brand.darkAccent
  return (
    <section className="py-16 px-4 bg-[#141412]">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-12 md:gap-16">

          {/* Text column */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-3"
              style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))', color: accent }}
            >
              Instagram
            </p>
            <h2
              className="text-3xl md:text-4xl font-black tracking-tight text-[#EDE9E1]"
              style={{ fontFamily: 'var(--font-archivo, var(--font-sans))' }}
            >
              {t('followUs')}
            </h2>
            <p className="text-sm text-[#8C8577] mt-4 mb-8 leading-relaxed max-w-sm">
              {t('tagline')}
            </p>
            <a
              href={STORE_INFO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-medium bg-[#0A0A0A] text-[#EDE9E1] hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              <InstagramIcon className="w-3.5 h-3.5" />
              {STORE_INFO.instagramHandle}
            </a>
          </div>

          {/* Phone column */}
          <div className="flex justify-center">
            <div className="w-[240px] md:w-[220px]">
              <PhoneFrame imageSrc="/images/screenshot.png" />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
