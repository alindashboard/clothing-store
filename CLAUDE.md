# CLAUDE.md — KAYA Studio Outlet

> Template origin: `alindashboard/site-template`. Project has been initialized.

## Critical: this is NOT the Next.js you know

Next.js 16 has breaking changes — APIs, conventions, and file structure may differ
from your training data. Read the relevant guide in `node_modules/next/dist/docs/`
before writing any code. Heed deprecation notices. Notably: `proxy.ts`, **not**
`middleware.ts`.

## Stack (fixed — do not deviate, do not add dependencies without approval)

- Next.js 16 App Router · React 19 · TypeScript
- Tailwind **v4** — design tokens live in `globals.css` under `@theme inline`.
  There is no `tailwind.config.js` in the v3 sense. Never write v3-style config.
- shadcn/ui `base-nova` · lucide-react icons
- Supabase (auth, DB, storage) — **active**
- Resend for all transactional email
- next-intl for i18n (IT default + EN)
- Vercel: hosting, push-to-deploy on `main`, DNS via ns1/ns2.vercel-dns.com

## Working rules

1. **Investigate before assuming.** Read the actual files, DB schema, and config
   before editing. Never trust that this repo matches the template exactly.
2. **Stop and report discrepancies.** If reality doesn't match the task description,
   stop and report — do not proceed on assumptions.
3. **`npm run build` must pass locally before any push/deploy.** No exceptions.
4. Code comments in **English**. UI text in **Italian** (default locale) + **English**
   — always go through next-intl translation keys, never hardcode UI strings.
5. Unconfirmed business data (addresses, prices, hours, phone numbers) → use
   `TODO_CONFIRM` placeholders and list them in your final report. Never invent.
6. Canonical URLs and sitemap always use the custom domain — never `*.vercel.app`.
7. Every page is self-canonical with complete metadata; never rely on inherited
   defaults for canonical/OG. No redirect chains.
8. Never add `aggregateRating` JSON-LD without verified review data (manual action risk).
9. Never ship the default template color palette — see Design section.

## Known gotchas (learned the hard way)

- Vercel handles www→non-www at the edge **before** `proxy.ts` runs; redirect code
  in proxy is a non-executing safety net.
- `NEXT_PUBLIC_SITE_URL` must be set in Vercel env vars — missing it silently breaks
  OG URLs (they fall back to Supabase URLs).
- Slugs: keep digits (model years, etc.) — they improve uniqueness and SEO. When
  migrating URLs, use 308 permanent redirects from old paths.
- Admin, cart, and checkout routes must be `noindex`.
- GSC Domain property covers all subdomains; no separate www property needed.
- `supabase/schema.sql` is the original **template** schema (items/reservations) —
  the actual production schema is in `supabase/migrations/`. Do not apply schema.sql.
- Stripe is wired (`enableStripe` flag exists) but **disabled**. Don't enable without
  full Stripe key setup and client confirmation.
- `localePrefix: 'always'` means every URL carries `/it/` or `/en/` — including the
  default locale. No bare `/` routes for public pages.
- Admin login redirects to `/admin/dashboard` on success, but the actual admin home
  is `app/admin/page.tsx`. Verify redirect target if adding admin pages.
- Hero backgrounds (`hero-bg-kaya.webp` desktop, `hero-mobile-kaya.webp` mobile) are
  logo-free by design — the logo (`/kaya-logo.png`, transparent PNG) is overlaid in JSX.
  Favicon comes from `app/icon.png` / `app/apple-icon.png` (Next file conventions).
  Don't reintroduce backgrounds with the logo baked in.
- Supabase env vars are NOT in `.env.local` (only the Vercel OIDC token is) — local
  SSR of public pages 500s; verify rendering on Vercel previews instead.
