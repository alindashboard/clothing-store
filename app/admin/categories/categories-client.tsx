'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, AlertTriangle, ChevronUp, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import type { Category } from '@/lib/types'
import { updateCategoryDirect, deleteCategory, reorderCategories, setCategoryOnLanding } from '@/lib/actions/categories'
import { slugify } from '@/lib/utils'

interface Props {
  categories: Category[]
  productCounts: Record<string, number>
  shoeSlugs: string[]
}

export function CategoriesClient({ categories: initial, productCounts, shoeSlugs }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initial)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  // Edit form fields
  const [eName, setEName] = useState('')
  const [eSlug, setESlug] = useState('')
  const [eOrigSlug, setEOrigSlug] = useState('')
  const [eDesc, setEDesc] = useState('')
  const [eActive, setEActive] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReordering, setIsReordering] = useState(false)

  // Sync when server re-fetches (after router.refresh)
  useEffect(() => { setCategories(initial) }, [initial])

  function openEdit(cat: Category) {
    setEditTarget(cat)
    setEName(cat.name)
    setESlug(cat.slug)
    setEOrigSlug(cat.slug)
    setEDesc(cat.description ?? '')
    setEActive(cat.is_active)
  }

  function closeEdit() {
    setEditTarget(null)
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
