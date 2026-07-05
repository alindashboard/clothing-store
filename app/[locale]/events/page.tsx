import type { Metadata } from 'next'
import Image from 'next/image'
import { MapPin, Globe, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { getTranslations } from 'next-intl/server'
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { getCategories } from '@/lib/actions/categories'
import { getPublishedEvents } from '@/lib/actions/events'
import { SITE_CONFIG } from '@/lib/config'
import { CornerBrackets } from '@/components/layout/corner-brackets'
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
  const accent = SITE_CONFIG.brand.darkAccent

  return (
    <div>
      <div className="relative aspect-video overflow-hidden mb-5" style={{ background: '#1B1917' }}>
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            style={{
              filter: isUpcoming
                ? 'contrast(1.1) brightness(0.95) saturate(1.05)'
                : 'contrast(1.05) brightness(0.55) saturate(0.5)',
            }}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs uppercase tracking-widest" style={{ color: '#5a5852' }}>{labels.noImage}</span>
          </div>
        )}
        <span
          className="absolute top-3 left-3 font-semibold text-[9.5px] tracking-[1.5px] uppercase px-2.5 py-1.5"
          style={
            isUpcoming
              ? { background: accent, color: '#141412', fontFamily: 'var(--font-grotesk, var(--font-sans))' }
              : { background: '#232320', color: '#8C8577', border: '1px solid #33312b', fontFamily: 'var(--font-grotesk, var(--font-sans))' }
          }
        >
          {isUpcoming ? labels.upcoming : labels.past}
        </span>
      </div>

      <p
        className="text-[11px] tracking-[1.5px] mb-2.5"
        style={{ color: isUpcoming ? accent : '#6b6862', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
      >
        {formattedDate}
      </p>
      <h3
        className="font-black uppercase leading-[1.25] mb-3 text-[21px]"
        style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', letterSpacing: '-0.01em', color: isUpcoming ? '#EDE9E1' : '#c7c3b8' }}
      >
        {event.title}
      </h3>
      <div className="flex items-start gap-2 mb-3.5">
        {event.is_online ? (
          <Globe className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: isUpcoming ? '#8C8577' : '#6b6862' }} aria-hidden="true" />
        ) : (
          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: isUpcoming ? '#8C8577' : '#6b6862' }} aria-hidden="true" />
        )}
        <span className="text-[13px] leading-snug" style={{ color: isUpcoming ? '#a9a598' : '#6b6862' }}>
          {event.is_online ? labels.online : event.location}
        </span>
      </div>
      {event.description && (
        <p className="text-[13.5px] leading-relaxed" style={{ color: isUpcoming ? '#8C8577' : '#5a5852' }}>
          {event.description}
        </p>
      )}
      {isUpcoming && event.cta_label && event.cta_url && (
        <a
          href={event.cta_url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-block px-7 py-3.5 mt-5 hover:opacity-80 transition-opacity"
        >
          <CornerBrackets />
          <span
            className="font-semibold text-xs tracking-[1.5px]"
            style={{ color: accent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {event.cta_label}
          </span>
        </a>
      )}
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-16 md:py-[72px] px-10" style={{ border: '1px dashed #2B2924' }}>
      <Calendar className="w-[30px] h-[30px] mx-auto mb-4" style={{ color: '#5a5852' }} aria-hidden="true" />
      <p className="text-[13px] tracking-[1.5px]" style={{ color: '#8C8577', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}>
        {label}
      </p>
    </div>
  )
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-6 mb-9">
      <h2
        className="font-black uppercase whitespace-nowrap text-2xl"
        style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', letterSpacing: '-0.01em', color: '#EDE9E1' }}
      >
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: '#2B2924' }} />
    </div>
  )
}

export default async function EventsPage() {
  const [categories, { upcoming, past }, t, tProduct] = await Promise.all([
    getCategories(),
    getPublishedEvents(),
    getTranslations('events'),
    getTranslations('product'),
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

      <main className="bg-[#141412] flex-1">
        {/* Breadcrumb */}
        <div
          className="max-w-7xl mx-auto px-4 pt-6 text-xs tracking-wide"
          style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))', color: '#6b6862' }}
        >
          <span>{tProduct('breadcrumbHome')}</span>
          <span className="mx-2" style={{ color: '#3a3833' }}>/</span>
          <span style={{ color: '#c7c3b8' }}>{t('title')}</span>
        </div>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-4 pt-7 pb-11 md:pb-14 mb-9 md:mb-16 border-b" style={{ borderColor: '#2B2924' }}>
          <p
            className="text-[10px] md:text-xs tracking-[0.3em] uppercase mb-2.5 md:mb-3.5"
            style={{ color: SITE_CONFIG.brand.darkAccent, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          >
            {SITE_CONFIG.brand.name}
          </p>
          <h1
            className="font-black uppercase leading-none text-[#EDE9E1] mb-4 md:mb-[18px]"
            style={{ fontFamily: 'var(--font-archivo, var(--font-sans))', fontSize: 'clamp(38px, 5.5vw, 64px)', letterSpacing: '-0.02em' }}
          >
            {t('title')}
          </h1>
          <p className="text-sm md:text-[15px] leading-relaxed max-w-[560px]" style={{ color: '#a9a598' }}>
            {t('heroDesc')}
          </p>
        </section>

        <div className="max-w-7xl mx-auto px-4 pb-16 md:pb-20 space-y-16 md:space-y-[72px]">
          <section>
            <SectionDivider>{t('upcoming')}</SectionDivider>
            {upcoming.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-9">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} isUpcoming={true} labels={labels} />
                ))}
              </div>
            ) : (
              <>
                <EmptyState label={t('noUpcoming')} />
                <p className="text-center text-[13px] mt-5" style={{ color: '#6b6862' }}>
                  <a
                    href={SITE_CONFIG.social?.instagram ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-80 transition-opacity"
                    style={{ color: SITE_CONFIG.brand.darkAccent }}
                  >
                    {t('followUs')}
                  </a>{' '}
                  {t('forAnnouncements')}
                </p>
              </>
            )}
          </section>

          <section>
            <SectionDivider>{t('past')}</SectionDivider>
            {past.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-9">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} isUpcoming={false} labels={labels} />
                ))}
              </div>
            ) : (
              <EmptyState label={t('noPast')} />
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
