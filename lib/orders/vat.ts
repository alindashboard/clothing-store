// VAT maths for VAT-inclusive (IVA inclusa) prices. Plain module.
//
// Contract shared with the gestionale export: VAT is extracted per line from the
// gross line total and rounded to the cent there; order-level figures are sums
// of the rounded lines. Never recompute VAT from order totals — it can differ
// by a cent from the sum of lines.

import { SITE_CONFIG } from '@/lib/config'

/** Standard Italian rate, as a percentage (22). */
export const STANDARD_VAT_RATE = Math.round(SITE_CONFIG.checkout.taxRate * 100)

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** VAT contained in a VAT-inclusive amount. */
export function vatIncluded(gross: number, ratePct: number): number {
  return round2(gross - gross / (1 + ratePct / 100))
}

/** Taxable (net) part of a VAT-inclusive amount. */
export function netOf(gross: number, ratePct: number): number {
  return round2(gross - vatIncluded(gross, ratePct))
}
