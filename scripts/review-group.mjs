/**
 * review-group.mjs — build one large labeled montage for a single group, for manual review.
 * Run: node scripts/review-group.mjs <groupIndex1based> <file1> <file2> ...
 */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const PHOTOS_DIR = path.join(process.cwd(), 'Poze magazin actualizate')
const OUT_DIR = path.join(process.cwd(), 'scripts/output/review')
fs.mkdirSync(OUT_DIR, { recursive: true })

const [groupNum, ...files] = process.argv.slice(2)
const THUMB = 420
const PAD = 10
const LABEL_H = 26
const COLS = 4
const cellW = THUMB + PAD * 2
const cellH = THUMB + PAD * 2 + LABEL_H
const rows = Math.ceil(files.length / COLS)

const composites = []
for (let i = 0; i < files.length; i++) {
  const f = files[i]
  const col = i % COLS
  const row = Math.floor(i / COLS)
  let buf
  try {
    const jpegBuf = execFileSync('convert', [path.join(PHOTOS_DIR, f), '-auto-orient', 'jpg:-'], {
      maxBuffer: 1024 * 1024 * 50,
    })
    buf = await sharp(jpegBuf).resize(THUMB, THUMB, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer()
  } catch (err) {
    buf = await sharp({ create: { width: THUMB, height: THUMB, channels: 3, background: '#c0392b' } })
      .composite([{ input: Buffer.from(`<svg width="${THUMB}" height="${THUMB}"><text x="10" y="${THUMB/2}" font-size="20" fill="#fff">DECODE FAILED</text></svg>`), top: 0, left: 0 }])
      .jpeg({ quality: 85 })
      .toBuffer()
  }
  const labelSvg = Buffer.from(`<svg width="${cellW}" height="${LABEL_H}"><text x="6" y="19" font-size="16" fill="#000" font-family="monospace">${f}</text></svg>`)
  composites.push({ input: buf, top: row * cellH + PAD, left: col * cellW + PAD })
  composites.push({ input: labelSvg, top: row * cellH + PAD + THUMB, left: col * cellW })
}

await sharp({ create: { width: cellW * COLS, height: cellH * rows, channels: 3, background: '#fff' } })
  .composite(composites)
  .jpeg({ quality: 88 })
  .toFile(path.join(OUT_DIR, `group-${String(groupNum).padStart(2, '0')}.jpg`))

console.log(`wrote scripts/output/review/group-${String(groupNum).padStart(2, '0')}.jpg`)
