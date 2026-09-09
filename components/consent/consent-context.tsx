'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type ConsentState = 'granted' | 'denied'

const STORAGE_KEY = 'kaya-cookie-consent'

interface ConsentContextValue {
  /** null until the visitor decides (or we read their stored choice on mount). */
  consent: ConsentState | null
  /** true once localStorage has been read on the client. Gate UI on this so the
   *  first client paint matches the server's (which always renders as undecided). */
  ready: boolean
  setConsent: (value: ConsentState) => void
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined)

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'granted' || stored === 'denied') setConsentState(stored)
    } catch {
      // private mode / storage disabled — treat as undecided
    }
    setReady(true)
  }, [])

  const setConsent = useCallback((value: ConsentState) => {
    setConsentState(value)
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore write failures
    }
  }, [])

  return (
    <ConsentContext.Provider value={{ consent, ready, setConsent }}>
      {children}
    </ConsentContext.Provider>
  )
}

export function useConsent() {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used within <ConsentProvider>')
  return ctx
}
