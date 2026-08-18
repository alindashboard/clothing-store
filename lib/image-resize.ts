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

/**
 * iPhones shoot HEIC unless "Most Compatible" is set, and no browser can decode it
 * natively. heic-to bundles libheif as wasm (~3MB), so it is imported dynamically:
 * the chunk is fetched only once a HEIC is actually picked, and never by the public
 * site, which does not touch this module.
 */
type HeicDecode =
  | { kind: 'bitmap'; bitmap: ImageBitmap }
  /** Named .heic but the header says otherwise — let the browser decode it normally. */
  | { kind: 'not-heic' }
  | { kind: 'failed' }

async function decodeHeic(file: File): Promise<HeicDecode> {
  try {
    const { isHeic, heicTo } = await import('heic-to/next')
    if (!(await isHeic(file))) return { kind: 'not-heic' }
    const bitmap = await heicTo({
      blob: file,
      type: 'bitmap',
      options: { imageOrientation: 'from-image' },
    })
    return { kind: 'bitmap', bitmap }
  } catch {
    // Corrupt HEIC (the depth-map breakage seen in this catalog) or an unsupported
    // variant. Caller reports it as an unreadable file.
    return { kind: 'failed' }
  }
}

/** Extension check only — the real check is heic-to's isHeic, which reads the header. */
function looksLikeHeic(file: File): boolean {
  return /\.(heic|heif)$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif'
}

export interface ResizeResult {
  file: File
  /** Bytes of the file the user picked, for reporting the saving. */
  originalSize: number
  /** False when the original was passed through untouched. */
  resized: boolean
}

/** Thrown when a file cannot be decoded at all, so there is nothing to upload. */
export class UndecodableImageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UndecodableImageError'
  }
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

  let heic = looksLikeHeic(file)

  let bitmap: ImageBitmap | null = null
  if (heic) {
    const decoded = await decodeHeic(file)
    if (decoded.kind === 'failed') {
      throw new UndecodableImageError('This HEIC file could not be read. Re-export it as JPEG.')
    }
    // Named .heic but actually a JPEG — fall through to the normal decode path.
    if (decoded.kind === 'not-heic') heic = false
    else bitmap = decoded.bitmap
  }

  if (!bitmap) {
    // Only reachable for non-HEIC files; a HEIC always needs converting whatever its size.
    if (file.size <= SKIP_BELOW_BYTES) return passthrough
    try {
      // 'from-image' applies EXIF rotation, which drawImage would otherwise drop.
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      return passthrough
    }
  }

  const source: ImageBitmap = bitmap

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(source.width, source.height))
    const width = Math.round(source.width * scale)
    const height = Math.round(source.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return passthrough
    ctx.drawImage(source, 0, 0, width, height)

    const blob = await canvasToBlob(canvas)
    // toBlob falls back to PNG when webp is unsupported, which inflates photos.
    if (!blob || blob.type !== 'image/webp') {
      if (heic) throw new UndecodableImageError('This browser cannot convert HEIC images.')
      return passthrough
    }
    // A HEIC must be converted even when the WebP is larger; the original is unusable.
    if (!heic && blob.size >= originalSize) return passthrough

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp'

    return {
      file: new File([blob], name, { type: 'image/webp', lastModified: file.lastModified }),
      originalSize,
      resized: true,
    }
  } finally {
    source.close()
  }
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  return `${Math.round(bytes / 1024)}KB`
}
