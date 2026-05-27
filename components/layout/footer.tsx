import Link from 'next/link'
import { SITE_CONFIG } from '@/lib/config'

export function Footer() {
  const { brand, contact, social } = SITE_CONFIG
  return (
    <footer className="bg-black text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <p className="text-sm font-semibold tracking-[0.2em] uppercase mb-3">{brand.name}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{brand.tagline}</p>
          </div>

          {/* Store */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Store</p>
            <ul className="space-y-2">
              <li><Link href="/products" className="text-xs text-gray-300 hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/category/new-arrivals" className="text-xs text-gray-300 hover:text-white transition-colors">New Arrivals</Link></li>
              <li><Link href="/category/sale" className="text-xs text-gray-300 hover:text-white transition-colors">Sale</Link></li>
              <li><Link href="/contact" className="text-xs text-gray-300 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Policy */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Info</p>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-xs text-gray-300 hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="text-xs text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Contact</p>
            <ul className="space-y-2">
              <li>
                <a href={`mailto:${contact.email}`} className="text-xs text-gray-300 hover:text-white transition-colors">
                  {contact.email}
                </a>
              </li>
              {contact.phone && (
                <li>
                  <a href={`tel:${contact.phone}`} className="text-xs text-gray-300 hover:text-white transition-colors">
                    {contact.phone}
                  </a>
                </li>
              )}
            </ul>
            {(social.instagram || social.facebook) && (
              <div className="flex gap-3 mt-4">
                {social.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-white transition-colors">
                    Instagram
                  </a>
                )}
                {social.facebook && (
                  <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-white transition-colors">
                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between gap-3 items-center">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} {brand.name}. All rights reserved.</p>
          <Link href="/admin" className="text-xs text-gray-700 hover:text-gray-500 transition-colors">Admin</Link>
        </div>
      </div>
    </footer>
  )
}
