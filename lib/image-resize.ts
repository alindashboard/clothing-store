/**
 * Client-side image downscaling, run before an image is handed to a Server Action.
 *
 * Phone photos are routinely 8-12MB, which no upload path here accepts: Vercel
 * caps a serverless request body at 4.5MB, below both our own MAX_SIZE check and
 * the configured serverActions.bodySizeLimit. Re-encoding in the browser keeps
 * the owner's workflow to "pick the file" while what leaves the browser is a
 * web-ready image of a few hundred KB.
 *
 * Constants mirror scripts/convert-to-webp.mjs so images uploaded from the admin
 * match the ones produced by the bulk pipeline.
 *
 * Every failure path here reports a `reason` rather than silently handing back the
 * original. An earlier version returned the untouched file on any error, so a
 * browser that could not decode or encode produced the same "still 4.4MB after
 * compression" message as a genuinely oversized photo, with no way to tell which.
 */

import { MAX_UPLOAD_SIZE } from '@/lib/actions/upload-limits'

const MAX_EDGE = 1600
const WEBP_QUALITY = 0.82

/** Files at or below this are already web-sized; re-encoding would only lose quality. */
const SKIP_BELOW_BYTES = 400 * 1024

/**
 * Progressively harder re-encodes, tried in order until one fits under the upload
 * cap. The first entry is the normal case and matches the bulk pipeline; the rest
 * only run for images that are still too large, so quality is never reduced
 * needlessly.
 */
const ENCODE_ATTEMPTS: ReadonlyArray<{ maxEdge: number; quality: number }> = [
  { maxEdge: MAX_EDGE, quality: WEBP_QUALITY },
  { maxEdge: MAX_EDGE, quality: 0.7 },
  { maxEdge: 1280, quality: 0.7 },
  { maxEdge: 1024, quality: 0.65 },
  { maxEdge: 800, quality: 0.6 },
]

/** WebP first; JPEG is the universal fallback for browsers that cannot encode WebP. */
const ENCODE_TYPES = ['image/webp', 'image/jpeg'] as const

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

/** Why an image came back unchanged. Surfaced to the user so failures are diagnosable. */
export type PassthroughReason =
  /** Already under SKIP_BELOW_BYTES — nothing to do. */
  | 'already-small'
  /** No decode path worked: createImageBitmap and the <img> fallback both failed. */
  | 'decode-failed'
  /** Decoded, but neither WebP nor JPEG could be encoded from a canvas. */
  | 'encode-failed'
  /** Canvas 2D context unavailable (private mode memory pressure, headless). */
  | 'no-canvas-context'
  /** Re-encoding made it bigger, and the original already fits. */
  | 'larger-than-original'

/** How the image was decoded / encoded. Reported for diagnosis. */
export interface ResizeDiagnostics {
  decodePath?: 'heic' | 'bitmap-oriented' | 'bitmap-plain' | 'img-element'
  encodedType?: string
  sourceWidth?: number
  sourceHeight?: number
  outputWidth?: number
  outputHeight?: number
  /** How many ENCODE_ATTEMPTS entries were consumed. */
  attempts?: number
}

export interface ResizeResult {
  file: File
  /** Bytes of the file the user picked, for reporting the saving. */
  originalSize: number
  /** False when the original was passed through untouched. */
  resized: boolean
  /** Set only when `resized` is false — why the resize did not happen. */
  reason?: PassthroughReason
  diagnostics: ResizeDiagnostics
}

/** Thrown when a file cannot be decoded at all, so there is nothing to upload. */
export class UndecodableImageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UndecodableImageError'
  }
}

/** Human-readable explanation for a passthrough, appended to the caller's toast. */
export function describePassthrough(reason: PassthroughReason): string {
  switch (reason) {
    case 'decode-failed':
      return 'this browser could not read the image'
    case 'encode-failed':
      return 'this browser could not re-encode the image'
    case 'no-canvas-context':
      return 'the browser refused a drawing canvas (low memory?)'
    case 'larger-than-original':
      return 'compressing made it larger'
    case 'already-small':
      return 'it was already small enough'
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/** A decoded image plus the metadata needed to draw and release it. */
interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  path: NonNullable<ResizeDiagnostics['decodePath']>
  release: () => void
}

/**
 * Decode via an <img> and an object URL.
 *
 * Fallback for browsers where createImageBitmap is missing or rejects the options
 * bag. Browsers apply EXIF orientation to <img> by default (CSS image-orientation
 * defaults to from-image), so drawing it to a canvas keeps the photo upright.
 */
async function decodeViaImgElement(file: File): Promise<DecodedImage | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('zero-sized decode')
    return {
      source: img,
      width: img.naturalWidth,
      height: img.naturalHeight,
      path: 'img-element',
      release: () => URL.revokeObjectURL(url),
    }
  } catch {
    URL.revokeObjectURL(url)
    return null
  }
}

/**
 * Try every decode route in order of fidelity.
 *
 * `imageOrientation: 'from-image'` is what applies EXIF rotation, so it is tried
 * first; Safari has been inconsistent about accepting that options bag, and a
 * browser that rejects it throws rather than ignoring it — hence the bare retry.
 */
