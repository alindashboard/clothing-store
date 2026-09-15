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

  // Always show first, last, current, and current's neighbors; collapse the
  // rest into an ellipsis so this stays a single row even at 20+ pages.
  const pageNumbers: (number | 'ellipsis')[] = []
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pageNumbers.push(p)
    } else if (pageNumbers[pageNumbers.length - 1] !== 'ellipsis') {
      pageNumbers.push('ellipsis')
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white sm:flex-row sm:justify-between">
      <p className="text-xs text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
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
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`e${i}`} className="w-7 text-center text-xs text-gray-300 select-none">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={buildPageUrl(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`w-7 h-7 flex items-center justify-center text-xs font-medium border transition-colors ${
                  p === page
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {p}
              </Link>
            ),
          )}
        </div>
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
