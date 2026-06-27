import { PhoneFrame } from './phone-frame'
import { STORE_INFO } from '@/lib/store-info'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function InstagramSection() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-12 md:gap-16">

          {/* Text column */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <p
              className="text-xs tracking-[0.3em] uppercase mb-3 text-stone-400"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Instagram
            </p>
            <h2
              className="text-3xl md:text-4xl font-light tracking-tight text-[#111]"
              style={{ fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)' }}
            >
              Follow us
            </h2>
            <p className="text-sm font-light text-gray-500 mt-4 mb-8 leading-relaxed max-w-sm">
              New drops, behind the scenes, and outfit inspiration — straight to your feed.
            </p>
            <a
              href={STORE_INFO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-medium bg-black text-white hover:bg-gray-800 transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <InstagramIcon className="w-3.5 h-3.5" />
              {STORE_INFO.instagramHandle}
            </a>
          </div>

          {/* Phone column */}
          <div className="flex justify-center">
            <div className="w-[240px] md:w-[220px]">
              <PhoneFrame imageSrc="/images/screenshot.jpg" />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
