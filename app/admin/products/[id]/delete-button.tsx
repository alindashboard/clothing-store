'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteProduct } from '@/lib/actions/products'

interface DeleteButtonProps {
  productId: string
  backHref: string
}

export function DeleteButton({ productId, backHref }: DeleteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this product?')) return
    setLoading(true)
    const result = await deleteProduct(productId)
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    router.push(backHref)
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 underline disabled:opacity-50 inline-flex items-center gap-1.5"
    >
      {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      {loading ? 'Deleting…' : 'Delete Product'}
    </button>
  )
}
