import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { CartPageClient } from '@/components/cart/cart-page-client'
import { getCategories } from '@/lib/actions/categories'

export default async function CartPage() {
  const categories = await getCategories()

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <CartPageClient />

      <Footer />
    </>
  )
}
