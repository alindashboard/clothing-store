/**
 * seed-products.mjs
 * Uploads product images to Supabase Storage and seeds products/variants/images into the DB.
 * Run: node scripts/seed-products.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET         = 'product-images'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. Run with: node --env-file=.env.local scripts/seed-products.mjs')
  process.exit(1)
}
const PHOTOS_ROOT    = 'C:\\Users\\Admin\\Desktop\\haine\\poze'

const HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function dbGet(table, params = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: HEADERS })
  return r.json()
}

async function dbInsert(table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST', headers: HEADERS, body: JSON.stringify(body),
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`INSERT ${table} failed: ${r.status} — ${text}`)
  return JSON.parse(text)
}

async function uploadImage(storagePath, filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase()
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
  const data = fs.readFileSync(filePath)
  const url  = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${storagePath}`
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}`, 'Content-Type': mime, 'x-upsert': 'true' },
    body: data,
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`Upload ${storagePath} failed: ${r.status} — ${text}`)
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ── Step 1: ensure categories exist ──────────────────────────────────────────

async function ensureCategories() {
  console.log('\n📂 Ensuring categories...')
  const existing = await dbGet('categories', 'select=id,name,slug')
  const bySlug = Object.fromEntries(existing.map(c => [c.slug, c.id]))

  const needed = [
    { name: 'Seturi', slug: 'seturi', sort_order: 8, description: 'Seturi complete — cămașă + shorts, hoodie + shorts' },
    { name: 'Tricouri', slug: 'tricouri', sort_order: 9, description: 'Tricouri premium și grafice' },
  ]

  for (const cat of needed) {
    if (bySlug[cat.slug]) {
      console.log(`  ✓ ${cat.name} already exists (${bySlug[cat.slug]})`)
      bySlug[cat.slug] = bySlug[cat.slug]
    } else {
      const [created] = await dbInsert('categories', { ...cat, is_active: true })
      bySlug[cat.slug] = created.id
      console.log(`  + Created ${cat.name} (${created.id})`)
    }
  }

  return {
    sneakers: bySlug['sneakers'],   // existing — used for Papuci
    seturi:   bySlug['seturi'],
    tricouri: bySlug['tricouri'],
  }
}

// ── Product catalogue ─────────────────────────────────────────────────────────

function buildCatalogue(catIds) {
  const SHOE_SIZES   = ['37','38','39','40','41','42','43','44','45']
  const CLOTH_SIZES  = ['S','M','L','XL']
  const DEFAULT_STOCK = 5

  return [
    // ── PAPUCI (Sneakers) ────────────────────────────────────────────────
    {
      name: 'New Balance 480 Navy Blue',
      sku_prefix: 'PAP-NB480-NAVY',
      base_price: 120,
      category_id: catIds.sneakers,
      description: 'Sneaker low-top clasic cu upper din piele și suede în navy/cream. Talpă gum cu finish vintage, logo iconic NB pe lateral. Confort și stil retro într-un design atemporal.',
      short_description: 'Sneaker low-top retro NB 480 Navy/Cream',
      brand: 'New Balance',
      images: [{ file: path.join(PHOTOS_ROOT, 'Papuci', 'papuci-1.jpeg'), storageName: 'pap-nb480-navy.jpeg', isPrimary: true }],
      sizes: SHOE_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'New Balance 550 White Green',
      sku_prefix: 'PAP-NB550-WHTGRN',
      base_price: 150,
      category_id: catIds.sneakers,
      description: 'Sneaker low-top retro basketball cu upper din piele albă și detalii verde forest. Silhuetă supradimensionată caracteristică modelului 550, extrem de versatil.',
      short_description: 'Sneaker retro basketball NB 550 White/Green',
      brand: 'New Balance',
      images: [{ file: path.join(PHOTOS_ROOT, 'Papuci', 'papuci-2.jpeg'), storageName: 'pap-nb550-whtgrn.jpeg', isPrimary: true }],
      sizes: SHOE_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'ICON Sneaker White Silver',
      sku_prefix: 'PAP-ICON-WHTSIL',
      base_price: 180,
      category_id: catIds.sneakers,
      description: 'Sneaker low-top cu upper alb și detaliu argintiu metalic la toc. Design minimalist și curat, branding ICON subtil. Cutie ICON inclusă.',
      short_description: 'ICON low-top alb cu detaliu argintiu',
      brand: 'ICON',
      images: [{ file: path.join(PHOTOS_ROOT, 'Papuci', 'papuci-3.jpeg'), storageName: 'pap-icon-whtsil.jpeg', isPrimary: true }],
      sizes: SHOE_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'ICON Sneaker White Black Embroidered',
      sku_prefix: 'PAP-ICON-WHTBLK',
      base_price: 200,
      category_id: catIds.sneakers,
      description: 'Sneaker low-top cu upper alb și detaliu negru lacuit la toc. Logo „icon" brodat în relief pe călcâi. Construcție premium, talpă groasă cu rifluri.',
      short_description: 'ICON low-top alb cu detaliu negru brodat',
      brand: 'ICON',
      images: [
        { file: path.join(PHOTOS_ROOT, 'Papuci', 'papuci-4.jpeg'), storageName: 'pap-icon-whtblk-1.jpeg', isPrimary: true },
        { file: path.join(PHOTOS_ROOT, 'Papuci', 'papuci-5.jpeg'), storageName: 'pap-icon-whtblk-2.jpeg', isPrimary: false },
      ],
      sizes: SHOE_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Alexander McQueen Oversized Sneaker White/Black',
      sku_prefix: 'PAP-AMQ-WHTBLK',
      base_price: 380,
      category_id: catIds.sneakers,
      description: 'Iconic sneaker oversized cu platformă înaltă sculptural. Upper din piele albă full-grain, detaliu negru la toc. Silhuetă monumentală, definiția luxury streetwear.',
      short_description: 'McQueen oversized platform sneaker White/Black',
      brand: 'Alexander McQueen',
      images: [{ file: path.join(PHOTOS_ROOT, 'Papuci', 'papuci-6.jpeg'), storageName: 'pap-amq-whtblk.jpeg', isPrimary: true }],
      sizes: SHOE_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Versace Jeans Couture Runner Black',
      sku_prefix: 'PAP-VJC-RUNBLK',
      base_price: 280,
      category_id: catIds.sneakers,
      description: 'Chunky runner sneaker full black cu bandă logo Versace Jeans Couture pe laterale. Talpă masivă, materiale mixte, detalii sport-lux. Cutie și dust bag originale incluse.',
      short_description: 'VJC chunky runner full black',
      brand: 'Versace Jeans Couture',
      images: [{ file: path.join(PHOTOS_ROOT, 'Papuci', 'papuci-7.jpeg'), storageName: 'pap-vjc-runblk.jpeg', isPrimary: true }],
      sizes: SHOE_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },

    // ── SETURI ─────────────────────────────────────────────────────────────
    {
      name: 'Barrow Cactus Floral Set Crem',
      sku_prefix: 'SET-BARROW-CACTUS',
      base_price: 380,
      category_id: catIds.seturi,
      description: 'Set complet cămașă camp-collar + pantaloni scurți în crem cu print floral cactus și botanică colorată. Material ușor și fluid, perfect pentru vară. Logo Barrow pe etichetă.',
      short_description: 'Set Barrow cămașă + shorts floral cactus crem',
      brand: 'Barrow',
      images: [{ file: path.join(PHOTOS_ROOT, 'Seturi', 'WhatsApp Image 2026-06-01 at 20.44.47.jpeg'), storageName: 'set-barrow-cactus.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Barrow Checkered Trim Set Crem',
      sku_prefix: 'SET-BARROW-CHECKERED',
      base_price: 350,
      category_id: catIds.seturi,
      description: 'Set cămașă + shorts din material crinkle/muselină în crem. Detaliu croșetat cu model geometric în maro-turcoaz pe mâneci. Logo Barrow brodat pe piept. Material ușor, look estival premium.',
      short_description: 'Set Barrow cămașă + shorts crinkle cu detaliu croșetat',
      brand: 'Barrow',
      images: [{ file: path.join(PHOTOS_ROOT, 'Seturi', 'WhatsApp Image 2026-06-01 at 20.44.47 (1).jpeg'), storageName: 'set-barrow-checkered.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Barrow Camo Bear Set',
      sku_prefix: 'SET-BARROW-CAMO',
      base_price: 320,
      category_id: catIds.seturi,
      description: 'Set cămașă + shorts cu print camuflaj special Barrow în verde și maro, cu ursulețul-logo integrat în pattern. Material satinat cu lustru ușor, croială relaxed.',
      short_description: 'Set Barrow camo cu ursuleț logo',
      brand: 'Barrow',
      images: [{ file: path.join(PHOTOS_ROOT, 'Seturi', 'WhatsApp Image 2026-06-01 at 20.44.48.jpeg'), storageName: 'set-barrow-camo.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'DS2 Hoodie Shirt Set Crem',
      sku_prefix: 'SET-DS2-HOODIE-CREM',
      base_price: 420,
      category_id: catIds.seturi,
      description: 'Set cămașă-hoodie cu glugă + shorts din material tehnic bej/crem. Logo DS2 brodat în albastru pe piept, butoane aurii, buzunare cu capsă. Look sport-lux sofisticat.',
      short_description: 'DSquared2 set hoodie-shirt + shorts crem',
      brand: 'DSquared2',
      images: [{ file: path.join(PHOTOS_ROOT, 'Seturi', 'WhatsApp Image 2026-06-01 at 20.44.48 (1).jpeg'), storageName: 'set-ds2-hoodie-crem.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'DS2 Acid Wash Set Gri',
      sku_prefix: 'SET-DS2-ACID-GRI',
      base_price: 380,
      category_id: catIds.seturi,
      description: 'Set tricou + shorts cu tratament acid-wash în gri. Logo DS2 în relief ton-pe-ton pe piept și pantalon. Textură vintage spălăcită, croială relaxed. Material bumbac premium.',
      short_description: 'DSquared2 acid wash set gri',
      brand: 'DSquared2',
      images: [{ file: path.join(PHOTOS_ROOT, 'Seturi', 'WhatsApp Image 2026-06-01 at 20.44.48 (2).jpeg'), storageName: 'set-ds2-acid-gri.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Versace Jeans Couture Set Alb',
      sku_prefix: 'SET-VJC-ALB',
      base_price: 380,
      category_id: catIds.seturi,
      description: 'Set all-white tricou + shorts cu logo circular V Versace Jeans Couture brodat pe piept și pantalon. Material premium bumbac, croială relaxed. Eleganță sport minimalistă.',
      short_description: 'VJC set alb tricou + shorts logo brodat',
      brand: 'Versace Jeans Couture',
      images: [{ file: path.join(PHOTOS_ROOT, 'Seturi', 'WhatsApp Image 2026-06-01 at 20.44.56.jpeg'), storageName: 'set-vjc-alb.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Versace Jeans Couture Set Negru',
      sku_prefix: 'SET-VJC-NEGRU',
      base_price: 380,
      category_id: catIds.seturi,
      description: 'Set tricou + shorts negru cu patch logo rectangular Versace Jeans Couture auriu pe piept și cordon auriu pe pantalon. Versiunea dark a setului iconic VJC.',
      short_description: 'VJC set negru tricou + shorts patch auriu',
      brand: 'Versace Jeans Couture',
      images: [{ file: path.join(PHOTOS_ROOT, 'Seturi', 'WhatsApp Image 2026-06-01 at 20.45.05.jpeg'), storageName: 'set-vjc-negru.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Barrow Monster Sun Set Alb',
      sku_prefix: 'SET-BARROW-MONSTER',
      base_price: 420,
      category_id: catIds.seturi,
      description: 'Set hoodie + shorts alb cu grafică sun-monster roșu brodat pe spatele hoodiei (personajul iconic Barrow). Pantalon scurt cu aplicații strass/rhinestone pe laterale. Piesă statement de colecție.',
      short_description: 'Barrow set hoodie + shorts alb Monster Sun',
      brand: 'Barrow',
      images: [{ file: path.join(PHOTOS_ROOT, 'Seturi', 'WhatsApp Image 2026-06-01 at 20.45.12.jpeg'), storageName: 'set-barrow-monster.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Barrow Snake Rhinestone Set Alb',
      sku_prefix: 'SET-BARROW-SNAKE',
      base_price: 450,
      category_id: catIds.seturi,
      description: 'Set hoodie + shorts alb cu șerpi aplicați din rhinestone/strass pe mâneci și pantalon scurt. Logo Barrow și charm smiley verde pe fermoar. Detalii extravagante, piesă premium de colecție.',
      short_description: 'Barrow set hoodie + shorts alb Snake Rhinestone',
      brand: 'Barrow',
      images: [{ file: path.join(PHOTOS_ROOT, 'Seturi', 'WhatsApp Image 2026-06-01 at 20.45.12 (1).jpeg'), storageName: 'set-barrow-snake.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },

    // ── TRICOURI ─────────────────────────────────────────────────────────
    {
      name: 'Tricou Skull Graphic Negru',
      sku_prefix: 'TRI-SKULL-BLK',
      base_price: 120,
      category_id: catIds.tricouri,
      description: 'Tricou oversized negru cu print grafic complex inspirat din tattoo art — craniu central, stele, îngeri și text în stil old-school. Piesă statement, croială largă.',
      short_description: 'Tricou oversized negru grafic skull tattoo art',
      brand: 'Streetwear',
      images: [{ file: path.join(PHOTOS_ROOT, 'Tricouri', 'ticou1.jpeg'), storageName: 'tri-skull-blk.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Givenchy Paris Tricou Alb Logo Roșu',
      sku_prefix: 'TRI-GIV-WHTRED',
      base_price: 280,
      category_id: catIds.tricouri,
      description: 'Tricou alb premium cu inscripție „GIVENCHY PARIS" în roșu oversized la baza tricoului. Croială relaxed, material bumbac de calitate superioară. Look minimalist cu impact maxim.',
      short_description: 'Givenchy Paris tricou alb logo roșu',
      brand: 'Givenchy',
      images: [{ file: path.join(PHOTOS_ROOT, 'Tricouri', 'ticou2.jpeg'), storageName: 'tri-giv-whtred.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Givenchy Paris Tricou Alb Logo Negru',
      sku_prefix: 'TRI-GIV-WHTBLK',
      base_price: 280,
      category_id: catIds.tricouri,
      description: 'Tricou alb premium cu inscripție „GIVENCHY PARIS" în negru oversize la baza tricoului. Versiunea monocromă, mai sobră față de varianta roșie. Croială oversized, bumbac premium.',
      short_description: 'Givenchy Paris tricou alb logo negru',
      brand: 'Givenchy',
      images: [{ file: path.join(PHOTOS_ROOT, 'Tricouri', 'ticou3.jpeg'), storageName: 'tri-giv-whtblk.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Givenchy Stars Tricou Alb',
      sku_prefix: 'TRI-GIV-STARS',
      base_price: 320,
      category_id: catIds.tricouri,
      description: 'Tricou alb cu 5 stele negre brodate în arc pe piept, patch logo pe mânecă stângă. Croială largă, bumbac heavyweight. Piesă iconică din colecția Givenchy.',
      short_description: 'Givenchy tricou alb 5 stele brodate',
      brand: 'Givenchy',
      images: [{ file: path.join(PHOTOS_ROOT, 'Tricouri', 'ticou4.jpeg'), storageName: 'tri-giv-stars.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Givenchy Monkey Brothers Tricou Alb',
      sku_prefix: 'TRI-GIV-MONKEY',
      base_price: 350,
      category_id: catIds.tricouri,
      description: 'Tricou alb cu iconicul print „Monkey Brothers" — două maimuțe urlând, steaua Givenchy și cerc grafic. Piesă de colecție, una dintre cele mai căutate grafici Givenchy.',
      short_description: 'Givenchy Monkey Brothers tricou alb',
      brand: 'Givenchy',
      images: [{ file: path.join(PHOTOS_ROOT, 'Tricouri', 'ticou5.jpeg'), storageName: 'tri-giv-monkey.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Tricou 1952 Negru Portrait',
      sku_prefix: 'TRI-1952-BLK',
      base_price: 200,
      category_id: catIds.tricouri,
      description: 'Tricou negru cu print portret artistic în tonuri alb-roz și numărul „1952" deasupra. Detaliu buzunar mic pe piept, grafică pictorală statement. Croială oversized.',
      short_description: 'Tricou negru grafic portrait 1952',
      brand: '1952',
      images: [{ file: path.join(PHOTOS_ROOT, 'Tricouri', 'ticou6.jpeg'), storageName: 'tri-1952-blk.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Barrow Logo Mashup Tricou Negru',
      sku_prefix: 'TRI-BARROW-LOGO',
      base_price: 220,
      category_id: catIds.tricouri,
      description: 'Tricou oversized negru cu multiple variații de logo Barrow în stiluri diferite — rock, grunge, gothic și pop. Text multicolor, max-print statement. Definiția streetwear extravagant.',
      short_description: 'Barrow oversized negru logo mashup multicolor',
      brand: 'Barrow',
      images: [{ file: path.join(PHOTOS_ROOT, 'Tricouri', 'ticou7.jpeg'), storageName: 'tri-barrow-logo.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
    {
      name: 'Barrow Mock-Neck Half-Zip Negru',
      sku_prefix: 'TRI-BARROW-MOCKNECK',
      base_price: 180,
      category_id: catIds.tricouri,
      description: 'Top cu guler înalt și fermoar mic la gât, material tehnic negru. Logo alb brodat pe piept, mâneci scurte, croială slim-fit. Piesă sport-lux versatilă.',
      short_description: 'Barrow mock-neck half-zip negru slim-fit',
      brand: 'Barrow',
      images: [{ file: path.join(PHOTOS_ROOT, 'Tricouri', 'ticou8.jpeg'), storageName: 'tri-barrow-mockneck.jpeg', isPrimary: true }],
      sizes: CLOTH_SIZES,
      stock: DEFAULT_STOCK,
      is_new: true,
    },
  ]
}

// ── Step 2: upload image, insert product + variants + images ──────────────────

async function seedProduct(p, index) {
  const slug = slugify(p.name)
  console.log(`\n  [${index}] ${p.name}`)

  // 1. Upload image(s)
  const uploadedImages = []
  for (const img of p.images) {
    process.stdout.write(`     📸 uploading ${img.storageName}... `)
    const publicUrl = await uploadImage(`products/${img.storageName}`, img.file)
    uploadedImages.push({ ...img, publicUrl })
    console.log('✓')
  }

  // 2. Insert product
  const [product] = await dbInsert('products', {
    name: p.name,
    slug,
    description: p.description,
    short_description: p.short_description,
    base_price: p.base_price,
    currency: 'EUR',
    category_id: p.category_id,
    sku_prefix: p.sku_prefix,
    is_active: true,
    is_featured: false,
    is_new: p.is_new ?? true,
  })
  console.log(`     ✓ product inserted (${product.id})`)

  // 3. Insert variants (one per size)
  const variants = p.sizes.map((size, i) => ({
    product_id: product.id,
    size,
    color_name: 'Standard',
    color_hex: '#808080',
    sku: `${p.sku_prefix}-${size}`,
    stock_quantity: p.stock,
    low_stock_threshold: 2,
    is_active: true,
    sort_order: i + 1,
  }))
  await dbInsert('product_variants', variants)
  console.log(`     ✓ ${variants.length} variants inserted (sizes: ${p.sizes.join(', ')})`)

  // 4. Insert images
  const imageRows = uploadedImages.map((img, i) => ({
    product_id: product.id,
    url: img.publicUrl,
    alt_text: p.name,
    color_name: 'Standard',
    is_primary: img.isPrimary,
    sort_order: i + 1,
  }))
  await dbInsert('product_images', imageRows)
  console.log(`     ✓ ${imageRows.length} image(s) linked`)

  return product.id
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 KAYA Studio Outlet — Product Seeder')
  console.log('=========================================')

  const catIds = await ensureCategories()
  console.log(`\n  Category IDs:`)
  console.log(`    sneakers → ${catIds.sneakers}`)
  console.log(`    seturi   → ${catIds.seturi}`)
  console.log(`    tricouri → ${catIds.tricouri}`)

  const catalogue = buildCatalogue(catIds)
  console.log(`\n📦 Seeding ${catalogue.length} products...`)

  const results = []
  for (let i = 0; i < catalogue.length; i++) {
    try {
      const id = await seedProduct(catalogue[i], i + 1)
      results.push({ name: catalogue[i].name, id, status: 'ok' })
    } catch (err) {
      console.error(`\n  ❌ FAILED: ${catalogue[i].name}`)
      console.error(`     ${err.message}`)
      results.push({ name: catalogue[i].name, id: null, status: 'error', error: err.message })
    }
  }

  console.log('\n\n📊 Summary')
  console.log('==========')
  const ok = results.filter(r => r.status === 'ok')
  const fail = results.filter(r => r.status === 'error')
  console.log(`  ✅ ${ok.length} products seeded successfully`)
  if (fail.length > 0) {
    console.log(`  ❌ ${fail.length} failed:`)
    fail.forEach(r => console.log(`     - ${r.name}: ${r.error}`))
  }
  console.log('\nDone.')
}

main().catch(err => { console.error(err); process.exit(1) })
