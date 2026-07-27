/**
 * export-groups-jpg.mjs — convert every photo to JPG, organized into one folder per group,
 * so the owner can browse them in a normal file viewer (no HEIC support needed).
 * Run: node scripts/export-groups-jpg.mjs
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const PHOTOS_DIR = path.join(process.cwd(), 'Poze magazin actualizate')
const OUT_DIR = path.join(process.cwd(), 'scripts/output/review-jpg')
const groups = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/output/groups.json'), 'utf8'))

fs.rmSync(OUT_DIR, { recursive: true, force: true })
fs.mkdirSync(OUT_DIR, { recursive: true })

for (const g of groups) {
  const groupNum = g.groupIndex + 1
  const dir = path.join(OUT_DIR, `grup-${String(groupNum).padStart(2, '0')}`)
  fs.mkdirSync(dir, { recursive: true })
  for (const file of g.files) {
    const src = path.join(PHOTOS_DIR, file)
    const dest = path.join(dir, file.replace(/\.heic$/i, '.jpg'))
    try {
      execFileSync('convert', [src, '-auto-orient', dest])
    } catch (err) {
      console.warn(`  ! failed to convert ${file}: ${err.message.split('\n')[0]}`)
    }
  }
  console.log(`grup-${String(groupNum).padStart(2, '0')} (${g.files.length} poze)`)
}
console.log(`\nDone. Open: ${OUT_DIR}`)
