import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getStockExportRows, brandCodeForSku, type StockExportRow } from '@/lib/stock-export'

const COLUMNS: { header: string; key: keyof StockExportRow; width: number }[] = [
  { header: 'SKU', key: 'sku', width: 16 },
  { header: 'Product', key: 'productName', width: 42 },
  { header: 'Category', key: 'category', width: 22 },
  { header: 'Color', key: 'color', width: 16 },
  { header: 'Size', key: 'size', width: 10 },
  { header: 'Price', key: 'price', width: 10 },
  { header: 'Compare At Price', key: 'compareAtPrice', width: 16 },
  { header: 'Currency', key: 'currency', width: 10 },
  { header: 'Stock', key: 'stock', width: 8 },
  { header: 'Low Stock Threshold', key: 'lowStockThreshold', width: 12 },
  { header: 'Variant Status', key: 'variantStatus', width: 12 },
  { header: 'Product Status', key: 'productStatus', width: 12 },
  { header: 'Product ID', key: 'productId', width: 38 },
]

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId') || undefined
  const search = searchParams.get('search') || undefined
  const status = (searchParams.get('status') as 'active' | 'draft' | 'incomplete' | null) || undefined

  let rows: StockExportRow[]
  try {
    rows = await getStockExportRows({ categoryId, search, status: status ?? undefined })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }

  const byBrand = new Map<string, StockExportRow[]>()
  for (const row of rows) {
    const brand = brandCodeForSku(row.sku)
    if (!byBrand.has(brand)) byBrand.set(brand, [])
    byBrand.get(brand)!.push(row)
  }

  // Alphabetical by brand code, with the SKU-less/short-SKU fallback bucket last.
  const brandCodes = [...byBrand.keys()].sort((a, b) => {
    if (a === 'ALTELE') return 1
    if (b === 'ALTELE') return -1
    return a.localeCompare(b)
  })

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'KAYA Studio Outlet'
  workbook.created = new Date()

  for (const brand of brandCodes) {
    const sheet = workbook.addWorksheet(brand)
    sheet.columns = COLUMNS
    sheet.getRow(1).font = { bold: true }
    sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + COLUMNS.length)}1` }
    for (const row of byBrand.get(brand)!) {
      sheet.addRow(row)
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const timestamp = new Date().toISOString().slice(0, 10)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="stock-by-brand-${timestamp}.xlsx"`,
    },
  })
}
