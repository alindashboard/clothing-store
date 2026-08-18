'use client'

import { useState, useTransition } from 'react'
import { ImageOff } from 'lucide-react'
import { toast } from 'sonner'
import { setHideProductsWithoutImages } from '@/lib/actions/settings'

export function HideImagelessToggle({ initial }: { initial: boolean }) {
  const [enabled, setEnabled] = useState(initial)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = !enabled
    setEnabled(next) // optimistic; reverted below if the write fails
    startTransition(async () => {
      const { error } = await setHideProductsWithoutImages(next)
      if (error) {
        setEnabled(!next)
        toast.error(error)
        return
      }
      toast.success(
        next
          ? 'Products without photos are now hidden from the site'
          : 'All active products are visible on the site again'
      )
    })
  }

  return (
    <div className="flex items-start gap-3 border border-gray-200 bg-gray-50 px-4 py-3 mb-5">
      <ImageOff className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <label htmlFor="hide-imageless" className="text-sm font-medium cursor-pointer">
          Hide products without photos
        </label>
        <p className="text-xs text-gray-500 mt-0.5">
          When on, products with no photo stay out of the shop, category pages and Google.
          They remain active and editable here.
        </p>
      </div>
      <button
        id="hide-imageless"
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        disabled={pending}
        className={`relative w-11 h-6 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          enabled ? 'bg-black' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            enabled ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  )
}
