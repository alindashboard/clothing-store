'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface CategoryImageSliderProps {
  images: string[]
  alt: string
}

export function CategoryImageSlider({ images, alt }: CategoryImageSliderProps) {
  const [active, setActive] = useState(0)
  const count = images.length

  useEffect(() => {
    if (count <= 1) return
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % count)
    }, 3500)
    return () => clearInterval(id)
  }, [count])

  if (count === 0) return null

  return (
    <>
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt={i === 0 ? alt : ''}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-opacity duration-700"
          style={{ opacity: i === active ? 1 : 0 }}
          unoptimized
        />
      ))}
    </>
  )
}
