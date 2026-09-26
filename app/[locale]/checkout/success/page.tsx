import { getTranslations } from 'next-intl/server'
import { CheckCircle } from 'lucide-react'
import { KayaCta } from '@/components/layout/kaya-cta'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Footer } from '@/components/layout/footer'
import { getCategories } from '@/lib/actions/categories'
import { getOrderByNumber } from '@/lib/actions/orders'
import { Header } from '@/components/layout/header'
import { TrackPurchase } from '@/components/analytics/track-purchase'
import { BankTransferPanel } from '@/components/checkout/bank-transfer-panel'
import { SITE_CONFIG } from '@/lib/config'

interface Props {
  searchParams: Promise<{ order?: string; email?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order, email } = await searchParams
  const [categories, t, orderRecord] = await Promise.all([
    getCategories(),
    getTranslations('checkout'),
    order ? getOrderByNumber(order) : Promise.resolve(null),
  ])

  const isStripePending = orderRecord?.payment_method === 'stripe' && orderRecord.payment_status !== 'paid'

  const stripeOrder =
    orderRecord?.payment_method === 'stripe' && orderRecord.payment_status === 'paid'
      ? {
          orderNumber: orderRecord.order_number,
          value: orderRecord.total,
          currency: orderRecord.currency,
          numItems: orderRecord.items.reduce((sum, i) => sum + i.quantity, 0),
          contents: orderRecord.items.map((i) => ({ id: i.product_id, quantity: i.quantity, item_price: i.unit_price })),
          paymentMethod: 'stripe',
        }
      : undefined

  return (
    <>
      <TrackPurchase stripeOrder={stripeOrder} />
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="dark kaya-dark flex-1 flex items-center justify-center px-4 py-20 md:py-28">
        <div className={`text-center ${orderRecord?.payment_method === 'bank_transfer' ? 'max-w-lg' : 'max-w-md'}`}>
          <CheckCircle className="w-14 h-14 mx-auto mb-6" style={{ color: SITE_CONFIG.brand.darkAccent }} strokeWidth={1.5} />
          <h1
            className="font-black uppercase leading-none text-[#EDE9E1] mb-4"
            style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.02em' }}
          >
            {t('orderConfirmed')}
          </h1>
          {order && (
            <p className="text-sm text-[#8C8577] mb-4">
              {t('orderNumber')}: <span className="font-semibold text-[#EDE9E1]">{order}</span>
            </p>
          )}
          {isStripePending ? (
            <p className="text-sm text-[#8C8577] mb-8">{t('paymentProcessing')}</p>
          ) : email ? (
            <p className="text-sm text-[#8C8577] mb-8">
              {t('confirmationEmail')} <strong className="text-[#EDE9E1]">{email}</strong>
            </p>
          ) : (
            <p className="text-sm text-[#8C8577] mb-8">
              {t('confirmationSoon')}<br />
              {t('questionsContact')}{' '}
              <a href={`mailto:${SITE_CONFIG.contact.email}`} className="underline underline-offset-4" style={{ color: SITE_CONFIG.brand.darkAccent }}>
                {SITE_CONFIG.contact.email}
              </a>
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <KayaCta href="/products" variant="outline">{t('continueShopping')}</KayaCta>
          </div>

          {orderRecord?.payment_method === 'bank_transfer' && (
            <BankTransferPanel
              orderNumber={orderRecord.order_number}
              total={orderRecord.total}
              currency={orderRecord.currency}
            />
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
