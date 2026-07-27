/**
 * render-final-sheets.mjs — contact sheets rendered from the FINAL product grouping,
 * one labeled block per product, for a last visual check before import.
 * Run: node scripts/render-final-sheets.mjs
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const PHOTOS_DIR = path.join(process.cwd(), 'Poze magazin actualizate')
const OUT_DIR = path.join(process.cwd(), 'scripts/output/final')
fs.mkdirSync(OUT_DIR, { recursive: true })

const { products } = JSON.parse(fs.readFileSync('scripts/output/groups-final.json', 'utf8'))

const THUMB = 200
const PAD = 8
const LABEL_H = 20
const COLS = 6
const HEADER_H = 30
const cellW = THUMB + PAD * 2
const cellH = THUMB + PAD * 2 + LABEL_H
const PER_SHEET = 14

for (let page = 0; page * PER_SHEET < products.length; page++) {
  const pageProducts = products.slice(page * PER_SHEET, (page + 1) * PER_SHEET)
  const blocks = pageProducts.map((p) => ({ rows: Math.ceil(p.files.length / COLS), p }))
  const totalRows = blocks.reduce((s, b) => s + b.rows, 0)
  const sheetW = cellW * COLS
  const sheetH = blocks.length * HEADER_H + totalRows * cellH

  const composites = []
  let y = 0
  for (const block of blocks) {
    const { p } = block
    const header = Buffer.from(
      `<svg width="${sheetW}" height="${HEADER_H}"><rect width="100%" height="100%" fill="#1b5e20"/><text x="10" y="21" font-size="16" fill="#fff" font-family="sans-serif">PRODUS ${p.productIndex + 1} — ${p.files.length} poze — (din grup ${p.sourceGroup})</text></svg>`
    )
    composites.push({ input: header, top: y, left: 0 })
    y += HEADER_H

    for (let i = 0; i < p.files.length; i++) {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const jpeg = execFileSync('convert', [path.join(PHOTOS_DIR, p.files[i]), '-auto-orient', 'jpg:-'], {
        maxBuffer: 1024 * 1024 * 50,
      })
      const thumb = await sharp(jpeg).resize(THUMB, THUMB, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer()
      const label = Buffer.from(
        `<svg width="${cellW}" height="${LABEL_H}"><text x="4" y="14" font-size="11" fill="#000" font-family="monospace">${p.files[i]}</text></svg>`
      )
      composites.push({ input: thumb, top: y + row * cellH + PAD, left: col * cellW + PAD })
      composites.push({ input: label, top: y + row * cellH + PAD + THUMB, left: col * cellW })
    }
    y += block.rows * cellH
  }

  const name = `final-${String(page + 1).padStart(2, '0')}.jpg`
  await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#fff' } })
    .composite(composites)
    .jpeg({ quality: 82 })
    .toFile(path.join(OUT_DIR, name))
  console.log(`wrote ${name} (produse ${page * PER_SHEET + 1}-${page * PER_SHEET + pageProducts.length})`)
}
