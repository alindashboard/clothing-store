import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getStockExportRows, type StockExportRow } from '@/lib/stock-export'

function csvEscape(value: string | number | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

const HEADERS = [
  'SKU',
  'Product',
  'Category',
  'Color',
  'Size',
  'Price',
  'Compare At Price',
  'Currency',
  'Stock',
  'Low Stock Threshold',
  'Variant Status',
  'Product Status',
  'Product ID',
]

function toCsvRow(row: StockExportRow): (string | number)[] {
  return [
    row.sku,
    row.productName,
    row.category,
    row.color,
    row.size,
    row.price,
    row.compareAtPrice ?? '',
    row.currency,
    row.stock,
    row.lowStockThreshold ?? '',
    row.variantStatus,
    row.productStatus,
    row.productId,
  ]
}

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

  const csvLines = [HEADERS, ...rows.map(toCsvRow)].map((row) => row.map(csvEscape).join(','))
  // BOM so Excel opens the UTF-8 file with accented characters intact.
  const csv = '﻿' + csvLines.join('\r\n') + '\r\n'

  const timestamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="stock-export-${timestamp}.csv"`,
    },
  })
}
