export const SITE_CONFIG = {
  brand: {
    name: '[Brand]',
    tagline: 'Your essentials, always',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://clothing-store.vercel.app',
    logo: '/logo.svg',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'en',
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
