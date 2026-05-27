import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getCategories } from '@/lib/actions/categories'
import { SITE_CONFIG } from '@/lib/config'

export const metadata = { title: `Privacy Policy | ${SITE_CONFIG.brand.name}` }

export default async function PrivacyPage() {
  const categories = await getCategories()
  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />
      <main className="max-w-2xl mx-auto px-4 py-16 flex-1 prose prose-sm">
        <h1>Privacy Policy</h1>
        <p className="text-gray-500">Last updated: {new Date().toLocaleDateString('en-GB')}</p>
        <p>This page is a placeholder. Please add your privacy policy here.</p>
        <h2>Data We Collect</h2>
        <p>We collect your name, email, shipping address, and order information to process your orders.</p>
        <h2>How We Use Your Data</h2>
        <p>Your data is used solely to process orders, send order confirmations, and improve our service.</p>
        <h2>Contact</h2>
        <p>For privacy inquiries, contact us at <a href={`mailto:${SITE_CONFIG.contact.email}`}>{SITE_CONFIG.contact.email}</a>.</p>
      </main>
      <Footer />
    </>
  )
}
