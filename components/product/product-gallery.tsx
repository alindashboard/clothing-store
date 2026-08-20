'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

  const scrollerRef = useRef<HTMLDivElement>(null)
  const [mobileIndex, setMobileIndex] = useState(0)

  const scrollToIndex = (index: number) => {
    const el = scrollerRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(index, display.length - 1))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
  }

  const handleScroll = () => {
    const el = scrollerRef.current
    if (!el || el.clientWidth === 0) return
    setMobileIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Mobile: swipeable carousel */}
      <div className="relative md:hidden aspect-[4/5] bg-[#1B1917] overflow-hidden">
        <div
          ref={scrollerRef}
          onScroll={handleScroll}
          className="flex h-full w-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {display.map((img) => (
            <div key={img.id} className="relative h-full w-full flex-shrink-0 snap-center">
              <Image
                src={img.url}
                alt={img.alt_text ?? productName}
                fill
                priority
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: '50% 30%', filter: 'contrast(1.1) brightness(0.95) saturate(1.05)' }}
                unoptimized={img.url.startsWith('/')}
              />
            </div>
          ))}
        </div>

        {display.length > 1 && (
          <>
            {mobileIndex > 0 && (
              <button
                onClick={() => scrollToIndex(mobileIndex - 1)}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm"
                style={{ background: 'rgba(20,20,18,0.45)' }}
              >
                <ChevronLeft className="w-4 h-4" style={{ color: '#EDE9E1' }} />
              </button>
            )}
            {mobileIndex < display.length - 1 && (
              <button
                onClick={() => scrollToIndex(mobileIndex + 1)}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-sm"
                style={{ background: 'rgba(20,20,18,0.45)' }}
              >
                <ChevronRight className="w-4 h-4" style={{ color: '#EDE9E1' }} />
              </button>
            )}

            {/* Dot indicators */}
            <div className="absolute bottom-3.5 inset-x-0 flex justify-center gap-1.5">
              {display.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => scrollToIndex(i)}
                  aria-label={img.alt_text ?? productName}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{ background: mobileIndex === i ? '#D9B679' : '#3a3833' }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Desktop: main image */}
      <div className="hidden md:block relative aspect-[4/5] bg-[#1B1917] overflow-hidden">
        <Image
          src={current.url}
          alt={current.alt_text ?? productName}
          fill
          priority
          sizes="50vw"
          className="object-cover"
          style={{ objectPosition: '50% 30%', filter: 'contrast(1.1) brightness(0.95) saturate(1.05)' }}
          unoptimized={current.url.startsWith('/')}
        />
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
