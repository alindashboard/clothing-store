import { Resend } from 'resend'

let _client: Resend | undefined

// Lazy proxy: defers instantiation until first property access (request time, not build time).
export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    if (!_client) _client = new Resend(process.env.RESEND_API_KEY)
    return (_client as any)[prop]
  },
})
