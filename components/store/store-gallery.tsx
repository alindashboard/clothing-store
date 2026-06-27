'use client'

import { useState } from 'react'
import Image from 'next/image'

const GALLERY = [
  { src: '/meet-kaya.png',        alt: 'Meet Kaya' },
  { src: '/store-background.png', alt: 'Store view' },
  { src: '/raft 1.jpg',           alt: 'Fitting room area' },
  { src: '/produse-2.jpg',        alt: 'Accessories display' },
]

export function StoreGallery() {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {GALLERY.map((item, i) => {
        const isExpanded = expanded === i
        return (
          <div
            key={i}
            onClick={() => setExpanded(isExpanded ? null : i)}
            style={{
              gridColumn: isExpanded ? '1 / -1' : undefined,
              aspectRatio: isExpanded ? '16/9' : '1/1',
              transition: 'aspect-ratio 300ms ease',
            }}
            className="relative bg-gray-100 overflow-hidden cursor-pointer group"
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes={
                isExpanded
                  ? '(max-width: 1280px) 100vw, 1024px'
                  : '(max-width: 768px) 100vw, 50vw'
              }
              className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              unoptimized
            />
            {isExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(null) }}
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-black/60 text-white rounded-full text-lg leading-none hover:bg-black/80 transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
