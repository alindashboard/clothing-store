'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import type { Product } from '@/lib/types'
import { ProductCard } from './product-card'
import { loadMoreProducts } from '@/lib/actions/products'

interface Props {
  initialProducts: Product[]
  initialHasMore: boolean
  categorySlug?: string
  columns?: 2 | 3 | 4
  /** 'dark' = for use on dark surfaces (e.g. the category page). */
  variant?: 'light' | 'dark'
}

export function ProductGridInfinite({
  initialProducts,
  initialHasMore,
  categorySlug,
  columns = 4,
  variant = 'light',
}: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isPending, startTransition] = useTransition()
  const sentinelRef = useRef<HTMLDivElement>(null)
  const offsetRef = useRef(initialProducts.length)
  const loadingRef = useRef(false)
  const t = useTranslations('common')

  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return
    const sentinel = sentinelRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || loadingRef.current) return
        loadingRef.current = true
        startTransition(async () => {
          const result = await loadMoreProducts({ categorySlug, offset: offsetRef.current })
          setProducts((prev) => [...prev, ...result.products])
          offsetRef.current += result.products.length
          setHasMore(result.hasMore)
          loadingRef.current = false
        })
      },
      { rootMargin: '400px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, categorySlug])

  const colClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[columns]

  if (products.length === 0) {
    return (
      <div className={`py-20 text-center ${variant === 'dark' ? 'text-[#8C8577]' : 'text-gray-400'}`}>
        {t('noProductsFound')}
      </div>
    )
  }

  return (
    <div>
      <div className={`grid ${colClass} gap-x-4 gap-y-10`}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} variant={variant} />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-12">
          {isPending && (
            <span
              className={`block w-5 h-5 border-2 rounded-full animate-spin ${
                variant === 'dark' ? 'border-[#2B2924] border-t-[#D9B679]' : 'border-gray-300 border-t-gray-700'
              }`}
            />
          )}
        </div>
      )}

      {!hasMore && (
        <p
          className={`text-center text-[10px] tracking-[0.25em] uppercase py-10 ${
            variant === 'dark' ? 'text-[#5a5852]' : 'text-gray-300'
          }`}
        >
          {t('endOfCollection')}
        </p>
      )}
    </div>
  )
}
