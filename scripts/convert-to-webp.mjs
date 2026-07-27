/**
 * convert-to-webp.mjs — decode the HEIC originals and write web-ready WebP files,
 * one folder per product. Browsers cannot render HEIC, so this runs before upload.
 *
 * ImageMagick does the HEIC decode (libvips in this repo lacks the HEVC plugin),
 * sharp does the resize/encode.
 *
 * Run: node scripts/convert-to-webp.mjs
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const PHOTOS_DIR = path.join(process.cwd(), 'Poze magazin actualizate')
const OUT_DIR = path.join(process.cwd(), 'scripts/output/webp')
const MAX_EDGE = 1600 // product photos never render larger than this on the site

const { products } = JSON.parse(fs.readFileSync('scripts/output/groups-final.json', 'utf8'))

fs.rmSync(OUT_DIR, { recursive: true, force: true })
fs.mkdirSync(OUT_DIR, { recursive: true })

let converted = 0
const failures = []

for (const p of products) {
  const num = String(p.productIndex + 1).padStart(3, '0')
  const dir = path.join(OUT_DIR, `produs-${num}`)
  fs.mkdirSync(dir, { recursive: true })

  for (let i = 0; i < p.files.length; i++) {
    const src = path.join(PHOTOS_DIR, p.files[i])
    const dest = path.join(dir, `${num}-${String(i + 1).padStart(2, '0')}.webp`)
    try {
      const jpeg = execFileSync('convert', [src, '-auto-orient', 'jpg:-'], { maxBuffer: 1024 * 1024 * 60 })
      await sharp(jpeg)
        .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(dest)
      converted++
    } catch (err) {
      failures.push(`${p.files[i]} (produs ${num}): ${err.message.split('\n')[0]}`)
    }
  }
  if ((p.productIndex + 1) % 20 === 0) console.log(`  ...${p.productIndex + 1}/${products.length} produse`)
}

console.log(`\nconverted: ${converted} files -> ${OUT_DIR}`)
if (failures.length) {
  console.log(`failures (${failures.length}):`)
  for (const f of failures) console.log(`  - ${f}`)
}
