'use client'

import Link from 'next/link'
import { X, ShoppingBag, User } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import type { Category } from '@/lib/types'
import { useCartStore } from '@/lib/store/cart'
import { SITE_CONFIG } from '@/lib/config'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  categories: Category[]
}

export function MobileNav({ isOpen, onClose, categories }: MobileNavProps) {
  const { getItemCount, openCart } = useCartStore()
  const count = getItemCount()

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="flex flex-col w-72 p-0">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <Link href="/" onClick={onClose} className="text-base font-semibold tracking-widest uppercase">
            {SITE_CONFIG.brand.name}
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
                  className="block py-2.5 text-sm font-medium tracking-wider uppercase text-gray-800 hover:text-black border-b border-gray-50 hover:border-gray-200 transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/products"
                onClick={onClose}
                className="block py-2.5 text-sm font-medium tracking-wider uppercase text-gray-800 hover:text-black"
              >
                All Products
              </Link>
            </li>
          </ul>
        </nav>

        <div className="px-5 py-4 border-t border-gray-100 space-y-2">
          <button
            onClick={() => { onClose(); openCart() }}
            className="flex items-center gap-3 w-full py-2 text-sm text-gray-700 hover:text-black"
          >
            <ShoppingBag className="w-4 h-4" />
            Cart {count > 0 && `(${count})`}
          </button>
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-3 py-2 text-sm text-gray-400 hover:text-gray-700"
          >
            <User className="w-4 h-4" />
            Admin
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
