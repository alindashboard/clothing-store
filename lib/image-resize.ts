/**
 * Client-side image downscaling, run before an image is handed to a Server Action.
 *
 * Phone photos are routinely 8-12MB, which no upload path here accepts: Vercel
 * caps a serverless request body at 4.5MB, below both our own MAX_SIZE check and
 * the configured serverActions.bodySizeLimit. Re-encoding in the browser keeps
 * the owner's workflow to "pick the file" while what leaves the browser is a
 * web-ready WebP of a few hundred KB.
 *
 * Constants mirror scripts/convert-to-webp.mjs so images uploaded from the admin
 * match the ones produced by the bulk pipeline.
 */

const MAX_EDGE = 1600
const WEBP_QUALITY = 0.82

/** Files at or below this are already web-sized; re-encoding would only lose quality. */
const SKIP_BELOW_BYTES = 400 * 1024

export interface ResizeResult {
  file: File
  /** Bytes of the file the user picked, for reporting the saving. */
  originalSize: number
  /** False when the original was passed through untouched. */
  resized: boolean
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY))
}

/**
 * Downscale and re-encode to WebP. Returns the original file untouched if it is
 * already small enough, or if the browser cannot decode/encode it — callers stay
 * responsible for enforcing the real size limit.
 */
export async function resizeImageForUpload(file: File): Promise<ResizeResult> {
  const originalSize = file.size
  const passthrough: ResizeResult = { file, originalSize, resized: false }

  if (file.size <= SKIP_BELOW_BYTES) return passthrough

  let bitmap: ImageBitmap
  try {
    // 'from-image' applies EXIF rotation, which drawImage would otherwise drop.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return passthrough
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return passthrough
    ctx.drawImage(bitmap, 0, 0, width, height)

    const blob = await canvasToBlob(canvas)
    // toBlob falls back to PNG when webp is unsupported, which inflates photos.
    if (!blob || blob.type !== 'image/webp' || blob.size >= originalSize) return passthrough

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp'
    return {
      file: new File([blob], name, { type: 'image/webp', lastModified: file.lastModified }),
      originalSize,
      resized: true,
    }
  } finally {
    bitmap.close()
  }
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  return `${Math.round(bytes / 1024)}KB`
}
