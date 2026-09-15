import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createSupabaseAdminClient } from '@/lib/supabase'
import type { Product } from '@/lib/types'

/** Category ids to filter by: the given id plus its children (products hang off
 *  leaf categories, so filtering a parent like "Uomo" must reach its children too). */
async function categoryIdsForId(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  categoryId: string
): Promise<string[]> {
  const { data: children } = await supabase
    .from('categories')
    .select('id')
    .eq('parent_id', categoryId)
  return [categoryId, ...(children ?? []).map((c) => c.id)]
}

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

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createSupabaseAdminClient()
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId') || undefined
  const search = searchParams.get('search') || undefined
  const status = (searchParams.get('status') as 'active' | 'draft' | 'incomplete' | null) || undefined

  let query = admin
    .from('products')
    .select(`
      *,
      category:categories(*),
      variants:product_variants(*)
    `)
    .order('name', { ascending: true })
    .range(0, 9999)

  if (categoryId) {
    const ids = await categoryIdsForId(admin, categoryId)
    query = query.in('category_id', ids)
  }
  if (search?.trim()) {
    const term = search.trim()
    query = query.or(`name.ilike.%${term}%,sku_prefix.ilike.%${term}%`)
  }
  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'draft') {
    query = query.eq('is_active', false)
  } else if (status === 'incomplete') {
    query = query.eq('base_price', 0)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const products = (data ?? []) as Product[]

  const rows: string[][] = []
  for (const product of products) {
    const categoryName = product.category?.name ?? ''
    const productStatus = product.is_active ? 'Active' : 'Draft'
    const variants = [...(product.variants ?? [])].sort((a, b) => a.sort_order - b.sort_order)

    if (variants.length === 0) {
      rows.push([
        product.sku_prefix ?? '',
        product.name,
        categoryName,
        '',
        '',
        String(product.base_price),
        product.compare_at_price !== null ? String(product.compare_at_price) : '',
        product.currency,
        '0',
        '',
        '',
        productStatus,
        product.id,
      ])
      continue
    }

    for (const variant of variants) {
      const price = variant.price_override ?? product.base_price
      rows.push([
        variant.sku ?? product.sku_prefix ?? '',
        product.name,
        categoryName,
        variant.color_name,
        variant.size,
        String(price),
        product.compare_at_price !== null ? String(product.compare_at_price) : '',
        product.currency,
        String(variant.stock_quantity),
        String(variant.low_stock_threshold),
        variant.is_active ? 'Active' : 'Draft',
        productStatus,
        product.id,
      ])
    }
  }

  const csvLines = [HEADERS, ...rows].map((row) => row.map(csvEscape).join(','))
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
