import type { Metadata } from 'next'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { MapPin, Globe } from 'lucide-react'
import { format } from 'date-fns'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getCategories } from '@/lib/actions/categories'
import { getPublishedEvents } from '@/lib/actions/events'
import { SITE_CONFIG } from '@/lib/config'
import type { Event } from '@/lib/types'

import { getAlternates } from '@/lib/seo/alternates'

export const dynamic = 'force-dynamic'

interface MetaProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: MetaProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    title: t('events.title'),
    description: t('events.description'),
    alternates: getAlternates(locale, '/events'),
  }
}

function EventCard({ event, isUpcoming, labels }: {
  event: Event
  isUpcoming: boolean
  labels: { upcoming: string; past: string; online: string; noImage: string }
}) {
  const date = new Date(event.event_date)
  const formattedDate = format(date, "EEEE, MMMM d, yyyy · HH:mm")

  return (
    <div className="flex flex-col bg-white border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-300 text-xs uppercase tracking-widest">{labels.noImage}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span
            className={`text-[10px] font-bold tracking-[0.15em] uppercase px-2 py-1 ${
              isUpcoming ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {isUpcoming ? labels.upcoming : labels.past}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-semibold text-base leading-tight mb-2">{event.title}</h3>
        <p className="text-xs text-gray-500 mb-1.5">{formattedDate}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          {event.is_online ? (
            <><Globe className="w-3 h-3 shrink-0" /> {labels.online}</>
          ) : (
            <><MapPin className="w-3 h-3 shrink-0" /> {event.location}</>
          )}
        </p>
        {event.description && (
          <p className="text-sm text-gray-600 line-clamp-3 flex-1 mb-4">{event.description}</p>
        )}
        {isUpcoming && event.cta_label && event.cta_url && (
          <a
            href={event.cta_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-block px-4 py-2 bg-black text-white text-xs font-medium tracking-widest uppercase text-center hover:bg-gray-800 transition-colors"
          >
            {event.cta_label}
          </a>
        )}
      </div>
    </div>
  )
}

export default async function EventsPage() {
  const [categories, { upcoming, past }, t] = await Promise.all([
    getCategories(),
    getPublishedEvents(),
    getTranslations('events'),
  ])

  const tCommon = await getTranslations('common')
  const labels = {
    upcoming: t('upcomingBadge'),
    past: t('pastBadge'),
    online: tCommon('online'),
    noImage: tCommon('noImage'),
  }

  return (
    <>
      <AnnouncementBar />
      <Header categories={categories} />

      <main className="flex-1">
        <section
          className="flex flex-col items-center justify-center py-16 px-4 text-center"
          style={{ background: '#0b0b0c', minHeight: 200 }}
        >
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-[0.1em] uppercase"
            style={{ color: '#ece6da' }}
          >
            Events
          </h1>
          <p
            className="mt-3 text-base font-light"
            style={{
              fontFamily: 'var(--font-serif, "Cormorant Garamond", Georgia, serif)',
              fontStyle: 'italic',
              color: 'rgba(236,230,218,0.55)',
            }}
          >
            {t('heroDesc')}
          </p>
        </section>

        <div className="max-w-7xl mx-auto px-4 py-12 pb-24 space-y-16">
          <section>
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-6">{t('upcoming')}</h2>
            {upcoming.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} isUpcoming={true} labels={labels} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-8">
                {t('noUpcoming')}{' '}
                <a
                  href={SITE_CONFIG.social?.instagram ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-black transition-colors"
                >
                  {t('followUs')}
                </a>{' '}
                {t('forAnnouncements')}
              </p>
            )}
          </section>

          <section>
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-gray-400 mb-6">{t('past')}</h2>
            {past.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} isUpcoming={false} labels={labels} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-8">{t('noPast')}</p>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
