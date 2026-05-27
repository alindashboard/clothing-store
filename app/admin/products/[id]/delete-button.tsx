'use client'

export function DeleteButton() {
  return (
    <button
      type="submit"
      className="text-xs text-red-500 hover:text-red-700 underline"
      onClick={(e) => {
        if (!confirm('Delete this product?')) e.preventDefault()
      }}
    >
      Delete Product
    </button>
  )
}
