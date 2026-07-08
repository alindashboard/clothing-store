import { STORE_INFO } from './store-info'
import { BRANDS, BRANDS_TICKER } from './brands'

export const SITE_CONFIG = {
  brand: {
    name: 'KAYA Studio Outlet',
    tagline: 'Premium labels, outlet prices.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://kayaoutlet.com',
    logo: '/kaya-logo.png',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'en',

    /**
     * Brand accent — metallic gold by default (matches the store's charcoal + gold interior).
     * This is the fallback used when no admin-dashboard override is stored in the DB.
     * To change the accent site-wide, update this value.
     * To allow per-session overrides, use the admin dashboard → Brand settings (coming soon).
     */
    accent: '#c2a04a',           // champagne gold — metallic brand default

    /**
     * Dark-chrome accent — used only by the always-dark header/footer and the
     * homepage's dark landing sections (per "Kaya Outlet Landing (Final)" design).
     * Deliberately distinct from `accent` above: that one stays the documented
     * brand gold (#c2a04a) for admin-configurable / light-page contexts (product,
     * category, cart, checkout). This one is the lighter, warmer gold (#D9B679)
     * the landing design was built around — do not use it outside dark surfaces.
     */
    darkAccent: '#D9B679',

    /**
     * Category slugs shown on the homepage landing grid.
     * Order matters — first slug = first card.
     * To change what appears on landing, update this list (admin UI coming).
     */
    landingCategorySlugs: ['sneakers', 'sets', 'shirts'],

    /**
     * Category slugs that use numeric shoe sizes (37–45).
     * All other categories default to clothing sizes (S/M/L/XL).
     */
    shoeCategorySlugs: ['sneakers', 'footwear'],

    /** Curated metallic swatch options shown in the admin accent picker. */
    accentOptions: [
      { value: '#c2a04a', label: 'Champagne Gold' },   // brand default
      { value: '#a8842f', label: 'Deep Gold' },
      { value: '#b08d57', label: 'Antique Bronze' },
      { value: '#b9bdbf', label: 'Platinum Silver' },
    ],

    /** Scrolling ticker bar below the hero. */
    ticker: {
      text: BRANDS_TICKER,
      separator: '·',
      subtext: BRANDS_TICKER,
      /** ~10 s per brand name for comfortable reading pace. Scales automatically
       *  if brands list grows. (7 brands → 70 s) */
      speed: BRANDS.length * 10,
      enabled: true,
    },

    /** Hero section defaults. */
    hero: {
      seasonLabel: 'F/W 26 · Drop 01',
      ctaText: 'Shop the drop',
      ctaUrl: '/products',
      /** Path inside /public, or a full URL. */
      logoSrc: '/kaya-logo.png',
    },
  },
  contact: {
    email: STORE_INFO.email,
    phone: STORE_INFO.phone,
    whatsapp: '393931427143',
    whatsappOrderMessage: 'Hello, I would like to place an order:',
  },
  shipping: {
    freeShippingThreshold: 150,
    standardShippingCost: 9.90,
    expressShippingCost: 14.90,
    estimatedDays: { standard: '3-5', express: '1-2' },
  },
  checkout: {
    enableStripe: false,
    enableWhatsAppOrder: true,
    enableBankTransfer: true,
    taxRate: 0.22,
  },
  features: {
    enableNewsletter: false,
    enableWishlist: false,
    enableReviews: false,
    showWipBanner: true,
  },
  social: {
    instagram: STORE_INFO.instagram,
    facebook: '',
    tiktok: '',
  },
}
