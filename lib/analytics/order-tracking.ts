/**
 * Hand-off of the just-placed order from the checkout form to the Meta `Purchase`
 * event on the success page. Uses sessionStorage (not the URL) so no order data
 * leaks into query params; the success page clears the key after firing so a
 * refresh doesn't double-count.
 */
export const LAST_ORDER_KEY = 'kaya-last-order'

export interface PixelOrder {
  orderNumber: string
  value: number
  currency: string
  numItems: number
  contents: { id: string; quantity: number; item_price: number }[]
}

export function stashOrderForPixel(order: PixelOrder) {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order))
  } catch {
    // private mode / storage disabled — Purchase just won't fire client-side
  }
}
