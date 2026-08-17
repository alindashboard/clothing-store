/**
 * import-stock.mjs
 * Replaces the whole catalog with the owner's stock spreadsheets: wipes
 * products / product_variants / product_images / categories and everything in
 * the product-images bucket, then writes the tree and rows from
 * scripts/output/stock.json (produced by scripts/parse-stock-ods.py).
 *
 * Events, contact requests and the event-images bucket are never touched.
 * Product photos are uploaded separately afterwards — this leaves the catalog
 * imageless on purpose.
 *
 * Credentials come from the environment, never from source.
 *   python3 scripts/parse-stock-ods.py
 *   node --env-file=.env.local scripts/import-stock.mjs --dry-run
 *   node --env-file=.env.local scripts/import-stock.mjs --wipe
 *
 * --wipe is required for the destructive run; without it the script refuses.
 */
import fs from 'fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'product-images'
const STOCK = 'scripts/output/stock.json'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Run with: node --env-file=.env.local scripts/import-stock.mjs')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')
const WIPE = process.argv.includes('--wipe')

if (!DRY_RUN && !WIPE) {
  console.error('Refusing to run: this deletes the entire catalog.')
  console.error('Preview it with --dry-run, or commit with --wipe.')
  process.exit(1)
}

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

async function dbSelect(table, query) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: HEADERS })
  if (!r.ok) throw new Error(`SELECT ${table} failed (${r.status}): ${await r.text()}`)
  return r.json()
}

async function dbInsert(table, rows) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=representation' },
    body: JSON.stringify(rows),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`INSERT ${table} failed (${r.status}): ${text}`)
  return JSON.parse(text)
}

async function dbDeleteAll(table) {
  // PostgREST requires a filter; "id is not null" matches every row.
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=not.is.null`, {
    method: 'DELETE',
    headers: HEADERS,
  })
  if (!r.ok) throw new Error(`DELETE ${table} failed (${r.status}): ${await r.text()}`)
}

/** Every object in the bucket, walking the per-product folders. */
async function listBucket() {
  const paths = []
  const walk = async (prefix) => {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ prefix, limit: 1000, sortBy: { column: 'name', order: 'asc' } }),
    })
    if (!r.ok) throw new Error(`Bucket list failed (${r.status}): ${await r.text()}`)
    for (const entry of await r.json()) {
      const full = prefix ? `${prefix}/${entry.name}` : entry.name
      // Storage reports folders as rows with no metadata.
      if (entry.id === null || entry.metadata === null) await walk(full)
      else paths.push(full)
    }
  }
  await walk('')
  return paths
}

async function deleteFromBucket(paths) {
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100)
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
      method: 'DELETE',
      headers: HEADERS,
      body: JSON.stringify({ prefixes: batch }),
    })
    if (!r.ok) throw new Error(`Bucket delete failed (${r.status}): ${await r.text()}`)
  }
}

// Clothing sizes have a defined order; shoe/waist sizes sort numerically after.
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'UNIVERSAL']
function sizeRank(size) {
  const known = SIZE_ORDER.indexOf(size.toUpperCase())
  if (known !== -1) return known
  const numeric = parseFloat(size.replace(',', '.'))
  return Number.isNaN(numeric) ? 900 : 100 + numeric
}

// product_variants.sku is globally unique. Sizes like "44 ½" and repeated
// size/colour pairs would collide, so normalise and suffix on conflict.
const usedSkus = new Set()
function variantSku(productSku, size, color) {
  const clean = (s) => s.replace(/½/g, '5').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  const base = `${productSku}-${clean(size)}`
  let sku = base
  let n = 1
  while (usedSkus.has(sku)) sku = `${base}-${clean(color)}-${++n}`
  usedSkus.add(sku)
  return sku
}

const { categories, products, warnings } = JSON.parse(fs.readFileSync(STOCK, 'utf8'))

const variantTotal = products.reduce((n, p) => n + p.variants.length, 0)
const childTotal = categories.reduce((n, c) => n + c.children.length, 0)

console.log(`stock.json: ${products.length} products, ${variantTotal} variants, ` +
  `${categories.length} parent + ${childTotal} child categories`)
if (warnings.length) console.log(`parser left ${warnings.length} warning(s) — see ${STOCK}`)

// --- What we are about to destroy ---------------------------------------
const existing = {}
for (const table of ['products', 'product_variants', 'product_images', 'categories']) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id`, {
    headers: { ...HEADERS, Prefer: 'count=exact', Range: '0-0' },
  })
  existing[table] = r.headers.get('content-range')?.split('/')[1] ?? '?'
}
const bucketPaths = await listBucket()

console.log('\nto delete:')
for (const [table, count] of Object.entries(existing)) console.log(`  ${table.padEnd(17)} ${count}`)
console.log(`  ${BUCKET.padEnd(17)} ${bucketPaths.length} file(s)`)

