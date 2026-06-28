import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'

export const metadata = { title: `Terms & Conditions | ${SITE_CONFIG.brand.name}` }

export default async function TermsPage() {
  const categories = await getCategories()
  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />
      <main className="max-w-2xl mx-auto px-4 py-16 flex-1 prose prose-sm">
        <h1>Terms &amp; Conditions</h1>
        <p className="text-gray-500">Last updated: {new Date().toLocaleDateString('en-GB')}</p>
        <p>This page is a placeholder. Please add your terms and conditions here.</p>
        <h2>Orders</h2>
        <p>All orders are subject to availability. We reserve the right to cancel orders.</p>
        <h2>Returns</h2>
        <p>Returns are accepted within 14 days of delivery. Items must be unworn and in original condition.</p>
        <h2>Shipping</h2>
        <p>Standard shipping takes {SITE_CONFIG.shipping.estimatedDays.standard} business days. Free shipping on orders over €{SITE_CONFIG.shipping.freeShippingThreshold}.</p>
      </main>
      <Footer />
    </>
  )
}
