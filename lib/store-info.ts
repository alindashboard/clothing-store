export const STORE_INFO = {
  name: 'KAYA Studio Outlet',

  /**
   * Registered legal entity behind the trading name, and its VAT number.
   *
   * TODO_CONFIRM: both are required by GDPR Art. 13 (identity of the data
   * controller) and by Italian e-commerce disclosure rules. Ask the owner for
   * the ragione sociale and partita IVA. Until they are filled in, the privacy
   * page falls back to the trading name and omits the VAT line entirely —
   * it never renders a placeholder, so leaving these empty is safe but
   * incomplete. Fill before any paid advertising goes live.
   */
  legalName: '',
  vatNumber: '',

  address: 'Str. Acque Alte, 12, 04100 Borgo Podgora LT, Italy',
  phone: '+39 393 142 7143',
  whatsappUrl: 'https://wa.me/393931427143',
  email: 'kaya.studio@icloud.com',
  instagram: 'https://instagram.com/kayastudiooutlet',
  instagramHandle: '@kayastudiooutlet',
  /**
   * Google Place ID of the Business Profile (find it with Google's Place ID Finder).
   * TODO_CONFIRM: fill in once the Business Profile is verified. While empty the
   * homepage reviews section and the "leave a review" links stay hidden.
   */
  googlePlaceId: '',
  /**
   * Official "leave a review" short link from Business Profile → Get more reviews.
   * Works without the Place ID, so the review CTA (homepage + shipping email) is
   * live now; the rating and review texts need googlePlaceId + GOOGLE_PLACES_API_KEY.
   * The Place ID must be the business's (types include clothing_store), NOT the
   * street address's — both exist on Maps for Str. Acque Alte 12.
   */
  googleReviewUrl: 'https://g.page/r/Ccpes1VENOfZEBM/review',
  schedule: {
    weekdaysLabel: 'Mon–Fri',
    morning: '09:00 – 13:00',
    afternoon: '15:30 – 20:00',
    weekend: 'Sat–Sun: Closed',
  },
  coordinates: {
    latitude: 41.516361,
    longitude: 12.8536982,
  },
  googleMapsUrl: 'https://maps.app.goo.gl/YLabzRgEobEZFBde7',
  googleMapsEmbedUrl:
    'https://maps.google.com/maps?q=Str.+Acque+Alte+12,+04100+Borgo+Podgora+LT,+Italy&hl=en&z=16&output=embed',
} as const
