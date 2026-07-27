/**
 * group-photos.mjs
 * Reads EXIF DateTimeOriginal from all HEIC photos in "Poze magazin actualizate/",
 * clusters them into product groups by time-gap, and writes:
 *   - scripts/output/groups.json (machine-readable groups for the import script)
 *   - scripts/output/contact-sheet-XX.jpg (visual grids for manual review)
 *
 * Run: node scripts/group-photos.mjs
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const PHOTOS_DIR = path.join(process.cwd(), 'Poze magazin actualizate')
const OUT_DIR = path.join(process.cwd(), 'scripts/output')
const GAP_SECONDS = 75 // photos taken within this gap are considered the same product

function readExifDate(exifBuf) {
  const tiff = exifBuf.subarray(6)
  const little = tiff.toString('ascii', 0, 2) === 'II'
  const u16 = (off) => (little ? tiff.readUInt16LE(off) : tiff.readUInt16BE(off))
  const u32 = (off) => (little ? tiff.readUInt32LE(off) : tiff.readUInt32BE(off))

  function readIFD(offset) {
    const count = u16(offset)
    const entries = {}
    for (let i = 0; i < count; i++) {
      const entryOff = offset + 2 + i * 12
      const tag = u16(entryOff)
      const type = u16(entryOff + 2)
      const numValues = u32(entryOff + 4)
      const valueOff = entryOff + 8
      entries[tag] = { type, numValues, valueOff }
    }
    return { entries }
  }

  const ifd0 = readIFD(u32(4))
  const exifIFDTag = ifd0.entries[0x8769]
  if (!exifIFDTag) return null
  const exifIFD = readIFD(u32(exifIFDTag.valueOff))
  const dtOrig = exifIFD.entries[0x9003]
  if (!dtOrig) return null
  const strOffset = dtOrig.numValues <= 4 ? dtOrig.valueOff : u32(dtOrig.valueOff)
  const raw = tiff.toString('ascii', strOffset, strOffset + 19) // "YYYY:MM:DD HH:MM:SS"
  const [datePart, timePart] = raw.split(' ')
  const [y, mo, d] = datePart.split(':')
  return new Date(`${y}-${mo}-${d}T${timePart}`).getTime()
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const files = fs.readdirSync(PHOTOS_DIR).filter((f) => f.toLowerCase().endsWith('.heic'))
  console.log(`Found ${files.length} HEIC files`)

  const shots = []
  for (const file of files) {
    const filePath = path.join(PHOTOS_DIR, file)
    const meta = await sharp(filePath).metadata()
    const ts = meta.exif ? readExifDate(meta.exif) : null
    if (ts === null) {
      console.warn(`  ! no EXIF date for ${file}, using file mtime`)
    }
    shots.push({
      file,
      ts: ts ?? fs.statSync(filePath).mtimeMs,
    })
  }

  shots.sort((a, b) => a.ts - b.ts)

  const groups = []
  let current = [shots[0]]
  for (let i = 1; i < shots.length; i++) {
    const gapSec = (shots[i].ts - shots[i - 1].ts) / 1000
    if (gapSec <= GAP_SECONDS) {
      current.push(shots[i])
    } else {
      groups.push(current)
      current = [shots[i]]
    }
  }
  groups.push(current)

  console.log(`\n${shots.length} photos -> ${groups.length} candidate groups (gap threshold ${GAP_SECONDS}s)\n`)

  const groupsJson = groups.map((g, i) => ({
    groupIndex: i,
    files: g.map((s) => s.file),
    firstTs: new Date(g[0].ts).toISOString(),
  }))
  fs.writeFileSync(path.join(OUT_DIR, 'groups.json'), JSON.stringify(groupsJson, null, 2))

  // ── Contact sheet: thumbnails grouped visually, group boundaries marked ──
  const THUMB = 220
  const PAD = 8
  const LABEL_H = 22
  const COLS = 6
  const cellW = THUMB + PAD * 2
  const cellH = THUMB + PAD * 2 + LABEL_H

  // paginate: ~10 groups per sheet to keep image size reasonable
  const GROUPS_PER_SHEET = 12
  for (let page = 0; page * GROUPS_PER_SHEET < groups.length; page++) {
    const pageGroups = groups.slice(page * GROUPS_PER_SHEET, (page + 1) * GROUPS_PER_SHEET)

    // layout: each group is its own row-block, wraps within COLS
    const blocks = pageGroups.map((g) => ({
      rows: Math.ceil(g.length / COLS),
      group: g,
    }))
    const totalRows = blocks.reduce((sum, b) => sum + b.rows, 0)
    const GROUP_HEADER_H = 28
    const sheetW = cellW * COLS
    const sheetH = blocks.length * GROUP_HEADER_H + totalRows * cellH

    const composites = []
    let y = 0
    let groupNum = page * GROUPS_PER_SHEET
    for (const block of blocks) {
      groupNum++
      const headerSvg = Buffer.from(
        `<svg width="${sheetW}" height="${GROUP_HEADER_H}"><rect width="100%" height="100%" fill="#222"/><text x="10" y="19" font-size="16" fill="#fff" font-family="sans-serif">Grup ${groupNum} — ${block.group.length} poze — ${new Date(block.group[0].ts).toLocaleString('ro-RO')}</text></svg>`
      )
      composites.push({ input: headerSvg, top: y, left: 0 })
      y += GROUP_HEADER_H

      for (let i = 0; i < block.group.length; i++) {
        const shot = block.group[i]
        const col = i % COLS
        const row = Math.floor(i / COLS)
        let thumbBuf
        try {
          const jpegBuf = execFileSync('convert', [
            path.join(PHOTOS_DIR, shot.file),
            '-auto-orient',
            'jpg:-',
          ], { maxBuffer: 1024 * 1024 * 50 })
          thumbBuf = await sharp(jpegBuf).resize(THUMB, THUMB, { fit: 'inside' }).jpeg({ quality: 70 }).toBuffer()
        } catch (err) {
          console.warn(`  ! could not decode ${shot.file} for thumbnail: ${err.message}`)
          thumbBuf = await sharp({
            create: { width: THUMB, height: THUMB, channels: 3, background: '#c0392b' },
          })
            .composite([
              {
                input: Buffer.from(
                  `<svg width="${THUMB}" height="${THUMB}"><text x="10" y="${THUMB / 2}" font-size="14" fill="#fff" font-family="sans-serif">DECODE FAILED</text></svg>`
                ),
                top: 0,
                left: 0,
              },
            ])
            .jpeg({ quality: 70 })
            .toBuffer()
        }
        const labelSvg = Buffer.from(
          `<svg width="${cellW}" height="${LABEL_H}"><text x="4" y="15" font-size="11" fill="#000" font-family="monospace">${shot.file}</text></svg>`
        )
        composites.push({ input: thumbBuf, top: y + row * cellH + PAD, left: col * cellW + PAD })
        composites.push({ input: labelSvg, top: y + row * cellH + PAD + THUMB, left: col * cellW })
      }
      y += block.rows * cellH
    }

    await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#fff' } })
      .composite(composites)
      .jpeg({ quality: 82 })
      .toFile(path.join(OUT_DIR, `contact-sheet-${String(page + 1).padStart(2, '0')}.jpg`))
    console.log(`  wrote contact-sheet-${String(page + 1).padStart(2, '0')}.jpg (groups ${page * GROUPS_PER_SHEET + 1}-${page * GROUPS_PER_SHEET + pageGroups.length})`)
  }

  console.log(`\nDone. Review scripts/output/contact-sheet-*.jpg and scripts/output/groups.json`)
}

main()
