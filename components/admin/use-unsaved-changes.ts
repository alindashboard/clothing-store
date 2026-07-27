'use client'

import { useEffect } from 'react'

/**
 * Warns before leaving a form with unsaved edits.
 *
 * Covers the two ways the admin actually leaves an edit page:
 *  - closing/reloading the tab  -> native beforeunload prompt
 *  - clicking any link (sidebar, breadcrumb, ...) -> confirm() in a capture-phase
 *    click listener, so the click is cancelled before Next's router sees it.
 *
 * Programmatic navigation (router.push after a successful save) is intentionally
 * not intercepted — pass `enabled: false` once the form is clean.
 *
 * Note: the browser Back button is not covered; the App Router gives no way to
 * block a popstate that has already happened.
 */
export function useUnsavedChanges(enabled: boolean, message: string) {
  useEffect(() => {
    if (!enabled) return

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }

    function handleClick(e: MouseEvent) {
      // Let modified clicks (new tab/window) and already-handled clicks through.
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return

      if (!window.confirm(message)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleClick, true)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleClick, true)
    }
  }, [enabled, message])
}
