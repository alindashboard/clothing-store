'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

interface AdminPaginationProps {
  page: number
  totalPages: number
}

export function AdminPagination({ page, totalPages }: AdminPaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function buildPageUrl(target: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(target))
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-white">
      <p className="text-xs text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link
            href={buildPageUrl(page - 1)}
            className="px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:border-gray-400 transition-colors"
          >
            Previous
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-xs font-medium border border-gray-100 text-gray-300 cursor-not-allowed select-none">
            Previous
          </span>
        )}
        {page < totalPages ? (
          <Link
            href={buildPageUrl(page + 1)}
            className="px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:border-gray-400 transition-colors"
          >
            Next
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-xs font-medium border border-gray-100 text-gray-300 cursor-not-allowed select-none">
            Next
          </span>
        )}
      </div>
    </div>
  )
}
