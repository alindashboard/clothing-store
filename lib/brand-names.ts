/**
 * Display brands as the stock import writes them (scripts/parse-stock-ods.py →
 * BRANDS): every imported product name starts with its brand, e.g.
 * "Palm Angels T-shirt Nero". Keep in sync with that table.
 */
export const BRAND_NAMES = [
  'Armani', 'Barrow', 'BLNCG', 'Calvin Klein', 'Disclaimer', 'DS2', 'Exit 7', 'GCDS',
  'Givenchy', 'Iceberg', 'Icon', 'Marcelo Burlon', 'Moschino', 'New Balance', 'Off-White',
  'Palm Angels', 'Pinko', 'Plein Sport', 'Tommy Hilfiger', 'Polo', 'Richmond', 'Versace',
]

// Longest first so "Plein Sport" wins over a shorter prefix match.
const BY_LENGTH = [...BRAND_NAMES].sort((a, b) => b.length - a.length)

export function brandFromProductName(name: string): string | null {
  const lower = name.toLowerCase()
  return BY_LENGTH.find((brand) => lower.startsWith(`${brand.toLowerCase()} `) || lower === brand.toLowerCase()) ?? null
}
