'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Product } from '@/lib/types'

interface Props {
  products: Product[]
}

/**
 * Auto-scrolling marquee of product images.
 * Two copies side-by-side + translateX(-50%) = seamless infinite loop,
 * same pattern as MarqueeTicker. No pause on hover by design.
 *
 * Speed: ~3.5 s per product to scroll past, minimum 14 s total.
 */
export function NewArrivalsCarousel({ products }: Props) {
  if (products.length === 0) return null

  // Duplicate for the seamless -50% loop
  const items = [...products, ...products]
  const speedSeconds = Math.max(products.length * 3.5, 14)

  return (
    <div className="overflow-hidden w-full" aria-label="New arrivals carousel">
      <div
        className="na-scroll-track inline-flex gap-4"
        style={{ '--na-speed': `${speedSeconds}s` } as React.CSSProperties}
      >
        {items.map((product, i) => {
          const img =
            product.images?.find((x) => x.is_primary) ?? product.images?.[0]
          const src = img?.url ?? '/images/placeholder-product.svg'
          const isLocal = src.startsWith('/')

          return (
            <Link
              key={`${product.id}-${i}`}
              href={`/product/${product.slug}`}
              className="block shrink-0 w-[200px] md:w-[240px] relative overflow-hidden rounded-xl"
              style={{ aspectRatio: '3/4' }}
              tabIndex={i >= products.length ? -1 : 0}
              aria-hidden={i >= products.length}
            >
              <Image
                src={src}
                alt={img?.alt_text ?? product.name}
                fill
                sizes="(max-width: 768px) 200px, 240px"
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
