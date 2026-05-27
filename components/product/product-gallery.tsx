'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ProductImage } from '@/lib/types'

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
  activeColor?: string
}

export function ProductGallery({ images, productName, activeColor }: ProductGalleryProps) {
  const filtered = activeColor
    ? images.filter((i) => !i.color_name || i.color_name === activeColor)
    : images

  const display = filtered.length > 0 ? filtered : images
  const primary = display.find((i) => i.is_primary) ?? display[0]
  const [active, setActive] = useState<ProductImage | undefined>(primary)

  const current = active ?? primary ?? { url: '/images/placeholder-product.svg', alt_text: productName }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
        <Image
          src={current.url}
          alt={current.alt_text ?? productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          unoptimized={current.url.startsWith('/')}
        />
      </div>

      {/* Thumbnails */}
      {display.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {display.map((img) => (
            <button
              key={img.id}
              onClick={() => setActive(img)}
              className={`relative w-20 h-24 shrink-0 overflow-hidden border-2 transition-all ${
                (active ?? primary)?.id === img.id ? 'border-black' : 'border-transparent hover:border-gray-300'
              }`}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? productName}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized={img.url.startsWith('/')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
