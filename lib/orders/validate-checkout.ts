import type { CheckoutFormData } from '@/lib/types'
import { isItalianProvince } from '@/lib/italy/provinces'

// Plain module (not 'use server'): server-side checkout validation for
// createOrder. The form's own HTML constraints mirror these rules for instant
// feedback, but a hand-crafted request skips them, and these fields end up on
// fiscal documents (FatturaPA rejects a bad CAP or Provincia).

export type CheckoutField =
  | 'email' | 'phone' | 'name'
  | 'address_line1' | 'address_line2' | 'city' | 'postal_code' | 'state'
  | 'billing_address_line1' | 'billing_address_line2' | 'billing_city'
  | 'billing_postal_code' | 'billing_state'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CAP = /^\d{5}$/
const PHONE = /^\+?[0-9 ().-]{6,20}$/

/** Collapses whitespace runs and trims — pasted addresses often carry tabs/double spaces. */
function clean(v: unknown): string {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''
}

export type CheckoutValidation =
  | { ok: true; data: CheckoutFormData }
  | { ok: false; invalid: CheckoutField[] }

/**
 * Normalises and validates checkout input. Italy only, so country is forced to
 * IT for both addresses. When billing = shipping the billing fields are filled
 * from shipping, so every order carries a complete billing address.
 */
export function validateCheckout(input: CheckoutFormData): CheckoutValidation {
  const invalid: CheckoutField[] = []
  const check = (field: CheckoutField, ok: boolean) => { if (!ok) invalid.push(field) }
  const len = (v: string, min: number, max: number) => v.length >= min && v.length <= max

  const email = clean(input.email).toLowerCase()
  const phone = clean(input.phone)
  const name = clean(input.name)
  const address_line1 = clean(input.address_line1)
  const address_line2 = clean(input.address_line2)
  const city = clean(input.city)
  const postal_code = clean(input.postal_code).replace(/\s/g, '')
  const state = clean(input.state).toUpperCase()

  check('email', len(email, 5, 254) && EMAIL.test(email))
  check('phone', phone === '' || PHONE.test(phone))
  check('name', len(name, 2, 120))
  check('address_line1', len(address_line1, 3, 200))
  check('address_line2', address_line2.length <= 200)
  check('city', len(city, 2, 80))
  check('postal_code', CAP.test(postal_code))
  check('state', isItalianProvince(state))

  const same = input.billing_same_as_shipping !== false
  const billing_address_line1 = same ? address_line1 : clean(input.billing_address_line1)
  const billing_address_line2 = same ? address_line2 : clean(input.billing_address_line2)
  const billing_city = same ? city : clean(input.billing_city)
  const billing_postal_code = same ? postal_code : clean(input.billing_postal_code).replace(/\s/g, '')
  const billing_state = same ? state : clean(input.billing_state).toUpperCase()

  if (!same) {
    check('billing_address_line1', len(billing_address_line1, 3, 200))
    check('billing_address_line2', billing_address_line2.length <= 200)
    check('billing_city', len(billing_city, 2, 80))
    check('billing_postal_code', CAP.test(billing_postal_code))
    check('billing_state', isItalianProvince(billing_state))
  }

  if (invalid.length) return { ok: false, invalid }

  return {
    ok: true,
    data: {
      email, phone, name,
      address_line1, address_line2, city, postal_code, state,
      country: 'IT',
      billing_same_as_shipping: same,
      billing_address_line1, billing_address_line2, billing_city,
      billing_postal_code, billing_state,
      billing_country: 'IT',
      payment_method: input.payment_method,
    },
  }
}
