import type { SupabaseClient } from '@supabase/supabase-js'
import type { CartItem } from '@/lib/store/cart'

// Plain module (not 'use server'): only createOrder calls this.

/** A cart line priced and described from the database, never from the browser. */
export interface PricedLine {
  productId: string
  variantId: string
  productName: string
  variantSize: string
  variantColor: string
  sku: string | null
  quantity: number
  price: number
}

/** Current price/stock per variant, sent back so the client cart can resync. */
export type CartUpdates = Record<string, { price: number; maxStock: number }>

export type PricingResult =
  | { ok: true; lines: PricedLine[] }
  | { ok: false; updates: CartUpdates }

interface VariantRow {
  id: string
  product_id: string
  size: string
  color_name: string | null
  sku: string | null
  price_override: number | null
  stock_quantity: number
  is_active: boolean
  product: { name: string; base_price: number; is_active: boolean } | null
}

const MAX_QTY = 20

/**
 * Re-prices a cart server-side. The cart lives in localStorage, so every field of
 * a CartItem — price included — is attacker-controlled; the order total, the
 * Stripe amount and the bank-transfer "amount due" must come from here.
 *
 * Returns `ok: false` with fresh price/stock for every line when anything is off
 * (price changed since it was added, variant/product deactivated, not enough
 * stock). The client applies the updates and asks the customer to review, so
 * nobody is ever charged a price they did not see at checkout.
 */
export async function priceCart(supabase: SupabaseClient, cartItems: CartItem[]): Promise<PricingResult> {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return { ok: false, updates: {} }

  const ids = [...new Set(cartItems.map((i) => i.variantId))]
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, product_id, size, color_name, sku, price_override, stock_quantity, is_active, product:products(name, base_price, is_active)')
    .in('id', ids)
  if (error) throw new Error(`priceCart: ${error.message}`)

  const byId = new Map((data as unknown as VariantRow[]).map((v) => [v.id, v]))
  const updates: CartUpdates = {}
  const lines: PricedLine[] = []
  let changed = ids.length !== cartItems.length // duplicate lines for one variant

  for (const item of cartItems) {
    const v = byId.get(item.variantId)
    const sellable = v && v.is_active && v.product?.is_active && v.product_id === item.productId
    const price = sellable ? Number(v.price_override ?? v.product!.base_price) : 0
    const maxStock = sellable ? Math.max(0, v.stock_quantity) : 0
    updates[item.variantId] = { price, maxStock }

    const qty = item.quantity
    const qtyOk = Number.isInteger(qty) && qty >= 1 && qty <= Math.min(maxStock, MAX_QTY)
    if (!sellable || !qtyOk || Math.abs(price - Number(item.price)) > 0.005) {
      changed = true
      continue
    }
    lines.push({
      productId: v.product_id,
      variantId: v.id,
      productName: v.product!.name,
      variantSize: v.size,
      variantColor: v.color_name ?? '',
      sku: v.sku,
      quantity: qty,
      price,
    })
  }

  return changed ? { ok: false, updates } : { ok: true, lines }
}
