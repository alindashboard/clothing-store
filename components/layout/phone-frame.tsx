'use client'
import Image from 'next/image'
import { useState } from 'react'

interface PhoneFrameProps {
  imageSrc: string
  imageAlt?: string
}

function InstagramPlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function PhoneFrame({ imageSrc, imageAlt = 'Instagram profile preview' }: PhoneFrameProps) {
  const [imgError, setImgError] = useState(false)
  const showImage = Boolean(imageSrc) && !imgError

  return (
    <div
      className="relative select-none"
      style={{
        width: 250,
        background: '#1a1a1a',
        borderRadius: 36,
        padding: '10px 10px 8px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      }}
    >
      {/* Dynamic Island */}
      <div
        className="mx-auto mb-2"
        style={{ width: 64, height: 14, background: '#0d0d0d', borderRadius: 9999 }}
        aria-hidden="true"
      />

      {/* Screen */}
      <div
        className="overflow-hidden relative"
        style={{ borderRadius: 24, aspectRatio: '9 / 19.5', background: '#111' }}
      >
        {showImage ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            style={{ objectFit: 'cover', objectPosition: 'top' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-600 gap-2">
            <InstagramPlaceholderIcon className="w-10 h-10" />
            <p className="text-xs text-center px-6 leading-relaxed">Screenshot coming soon</p>
          </div>
        )}
      </div>

      {/* Home indicator */}
      <div
        className="mx-auto mt-2"
        style={{ width: 80, height: 4, background: '#333', borderRadius: 9999 }}
        aria-hidden="true"
      />
    </div>
  )
}
