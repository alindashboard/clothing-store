/**
 * build-final-groups.mjs
 * Encodes the owner's manual annotations (drawn on the contact sheets) into the
 * definitive product grouping, then validates it against the source photo folder.
 *
 * Convention used on the contact sheets: a drawn frame = one product,
 * a vertical line = separator, arrows = the group continues on the next row.
 *
 * Run: node scripts/build-final-groups.mjs
 */
import fs from 'fs'
import path from 'path'

const PHOTOS_DIR = path.join(process.cwd(), 'Poze magazin actualizate')
const OUT = path.join(process.cwd(), 'scripts/output/groups-final.json')

// Photos that no decoder can read (broken HEIC depth-map). Kept out of products.
const CORRUPT = ['IMG_6822.heic', 'IMG_6823.heic', 'IMG_6857.HEIC', 'IMG_7043.HEIC']

// Photos that are not products (packaging/dust bags shot between items).
const NOT_A_PRODUCT = ['IMG_7166.HEIC', 'IMG_7167.HEIC', 'IMG_7168.HEIC']

// Each entry = one product. `src` notes which original auto-group it came from.
const PRODUCTS = [
  { src: '1',     files: [6687, 6688] },
  { src: '2',     files: [6691, 6692] },
  { src: '3a',    files: [6693, 6694] },
  { src: '3b',    files: [6695, 6696, 6697] },
  { src: '4a',    files: [6711] },
  { src: '4b',    files: [6712, 6713] },
  { src: '4c',    files: [6714, 6715, 6716, 6717] },
  { src: '5',     files: [6718, 6719] },
  { src: '6',     files: [6720] },
  { src: '7a',    files: [6723, 6724] },
  { src: '7b',    files: [6725, 6726] },
  { src: '8a',    files: [6731, 6732] },
  { src: '8b',    files: [6733, 6734] },
  { src: '9',     files: [6737, 6738] },
  { src: '10a',   files: [6742, 6743] },
  { src: '10b',   files: [6744] },
  { src: '11',    files: [6747, 6748] },
  { src: '12a',   files: [6749, 6750] },
  { src: '12b',   files: [6751, 6752] },
  { src: '13',    files: [4830] },
  { src: '14',    files: [4848] },
  { src: '15',    files: [4861, 4862, 4863, 4864] },
  { src: '16',    files: [6785] },
  { src: '17a',   files: [6788, 6789] },
  { src: '17b',   files: [6790, 6791, 6792] },
  { src: '17c',   files: [6793] },
  { src: '17d',   files: [6794, 6795] },
  { src: '18',    files: [6796, 6797] },
  { src: '19',    files: [6817, 6819] },
  { src: '20',    files: [4881, 4882] },
  { src: '21a',   files: [4884] },
  { src: '21b+22', files: [4885, 4886, 4887, 4888] }, // merged across groups 21/22
  { src: '23',    files: [4890] },
  { src: '24a',   files: [4891, 4892] },
  { src: '24b',   files: [4893, 4894] },
  { src: '25',    files: [4895, 4896] },
  { src: '26',    files: [4899, 4900] },
  { src: '27',    files: [4901, 4903] },
  { src: '28a',   files: [4904, 4905] },
  { src: '28b+29', files: [4906, 4907] },             // merged across groups 28/29
  { src: '29a',   files: [4908] },
  { src: '29b',   files: [4909] },
  { src: '29c',   files: [4911, 4913] },
  { src: '30+31a', files: [4915, 4917, 4918, 4920] }, // merged across groups 30/31
  { src: '31b',   files: [4921] },
  { src: '31c',   files: [4922, 4923] },
  { src: '32',    files: [6821] },
  { src: '34a',   files: [6845] },
  { src: '34b',   files: [6846, 6848] },
  { src: '34c',   files: [6849, 6850] },
  { src: '35',    files: [6854] },
  { src: '36',    files: [6856] },
  { src: '37',    files: [6865, 6867] },
  { src: '38',    files: [6871] },
  { src: '39a',   files: [6881, 6882] },
  { src: '39b',   files: [6883] },
  { src: '40',    files: [6885] },
  { src: '41',    files: [6887, 6888] },
  { src: '42',    files: [6889] },
  { src: '43',    files: [6892] },
  { src: '44',    files: [6897] },
  { src: '45',    files: [6899] },
  { src: '46',    files: [6901, 6902] },
  { src: '47',    files: [6903, 6904] },
  { src: '48',    files: [6906, 6907] },
  { src: '49',    files: [6916, 6917] },
  { src: '50',    files: [6920, 6921] },
  { src: '51',    files: [6927, 6928] },
  { src: '52',    files: [6962, 6963, 6964] },
  { src: '53',    files: [6982] },
  { src: '54',    files: [6990] },
  { src: '55',    files: [7036] },
  { src: '56',    files: [7039, 7040] },
  { src: '57',    files: [7041, 7042] },
  { src: '58',    files: [7044] },
  { src: '59',    files: [7046] },
  { src: '60',    files: [7047, 7048] },
  { src: '61',    files: [7051, 7052, 7053] },
  { src: '62',    files: [7061] },
  { src: '63',    files: [7065, 7066] },
  { src: '64',    files: [7101, 7102] },
  { src: '65a',   files: [7107, 7108] },
  { src: '65b',   files: [7109, 7110] },
  { src: '66',    files: [7120] },
  { src: '67',    files: [7125, 7126] },
  { src: '68a',   files: [7127, 7128] },
  { src: '68b',   files: [7129, 7130] },
  { src: '69',    files: [7132] },
  { src: '70a',   files: [7134, 7135, 7136] },
  { src: '70b',   files: [7137, 7138, 7139, 7140] },  // arrows mark the row wrap
  { src: '70c',   files: [7141, 7142, 7143, 7144, 7145] },
  { src: '70d',   files: [7146, 7147] },
  { src: '70e',   files: [7148, 7149] },
  { src: '70f',   files: [7150, 7151] },
  { src: '71',    files: [7152, 7153] },
  { src: '72',    files: [7154, 7155] },
  { src: '73a',   files: [7156, 7157] },
  { src: '73b',   files: [7158, 7159, 7160] },
  { src: '73c',   files: [7161, 7162, 7163] },
  { src: '73d',   files: [7164, 7165] },
  { src: '75a',   files: [7170, 7171, 7172] },
  { src: '75b',   files: [7173, 7174, 7175] },
  { src: '76a',   files: [7176, 7177] },
  { src: '76b',   files: [7178, 7179, 7180] },
  { src: '77a',   files: [7182, 7183, 7184, 7185, 7186, 7187] },
  { src: '77b',   files: [7189, 7190, 7191] },
  { src: '77c',   files: [7192, 7193, 7194] },
  { src: '77d',   files: [7195, 7196, 7197, 7198] },
  { src: '77e',   files: [7199, 7200, 7201, 7202, 7203] },
  { src: '77f',   files: [7204, 7205, 7206, 7207, 7208] },
  { src: '77g',   files: [7209, 7210, 7211, 7212] },
]

