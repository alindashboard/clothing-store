'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'

interface Props {
  products: Product[]
  /**
   * "default" = full-size items (landing).
   * "compact" = ~30% narrower (dedicated /new-arrivals page,
   *             shows more items simultaneously).
   */
  size?: 'default' | 'compact'
}

/**
 * Auto-scrolling marquee of product images.
 *
 * Repeat logic: the track must be wide enough that at any point during the
 * animation the viewport is always filled. Required: trackWidth ≥ 2 × viewport.
 * With ~240px items, safe thresholds for a 1440px screen:
 *   ≤6 products → 4 copies  (4 × 6 × 256px = 6144px ≥ 2880px ✓)
 *   7–10        → 3 copies
 *   >10         → 2 copies
 *
 * Animation: translateX(calc(-100% / repeats)) = exactly one copy's width.
 * Speed is based on products.length (one copy), so it stays constant regardless
 * of how many copies we add.
 */
export function NewArrivalsCarousel({ products, size = 'default' }: Props) {
  if (products.length === 0) return null

  const repeats =
    products.length <= 6 ? 4
    : products.length <= 10 ? 3
    : 2

  const repeated = Array<Product[]>(repeats).fill(products).flat()

  // Speed: time to scroll one copy's width
  const speedSeconds = Math.max(products.length * 3.5, 14)

  const itemClass =
    size === 'compact'
      ? 'w-[140px] md:w-[168px]'
      : 'w-[200px] md:w-[240px]'

  const gapClass = size === 'compact' ? 'gap-3' : 'gap-4'

  return (
    <div className="overflow-hidden w-full" aria-label="New arrivals carousel">
      <div
        className={`na-scroll-track inline-flex ${gapClass}`}
        style={
          {
            '--na-speed': `${speedSeconds}s`,
            '--na-repeats': repeats,
          } as React.CSSProperties
        }
      >
        {repeated.map((product, i) => {
          const img =
            product.images?.find((x) => x.is_primary) ?? product.images?.[0]
          const src = img?.url ?? '/images/placeholder-product.svg'
          const isLocal = src.startsWith('/')

          return (
            <Link
              key={`${product.id}-${i}`}
              href={`/product/${product.slug}`}
              className={`block shrink-0 ${itemClass} relative overflow-hidden rounded-xl`}
              style={{ aspectRatio: '3/4' }}
              tabIndex={i >= products.length ? -1 : 0}
              aria-hidden={i >= products.length}
            >
              <Image
                src={src}
                alt={img?.alt_text ?? product.name}
                fill
                sizes={
                  size === 'compact'
                    ? '(max-width: 768px) 140px, 168px'
                    : '(max-width: 768px) 200px, 240px'
                }
                className="object-cover transition-transform duration-500 hover:scale-105"
                loading={i < products.length ? 'eager' : 'lazy'}
                unoptimized={isLocal}
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
