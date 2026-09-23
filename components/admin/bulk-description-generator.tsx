'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Square } from 'lucide-react'
import { toast } from 'sonner'
import { listProductsMissingDescription, generateAndSaveMissingCopy } from '@/lib/actions/ai'

interface Failure {
  name: string
  error: string
}

/**
 * Writes IT + EN copy for every photographed product that has no Italian
 * description yet. Runs one product per request from the browser (each call is
 * a normal Server Action, well inside the function timeout), so it can be
 * stopped at any point and simply resumed later — finished products drop off
 * the work list. Only empty fields are filled; existing text is never replaced.
 */
export function BulkDescriptionGenerator() {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [failures, setFailures] = useState<Failure[]>([])
  const stopRef = useRef(false)

  async function run() {
    const todo = await listProductsMissingDescription()
    if (todo.length === 0) {
      toast.success('Every photographed product already has a description')
      return
    }
    if (!window.confirm(
      `Generate descriptions for ${todo.length} product(s)? About €0.05 each on the AI API. ` +
      'They go live straight away; you can edit any of them afterwards.'
    )) return

    stopRef.current = false
    setRunning(true)
    setFailures([])
    setProgress({ done: 0, total: todo.length })

    for (let i = 0; i < todo.length; i++) {
      if (stopRef.current) break
      const result = await generateAndSaveMissingCopy(todo[i].id)
      if (result.error) {
        const failure = { name: todo[i].name, error: result.error }
        setFailures((prev) => [...prev, failure])
        // A missing/invalid key fails every product the same way — stop early.
        if (/ANTHROPIC_API_KEY/.test(result.error)) {
          toast.error(result.error)
          break
        }
      }
      setProgress({ done: i + 1, total: todo.length })
    }

    setRunning(false)
    router.refresh()
    toast.success(stopRef.current ? 'Stopped — run again to continue' : 'Descriptions generated')
  }

  return (
    <div className="border border-gray-200 bg-gray-50 px-4 py-3 mb-5">
      <div className="flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">AI descriptions</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Writes Italian + English copy from the photos for products that have none yet.
            Materials are only mentioned when a photo marked “Label photo” shows them.
          </p>
          {progress && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-black transition-all"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {progress.done} / {progress.total}
                {failures.length > 0 && ` · ${failures.length} failed`}
              </p>
            </div>
          )}
          {failures.length > 0 && !running && (
            <ul className="mt-2 text-xs text-red-600 space-y-0.5">
              {failures.slice(0, 10).map((f, i) => (
                <li key={i}>{f.name}: {f.error}</li>
              ))}
              {failures.length > 10 && <li>… and {failures.length - 10} more</li>}
            </ul>
          )}
        </div>
        {running ? (
          <button
            type="button"
            onClick={() => { stopRef.current = true }}
            className="text-xs px-3 py-1.5 border border-gray-300 bg-white flex items-center gap-1.5 hover:border-gray-500 shrink-0"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <Square className="w-3 h-3" /> Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={run}
            className="text-xs px-3 py-1.5 bg-black text-white flex items-center gap-1.5 hover:bg-gray-800 shrink-0"
          >
            <Sparkles className="w-3 h-3" /> Generate missing
          </button>
        )}
      </div>
    </div>
  )
}
