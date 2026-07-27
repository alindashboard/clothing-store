/**
 * import-placeholder-products.mjs
 * Creates one placeholder product per photo group, uploads its WebP images to
 * Supabase Storage, and links them in product_images. The owner then fills in
 * name / category / price / description / variants from the admin panel.
 *
 * Credentials come from the environment, never from source.
 *   node --env-file=.env.local scripts/import-placeholder-products.mjs --dry-run
 *   node --env-file=.env.local scripts/import-placeholder-products.mjs
 *
 * Re-running is safe: products already listed in the manifest are skipped.
 */
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'product-images'
const WEBP_DIR = path.join(process.cwd(), 'scripts/output/webp')
const MANIFEST = path.join(process.cwd(), 'scripts/output/import-manifest.json')

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Run with: node --env-file=.env.local scripts/import-placeholder-products.mjs')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? Infinity)

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

async function dbInsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`INSERT ${table} failed (${r.status}): ${text}`)
  return JSON.parse(text)
}

async function uploadImage(storagePath, filePath) {
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'image/webp',
      'x-upsert': 'true',
    },
    body: fs.readFileSync(filePath),
  })
  if (!r.ok) throw new Error(`Upload ${storagePath} failed (${r.status}): ${await r.text()}`)
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

const { products } = JSON.parse(fs.readFileSync('scripts/output/groups-final.json', 'utf8'))
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {}

console.log(`${products.length} products to import${DRY_RUN ? ' (DRY RUN — nothing will be written)' : ''}`)
console.log(`already imported: ${Object.keys(manifest).length}\n`)

let created = 0
let imagesUploaded = 0

for (const p of products) {
  if (created >= LIMIT) break

  const num = String(p.productIndex + 1).padStart(3, '0')
  const key = `produs-${num}`
  if (manifest[key]) {
    console.log(`  = ${key} already imported (${manifest[key].productId}), skipping`)
    continue
  }

  const dir = path.join(WEBP_DIR, `produs-${num}`)
  const webpFiles = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.webp')).sort() : []
  if (webpFiles.length === 0) {
    console.warn(`  ! ${key} has no converted images, skipping`)
    continue
  }

  const productRow = {
    name: `Produs ${num}`,
    slug: key,
    base_price: 0,
    currency: 'EUR',
    category_id: null,
    is_active: true,
    is_featured: false,
    is_new: false,
    short_description: 'TODO_CONFIRM — descriere de completat',
  }

  if (DRY_RUN) {
    console.log(`  + ${key}: would create product + upload ${webpFiles.length} image(s)`)
    created++
    imagesUploaded += webpFiles.length
    continue
  }

  const [product] = await dbInsert('products', productRow)

  const imageRows = []
  for (let i = 0; i < webpFiles.length; i++) {
    const storagePath = `${product.id}/${webpFiles[i]}`
    const url = await uploadImage(storagePath, path.join(dir, webpFiles[i]))
    imageRows.push({
      product_id: product.id,
      url,
      alt_text: `Produs ${num}`,
      is_primary: i === 0,
      sort_order: i,
    })
    imagesUploaded++
  }
  await dbInsert('product_images', imageRows)

  manifest[key] = { productId: product.id, images: imageRows.length }
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2))

  created++
  console.log(`  + ${key} -> ${product.id} (${imageRows.length} images)`)
}

console.log(`\ndone: ${created} products, ${imagesUploaded} images${DRY_RUN ? ' (dry run)' : ''}`)
if (!DRY_RUN) console.log(`manifest: ${MANIFEST}`)
