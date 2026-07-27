'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useUnsavedChanges } from './use-unsaved-changes'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Product, Category } from '@/lib/types'
import { createProduct, updateProduct } from '@/lib/actions/products'
import { VariantManager } from './variant-manager'
import { ImageUploader } from './image-uploader'
import { slugify } from '@/lib/utils'
import { toast } from 'sonner'

interface ProductFormProps {
  product?: Product
  categories: Category[]
}

const UNSAVED_MESSAGE = 'You have unsaved changes. Leave this page and discard them?'

/** Text/number inputs whose values live in the DOM rather than in React state. */
const TEXT_FIELDS = [
  'name',
  'slug',
  'short_description',
  'description',
  'base_price',
  'compare_at_price',
  'sku_prefix',
  'meta_title',
  'meta_description',
] as const

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false)
  const [isNew, setIsNew] = useState(product?.is_new ?? false)
  const [categoryId, setCategoryId] = useState<string>(product?.category_id ?? '')

  const initial = useMemo(
    () => ({
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      short_description: product?.short_description ?? '',
      description: product?.description ?? '',
      base_price: product?.base_price != null ? String(product.base_price) : '',
      compare_at_price: product?.compare_at_price != null ? String(product.compare_at_price) : '',
      sku_prefix: product?.sku_prefix ?? '',
      meta_title: product?.meta_title ?? '',
      meta_description: product?.meta_description ?? '',
      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
      is_new: product?.is_new ?? false,
      category_id: product?.category_id ?? '',
    }),
    [product],
  )

  /* Recomputed from the live form rather than tracked per-keystroke, so typing a
     change and undoing it leaves the form clean again. Variant/image managers sit
     inside this <form> but own no named inputs, so they never mark it dirty. */
  const recomputeDirty = useCallback(
    (next?: Partial<typeof initial>) => {
      const form = formRef.current
      if (!form) return
      const fd = new FormData(form)
      const current = {
        ...Object.fromEntries(TEXT_FIELDS.map((f) => [f, String(fd.get(f) ?? '')])),
        is_active: isActive,
        is_featured: isFeatured,
        is_new: isNew,
        category_id: categoryId,
        ...next,
      }
      setDirty(Object.keys(initial).some((k) => current[k as keyof typeof initial] !== initial[k as keyof typeof initial]))
    },
    [initial, isActive, isFeatured, isNew, categoryId],
  )

  useUnsavedChanges(dirty && !loading, UNSAVED_MESSAGE)

  function handleDiscard() {
    if (dirty && !window.confirm(UNSAVED_MESSAGE)) return
    setDirty(false)
    router.push('/admin/products')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    fd.set('slug', slug)
    fd.set('is_active', String(isActive))
    fd.set('is_featured', String(isFeatured))
    fd.set('is_new', String(isNew))
    fd.set('category_id', categoryId)

    const result = product
      ? await updateProduct(product.id, fd)
      : await createProduct(fd)

    if (result.error) { toast.error(result.error); setLoading(false); return }

    setDirty(false) // saved — stop guarding before we navigate away
    toast.success(product ? 'Product updated' : 'Product created')
    if (product) {
      router.push('/admin/products')
      router.refresh()
    } else {
      router.push(`/admin/products/${(result as any).data.id}`)
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onInput={() => recomputeDirty()}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main fields */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">Product Info</h2>

            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={product?.name}
                onChange={(e) => !product && setSlug(slugify(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="short_description">Short Description</Label>
              <Input
                id="short_description"
                name="short_description"
                defaultValue={product?.short_description ?? ''}
                placeholder="One-line product description"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={product?.description ?? ''}
                placeholder="Detailed product description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="base_price">Base Price (€) *</Label>
                <Input
                  id="base_price"
                  name="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={product?.base_price}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="compare_at_price">Compare At Price (€)</Label>
                <Input
                  id="compare_at_price"
                  name="compare_at_price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product?.compare_at_price ?? ''}
                  placeholder="Original price"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select
                  value={categoryId}
                  onChange={(e) => { setCategoryId(e.target.value); recomputeDirty({ category_id: e.target.value }) }}
                  className="w-full h-10 border border-input bg-background px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sku_prefix">SKU Prefix</Label>
                <Input
                  id="sku_prefix"
                  name="sku_prefix"
                  defaultValue={product?.sku_prefix ?? ''}
                  placeholder="TSH"
                />
              </div>
            </div>
          </section>

          {/* SEO */}
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">SEO</h2>
            <div className="space-y-1.5">
              <Label htmlFor="meta_title">Meta Title</Label>
              <Input id="meta_title" name="meta_title" defaultValue={product?.meta_title ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="meta_description">Meta Description</Label>
              <Textarea id="meta_description" name="meta_description" rows={2} defaultValue={product?.meta_description ?? ''} />
            </div>
          </section>

          {/* Variants */}
          {product && (
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <VariantManager
                productId={product.id}
                initialVariants={product.variants ?? []}
                categorySlug={categories.find(c => c.id === categoryId)?.slug ?? ''}
              />
            </section>
          )}

          {/* Images */}
          {product && (
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <ImageUploader
                productId={product.id}
                initialImages={product.images ?? []}
              />
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">Status</h2>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => { setIsActive(e.target.checked); recomputeDirty({ is_active: e.target.checked }) }} className="w-4 h-4" />
              <span className="text-sm">Active (visible on site)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isFeatured} onChange={(e) => { setIsFeatured(e.target.checked); recomputeDirty({ is_featured: e.target.checked }) }} className="w-4 h-4" />
              <span className="text-sm">Featured (on homepage)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isNew} onChange={(e) => { setIsNew(e.target.checked); recomputeDirty({ is_new: e.target.checked }) }} className="w-4 h-4" />
              <span className="text-sm">New (badge + new arrivals)</span>
            </label>
          </section>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-black text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {product ? 'Save Changes' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              disabled={loading}
              className="w-full h-11 bg-white text-gray-700 border border-gray-300 font-medium text-sm hover:border-gray-500 hover:text-black transition-colors disabled:opacity-50"
            >
              {dirty ? 'Discard Changes' : 'Cancel'}
            </button>
            {dirty && (
              <p className="text-xs text-amber-600 text-center">Unsaved changes</p>
            )}
            {product && (
              <p className="text-xs text-gray-400 text-center">
                Add variants and images after creating the product.
              </p>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
