'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { siteTrack } from '@/lib/analytics/site-track'
import { isInternalVisitor } from '@/lib/analytics/internal-visitor'

export type ConsentState = 'granted' | 'denied'

const STORAGE_KEY = 'kaya-cookie-consent'
// The privacy policy promises the banner comes back after 12 months.
const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000

interface ConsentContextValue {
  /** null until the visitor decides (or we read their stored choice on mount). */
  consent: ConsentState | null
  /** true once localStorage has been read on the client. Gate UI on this so the
   *  first client paint matches the server's (which always renders as undecided). */
  ready: boolean
  setConsent: (value: ConsentState) => void
  /** true while the banner is re-opened from the footer link (choice already made). */
  preferencesOpen: boolean
  /** Re-opens the banner so the visitor can change or withdraw their choice. The
   *  current consent stays in force (trackers keep their state) until they choose. */
  openPreferences: () => void
}

const ConsentContext = createContext<ConsentContextValue | undefined>(undefined)

function readStored(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    // Choices saved before the 12-month expiry existed are a bare string with no date: treat
    // them as made now and re-save with a timestamp so the 12 months start.
    if (raw === 'granted' || raw === 'denied') {
      writeStored(raw)
      return raw
    }
    const parsed = JSON.parse(raw) as { value?: string; at?: string }
    if ((parsed.value !== 'granted' && parsed.value !== 'denied') || !parsed.at) return null
    if (Date.now() - new Date(parsed.at).getTime() > CONSENT_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed.value
  } catch {
    return null // private mode / storage disabled / corrupt value — treat as undecided
  }
}

function writeStored(value: ConsentState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, at: new Date().toISOString() }))
  } catch {
    // ignore write failures
  }
}

/** Creates (granted) or removes (denied) our HttpOnly visitor cookie server-side. */
function syncVisitorCookie(value: ConsentState) {
  if (value === 'granted' && isInternalVisitor()) return
  fetch('/api/analytics/visitor', { method: value === 'granted' ? 'POST' : 'DELETE', keepalive: true }).catch(() => {})
}

/**
 * On withdrawal, remove the cookies Meta Pixel and Google Analytics already
 * set in this browser. The scripts themselves stop loading after the reload
 * that follows, since both are gated on consent === 'granted'.
 */
function clearThirdPartyCookies() {
  const prefixes = ['_ga', '_gid', '_gcl', '_fbp', '_fbc']
  const host = window.location.hostname
  const domains = ['', host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`]
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim()
    if (!prefixes.some((p) => name.startsWith(p))) continue
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`
    }
  }
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState | null>(null)
  const [ready, setReady] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  useEffect(() => {
    const stored = readStored()
    setConsentState(stored)
    setReady(true)
    // Consent given before the visitor cookie existed (or cookie cleared):
    // make sure it is there. The server leaves an existing cookie untouched.
    if (stored === 'granted') syncVisitorCookie('granted')
  }, [])

  const setConsent = useCallback((value: ConsentState) => {
    const previous = readStored()
    setPreferencesOpen(false)
    setConsentState(value)
    writeStored(value)
    siteTrack(value === 'granted' ? 'consent_granted' : 'consent_denied')
    syncVisitorCookie(value)
    if (value === 'denied' && previous === 'granted') {
      // Withdrawal: Pixel/GA are already running in this page; drop their
      // cookies and reload so nothing keeps running until the next navigation.
      clearThirdPartyCookies()
      setTimeout(() => window.location.reload(), 150)
    }
  }, [])

  const openPreferences = useCallback(() => setPreferencesOpen(true), [])

  return (
    <ConsentContext.Provider value={{ consent, ready, setConsent, preferencesOpen, openPreferences }}>
      {children}
    </ConsentContext.Provider>
  )
}

export function useConsent() {
  const ctx = useContext(ConsentContext)
  if (!ctx) throw new Error('useConsent must be used within <ConsentProvider>')
  return ctx
}