// ── Resolve bare numbers to real filenames (extension case varies) ────────────
const onDisk = fs.readdirSync(PHOTOS_DIR)
const byNumber = new Map()
for (const f of onDisk) {
  const m = f.match(/^IMG_(\d+)\.(heic)$/i)
  if (m) byNumber.set(Number(m[1]), f)
}

const errors = []
const used = new Set()
const products = PRODUCTS.map((p, i) => {
  const files = p.files.map((n) => {
    const f = byNumber.get(n)
    if (!f) errors.push(`product ${p.src}: IMG_${n} not found on disk`)
    else if (used.has(f)) errors.push(`product ${p.src}: ${f} used twice`)
    else used.add(f)
    return f
  })
  return { productIndex: i, sourceGroup: p.src, files: files.filter(Boolean) }
})

// ── Validate full coverage ───────────────────────────────────────────────────
const accountedFor = new Set([...used, ...CORRUPT, ...NOT_A_PRODUCT])
const missing = onDisk.filter((f) => /\.heic$/i.test(f) && !accountedFor.has(f))
if (missing.length) errors.push(`unassigned photos: ${missing.join(', ')}`)

console.log(`products:            ${products.length}`)
console.log(`photos in products:  ${used.size}`)
console.log(`corrupt (excluded):  ${CORRUPT.length}`)
console.log(`packaging (excluded):${NOT_A_PRODUCT.length}`)
console.log(`total accounted for: ${accountedFor.size} / ${onDisk.filter((f) => /\.heic$/i.test(f)).length}`)

if (errors.length) {
  console.error('\nVALIDATION FAILED:')
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

fs.writeFileSync(OUT, JSON.stringify({ products, excluded: { corrupt: CORRUPT, packaging: NOT_A_PRODUCT } }, null, 2))
console.log(`\nOK — wrote ${OUT}`)
