/**
 * Buckets a storefront path (always locale-prefixed, e.g. /it/product/x) into
 * the page type the admin analytics groups by.
 */
export const PAGE_GROUPS = [
  'home',
  'product',
  'category',
  'all_products',
  'new_arrivals',
  'store',
  'events',
  'cart_checkout',
  'info',
  'other',
] as const

export type PageGroup = (typeof PAGE_GROUPS)[number]

export const PAGE_GROUP_LABELS: Record<PageGroup, string> = {
  home: 'Homepage',
  product: 'Product pages',
  category: 'Category pages',
  all_products: 'All products',
  new_arrivals: 'New arrivals',
  store: 'Store page',
  events: 'Events',
  cart_checkout: 'Cart & checkout',
  info: 'Contact & legal',
  other: 'Other',
}

export function pageGroupForPath(path: string | null | undefined): PageGroup {
  if (!path) return 'other'
  // Drop the locale segment: /it/product/x -> /product/x
  const rest = path.replace(/^\/(it|en)(?=\/|$)/, '') || '/'
  if (rest === '/') return 'home'
  if (rest.startsWith('/product/')) return 'product'
  if (rest.startsWith('/category/')) return 'category'
  if (rest === '/products') return 'all_products'
  if (rest.startsWith('/new-arrivals')) return 'new_arrivals'
  if (rest.startsWith('/store')) return 'store'
  if (rest.startsWith('/events')) return 'events'
  if (rest.startsWith('/cart') || rest.startsWith('/checkout')) return 'cart_checkout'
  if (rest.startsWith('/contact') || rest.startsWith('/privacy') || rest.startsWith('/terms')) return 'info'
  return 'other'
}
