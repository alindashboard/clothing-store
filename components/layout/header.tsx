'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { MobileNav } from './mobile-nav'
import type { Category } from '@/lib/types'
import { SITE_CONFIG } from '@/lib/config'

interface HeaderProps {
  categories: Category[]
}

export function Header({ categories }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { getItemCount, openCart } = useCartStore()
  const count = getItemCount()

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Mobile: hamburger */}
        <button
          className="lg:hidden p-2 -ml-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <Link
          href="/"
          className="text-sm font-semibold tracking-[0.2em] uppercase absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
        >
          {SITE_CONFIG.brand.name}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6 flex-1">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="text-xs font-medium tracking-widest uppercase text-gray-600 hover:text-black transition-colors"
            >
              {cat.name}
            </Link>
          ))}
          <Link
            href="/products"
            className="text-xs font-medium tracking-widest uppercase text-gray-600 hover:text-black transition-colors"
          >
            All
          </Link>
          <Link
            href="/new-arrivals"
            className="text-xs font-medium tracking-widest uppercase transition-colors"
            style={{ color: '#c2a04a' }}
          >
            New Arrivals
          </Link>
        </nav>

        {/* Cart */}
        <button
          onClick={openCart}
          className="relative p-2 -mr-2"
          aria-label={`Cart (${count} items)`}
        >
          <ShoppingBag className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </div>

      <MobileNav
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categories}
      />
    </header>
  )
}
