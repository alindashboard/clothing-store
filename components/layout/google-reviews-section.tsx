import { getTranslations } from 'next-intl/server'
import { Star } from 'lucide-react'
import { SITE_CONFIG } from '@/lib/config'
import { getGoogleReviews, writeReviewUrl, type GoogleReviewsData } from '@/lib/google-reviews'

const ACCENT = SITE_CONFIG.brand.darkAccent

function Stars({ rating, size = 'w-3.5 h-3.5' }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={size}
          style={{ color: ACCENT, fill: i <= Math.round(rating) ? ACCENT : 'transparent' }}
        />
      ))}
    </span>
  )
}

const buttonClass =
  'inline-flex items-center justify-center px-5 py-3 text-[11px] font-semibold tracking-[0.2em] uppercase transition-opacity hover:opacity-80'

// Replaces the old hardcoded testimonials: only real Google reviews, shown as
// Google returns them. Hidden entirely until a Place ID is configured.
export async function GoogleReviewsSection({ locale }: { locale: string }) {
  const writeUrl = writeReviewUrl()
  if (!writeUrl) return null
  return <GoogleReviewsView data={await getGoogleReviews(locale)} writeUrl={writeUrl} />
}

/** Presentation only (no fetching), so it can be rendered with fixture data. */
export async function GoogleReviewsView({ data, writeUrl }: { data: GoogleReviewsData | null; writeUrl: string }) {
  const t = await getTranslations('home.reviews')
  const reviews = data?.reviews ?? []
  const writeHref = data?.writeReviewUri ?? writeUrl

  const heading = (
    <h2
      className="text-2xl md:text-3xl font-black tracking-tight text-[#EDE9E1]"
      style={{ fontFamily: 'var(--font-archivo, var(--font-sans))' }}
    >
      {reviews.length > 0 ? t('title') : t('emptyTitle')}
    </h2>
  )

  const writeButton = (
    <a
      href={writeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass}
      style={{ background: ACCENT, color: '#141412', fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
    >
      {t('write')}
    </a>
  )

  // No reviews yet (new profile, or the API is unavailable): just ask for one.
  if (reviews.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16 pb-20">
        <div className="border border-[#2B2924] bg-[#1B1917] p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            {heading}
            <p className="text-sm text-[#c7c3b8] mt-3 max-w-xl">{t('emptyBody')}</p>
          </div>
          {writeButton}
        </div>
      </section>
    )
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-16 pb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div>
          {heading}
          {data?.rating != null && data.count > 0 && (
            <p className="mt-3 flex items-center gap-2 text-sm text-[#c7c3b8]">
              <Stars rating={data.rating} size="w-4 h-4" />
              <span>{t('summary', { rating: data.rating.toFixed(1), count: data.count })}</span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {data?.reviewsUri && (
            <a
              href={data.reviewsUri}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass}
              style={{ border: `1px solid ${ACCENT}`, color: ACCENT, fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
            >
              {t('readAll')}
            </a>
          )}
          {writeButton}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reviews.slice(0, 3).map((review, i) => (
          <figure
            key={i}
            className="bg-[#1B1917] border border-[#2B2924] p-8 flex flex-col justify-between gap-6"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <Stars rating={review.rating} />
                <span className="sr-only">{t('ratingLabel', { rating: review.rating })}</span>
                <span className="text-[11px] text-[#8C8577]">{review.relativeTime}</span>
              </div>
              <blockquote className="text-sm leading-relaxed text-[#c7c3b8] line-clamp-6">
                {review.text}
              </blockquote>
            </div>
            <figcaption className="flex items-center gap-3">
              {review.authorPhotoUri && (
                // Google-hosted avatar; a plain <img> avoids adding Google's CDN to next/image remotePatterns.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={review.authorPhotoUri}
                  alt=""
                  width={32}
                  height={32}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full"
                />
              )}
              <div>
                {review.authorUri ? (
                  <a
                    href={review.authorUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-[#EDE9E1] hover:underline underline-offset-4"
                  >
                    {review.authorName}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-[#EDE9E1]">{review.authorName}</p>
                )}
                <p className="text-xs text-[#8C8577] mt-0.5">{t('source')}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
