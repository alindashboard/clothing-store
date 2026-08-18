'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Pencil, Trash2, AlertTriangle, ChevronUp, ChevronDown, Upload, X, Plus, ChevronLeft, ChevronRight, Images } from 'lucide-react'
import { toast } from 'sonner'
import type { Category } from '@/lib/types'
import { updateCategoryDirect, deleteCategory, reorderCategories, setCategoryOnLanding, setCategoryImages } from '@/lib/actions/categories'
import { uploadCategoryImage } from '@/lib/actions/upload'
import { getCategoryPhotoOptions } from '@/lib/actions/products'
import { resizeImageForUpload, formatBytes, UndecodableImageError } from '@/lib/image-resize'
import { MAX_UPLOAD_SIZE, MAX_UPLOAD_SIZE_LABEL } from '@/lib/actions/upload-limits'
import { slugify } from '@/lib/utils'

interface Props {
  categories: Category[]
  productCounts: Record<string, number>
  shoeSlugs: string[]
  /** Server action that creates a category and redirects back to this page. */
  createAction: (formData: FormData) => Promise<void>
}

export function CategoriesClient({ categories: initial, productCounts, shoeSlugs, createAction }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initial)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  // Edit form fields
  const [eName, setEName] = useState('')
  const [eSlug, setESlug] = useState('')
  const [eOrigSlug, setEOrigSlug] = useState('')
  const [eDesc, setEDesc] = useState('')
  const [eActive, setEActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [eImages, setEImages] = useState<string[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [pickerFor, setPickerFor] = useState<Category | null>(null)
  const [pickerOptions, setPickerOptions] = useState<{ productName: string; url: string }[] | null>(null)

  // Sync when server re-fetches (after router.refresh)
  useEffect(() => { setCategories(initial) }, [initial])

  function openEdit(cat: Category) {
    setEditTarget(cat)
    setEName(cat.name)
    setESlug(cat.slug)
    setEOrigSlug(cat.slug)
    setEDesc(cat.description ?? '')
    setEActive(cat.is_active)
    setEImages(cat.image_urls ?? [])
  }

  function closeEdit() {
    setEditTarget(null)
  }

  /** Single place that persists the list and mirrors it into the table state. */
  async function persistImages(categoryId: string, urls: string[]): Promise<boolean> {
    const { error } = await setCategoryImages(categoryId, urls)
    if (error) { toast.error(error); return false }
    setEImages(urls)
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, image_urls: urls } : c)))
    return true
  }

  async function handleCategoryImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0 || !editTarget) return

    setIsUploadingImage(true)
    const added: string[] = []

    for (let i = 0; i < files.length; i++) {
      setUploadProgress(files.length > 1 ? `${i + 1}/${files.length}` : null)
      const original = files[i]

      let file = original
      try {
        file = (await resizeImageForUpload(original)).file
      } catch (err) {
        if (err instanceof UndecodableImageError) { toast.error(`${original.name}: ${err.message}`); continue }
        // Fall through with the original; the size check below still guards it.
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        toast.error(`${original.name}: still ${formatBytes(file.size)} after compression — max is ${MAX_UPLOAD_SIZE_LABEL}.`)
        continue
      }

      const fd = new FormData()
      fd.append('file', file)
      const { url, error } = await uploadCategoryImage(fd)
      if (error || !url) { toast.error(`${original.name}: ${error ?? 'upload failed.'}`); continue }
      added.push(url)
    }

    setUploadProgress(null)
    setIsUploadingImage(false)
    if (added.length === 0) return

    if (await persistImages(editTarget.id, [...eImages, ...added])) {
      toast.success(added.length === 1 ? 'Image added' : `${added.length} images added`)
    }
  }

  async function handleRemoveImageAt(index: number) {
    if (!editTarget) return
    await persistImages(editTarget.id, eImages.filter((_, i) => i !== index))
  }

  /** Moves an image one slot along, which is what reorders the slideshow. */
  async function handleMoveImage(index: number, direction: -1 | 1) {
    if (!editTarget) return
    const target = index + direction
    if (target < 0 || target >= eImages.length) return
    const next = [...eImages]
    ;[next[index], next[target]] = [next[target], next[index]]
    await persistImages(editTarget.id, next)
  }

  async function openPicker() {
    if (!editTarget) return
    setPickerFor(editTarget)
    setPickerOptions(null) // renders the loading state
    setPickerOptions(await getCategoryPhotoOptions(editTarget.id))
  }

  async function addFromProduct(url: string) {
    if (!editTarget) return
    if (eImages.includes(url)) { toast.error('That photo is already in the slideshow'); return }
    if (await persistImages(editTarget.id, [...eImages, url])) toast.success('Photo added')
  }

  async function handleSave() {
    if (!editTarget) return
    if (!eName.trim()) { toast.error('Name is required'); return }
    if (!eSlug.trim()) { toast.error('Slug is required'); return }

    setIsSaving(true)
    const res = await updateCategoryDirect(editTarget.id, {
      name: eName.trim(),
      slug: eSlug.trim(),
      description: eDesc.trim(),
      sort_order: editTarget.sort_order, // position is owned by the table arrows
      is_active: eActive,
    })

    if (res.error) { toast.error(res.error); setIsSaving(false); return }

    setCategories((prev) =>
      prev.map((c) =>
        c.id === editTarget.id
          ? { ...c, name: eName.trim(), slug: eSlug.trim(), description: eDesc.trim() || null, is_active: eActive }
          : c
      )
    )
    toast.success('Category updated')
    setIsSaving(false)
    closeEdit()
    router.refresh()
  }

  async function handleToggleLanding(cat: Category) {
    const next = !cat.show_on_landing
    const previous = categories
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, show_on_landing: next } : c)))

    const res = await setCategoryOnLanding(cat.id, next)
    if (res.error) {
      setCategories(previous)
      toast.error(res.error)
      return
    }
    toast.success(next ? `${cat.name} shown on landing` : `${cat.name} removed from landing`)
    router.refresh()
  }

  /** Swaps a category with its neighbour and persists the whole new order. */
  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= categories.length || isReordering) return

    const previous = categories
    const next = [...categories]
    ;[next[index], next[target]] = [next[target], next[index]]

    setCategories(next.map((c, i) => ({ ...c, sort_order: i + 1 })))
    setIsReordering(true)

    const res = await reorderCategories(next.map((c) => c.id))
    setIsReordering(false)

    if (res.error) {
      setCategories(previous) // put it back where it was
      toast.error(res.error)
      return
    }
    router.refresh()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    const res = await deleteCategory(deleteTarget.id)
    if (res.error) { toast.error(res.error); setIsDeleting(false); return }
    setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id))
    toast.success('Category deleted')
    setIsDeleting(false)
    setDeleteTarget(null)
    router.refresh()
  }

  const slugChanged = editTarget !== null && eSlug !== eOrigSlug

  return (
    <>
      {/* ── Toolbar (both breakpoints) ──────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs text-gray-400">
          {categories.length} {categories.length === 1 ? 'category' : 'categories'}
        </p>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* ── Desktop table ───────────────────────────────────────── */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-x-auto min-w-0">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left pl-4 pr-1 py-3 text-xs font-medium text-gray-500">#</th>
              <th className="px-1 py-3" />
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Slug</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Products</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Landing</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Flags</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {categories.map((cat, index) => {
              const count  = productCounts[cat.id] ?? 0
              const isShoe = shoeSlugs.includes(cat.slug)
              return (
                <tr key={cat.id} className={`hover:bg-gray-50 ${!cat.is_active ? 'opacity-50' : ''}`}>
                  <td className="pl-4 pr-1 py-2.5 text-xs text-gray-400 tabular-nums">{index + 1}</td>
                  <td className="px-1 py-2.5">
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0 || isReordering}
                        className="text-gray-300 hover:text-black disabled:opacity-30 disabled:hover:text-gray-300 transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 1)}
                        disabled={index === categories.length - 1 || isReordering}
                        className="text-gray-300 hover:text-black disabled:opacity-30 disabled:hover:text-gray-300 transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-medium">{cat.name}</td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs font-mono">{cat.slug}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-semibold ${count > 0 ? 'text-green-700' : 'text-gray-300'}`}>
                      {count}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <label
                      className={`flex items-center gap-1.5 ${cat.is_active ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      title={cat.is_active ? 'Show this category on the homepage' : 'Inactive categories never show on the homepage'}
                    >
                      <input
                        type="checkbox"
                        checked={cat.show_on_landing}
                        disabled={!cat.is_active}
                        onChange={() => handleToggleLanding(cat)}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-[11px] text-gray-500">
                        {cat.show_on_landing ? 'Shown' : '—'}
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {isShoe && (
                        <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                          shoe sizes
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs ${cat.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {cat.is_active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openEdit(cat)}
                        className="text-gray-400 hover:text-black transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cat)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {categories.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-400">No categories.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile cards ────────────────────────────────────────────
          Slug / product count / flags are dropped here — the row itself
          opens the edit modal, and the controls that mutate state stop
          propagation so they never trigger it by accident. */}
      <div className="md:hidden space-y-2">
        {categories.map((cat, index) => (
          <div
            key={cat.id}
            onClick={() => openEdit(cat)}
            className={`bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 active:bg-gray-50 transition-colors cursor-pointer ${!cat.is_active ? 'opacity-60' : ''}`}
          >
            <div className="flex flex-col shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => handleMove(index, -1)}
                disabled={index === 0 || isReordering}
                className="p-1 text-gray-300 hover:text-black disabled:opacity-30 transition-colors"
                aria-label={`Move ${cat.name} up`}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMove(index, 1)}
                disabled={index === categories.length - 1 || isReordering}
                className="p-1 text-gray-300 hover:text-black disabled:opacity-30 transition-colors"
                aria-label={`Move ${cat.name} down`}
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{cat.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <label
                  className={`flex items-center gap-1.5 ${cat.is_active ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={cat.show_on_landing}
                    disabled={!cat.is_active}
                    onChange={() => handleToggleLanding(cat)}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-[11px] text-gray-500">Landing</span>
                </label>
                <span className={`text-[11px] ${cat.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                  {cat.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Tapping the card opens the editor; this is the keyboard/AT path. */}
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(cat) }}
                className="p-1.5 text-gray-300 hover:text-black transition-colors"
                aria-label={`Edit ${cat.name}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setDeleteTarget(cat) }}
                className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                aria-label={`Delete ${cat.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-400">
            No categories.
          </div>
        )}
      </div>

      {/* Guidance that used to sit beside the table, now that it is full width. */}
      <div className="mt-4 flex flex-wrap items-start gap-x-8 gap-y-3 text-[11px] text-gray-400 leading-relaxed">
        <p className="max-w-md">
          <span className="font-medium text-gray-500">Shown on landing:</span>{' '}
          toggle the <strong>Landing</strong> checkbox above. Cards appear in the same order as
          this list, so use the arrows to arrange them.
        </p>
        <div>
          <p className="font-medium text-gray-500 mb-1">Shoe size categories (37–45)</p>
          <div className="flex flex-wrap gap-1.5">
            {shoeSlugs.map((slug) => (
              <span key={slug} className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded">
                {slug}
              </span>
            ))}
          </div>
          <p className="mt-1">Edit in <code className="bg-gray-100 px-1">lib/config.ts → brand.shoeCategorySlugs</code></p>
        </div>
      </div>

      {/* ── Add Modal ───────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
              Add Category
            </h2>
            {/* The action redirects back to this page, which re-renders the table. */}
            <form action={createAction} onSubmit={() => setShowAdd(false)} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">Name *</label>
                <input
                  name="name"
                  required
                  autoFocus
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">Slug (auto-generated if empty)</label>
                <input
                  name="slug"
                  className="w-full border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-400"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-gray-500">Description</label>
                <input
                  name="description"
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Added at the end of the list — reorder with the arrows in the table.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Add Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2 border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeEdit} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
              Edit Category
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Name *</label>
              <input
                value={eName}
                onChange={(e) => setEName(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Slug *</label>
              <input
                value={eSlug}
                onChange={(e) => setESlug(slugify(e.target.value))}
                className="w-full border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-400"
              />
              {slugChanged && (
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Changing the slug will break <code className="bg-amber-100 px-0.5">/category/{eOrigSlug}</code> URLs
                    and any hardcoded references in <code className="bg-amber-100 px-0.5">lib/config.ts</code> and{' '}
                    <code className="bg-amber-100 px-0.5">footer.tsx</code>. Only change if you update those too.
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Description</label>
              <input
                value={eDesc}
                onChange={(e) => setEDesc(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>

            {/* Only landing categories render a card, so the slideshow is offered there. */}
            {editTarget.show_on_landing && (
              <div className="space-y-2">
                <label className="text-xs text-gray-500">Landing slideshow</label>

                {eImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {eImages.map((url, i) => (
                      <div key={url} className="relative aspect-[3/4] bg-gray-50 overflow-hidden group">
                        <Image src={url} alt="" fill sizes="96px" className="object-cover" unoptimized />
                        <span className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1">
                          {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveImageAt(i)}
                          className="absolute top-1 right-1 p-0.5 bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remove image ${i + 1}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-0 inset-x-0 flex justify-between bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleMoveImage(i, -1)}
                            disabled={i === 0}
                            className="p-1 text-white disabled:opacity-30"
                            aria-label={`Move image ${i + 1} earlier`}
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveImage(i, 1)}
                            disabled={i === eImages.length - 1}
                            className="p-1 text-white disabled:opacity-30"
                            aria-label={`Move image ${i + 1} later`}
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-xs hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploadingImage ? `Uploading${uploadProgress ? ` ${uploadProgress}` : ''}…` : 'Upload'}
                  </button>
                  <button
                    type="button"
                    onClick={openPicker}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-xs hover:bg-gray-50 transition-colors"
                  >
                    <Images className="w-3.5 h-3.5" /> From products
                  </button>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  {eImages.length === 0
                    ? 'No images set — the card cycles through photos of products in this category.'
                    : eImages.length === 1
                    ? 'One image — the card shows it as a still.'
                    : `${eImages.length} images, cross-fading every 3.5s in this order.`}
                </p>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
                  multiple
                  onChange={handleCategoryImage}
                  className="hidden"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-gray-500">Active</label>
              <label className="flex items-center gap-2 mt-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eActive}
                  onChange={(e) => setEActive(e.target.checked)}
                  className="w-3.5 h-3.5"
                />
                <span className="text-sm text-gray-700">Visible in nav</span>
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-2 bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={closeEdit}
                className="flex-1 py-2 border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product photo picker ─────────────────────────────────
          Sits above the edit modal (z-60) so the edit form stays behind it. */}
      {pickerFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPickerFor(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
                Photos in {pickerFor.name}
              </h2>
              <button
                type="button"
                onClick={() => setPickerFor(null)}
                className="p-1 text-gray-400 hover:text-black transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pickerOptions === null ? (
              <p className="text-xs text-gray-400 py-8 text-center">Loading photos…</p>
            ) : pickerOptions.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">
                No products in this category have photos yet.
              </p>
            ) : (
              <div className="overflow-y-auto grid grid-cols-4 sm:grid-cols-5 gap-2">
                {pickerOptions.map((opt) => {
                  const chosen = eImages.includes(opt.url)
                  return (
                    <button
                      key={opt.url}
                      type="button"
                      onClick={() => addFromProduct(opt.url)}
                      disabled={chosen}
                      title={opt.productName}
                      className={`relative aspect-[3/4] bg-gray-50 overflow-hidden group ${
                        chosen ? 'ring-2 ring-black cursor-default' : 'hover:opacity-80'
                      }`}
                    >
                      <Image src={opt.url} alt={opt.productName} fill sizes="120px" className="object-cover" unoptimized />
                      {chosen && (
                        <span className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[10px] py-0.5">
                          Added
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete Modal ─────────────────────────────────────────── */}
      {deleteTarget && (() => {
        const count = productCounts[deleteTarget.id] ?? 0
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteTarget(null)} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
                Delete Category
              </h2>

              {count > 0 ? (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-800 leading-relaxed">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>{count} product{count !== 1 ? 's' : ''}</strong> are still assigned to{' '}
                    <strong>{deleteTarget.name}</strong>. They will become uncategorized.
                    Reassign them first for cleaner data.
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2 border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
