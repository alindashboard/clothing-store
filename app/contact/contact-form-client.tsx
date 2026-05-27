'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitContact } from '@/lib/actions/contact'
import { Loader2, CheckCircle } from 'lucide-react'

export function ContactFormClient() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await submitContact(new FormData(e.currentTarget))
    if (result.error) { setError(result.error); setLoading(false); return }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="flex items-center gap-3 text-green-700 bg-green-50 px-4 py-4 border border-green-200">
        <CheckCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm">Message sent! We&apos;ll get back to you soon.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" type="tel" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">Message *</Label>
        <Textarea id="message" name="message" rows={5} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-black text-white font-semibold text-sm tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
