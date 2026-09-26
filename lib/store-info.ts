export const STORE_INFO = {
  name: 'KAYA Studio Outlet',

  /**
   * Registered business behind the trading name, from the Registro Imprese
   * extract (CCIAA Frosinone-Latina, doc. T 644617655, 2026-03-26). It is an
   * impresa individuale, so the legal name is the owner's own name. Required by
   * GDPR Art. 13 (data controller), art. 7 D.Lgs. 70/2003 and art. 35 DPR 633/72
   * (VAT number on the website) — rendered in the footer, /privacy and /terms.
   * The codice fiscale is the owner's personal one and is deliberately not
   * published (the VAT number satisfies the disclosure rules).
   */
  legalName: 'LABIS POP DRAGOS COSMIN',
  legalAddress: 'Via Acque Alte 12, 04100 Latina (LT), Italia',
  vatNumber: '03361320595',
  reaNumber: 'LT-335179',
  pec: 'dragoscommerce@pec.it',

  address: 'Str. Acque Alte, 12, 04100 Borgo Podgora LT, Italy',
  phone: '+39 393 142 7143',
  whatsappUrl: 'https://wa.me/393931427143',
  email: 'kayastudiooutlet@gmail.com',
  instagram: 'https://instagram.com/kayastudiooutlet',
  instagramHandle: '@kayastudiooutlet',
  tiktok: 'https://www.tiktok.com/@kaya.studio.outlet',
  tiktokHandle: '@kaya.studio.outlet',
  /**
   * Google Place ID of the Business Profile "Kaya Studio Outlet" (owner-confirmed
   * 2026-09-26 via Place ID Finder). The homepage rating + review texts also need
   * GOOGLE_PLACES_API_KEY; without it the reviews section stays hidden.
   */
  googlePlaceId: 'ChIJV8U6caR1JRMRyl6zVUQ059k',
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