async function decodeImage(file: File): Promise<DecodedImage | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        path: 'bitmap-oriented',
        release: () => bitmap.close(),
      }
    } catch {
      // Options bag rejected or decode failed — try without options.
    }

    try {
      const bitmap = await createImageBitmap(file)
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        path: 'bitmap-plain',
        release: () => bitmap.close(),
      }
    } catch {
      // Fall through to the <img> route.
    }
  }

  return decodeViaImgElement(file)
}

/**
 * Downscale and re-encode, shrinking progressively until the result fits under the
 * upload cap. Returns the original file untouched (with a `reason`) when it is
 * already small enough or the browser cannot process it.
 */
export async function resizeImageForUpload(file: File): Promise<ResizeResult> {
  const originalSize = file.size
  const passthrough = (
    reason: PassthroughReason,
    diagnostics: ResizeDiagnostics = {}
  ): ResizeResult => ({ file, originalSize, resized: false, reason, diagnostics })

  let heic = looksLikeHeic(file)
  let decoded: DecodedImage | null = null

  if (heic) {
    const heicResult = await decodeHeic(file)
    if (heicResult.kind === 'failed') {
      throw new UndecodableImageError('This HEIC file could not be read. Re-export it as JPEG.')
    }
    // Named .heic but actually a JPEG — fall through to the normal decode path.
    if (heicResult.kind === 'not-heic') heic = false
    else {
      const bitmap = heicResult.bitmap
      decoded = {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        path: 'heic',
        release: () => bitmap.close(),
      }
    }
  }

  if (!decoded) {
    // Only reachable for non-HEIC files; a HEIC always needs converting whatever its size.
    if (file.size <= SKIP_BELOW_BYTES) return passthrough('already-small')
    decoded = await decodeImage(file)
    if (!decoded) {
      if (heic) throw new UndecodableImageError('This HEIC file could not be read. Re-export it as JPEG.')
      return passthrough('decode-failed')
    }
  }

  const source = decoded
  const base: ResizeDiagnostics = {
    decodePath: source.path,
    sourceWidth: source.width,
    sourceHeight: source.height,
  }

  try {
    /** Smallest encode seen so far, kept in case no attempt fits the cap. */
    let best: { blob: Blob; width: number; height: number; attempts: number } | null = null

    for (let i = 0; i < ENCODE_ATTEMPTS.length; i++) {
      const { maxEdge, quality } = ENCODE_ATTEMPTS[i]
      const scale = Math.min(1, maxEdge / Math.max(source.width, source.height))
      const width = Math.round(source.width * scale)
      const height = Math.round(source.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) return passthrough('no-canvas-context', base)
      ctx.drawImage(source.source, 0, 0, width, height)

      let blob: Blob | null = null
      for (const type of ENCODE_TYPES) {
        const candidate = await canvasToBlob(canvas, type, quality)
        // toBlob silently falls back to PNG for an unsupported type, which inflates
        // photos — only accept a blob that is actually the format we asked for.
        if (candidate && candidate.type === type) {
          blob = candidate
          break
        }
      }

      if (!blob) return passthrough('encode-failed', base)

      if (!best || blob.size < best.blob.size) best = { blob, width, height, attempts: i + 1 }
      if (blob.size <= MAX_UPLOAD_SIZE) break
    }

    if (!best) return passthrough('encode-failed', base)

    // Re-encoding gained nothing and the original already fits — keep the original.
    if (!heic && best.blob.size >= originalSize && originalSize <= MAX_UPLOAD_SIZE) {
      return passthrough('larger-than-original', base)
    }

    const extension = best.blob.type === 'image/jpeg' ? '.jpg' : '.webp'
    const name = file.name.replace(/\.[^.]+$/, '') + extension

    return {
      file: new File([best.blob], name, { type: best.blob.type, lastModified: file.lastModified }),
      originalSize,
      resized: true,
      diagnostics: {
        ...base,
        encodedType: best.blob.type,
        outputWidth: best.width,
        outputHeight: best.height,
        attempts: best.attempts,
      },
    }
  } finally {
    source.release()
  }
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  return `${Math.round(bytes / 1024)}KB`
}

/**
 * Message for a file that is still over the cap, shared by all three uploaders.
 *
 * Distinguishes "we compressed it as hard as we can and it is still too big" from
 * "we never managed to compress it at all", which previously read identically.
 */
export function oversizeMessage(result: ResizeResult, limitLabel: string): string {
  const size = formatBytes(result.file.size)

  if (result.resized) {
    const { outputWidth, outputHeight } = result.diagnostics
    const dims = outputWidth && outputHeight ? ` at ${outputWidth}x${outputHeight}` : ''
    return `still ${size}${dims} after compression — max is ${limitLabel}.`
  }

  const why = result.reason ? describePassthrough(result.reason) : 'it could not be compressed'
  return `${size}, not compressed (${why}) — max is ${limitLabel}.`
}

/**
 * Result standing in for a file the resizer threw on, so callers can still run it
 * through the same size check and message path.
 */
export function unresizedResult(file: File, reason: PassthroughReason = 'decode-failed'): ResizeResult {
  return { file, originalSize: file.size, resized: false, reason, diagnostics: {} }
}
