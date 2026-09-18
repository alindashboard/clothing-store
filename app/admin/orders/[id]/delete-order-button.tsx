'use client'

export function DeleteOrderButton() {
  return (
    <button
      type="submit"
      className="text-xs text-red-500 hover:text-red-700 underline"
      onClick={(e) => {
        if (!confirm('Delete this order and restore its stock? This cannot be undone.')) e.preventDefault()
      }}
    >
      Delete Order
    </button>
  )
}
