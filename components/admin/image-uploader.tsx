'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, Trash2, Star } from 'lucide-react'
import type { ProductImage } from '@/lib/types'
import { uploadProductImage } from '@/lib/actions/upload'
import { upsertImage, deleteImage, setImageAsPrimary } from '@/lib/actions/products'
import { resizeImageForUpload, formatBytes, UndecodableImageError } from '@/lib/image-resize'
import { MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_LABEL } from '@/lib/actions/upload-limits'
import { toast } from 'sonner'

interface ImageUploaderProps {
  productId: string
  initialImages: ProductImage[]
}

export function ImageUploader({ productId, initialImages }: ImageUploaderProps) {
  const [images, setImages] = useState<ProductImage[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Uploads run in a loop; each one needs the count after the previous finished,
  // which the images state has not re-rendered into scope yet.
  const imagesRef = useRef(images)
  useEffect(() => { imagesRef.current = images }, [images])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    setUploading(true)
    let uploaded = 0
    // Sequential: each upload needs the running image count for is_primary/sort_order.
    for (let i = 0; i < files.length; i++) {
      setProgress(files.length > 1 ? `${i + 1}/${files.length}` : null)
      const ok = await uploadOne(files[i])
      if (ok) uploaded++
    }
    setProgress(null)
    setUploading(false)

    if (uploaded > 0) {
      toast.success(uploaded === 1 ? 'Image uploaded' : `${uploaded} images uploaded`)
    }
  }

  /** Returns true when the file made it all the way into the DB. */
  async function uploadOne(original: File): Promise<boolean> {
    let file = original
    try {
      const result = await resizeImageForUpload(original)
      file = result.file
    } catch (err) {
      if (err instanceof UndecodableImageError) {
        toast.error(`${original.name}: ${err.message}`)
        return false
      }
      // Fall through with the original; the size check below still guards it.
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error(
        `${original.name}: still ${formatBytes(file.size)} after compression — max is ${MAX_UPLOAD_SIZE_LABEL}.`
      )
      return false
    }

    const fd = new FormData()
    fd.append('file', file)

    let url: string | undefined
    let error: string | undefined
    try {
      ;({ url, error } = await uploadProductImage(fd, productId))
    } catch {
      toast.error(`${original.name}: upload failed. Check your connection and retry.`)
      return false
    }
    if (error || !url) {
      toast.error(`${original.name}: ${error ?? 'upload failed.'}`)
      return false
    }

    const count = imagesRef.current.length
    const result = await upsertImage({
      product_id: productId,
      url,
      alt_text: original.name.replace(/\.[^.]+$/, ''),
      is_primary: count === 0,
      sort_order: count,
    })

    if (result.error) {
      toast.error(`${original.name}: ${result.error}`)
      return false
    }

    const next = [...imagesRef.current, result.data!]
    imagesRef.current = next
    setImages(next)
    return true
  }

  async function handleDelete(img: ProductImage) {
    if (!confirm('Delete this image?')) return
    const result = await deleteImage(img.id)
    if (result.error) { toast.error(result.error); return }
    setImages((prev) => prev.filter((i) => i.id !== img.id))
    toast.success('Image deleted')
  }

  async function handleSetPrimary(img: ProductImage) {
    const result = await setImageAsPrimary(productId, img.id)
    if (result.error) { toast.error(result.error); return }
    setImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === img.id })))
    toast.success('Primary image updated')
  }

  async function handleAltText(img: ProductImage, altText: string) {
    await upsertImage({ ...img, alt_text: altText })
    setImages((prev) => prev.map((i) => (i.id === img.id ? { ...i, alt_text: altText } : i)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600">Images</h3>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs px-3 py-1.5 bg-black text-white flex items-center gap-1 hover:bg-gray-800 disabled:opacity-50"
        >
          <Upload className="w-3 h-3" />
          {uploading ? `Uploading${progress ? ` ${progress}` : ''}...` : 'Upload Images'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <p className="text-xs text-gray-400">
        JPG, PNG, WebP, HEIC · select several at once · large photos are converted and
        compressed automatically · Click ★ to set as primary
      </p>

      {images.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Click to upload — you can select several photos at once</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                <Image
                  src={img.url}
                  alt={img.alt_text ?? 'Product image'}
                  fill
                  sizes="120px"
                  className="object-cover"
                  unoptimized={img.url.startsWith('/')}
                />
                {img.is_primary && (
                  <div className="absolute top-1 left-1 bg-black text-white text-[10px] px-1 py-0.5">
                    PRIMARY
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!img.is_primary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(img)}
                      className="text-white hover:text-yellow-400 transition-colors"
                      title="Set as primary"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(img)}
                    className="text-white hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={img.alt_text ?? ''}
                onChange={(e) => handleAltText(img, e.target.value)}
                placeholder="Alt text"
                className="mt-1 w-full text-[10px] border border-gray-200 px-1.5 py-0.5 focus:outline-none focus:border-gray-400"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
