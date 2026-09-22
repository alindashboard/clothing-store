// Applies wholesale discounts to base_price, keyed by the 2-char brand code in
// products.sku_prefix ("BR-0016" -> "BR"). new_base_price = source_price * (1 - discount%),
// where source_price is compare_at_price if set, otherwise the current base_price
// (and in that case compare_at_price is backfilled to the old base_price so the
// discount still shows as crossed-out on the storefront).
//
// Usage:
//   node --env-file=.env.local scripts/apply-wholesale-discount.mjs                     (dry run, all brands in DISCOUNTS)
//   node --env-file=.env.local scripts/apply-wholesale-discount.mjs --apply              (writes changes, all brands)
//   node --env-file=.env.local scripts/apply-wholesale-discount.mjs --brand=MB           (dry run, only MB)
//   node --env-file=.env.local scripts/apply-wholesale-discount.mjs --brand=MB --apply   (writes changes, only MB)
// --brand accepts a comma-separated list (--brand=MB,VS) to scope a run to specific
// brands without touching brands already processed in an earlier run.

import { createClient } from '@supabase/supabase-js'

const DISCOUNTS = {
  BL: 40,
  CK: 40,
  DI: 35,
  IC: 50,
  IB: 35,
  PK: 40,
  PS: 40,
  TH: 40,
  DS: 40,
  RI: 50,
  NB: 50,
  EX: 40,
  BR: 50,
  MB: 50,
}

const apply = process.argv.includes('--apply')

const brandArg = process.argv.find((a) => a.startsWith('--brand='))
const brandFilter = brandArg
  ? new Set(brandArg.slice('--brand='.length).split(',').map((b) => b.trim().toUpperCase()))
  : null

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data: products, error } = await supabase
  .from('products')
  .select('id, name, sku_prefix, base_price, compare_at_price')

if (error) {
  console.error(error)
  process.exit(1)
}

const updates = []

for (const p of products) {
  const brand = (p.sku_prefix ?? '').split('-')[0].toUpperCase()
  const discount = DISCOUNTS[brand]
  if (discount === undefined) continue
  if (brandFilter && !brandFilter.has(brand)) continue

  const sourcePrice = p.compare_at_price ?? p.base_price
  const newBasePrice = Math.round(sourcePrice * (1 - discount / 100) * 100) / 100
  const newCompareAtPrice = p.compare_at_price ?? p.base_price

  updates.push({
    id: p.id,
    sku_prefix: p.sku_prefix,
    name: p.name,
    brand,
    discount,
    oldBasePrice: p.base_price,
    oldCompareAtPrice: p.compare_at_price,
    newBasePrice,
    newCompareAtPrice,
  })
}

updates.sort((a, b) => a.sku_prefix.localeCompare(b.sku_prefix))

console.log(`${apply ? 'APPLYING' : 'DRY RUN'} — ${updates.length} products across ${new Set(updates.map((u) => u.brand)).size} brands\n`)

const byBrand = new Map()
for (const u of updates) {
  if (!byBrand.has(u.brand)) byBrand.set(u.brand, [])
  byBrand.get(u.brand).push(u)
}

for (const [brand, rows] of [...byBrand.entries()].sort()) {
  console.log(`--- ${brand} (${DISCOUNTS[brand]}%) — ${rows.length} products ---`)
  for (const u of rows) {
    const compareNote = u.oldCompareAtPrice === null ? ' (backfilled from base_price)' : ''
    console.log(
      `  ${u.sku_prefix.padEnd(10)} ${u.name.slice(0, 40).padEnd(42)} ` +
        `base ${u.oldBasePrice.toFixed(2)} -> ${u.newBasePrice.toFixed(2)}  ` +
        `compare_at ${(u.oldCompareAtPrice ?? '-').toString().padEnd(6)} -> ${u.newCompareAtPrice.toFixed(2)}${compareNote}`
    )
  }
  console.log('')
}

if (!apply) {
  console.log('Dry run only — no changes written. Re-run with --apply to write these changes.')
} else {
  let ok = 0
  let failed = 0
  for (const u of updates) {
    const { error: updateError } = await supabase
      .from('products')
      .update({ base_price: u.newBasePrice, compare_at_price: u.newCompareAtPrice })
      .eq('id', u.id)
    if (updateError) {
      console.error(`FAILED ${u.sku_prefix} (${u.id}):`, updateError.message)
      failed++
    } else {
      ok++
    }
  }
  console.log(`\nDone. ${ok} updated, ${failed} failed.`)
}
process.exitCode = 0
