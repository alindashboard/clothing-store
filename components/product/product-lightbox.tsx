'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { X, ChevronLeft, ChevronRight, LayoutGrid, ZoomIn, ZoomOut } from 'lucide-react'
import type { ProductImage } from '@/lib/types'

interface ProductLightboxProps {
  images: ProductImage[]
  productName: string
  startIndex: number
  /** Called with the index the viewer was on, so the inline gallery can follow. */
  onClose: (lastIndex: number) => void
}

const ZOOM = 2.5
const GOLD = '#D9B679'

// Fullscreen PDP photo viewer: whole image (object-contain, never cropped),
// swipe between photos, tap to zoom + pan, grid of all photos, thumbnail strip.
// Opening pushes a history entry so the phone's Back button closes the viewer
// instead of leaving the product page.
export function ProductLightbox({ images, productName, startIndex, onClose }: ProductLightboxProps) {
  const t = useTranslations('product.gallery')
  const count = images.length
  const [index, setIndex] = useState(startIndex)
  const [grid, setGrid] = useState(false)
  const [zoomed, setZoomed] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)
  const zoomPoint = useRef({ x: 0.5, y: 0.5 })
  const indexRef = useRef(startIndex)
  const onCloseRef = useRef(onClose)
  const pushedRef = useRef(false)
  const closedRef = useRef(false)

  indexRef.current = index
  onCloseRef.current = onClose

  const finishClose = useCallback(() => {
    if (closedRef.current) return
    closedRef.current = true
    onCloseRef.current(indexRef.current)
  }, [])

  // Pop our own history entry; the popstate listener then closes the viewer.
  const requestClose = useCallback(() => {
    if (pushedRef.current) window.history.back()
    else finishClose()
  }, [finishClose])

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const el = trackRef.current
      const clamped = Math.max(0, Math.min(i, count - 1))
      setZoomed(false)
      setIndex(clamped)
      el?.scrollTo({ left: clamped * el.clientWidth, behavior: smooth ? 'smooth' : 'instant' })
    },
    [count]
  )

  // Start on the photo that was tapped.
  useLayoutEffect(() => {
    const el = trackRef.current
    if (el) el.scrollLeft = startIndex * el.clientWidth
  }, [startIndex])

  // History entry (guarded so StrictMode's double effect doesn't push twice),
  // Back-button close, body scroll lock and keyboard controls.
  useEffect(() => {
    if (!pushedRef.current) {
      window.history.pushState({ kayaLightbox: true }, '')
      pushedRef.current = true
    }
    const onPop = () => finishClose()
    window.addEventListener('popstate', onPop)

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('popstate', onPop)
      document.body.style.overflow = prevOverflow
    }
  }, [finishClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
      else if (e.key === 'ArrowRight') goTo(indexRef.current + 1)
      else if (e.key === 'ArrowLeft') goTo(indexRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, requestClose])

  // Keep the active thumbnail in view.
  useEffect(() => {
    const thumb = thumbsRef.current?.children[index] as HTMLElement | undefined
    thumb?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [index])

  // After zooming in, scroll so the tapped point sits in the middle.
  useLayoutEffect(() => {
    const el = zoomRef.current
    if (!zoomed || !el) return
    el.scrollLeft = zoomPoint.current.x * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = zoomPoint.current.y * el.scrollHeight - el.clientHeight / 2
  }, [zoomed])

  const handleScroll = () => {
    const el = trackRef.current
    if (!el || el.clientWidth === 0 || zoomed) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== indexRef.current) setIndex(i)
  }

  const toggleZoom = (e?: React.MouseEvent<HTMLElement>) => {
    if (!zoomed && e) {
      const rect = e.currentTarget.getBoundingClientRect()
      zoomPoint.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      }
    } else if (!zoomed) {
      zoomPoint.current = { x: 0.5, y: 0.5 }
    }
    setZoomed((z) => !z)
  }

  const iconButton = 'w-10 h-10 flex items-center justify-center rounded-full transition-colors hover:bg-white/10'

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={productName}
      className="fixed inset-0 z-[100] flex flex-col bg-[#0A0A0A] text-[#EDE9E1]"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between h-14 px-2 shrink-0">
        <p
          className="pl-3 text-xs tracking-[0.2em]"
          style={{ fontFamily: 'var(--font-grotesk, var(--font-sans))' }}
          aria-live="polite"
        >
          {grid ? t('allPhotos') : t('counter', { current: index + 1, total: count })}
        </p>
        <div className="flex items-center gap-1">
          {!grid && (
            <button type="button" onClick={() => toggleZoom()} aria-label={zoomed ? t('zoomOut') : t('zoomIn')} className={iconButton}>
              {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>
          )}
          {count > 1 && (
            <button
              type="button"
              onClick={() => { setZoomed(false); setGrid((g) => !g) }}
              aria-label={t('allPhotos')}
              aria-pressed={grid}
              className={iconButton}
              style={grid ? { color: GOLD } : undefined}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          )}
          <button type="button" onClick={requestClose} aria-label={t('close')} className={iconButton}>
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Slides */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className={`flex h-full w-full snap-x snap-mandatory [&::-webkit-scrollbar]:hidden ${zoomed ? 'overflow-hidden' : 'overflow-x-auto'}`}
          style={{ scrollbarWidth: 'none' }}
        >
          {images.map((img, i) => {
            const isCurrent = i === index
            const near = Math.abs(i - index) <= 1
            return (
              <div key={img.id} className="relative h-full w-full flex-shrink-0 snap-center">
                {isCurrent && zoomed ? (
                  <div ref={zoomRef} className="absolute inset-0 overflow-auto cursor-zoom-out" onClick={() => toggleZoom()}>
                    <div className="relative" style={{ width: `${ZOOM * 100}%`, height: `${ZOOM * 100}%` }}>
                      <Image
                        src={img.url}
                        alt={img.alt_text ?? productName}
                        fill
                        sizes={`${ZOOM * 100}vw`}
                        className="object-contain"
                        unoptimized={img.url.startsWith('/')}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 cursor-zoom-in" onClick={isCurrent ? toggleZoom : undefined}>
                    <Image
                      src={img.url}
                      alt={img.alt_text ?? productName}
                      fill
                      sizes="100vw"
                      loading={near ? 'eager' : 'lazy'}
                      className="object-contain"
                      unoptimized={img.url.startsWith('/')}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {count > 1 && !zoomed && !grid && (
          <>
            {index > 0 && (
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                aria-label={t('previous')}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 hidden md:flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {index < count - 1 && (
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                aria-label={t('next')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 hidden md:flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </>
        )}

        {/* Grid of all photos, layered over the track so its scroll position survives */}
        {grid && (
          <div className="absolute inset-0 z-10 overflow-y-auto bg-[#0A0A0A] px-3 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-5xl mx-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => { setGrid(false); goTo(i, false) }}
                  aria-label={t('counter', { current: i + 1, total: count })}
                  className="relative aspect-[3/4] bg-[#1B1917] overflow-hidden"
                  style={{ outline: i === index ? `1.5px solid ${GOLD}` : 'none', outlineOffset: '-1.5px' }}
                >
                  <Image
                    src={img.url}
                    alt={img.alt_text ?? productName}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover"
                    unoptimized={img.url.startsWith('/')}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {count > 1 && !grid && (
        <div
          ref={thumbsRef}
          className="flex gap-2 overflow-x-auto px-3 py-3 shrink-0 justify-start md:justify-center [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t('counter', { current: i + 1, total: count })}
              className="relative w-12 h-16 shrink-0 overflow-hidden bg-[#1B1917]"
              style={{ outline: i === index ? `1.5px solid ${GOLD}` : 'none', outlineOffset: '-1.5px' }}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
                style={{ opacity: i === index ? 1 : 0.5 }}
                unoptimized={img.url.startsWith('/')}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return createPortal(content, document.body)
}
