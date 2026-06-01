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

    /** Curated metallic swatch options shown in the admin accent picker. */
    accentOptions: [
      { value: '#c2a04a', label: 'Champagne Gold' },   // brand default
      { value: '#a8842f', label: 'Deep Gold' },
      { value: '#b08d57', label: 'Antique Bronze' },
      { value: '#b9bdbf', label: 'Platinum Silver' },
    ],
  },
  contact: {
    email: 'contact@placeholder.com',
    phone: '+39 XXX XXX XXXX',
    whatsapp: '39XXXXXXXXXX',
    whatsappOrderMessage: 'Hi, I would like to place an order:',
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
    instagram: '',
    facebook: '',
    tiktok: '',
  },
}
