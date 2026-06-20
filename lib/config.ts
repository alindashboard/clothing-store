import { STORE_INFO } from './store-info'

export const SITE_CONFIG = {
  brand: {
    name: 'KAYA Studio Outlet',
    tagline: 'Premium labels, outlet prices.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://clothing-store.vercel.app',
    logo: '/logo.svg',
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
     * Category slugs shown on the homepage landing grid.
     * Order matters — first slug = first card.
     * To change what appears on landing, update this list (admin UI coming).
     */
    landingCategorySlugs: ['sneakers', 'seturi', 'tricouri'],

    /**
     * Category slugs that use numeric shoe sizes (37–45).
     * All other categories default to clothing sizes (S/M/L/XL).
     */
    shoeCategorySlugs: ['sneakers', 'papuci'],

    /** Curated metallic swatch options shown in the admin accent picker. */
    accentOptions: [
      { value: '#c2a04a', label: 'Champagne Gold' },   // brand default
      { value: '#a8842f', label: 'Deep Gold' },
      { value: '#b08d57', label: 'Antique Bronze' },
      { value: '#b9bdbf', label: 'Platinum Silver' },
    ],

    /** Scrolling ticker bar below the hero. */
    ticker: {
      text: 'KAYA Studio Outlet',
      separator: '✦',
      subtext: 'New drop every week',
      /** Animation duration in seconds — lower = faster. */
      speed: 42,
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
    whatsappOrderMessage: 'Hello, I would like to place an order / Bună ziua, aș dori să plasez o comandă:',
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
  },
  social: {
    instagram: STORE_INFO.instagram,
    facebook: '',
    tiktok: '',
  },
}
