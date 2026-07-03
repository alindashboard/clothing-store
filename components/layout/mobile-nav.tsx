'use client'

import { X, ShoppingBag, User } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { Category } from '@/lib/types'
import { useCartStore } from '@/lib/store/cart'
import { SITE_CONFIG } from '@/lib/config'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from './language-switcher'
import { KayaMark } from './kaya-mark'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
}

export function MobileNav({ isOpen, onClose, categories }: MobileNavProps) {
  const { getItemCount, openCart } = useCartStore()
  const count = getItemCount()
  const t = useTranslations('nav')
  const accent = SITE_CONFIG.brand.darkAccent

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="flex flex-col w-72 p-0 bg-[#141412] border-[#2B2924] text-[#EDE9E1]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2B2924]">
          <Link href="/" onClick={onClose} aria-label={SITE_CONFIG.brand.name}>
            <KayaMark size={30} textClassName="text-base" />
          </Link>
          <button onClick={onClose} className="p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-6">
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/category/${cat.slug}`}
                  onClick={onClose}
                  className="block py-2.5 text-sm font-medium tracking-wider uppercase text-[#c7c3b8] hover:text-[#EDE9E1] border-b border-[#201f1c] hover:border-[#2B2924] transition-colors"
                  style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/products"
                onClick={onClose}
                className="block py-2.5 text-sm font-medium tracking-wider uppercase text-[#c7c3b8] hover:text-[#EDE9E1] border-b border-[#201f1c] hover:border-[#2B2924] transition-colors"
                style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {t('allProducts')}
              </Link>
            </li>
            <li>
              <Link
                href="/new-arrivals"
                onClick={onClose}
                className="block py-2.5 text-sm font-medium tracking-wider uppercase"
                style={{ color: accent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {t('newArrivals')}
              </Link>
            </li>
            <li>
              <Link
                href="/events"
                onClick={onClose}
                className="block py-2.5 text-sm font-medium tracking-wider uppercase text-[#c7c3b8] hover:text-[#EDE9E1] border-b border-[#201f1c] hover:border-[#2B2924] transition-colors"
                style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {t('events')}
              </Link>
            </li>
            <li>
              <Link
                href="/store"
                onClick={onClose}
                className="block py-2.5 text-sm font-medium tracking-wider uppercase text-[#c7c3b8] hover:text-[#EDE9E1] border-b border-[#201f1c] hover:border-[#2B2924] transition-colors"
                style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
              >
                {t('store')}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="px-5 py-4 border-t border-[#2B2924] space-y-2">
          <div className="py-2">
            <LanguageSwitcher />
          </div>
          <button
            onClick={() => { onClose(); openCart() }}
            className="flex items-center gap-3 w-full py-2 text-sm text-[#c7c3b8] hover:text-[#EDE9E1]"
          >
            <ShoppingBag className="w-4 h-4" />
            {t('cart')} {count > 0 && `(${count})`}
          </button>
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3 py-2 text-sm text-[#6b6862] hover:text-[#8C8577]"
          >
            <User className="w-4 h-4" />
            {t('admin')}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
