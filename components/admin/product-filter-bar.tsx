'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useRef, useState } from 'react'
import type { Category } from '@/lib/types'

interface ProductFilterBarProps {
  categories: Category[]
  activeCategoryId: string
  totalCount: number
}

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  // Placeholders from the bulk photo import — price still at 0, nothing filled in yet.
  { label: 'Incomplete', value: 'incomplete' },
]

export function ProductFilterBar({ categories, activeCategoryId, totalCount }: ProductFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeStatus = searchParams.get('status') ?? ''
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function buildParams(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')
    for (const [k, v] of Object.entries(overrides)) {
      if (v) {
        params.set(k, v)
      } else {
        params.delete(k)
      }
    }
    return params.toString()
  }

  function navigateTo(overrides: Record<string, string>) {
    router.push(`${pathname}?${buildParams(overrides)}`)
  }

  function handleSearch(value: string) {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigateTo({ search: value })
    }, 300)
  }

  return (
    <div className="space-y-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search by name or SKU..."
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-1.5 text-sm border border-gray-200 bg-white focus:outline-none focus:border-gray-400"
        />
        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => navigateTo({ status: opt.value })}
              className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                activeStatus === opt.value
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400 mr-1">{totalCount} products</span>
        <button
          onClick={() => navigateTo({ categoryId: '' })}
          className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
            !activeCategoryId
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          All categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => navigateTo({ categoryId: cat.id })}
            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
              activeCategoryId === cat.id
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
