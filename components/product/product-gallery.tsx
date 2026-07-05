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
  const activeId = (active ?? primary)?.id

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-[4/5] bg-[#1B1917] overflow-hidden">
        <Image
          src={current.url}
          alt={current.alt_text ?? productName}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          style={{ objectPosition: '50% 30%', filter: 'contrast(1.1) brightness(0.95) saturate(1.05)' }}
          unoptimized={current.url.startsWith('/')}
        />

        {/* Mobile: dot indicators over the image */}
        {display.length > 1 && (
          <div className="md:hidden absolute bottom-3.5 inset-x-0 flex justify-center gap-1.5">
            {display.map((img) => (
              <button
                key={img.id}
                onClick={() => setActive(img)}
                aria-label={img.alt_text ?? productName}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ background: activeId === img.id ? '#D9B679' : '#3a3833' }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: thumbnail grid */}
      {display.length > 1 && (
        <div className="hidden md:grid grid-cols-4 gap-3">
          {display.map((img) => (
            <button
              key={img.id}
              onClick={() => setActive(img)}
              className="relative aspect-[3/4] overflow-hidden box-border transition-all"
              style={{ border: `1.5px solid ${activeId === img.id ? '#D9B679' : 'transparent'}` }}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? productName}
                fill
                sizes="140px"
                className="object-cover"
                style={{
                  objectPosition: '50% 30%',
                  opacity: activeId === img.id ? 1 : 0.55,
                  filter: 'contrast(1.1) brightness(0.95) saturate(1.05)',
                }}
                unoptimized={img.url.startsWith('/')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
