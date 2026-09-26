import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { CookiePreferencesLink } from '@/components/consent/cookie-preferences-link'
import { SITE_CONFIG } from '@/lib/config'
import { STORE_INFO } from '@/lib/store-info'
import { KayaMark } from './kaya-mark'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

// Simple Icons "TikTok" glyph (CC0), inlined to avoid a dependency.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

export async function Footer() {
  const { brand, contact, social } = SITE_CONFIG
  const t = await getTranslations('footer')

  return (
    <footer className="bg-[#0A0A0A] text-[#EDE9E1]">
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3">
              <KayaMark textClassName="text-base" />
            </div>
            <p className="text-xs text-[#6b6862] leading-relaxed max-w-[220px]">{brand.tagline}</p>
          </div>

          {/* Store */}
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase text-[#8C8577] mb-3"
              style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {t('store')}
            </p>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-xs text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors">{t('allProducts')}</Link></li>
              <li><Link href="/new-arrivals" className="text-xs text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors">{t('newArrivals')}</Link></li>
              <li><Link href="/contact" className="text-xs text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors">{t('contact')}</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase text-[#8C8577] mb-3"
              style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {t('info')}
            </p>
            <ul className="space-y-2">
              <li><Link href="/store" className="text-xs text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors">{t('storeLink')}</Link></li>
              <li><Link href="/terms" className="text-xs text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors">{t('terms')}</Link></li>
              <li><Link href="/privacy" className="text-xs text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors">{t('privacy')}</Link></li>
              <li><CookiePreferencesLink className="text-xs text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors text-left" /></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase text-[#8C8577] mb-3"
              style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {t('contact')}
            </p>
            <ul className="space-y-2">
              <li>
                <a href={`mailto:${contact.email}`} className="text-xs text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors">
                  {contact.email}
                </a>
              </li>
              {contact.phone && (
                <li>
                  <a href={`tel:${contact.phone}`} className="text-xs text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors">
                    {contact.phone}
                  </a>
                </li>
              )}
            </ul>
            {(social.instagram || social.tiktok || social.facebook) && (
              <div className="flex flex-col gap-2 mt-4">
                {social.instagram && (
                  <a
                    href={social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#8C8577] hover:text-[#EDE9E1] transition-colors"
                  >
                    <InstagramIcon className="w-3.5 h-3.5" />
                    {STORE_INFO.instagramHandle}
                  </a>
                )}
                {social.tiktok && (
                  <a
                    href={social.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-[#8C8577] hover:text-[#EDE9E1] transition-colors"
                  >
                    <TikTokIcon className="w-3.5 h-3.5" />
                    {STORE_INFO.tiktokHandle}
                  </a>
                )}
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8C8577] hover:text-[#EDE9E1] transition-colors">
                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#201f1c] mt-10 pt-6 flex flex-col md:flex-row justify-between gap-3 items-center">
          <div className="flex flex-col gap-1 text-center md:text-left">
            <p className="text-xs text-[#5a5852]">© {new Date().getFullYear()} {brand.name}. {t('allRightsReserved')}</p>
            {/* Seller identity + VAT number: required on the site by art. 35 DPR 633/72 and art. 7 D.Lgs. 70/2003. */}
            <p className="text-[11px] leading-relaxed text-[#5a5852]">
              {t('legalLine', {
                brand: brand.name,
                name: STORE_INFO.legalName,
                address: STORE_INFO.legalAddress,
                vat: STORE_INFO.vatNumber,
                rea: STORE_INFO.reaNumber,
              })}
            </p>
          </div>
          <a href="/admin" className="text-xs text-[#3d3b37] hover:text-[#6b6862] transition-colors">Admin</a>
        </div>
      </div>
    </footer>
  )
}
