import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CheckoutPageClient } from '@/components/checkout/checkout-page-client'
import { getCategories } from '@/lib/actions/categories'

export default async function CheckoutPage() {
  const categories = await getCategories()

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <CheckoutPageClient />

      <Footer />
    </>
  )
}