- Header + Footer (shared on every page), the homepage, the **product detail
  page** (`/product/[slug]`), the **category/listing page** (`/category/[slug]`),
  the **store page** (`/store`), the **events page** (`/events`), and the
  **all-products page** (`/products`) are **always dark** (`#141412`/`#0A0A0A`,
  cream `#EDE9E1` text) per the "Kaya Outlet Landing (Final)", "Kaya Product
  Page", "Kaya Category Page", "Kaya Store Page", and "Kaya Events Page"
  Claude Design files — cart/checkout page bodies still stay on the original
  light theme (no design for those yet; ask before converting them).
  `/products` and `/category/[slug]` share `ProductGridInfinite` — it takes the
  same `variant: 'light' | 'dark'` prop pattern, default `'light'`; `/products`
  now passes `variant="dark"` and reuses the same breadcrumb/eyebrow/header
  layout as `/category/[slug]`, with a category filter row (`product.filterAll`
  / `product.shopEyebrow` translation keys) instead of a single category name.
  `lib/config.ts → brand.darkAccent` (`#D9B679`) is the gold used in dark
  chrome/landing/PDP/category/store/events only; `brand.accent` (`#c2a04a`)
  remains the admin-configurable accent for light pages — don't conflate the two.
  `ProductCard`/`PriceDisplay`/`ProductGrid`/`ProductGridInfinite`/`ProductBadge`
  take a `variant: 'light' | 'dark'` prop for this reason (default `'light'`,
  used `'dark'` on the homepage Featured grid, the PDP related-products grid,
  and the category page's infinite grid).
  `ProductGallery`/`VariantSelector`/`AddToCartButton` are PDP-only and are
  hardcoded dark (no variant prop — add one only if a light consumer shows up).
  `StoreGallery` (used only on `/store`) is likewise hardcoded dark.
  The corner-bracket CTA decoration (four absolutely-positioned gold border
  spans) is shared via `components/layout/corner-brackets.tsx` — used by
  `/store`'s CTAs and `/events`' RSVP links. The homepage hero CTA and
  `AddToCartButton` still inline their own copy (different sizing/disabled-state
  color logic) — migrate those to the shared component if they ever need to
  change in lockstep with the others.
  Archivo (`--font-archivo`) and Space Grotesk (`--font-grotesk`) are loaded for
  this dark chrome/landing/PDP only — DM Sans/Cormorant Garamond stay the site's
  base typography elsewhere.

- `AnnouncementBar` and `Footer` are async Server Components (`getTranslations`
  from `next-intl/server`) — never import/render them directly inside a
  `'use client'` page. `/cart` and `/checkout` used to do this and crashed with
  "getTranslations is not supported in Client Components". Pattern: keep the
  page itself an async Server Component that fetches data and renders
  AnnouncementBar/Header/Footer, and push interactive state (Zustand, hooks,
  `useTranslations`) into a separate `*-page-client.tsx` child component
  (see `components/cart/cart-page-client.tsx`, `components/checkout/checkout-page-client.tsx`).

## Design

Design tokens (colors, radii, fonts) are defined in `globals.css` `@theme inline`.
Brand accent: **champagne gold `#c2a04a`** (matches the physical store's charcoal +
gold interior). The accent is also stored in `lib/config.ts → brand.accent` and can
be overridden via Supabase `site_settings` (admin UI planned).

## Maintenance rule for this file

When a task teaches something durable (a gotcha, a convention, a client constraint),
add it here in the same commit — one or two lines, no essays. This file is the
project's memory.

---

## Project Specifics

- **Client:** KAYA Studio Outlet
- **Domain:** `kayaoutlet.com`
- **Project type:** magazin (fashion outlet e-commerce, brick-and-mortar + online)
- **Physical location:** Str. Acque Alte 12, 04100 Borgo Podgora LT, Italy
- **Languages:** IT (default) + EN — via next-intl, `localePrefix: 'always'`
- **Supabase:** yes — auth (admin only), DB (products/orders/events/new_arrivals/categories/contacts), storage (product images)
- **Currency:** EUR · `€`

### Features enabled

- Product catalog with categories, variants (size/color), image gallery
- Cart (Zustand store) + checkout
- WhatsApp order flow (`enableWhatsAppOrder: true`)
- Bank transfer checkout (`enableBankTransfer: true`)
- New Arrivals curated list (admin-managed, carousel on homepage)
- Events module (admin CRUD, public listing page)
- Contact form → Supabase `contact_requests` table
- Resend email (order confirmation + test endpoint at `/api/test-email`)
- Admin panel: products, categories, orders, new-arrivals, events, contacts
- Brands ticker (BARROW, VERSACE JEANS COUTURE, DS2, GIVENCHY, ALEXANDER MCQUEEN, NEW BALANCE, ICON)
- Store info page with map embed

### Features disabled

- Stripe (`enableStripe: false`) — checkout is WhatsApp + bank transfer only
- Newsletter (`enableNewsletter: false`)
- Wishlist (`enableWishlist: false`)
- Reviews (`enableReviews: false`)

### Divergences from template

- Full e-commerce schema (products, categories, orders, product_variants, new_arrivals, events) — not the generic items/reservations schema
- next-intl multilingual (IT+EN) — template has no i18n
- No reservations system
- Events module added (not in template)
- New arrivals module added (not in template)
- Extra deps: `zustand`, `react-day-picker`, `date-fns`, `@base-ui/react`
- Brands ticker component on homepage
- `lib/store-info.ts` and `lib/brands.ts` extracted from `lib/config.ts`

### External services & env vars

```
NEXT_PUBLIC_SITE_URL          # https://kayaoutlet.com
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY     # Supabase service role (server-only)
RESEND_API_KEY                # Resend API key for transactional email
```

### Things the client must confirm (TODO_CONFIRM)

- Verified sender domain in Resend (required for production email delivery)
- Shipping rates / free shipping threshold (currently: free ≥ €150, standard €9.90, express €14.90)
- Tax rate (currently 22% VAT — confirm applies to all products)
- Facebook / TikTok handles (currently empty in config)
- Brand logo assets in `/public/brands/` (ticker uses text fallback for now)
- Admin dashboard redirect target (`/admin/dashboard` vs `/admin`)
