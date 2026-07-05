'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

const GALLERY = [
  { src: '/store-background.png', alt: 'Store view', captionKey: 'galleryCaptionFloor' as const },
  { src: '/raft 1.jpg',           alt: 'Fitting room area', captionKey: 'galleryCaptionRacks' as const },
  { src: '/produse-2.jpg',        alt: 'Accessories display', captionKey: 'galleryCaptionCurated' as const },
  { src: '/meet-kaya.png',        alt: 'Meet Kaya', captionKey: 'galleryCaptionMeetKaya' as const },
]

export function StoreGallery() {
  const t = useTranslations('store')
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
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
              background: '#1B1917',
            }}
            className="relative overflow-hidden cursor-pointer group"
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
              style={{ filter: 'contrast(1.1) brightness(0.95) saturate(1.05)' }}
              unoptimized
            />
            <div
              className="absolute bottom-0 left-0 right-0 px-4 py-3 text-[10.5px] tracking-[1.5px]"
              style={{
                background: 'linear-gradient(0deg, rgba(10,10,9,0.7) 0%, rgba(10,10,9,0) 100%)',
                color: '#EDE9E1',
                fontFamily: 'var(--font-grotesk, var(--font-sans))',
              }}
            >
              {t(item.captionKey)}
            </div>
            {isExpanded && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(null) }}
                className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full text-lg leading-none transition-colors"
                style={{ background: 'rgba(10,10,9,0.7)', color: '#EDE9E1' }}
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
