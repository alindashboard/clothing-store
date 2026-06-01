'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type { Category } from '@/lib/types'

interface ProductFilterBarProps {
  categories: Category[]
  activeCategoryId: string
  totalCount: number
}

export function ProductFilterBar({ categories, activeCategoryId, totalCount }: ProductFilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function navigate(categoryId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (categoryId) {
      params.set('categoryId', categoryId)
    } else {
      params.delete('categoryId')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <button
        onClick={() => navigate('')}
        className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
          !activeCategoryId
            ? 'bg-black text-white border-black'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
        }`}
      >
        All
        {!activeCategoryId && (
          <span className="ml-1.5 opacity-70">({totalCount})</span>
        )}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => navigate(cat.id)}
          className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
            activeCategoryId === cat.id
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          {cat.name}
          {activeCategoryId === cat.id && (
            <span className="ml-1.5 opacity-70">({totalCount})</span>
          )}
        </button>
      ))}
    </div>
  )
}
