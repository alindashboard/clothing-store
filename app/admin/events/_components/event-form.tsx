'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Event } from '@/lib/types'
import { createEvent, updateEvent } from '@/lib/actions/events'
import { uploadEventImage, deleteEventImageFromStorage } from '@/lib/actions/upload'
import { slugify } from '@/lib/utils'

interface Props {
  event?: Event
}

export function EventForm({ event }: Props) {
  const router = useRouter()
  const isEdit = !!event

  const [title, setTitle] = useState(event?.title ?? '')
  const [slug, setSlug] = useState(event?.slug ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [eventDate, setEventDate] = useState(
    event?.event_date
      ? new Date(event.event_date).toISOString().slice(0, 16)
      : ''
  )
  const [isOnline, setIsOnline] = useState(event?.is_online ?? false)
  const [location, setLocation] = useState(event?.location ?? '')
  const [imageUrl, setImageUrl] = useState(event?.image_url ?? '')
  const [ctaLabel, setCtaLabel] = useState(event?.cta_label ?? '')
  const [ctaUrl, setCtaUrl] = useState(event?.cta_url ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>(event?.status ?? 'draft')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleTitleChange(v: string) {
    setTitle(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  function handleSlugChange(v: string) {
    setSlugTouched(true)
    setSlug(slugify(v))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const { url, error } = await uploadEventImage(fd)
    if (error) { toast.error(error); setUploading(false); return }
    setImageUrl(url!)
    toast.success('Image uploaded')
    setUploading(false)
    e.target.value = ''
  }

  async function handleRemoveImage() {
    if (!imageUrl) return
    const res = await deleteEventImageFromStorage(imageUrl)
    if (res.error) { toast.error(res.error); return }
    setImageUrl('')
    toast.success('Image removed')
  }

  async function handleSubmit(publishOverride?: boolean) {
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!slug.trim()) { toast.error('Slug is required'); return }
    if (!eventDate) { toast.error('Event date is required'); return }
    if (!isOnline && !location.trim()) { toast.error('Location is required for in-person events'); return }
    if (ctaUrl && !/^https?:\/\/.+/.test(ctaUrl)) { toast.error('CTA URL must start with http:// or https://'); return }

    setSaving(true)
    const resolvedStatus = publishOverride ? 'published' : status

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      event_date: new Date(eventDate).toISOString(),
      location: isOnline ? undefined : location.trim() || undefined,
      is_online: isOnline,
      image_url: imageUrl || undefined,
      cta_label: ctaLabel.trim() || undefined,
      cta_url: ctaUrl.trim() || undefined,
      status: resolvedStatus,
    }

    if (isEdit) {
      const res = await updateEvent(event.id, payload)
      if (res.error) { toast.error(res.error); setSaving(false); return }
      toast.success('Event saved')
      router.push('/admin/events')
    } else {
      const res = await createEvent(payload)
      if (res.error) { toast.error(res.error); setSaving(false); return }
      toast.success('Event created')
      router.push('/admin/events')
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main fields */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Summer Giveaway 2026"
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Slug <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border border-gray-200 focus-within:border-gray-400">
              <span className="px-3 py-2 text-xs text-gray-400 border-r border-gray-200 bg-gray-50 shrink-0">/events/</span>
              <input
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="summer-giveaway-2026"
                className="flex-1 px-3 py-2 text-sm focus:outline-none bg-transparent"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Lowercase, letters, numbers, and dashes only.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="What's this event about?"
              className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Event Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                Location
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  id="is_online"
                  type="checkbox"
                  checked={isOnline}
                  onChange={(e) => {
                    setIsOnline(e.target.checked)
                    if (e.target.checked) setLocation('')
                  }}
                  className="w-3.5 h-3.5"
                />
                <label htmlFor="is_online" className="text-xs text-gray-600">Online event</label>
              </div>
              <input
                value={isOnline ? '' : location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isOnline}
                placeholder={isOnline ? 'Online event' : 'e.g. Str. Republicii 12, Cluj-Napoca'}
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                CTA Label
              </label>
              <input
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Register, Join Giveaway…"
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                CTA URL
              </label>
              <input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://instagram.com/…"
                className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Right column: image + status */}
        <div className="space-y-6">
          {/* Image */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Event Image</h3>
            {imageUrl ? (
              <div className="relative group">
                <div className="relative aspect-video bg-gray-100 overflow-hidden rounded">
                  <Image
                    src={imageUrl}
                    alt="Event"
                    fill
                    sizes="400px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-red-500 rounded shadow transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              >
                <Upload className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-400">Click to upload</p>
                <p className="text-[10px] text-gray-300 mt-1">JPG, PNG, WebP · Max 5MB</p>
              </div>
            )}
            {!imageUrl && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-xs hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <Upload className="w-3 h-3" />
                {uploading ? 'Uploading…' : 'Upload Image'}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* Status */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Status</h3>
            <div className="space-y-2">
              {(['draft', 'published'] as const).map((s) => (
                <label key={s} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="w-3.5 h-3.5"
                  />
                  <span className="text-sm capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving}
          className="px-5 py-2.5 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {status !== 'published' && (
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="px-5 py-2.5 bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            Save & Publish
          </button>
        )}
        <button
          type="button"
          onClick={() => router.push('/admin/events')}
          className="px-5 py-2.5 border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