if (DRY_RUN) {
  console.log('\nDRY RUN — nothing written. Sample of what would be created:\n')
  for (const c of categories) {
    console.log(`  ${c.name_it} (${c.slug})`)
    for (const ch of c.children) console.log(`     - ${ch.name_it} (${ch.slug}) x${ch.count}`)
  }
  for (const p of products.slice(0, 5)) {
    console.log(`\n  ${p.sku} ${p.name_it}`)
    console.log(`     slug ${p.slug} | ${p.base_price} EUR` +
      `${p.compare_at_price ? ` (was ${p.compare_at_price}, -${p.discount_pct}%)` : ''}` +
      ` | active ${p.is_active} | ${p.variants.length} variant(s)`)
  }
  process.exit(0)
}

// --- Wipe ---------------------------------------------------------------
// Child rows first: product_images / product_variants reference products.
console.log('\nwiping...')
for (const table of ['product_images', 'product_variants', 'products', 'categories']) {
  await dbDeleteAll(table)
  console.log(`  cleared ${table}`)
}
if (bucketPaths.length) {
  await deleteFromBucket(bucketPaths)
  console.log(`  cleared ${bucketPaths.length} file(s) from ${BUCKET}`)
}

// --- Categories ---------------------------------------------------------
// Parents carry the landing grid; children are the browsable listings.
const categoryIds = {}
let parentOrder = 0
for (const c of categories) {
  const [parent] = await dbInsert('categories', {
    name: c.name_it,
    slug: c.slug,
    parent_id: null,
    sort_order: ++parentOrder,
    is_active: true,
    show_on_landing: true,
  })
  categoryIds[c.slug] = parent.id
  let childOrder = 0
  for (const ch of c.children) {
    const [child] = await dbInsert('categories', {
      name: ch.name_it,
      slug: ch.slug,
      parent_id: parent.id,
      sort_order: ++childOrder,
      is_active: true,
      show_on_landing: false,
    })
    categoryIds[ch.slug] = child.id
  }
}
console.log(`\ncreated ${Object.keys(categoryIds).length} categories`)

// --- Products + variants ------------------------------------------------
let created = 0
let variantsCreated = 0
for (const p of products) {
  const childSlug = p.category ? `${p.gender_slug}-${p.category}` : null
  const [product] = await dbInsert('products', {
    name: p.name_it,
    slug: p.slug,
    base_price: p.base_price,
    compare_at_price: p.compare_at_price,
    currency: 'EUR',
    category_id: childSlug ? categoryIds[childSlug] ?? null : null,
    sku_prefix: p.sku,
    is_active: p.is_active,
    is_featured: false,
    is_new: false,
  })
  created++

  // The spreadsheets sometimes list the same size/colour on two rows; those are
  // one variant holding the combined stock, not two.
  const merged = new Map()
  for (const v of p.variants) {
    const key = `${v.size}|${v.color_it}`
    const seen = merged.get(key)
    if (seen) seen.quantity += v.quantity
    else merged.set(key, { ...v })
  }

  const variants = [...merged.values()]
    .sort((a, b) => sizeRank(a.size) - sizeRank(b.size))
    .map((v, i) => ({
      product_id: product.id,
      size: v.size,
      color_name: v.color_it,
      color_hex: v.color_hex,
      sku: variantSku(p.sku, v.size, v.color_it),
      price_override: null,
      stock_quantity: v.quantity,
      is_active: v.quantity > 0,
      sort_order: i + 1,
    }))
  if (variants.length) {
    await dbInsert('product_variants', variants)
    variantsCreated += variants.length
  }
  if (created % 50 === 0) console.log(`  ${created}/${products.length} products`)
}

console.log(`\ndone: ${created} products, ${variantsCreated} variants`)
console.log(`hidden (no stock): ${products.filter((p) => !p.is_active).length}`)
console.log('product-images bucket is empty — photos are uploaded separately.')

// --- Verify against the live DB ----------------------------------------
const [liveProducts, liveVariants, liveCategories] = await Promise.all(
  ['products', 'product_variants', 'categories'].map(async (t) => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=id`, {
      headers: { ...HEADERS, Prefer: 'count=exact', Range: '0-0' },
    })
    return r.headers.get('content-range')?.split('/')[1]
  })
)
console.log(`live now: ${liveProducts} products, ${liveVariants} variants, ${liveCategories} categories`)

const orphans = await dbSelect('products', 'select=slug&category_id=is.null')
if (orphans.length) {
  console.log(`\n${orphans.length} product(s) landed without a category:`)
  for (const o of orphans.slice(0, 20)) console.log(`  ${o.slug}`)
}
