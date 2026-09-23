import { STORE_INFO } from '@/lib/store-info'

// Google Business Profile reviews via the Places API (New), Place Details.
// Server-only module (reads GOOGLE_PLACES_API_KEY). Google returns at most 5
// reviews, picked by its own relevance ranking; we show them as returned —
// no filtering or editing, which the Places terms also require — and always
// attribute them to Google with a link to the full list.

export interface GoogleReview {
  authorName: string
  authorUri: string | null
  authorPhotoUri: string | null
  rating: number
  text: string
  relativeTime: string
}

export interface GoogleReviewsData {
  rating: number | null
  count: number
  reviews: GoogleReview[]
  reviewsUri: string | null
  writeReviewUri: string
}

// Places responses are cached per locale for a day: reviews change slowly and
// every Place Details call with reviews is billed.
const REVALIDATE_SECONDS = 60 * 60 * 24

export function writeReviewUrl(placeId: string = STORE_INFO.googlePlaceId): string | null {
  return placeId ? `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}` : null
}

interface PlacesReview {
  rating?: number
  relativePublishTimeDescription?: string
  text?: { text?: string }
  originalText?: { text?: string }
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string }
}

interface PlacesResponse {
  rating?: number
  userRatingCount?: number
  reviews?: PlacesReview[]
  googleMapsLinks?: { reviewsUri?: string; writeAReviewUri?: string }
}

/** Returns null when not configured or on any API error — the section then hides itself. */
export async function getGoogleReviews(locale: string): Promise<GoogleReviewsData | null> {
  const placeId = STORE_INFO.googlePlaceId
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!placeId || !apiKey) return null

  try {
    const res = await fetch(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${locale}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsLinks',
        },
        next: { revalidate: REVALIDATE_SECONDS },
      }
    )
    if (!res.ok) {
      console.error('[google-reviews] Places API', res.status, await res.text().catch(() => ''))
      return null
    }
    const place = (await res.json()) as PlacesResponse

    return {
      rating: place.rating ?? null,
      count: place.userRatingCount ?? 0,
      reviews: (place.reviews ?? [])
        .map((r) => ({
          authorName: r.authorAttribution?.displayName ?? 'Google user',
          authorUri: r.authorAttribution?.uri ?? null,
          authorPhotoUri: r.authorAttribution?.photoUri ?? null,
          rating: r.rating ?? 0,
          // `text` is Google's translation into `locale` when the review was written in another language.
          text: r.text?.text ?? r.originalText?.text ?? '',
          relativeTime: r.relativePublishTimeDescription ?? '',
        }))
        .filter((r) => r.text),
      reviewsUri: place.googleMapsLinks?.reviewsUri ?? null,
      writeReviewUri: place.googleMapsLinks?.writeAReviewUri ?? writeReviewUrl(placeId)!,
    }
  } catch (err) {
    console.error('[google-reviews] fetch failed', err)
    return null
  }
}
