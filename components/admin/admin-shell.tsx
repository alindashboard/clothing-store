'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, Package, ShoppingCart, Tag, MessageSquare, ExternalLink, Sparkles } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package, exact: false },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, exact: false },
  { href: '/admin/categories', label: 'Categories', icon: Tag, exact: false },
  { href: '/admin/new-arrivals', label: 'New Arrivals', icon: Sparkles, exact: false },
  { href: '/admin/contacts', label: 'Contacts', icon: MessageSquare, exact: false },
]

function SidebarContent({ pathname, brandName, onNavigate }: { pathname: string; brandName: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2.5 text-sm rounded transition-colors ${
                active ? 'bg-black text-white' : 'text-gray-600 hover:text-black hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-700 rounded transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> View Store
        </Link>
      </div>
    </>
  )
}

export function AdminShell({ children, brandName }: { children: React.ReactNode; brandName: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const header = (
    <div className="px-5 py-5 border-b border-gray-100 shrink-0">
      <p className="text-xs font-semibold tracking-[0.2em] uppercase">{brandName}</p>
      <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar — fixed */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-gray-200 fixed top-0 left-0 h-full z-30">
        {header}
        <SidebarContent pathname={pathname} brandName={brandName} />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 flex flex-col transform transition-transform duration-200 md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase">{brandName}</p>
            <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SidebarContent pathname={pathname} brandName={brandName} onNavigate={() => setOpen(false)} />
      </aside>

      {/* Content area */}
      <div className="flex-1 min-w-0 md:ml-56">
        {/* Mobile topbar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setOpen(true)}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold tracking-[0.15em] uppercase">{brandName}</span>
        </div>

        {children}
      </div>
    </div>
  )
}
