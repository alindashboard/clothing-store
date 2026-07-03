import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
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

export async function Footer() {
  const { brand, contact, social } = SITE_CONFIG
  const t = await getTranslations('footer')

  return (
    <footer className="bg-[#0A0A0A] text-[#EDE9E1] mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3">
              <KayaMark size={30} textClassName="text-base" />
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
              <li><Link href="/category/sale" className="text-xs text-[#c7c3b8] hover:text-[#EDE9E1] transition-colors">{t('sale')}</Link></li>
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
            {(social.instagram || social.facebook) && (
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
          <p className="text-xs text-[#5a5852]">© {new Date().getFullYear()} {brand.name}. {t('allRightsReserved')}</p>
          <a href="/admin" className="text-xs text-[#3d3b37] hover:text-[#6b6862] transition-colors">Admin</a>
        </div>
      </div>
    </footer>
  )
}
