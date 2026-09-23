import Anthropic from '@anthropic-ai/sdk'
import type { Product } from '@/lib/types'

// Plain server module (not 'use server'): only the admin-guarded actions in
// lib/actions/ai.ts call it, so it is never a public endpoint of its own.

export interface ProductCopy {
  short_description: string
  description: string
  short_description_en: string
  description_en: string
}

const MODEL = 'claude-opus-5'
const MAX_IMAGES = 4

const SYSTEM_PROMPT = `You write product copy for KAYA Studio Outlet, a designer-fashion outlet with a physical store in Borgo Podgora (Latina, Italy) and an online shop. Customers are deciding whether a heavily discounted designer piece is worth buying online, so the copy must be accurate and concrete, never inflated.

You receive the product's name, brand, category, colours, sizes and photos. Write:
- short_description: one Italian sentence, at most 140 characters, saying what the piece is and its most distinctive visible feature.
- description: 2 to 4 short Italian sentences (roughly 50-90 words): the garment type, the visible design details (cut, neckline, closures, pockets, prints, logos, hardware, finish), the colour, and how it can be worn.
- short_description_en and description_en: faithful English versions of the two Italian texts, natural rather than word-for-word.

Accuracy rules - these matter more than style:
- State only what the product data or the photos show. If you cannot see a detail, leave it out; do not guess.
- Material and composition (for example "100% cotone") only when a care or composition label is legible in a photo, copied exactly as printed. Otherwise do not mention materials at all, not even vaguely ("morbido", "tessuto pregiato").
- Never state fit or sizing advice, country of manufacture, season or collection, care instructions, or authenticity claims unless they are printed on a visible label.
- No prices, discounts, urgency or superlatives ("imperdibile", "il migliore").
- Plain text only: no markdown, no emoji, no bullet points, no quotation marks around the text.`

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    short_description: { type: 'string' },
    description: { type: 'string' },
    short_description_en: { type: 'string' },
    description_en: { type: 'string' },
  },
  required: ['short_description', 'description', 'short_description_en', 'description_en'],
  additionalProperties: false,
}

export class DescriptionGenerationError extends Error {}

/** Label photos first (the only reliable source for composition), then primary, then gallery order. */
function pickImages(product: Product): string[] {
  const images = [...(product.images ?? [])].sort(
    (a, b) =>
      Number(b.is_label ?? false) - Number(a.is_label ?? false) ||
      Number(b.is_primary) - Number(a.is_primary) ||
      a.sort_order - b.sort_order
  )
  return images.slice(0, MAX_IMAGES).map((img) => img.url)
}

function describeProduct(product: Product, parentCategoryName: string | null): string {
  const variants = (product.variants ?? []).filter((v) => v.is_active)
  const colours = [...new Set(variants.map((v) => v.color_name).filter(Boolean))]
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))]
  const lines = [
    `Name: ${product.name}`,
    product.category ? `Category: ${[parentCategoryName, product.category.name].filter(Boolean).join(' > ')}` : null,
    colours.length ? `Colours: ${colours.join(', ')}` : null,
    sizes.length ? `Sizes in stock: ${sizes.join(', ')}` : null,
    `Photos: ${pickImages(product).length} attached (label photos first, if any).`,
  ]
  return lines.filter(Boolean).join('\n')
}

let client: Anthropic | null = null

export async function generateProductCopy(product: Product, parentCategoryName: string | null): Promise<ProductCopy> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new DescriptionGenerationError('ANTHROPIC_API_KEY is not set.')
  }
  const images = pickImages(product)
  if (images.length === 0) {
    throw new DescriptionGenerationError('Add at least one photo first — the copy is written from the photos.')
  }

  client ??= new Anthropic()

  let response: Anthropic.Beta.BetaMessage
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      // Server-side fallback if the model's safety classifiers decline the request.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
      },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...images.map((url) => ({ type: 'image' as const, source: { type: 'url' as const, url } })),
            { type: 'text', text: describeProduct(product, parentCategoryName) },
          ],
        },
      ],
    })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new DescriptionGenerationError('ANTHROPIC_API_KEY was rejected.')
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new DescriptionGenerationError('Rate limited by the AI API — wait a minute and retry.')
    }
    if (err instanceof Anthropic.BadRequestError) {
      throw new DescriptionGenerationError(`AI request rejected: ${err.message}`)
    }
    if (err instanceof Anthropic.APIError) {
      throw new DescriptionGenerationError(`AI API error ${err.status ?? ''}: ${err.message}`)
    }
    throw err
  }

  if (response.stop_reason === 'refusal') {
    throw new DescriptionGenerationError('The AI declined this product. Write the description by hand.')
  }
  if (response.stop_reason === 'max_tokens') {
    throw new DescriptionGenerationError('The AI response was cut off. Retry.')
  }

  const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text
  if (!text) throw new DescriptionGenerationError('Empty AI response. Retry.')

  let parsed: ProductCopy
  try {
    parsed = JSON.parse(text) as ProductCopy
  } catch {
    throw new DescriptionGenerationError('Unreadable AI response. Retry.')
  }
  return {
    short_description: parsed.short_description.trim(),
    description: parsed.description.trim(),
    short_description_en: parsed.short_description_en.trim(),
    description_en: parsed.description_en.trim(),
  }
}
