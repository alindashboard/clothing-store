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
- `useCartStore` (zustand `persist`) uses `skipHydration: true` — the default
  (synchronous auto-rehydrate from `localStorage` before first client paint)
  makes a returning visitor's client render disagree with the server's
  always-empty render, tripping React hydration error #418 on every page for
  anyone with items already in their cart. `Header` calls
  `useCartStore.persist.rehydrate()` in a mount effect instead; any component
  reading `items`/`getItemCount` in render must gate on `hasHydrated` (see
  `header.tsx`, `mobile-nav.tsx`) so the first client paint matches the server.
- **Never hardcode Supabase keys in scripts.** `scripts/seed-products.mjs` shipped a
  plaintext `service_role` key in this public repo from 2026-06-01 to 2026-07-27
  (fixed in `400cb9c`). Resolved: the project moved to `sb_secret_*` /
  `sb_publishable_*` keys and **legacy keys were disabled 2026-07-27** — the leaked
  JWT now returns 401, so it is dead even though it stays in git history. Scripts
  read credentials from env only: `node --env-file=.env.local scripts/<name>.mjs`.
- **The catalog is generated from the owner's stock spreadsheets, which are the
  source of truth.** `scripts/input/*.ods` (gitignored) → `parse-stock-ods.py`
  → `scripts/output/stock.json` → `import-stock.mjs --wipe`. The import wipes
  products/variants/images/categories **and the whole `product-images` bucket**
  before writing; it never touches events, contact requests or `event-images`.
  Re-running is a full replace, not a merge — anything the owner edited in the
  admin is lost, so re-import only from an updated ODS. Photos are uploaded
  separately afterwards; a fresh import leaves the catalog imageless.
  Sheet quirks the parser handles: one sheet per brand; SKU/NUME/CATEGORIE/
  CULOARE/MARIME only appear on a product's first row and carry down; a
  free-text "Sconto X%" past the VALOARE column applies downwards until the
  next note; PRET is the **pre-discount** price (`compare_at_price`), so
  `base_price = PRET x (1 - sconto)`; nameless rows are sold-out leftovers
  (CANTITATE 0) and are dropped; sheets end in hundreds of formula-only rows.
  Product names are translated to Italian from a fixed vocabulary at the top of
  the parser — extend those tables rather than hand-editing names.
- Categories are a two-level tree: `uomo` / `donna` / `accessori-scarpe` parents
  (from the three source files, the only place gender is recorded) with slugs
  like `uomo-t-shirt`. Only the three parents have `show_on_landing`.
  `brand.shoeCategorySlugs` must track the shoe child slugs
  (`accessori-scarpe-sneakers`, `accessori-scarpe-ciabatte`) or PDPs show
  clothing sizes for shoes.
- `product_variants.sku` is globally unique — the import derives it from the
  product SKU plus a cleaned size ("44 ½" → `-445`) and suffixes on collision.
- The pre-2026-08-17 catalog was bulk-imported from store photos as **placeholder products**
  (`name: "Produs NNN"`, `base_price: 0`, no category, no variants) — the owner
  fills each one in from the admin. The `Incomplete` filter on `/admin/products`
  keys off `base_price = 0`; drop that filter once the catalog is real.
  Pipeline lives in `scripts/` (`group-photos` → `build-final-groups` →
  `convert-to-webp` → `import-placeholder-products`); it reads credentials from
  env only, and `scripts/output/` + the photo folder are gitignored (hundreds of MB).
- Landing-grid categories are **DB-driven**: `categories.show_on_landing` (toggle in
  `/admin/categories`), ordered by `sort_order` — which the up/down arrows in that
  table own. `brand.landingCategorySlugs` is gone; `brand.shoeCategorySlugs` stays
  (it drives numeric vs clothing sizes). Category sort_order is renumbered 1..N on
  every reorder, so never hand-write values.
- `ProductForm` guards unsaved edits via `useUnsavedChanges` — a capture-phase
  click listener cancels link navigation and `beforeunload` covers reload/close.
  Dirty state is recomputed from the live form, so undoing an edit clears it.
  Browser Back is *not* covered (App Router can't block a popstate after the fact).
- **Image uploads are capped at 4MB by Vercel, not by us.** A Server Action body over
  ~4.5MB is rejected at the platform edge before the action runs, so
  `serverActions.bodySizeLimit` cannot raise it. `lib/actions/upload-limits.ts` holds the
  single `MAX_UPLOAD_SIZE` both the actions and the admin clients check. Admin uploads
  downscale in the browser first (`lib/image-resize.ts`, 1600px WebP q82 — same constants
  as `scripts/convert-to-webp.mjs`), so phone photos of 8-12MB go through as a few hundred
  KB. The product uploader accepts multiple files per pick and uploads them sequentially.
  HEIC is handled too: browsers cannot decode it natively, so `heic-to` (libheif wasm)
  is **dynamically imported** in `lib/image-resize.ts` only when a HEIC is picked — keep
  it a dynamic import, it is a ~2.9MB chunk that must never reach the public bundle.
  This means the owner can upload straight from her iPhone with no phone-setting change.
  A HEIC that libheif cannot decode (the broken depth maps in this catalog) throws
  `UndecodableImageError` and is reported per-file; `scripts/convert-to-webp.mjs` +
  ImageMagick remains the fallback for those.
- Admin numeric inputs must not bind `value` to `parseInt(x) || fallback` — emptying
  the field re-renders it as the fallback on the same keystroke, so it can never be
  cleared and retyped (no spinner arrows on mobile = uneditable). `NumberCell` in
  `variant-manager.tsx` is the pattern: hold a string draft while focused, resolve the
  fallback on blur only. Variant Stock/Threshold also auto-save on blur via
  `persistRow`; rows with no `id` are skipped (empty size/SKU would insert junk) and
  local flags `_dirty`/`_new`/`_saving` must be stripped before hitting Supabase.
- `lib/image-resize.ts` must never fail silently. It used to `return passthrough`
  (the untouched original) on any decode/encode error, so a browser that could not
  process an image produced the same "still NMB after compression" toast as a
  genuinely oversized one. It now reports a `PassthroughReason`, and the three
  uploaders render it via `oversizeMessage`. Decode falls back
  createImageBitmap(from-image) -> createImageBitmap() -> <img>+objectURL; encode falls
  back WebP -> JPEG (Safari lacked canvas WebP encoding for years); and
  `ENCODE_ATTEMPTS` steps quality/size down until the result fits `MAX_UPLOAD_SIZE`.
- `site_settings` is a key/value table for admin-toggleable flags (read via
  `lib/site-settings.ts`, cached per request). First flag:
  `hide_products_without_images`, toggled at the top of `/admin/products`. When on,
  the public product queries switch their images embed to `product_images!inner`,
  which drops products with no photo from listings, the PDP (404) and the sitemap.
  Reads default to **false** if the row or table is missing, so a missing migration
  degrades to the old behaviour instead of emptying the shop.
- Landing category cards: `categories.image_urls` (TEXT[], curated in the
  `/admin/categories` edit modal, offered only for `show_on_landing` categories) is a
  slideshow fed straight to `CategoryImageSlider`; array order is slideshow order.
  Entries are either uploads or URLs picked from the category's own product photos, so
  **removing one never deletes the file** — it may still be a product image. Uploaded
  category images are therefore orphaned on removal, which the bucket wipe on re-import
  clears. Empty list falls back to `getCategoryImages`, which cycles one photo from each
  of the newest photographed products. That helper must resolve **parent + children** — landing shows
  the gender parents while products hang off child categories, so a bare
  `.eq('category_id', parentId)` matches nothing and every card renders the gradient
  placeholder. Category images live in the `product-images` bucket under `categories/`:
  a stock re-import wipes that bucket *and* the categories rows, so file and row die
  together instead of leaving orphans.
- GSC Domain property covers all subdomains; no separate www property needed.
- `supabase/schema.sql` is the original **template** schema (items/reservations) —
  the actual production schema is in `supabase/migrations/`. Do not apply schema.sql.
- **Stripe card payments — live in sandbox as of 2026-09-18** (`checkout.enableStripe:
  true`). Uses hosted Stripe Checkout (redirect), not Elements — we never touch card
  data. Flow: `CheckoutForm` calls `createOrder` first (status `pending`/`unpaid`,
  same as whatsapp/bank_transfer), then `createStripeCheckoutSession`
  (`lib/actions/orders.ts`) builds one Checkout Session line item per cart item plus
  a `Shipping` line if non-zero, sets `client_reference_id`/`metadata.order_id` to
  the order's UUID, stashes the session id on `payment_intent_id` (temporarily —
  see below), and redirects via `window.location.href` (a real navigation, not
  `router.push`, since Stripe's domain is external). Amount is always computed
  server-side from the order just persisted — never trust a client-submitted total.
  `success_url`/`cancel_url` are built from the request's own `host`/
  `x-forwarded-proto` headers (`next/headers`), not `NEXT_PUBLIC_SITE_URL` — that
  env var is still wrong locally (points at the vercel.app placeholder per the
  gotcha below), and deriving from the request makes local Stripe testing work
  without touching it.
  **Payment confirmation is webhook-only**, never the client-side redirect back to
  success — `app/api/webhooks/stripe/route.ts` verifies `stripe-signature` against
  `STRIPE_WEBHOOK_SECRET` on the raw body (`request.text()`, read before any JSON
  parsing) and, on `checkout.session.completed` with `payment_status === 'paid'`,
  calls `markStripeOrderPaid(orderId, paymentIntentId)` — looked up by
  **`session.client_reference_id` (the order's UUID), not `payment_intent_id`**,
  because that column gets overwritten from the Checkout Session id to the real
  PaymentIntent id as part of marking it paid; looking it up by that same mutable
  column breaks a legitimate Stripe retry of the same event (reproduced locally: a
  replayed webhook came back "order not found" after the first delivery succeeded).
  `markStripeOrderPaid` is idempotent on `payment_status === 'paid'` (early-return,
  no duplicate `order_status_history` row, no duplicate emails) — Stripe retries
  webhooks it doesn't get a fast 2xx for.
  `createOrder` skips `sendOrderConfirmation`/`sendNewOrderNotification` when
  `payment_method === 'stripe'` (money hasn't arrived yet); `markStripeOrderPaid`
  sends both once payment is confirmed, reusing the extracted `buildOrderEmailData`
  helper. One confirmation email template for all three payment methods — the
  `payment_status === 'stripe'` branch in `emails/order-confirmation.tsx` shows a
  "Payment received" block instead of the `bank_transfer` IBAN block;
  `new-order-notification.tsx` gets a green "PAID — CARD" badge so the owner can
  tell at a glance which orders are already settled.
  The success page (`app/[locale]/checkout/success/page.tsx`) reflects actual DB
  state, not client-side optimism: `getOrderByNumber` now also selects
  `payment_status` and `items(product_id, quantity, unit_price)`; if a stripe order
  hasn't flipped to `paid` yet (webhook can lag the redirect by a beat) it shows a
  "confirming your payment" message instead of claiming success. The Meta Pixel
  `Purchase` event follows the same split: `CheckoutForm` never stashes pixel data
  before redirecting to Stripe (payment isn't confirmed at that point), so
  `TrackPurchase` (`components/analytics/track-purchase.tsx`) gained an optional
  `stripeOrder` prop — the success page builds it server-side from the DB only when
  `payment_method === 'stripe' && payment_status === 'paid'`, bypassing the
  sessionStorage path whatsapp/bank_transfer still use.
  Tested end-to-end against the real sandbox account (checkout redirect, line
  items/amount matched the cart exactly, a real `4242...` test card payment) and
  the webhook route was exercised locally with `stripe.webhooks.generateTestHeaderString`
  (no Stripe CLI install needed) — including the retry/idempotency case above.
  **Not yet done: the sandbox's `STRIPE_WEBHOOK_SECRET` isn't registered anywhere.**
  Get it by running `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
  locally (prints a `whsec_...`), or by adding the endpoint in the Stripe Dashboard
  (Developers → Webhooks) for `checkout.session.completed` once deployed — a
  deployed endpoint needs its own separate `STRIPE_WEBHOOK_SECRET` in Vercel env
  vars, listening locally does not share a secret with the Dashboard's.
  Also unresolved: `createOrder`'s `total` still excludes `tax_amount` (pre-existing,
  not introduced by this work) — the Stripe Checkout Session amount mirrors that
  same `total`, so fix the tax bug and the Stripe amount together if it's ever fixed.
- **Fixed 2026-09-18 — bank transfer checkout landed on a blank page.** Both
  `whatsapp` and `bank_transfer` submits in `CheckoutForm` called `clearCart()`
  synchronously before `router.push('/checkout/success')`. Clearing the cart
  immediately re-rendered the still-mounted `/checkout` page, whose
  `CheckoutPageClient` has "cart empty → redirect to `/cart` and render
  `null`" — a second, competing navigation that could leave the browser stuck
  on `/checkout` rendering nothing (reproduced live: both the success-page and
  cart-page requests came back `net::ERR_ABORTED`). WhatsApp hit the same race
  but was masked because `window.open()` pulls attention to the new tab.
  Fix: `clearCart()` moved out of `CheckoutForm` into `TrackPurchase`, which
  already runs once on `/checkout/success` mount — the cart only empties once
  the checkout page is gone, so there's nothing to race.
  Bank details live in `lib/config.ts → checkout.bankTransfer` (bank name,
  account holder, IBAN, BIC/SWIFT — real values, client-confirmed
  2026-09-18). The success page fetches the order server-side via
  `getOrderByNumber` (`lib/actions/orders.ts`, public — only selects
  `order_number/payment_method/total/currency`, no PII) and renders
  `BankTransferPanel` (copy-to-clipboard per field, including the order
  number as payment reference so the owner can match transfers to orders) when
  `payment_method === 'bank_transfer'`. Same block is mirrored in
  `emails/order-confirmation.tsx` (gated on the new `paymentMethod` prop,
  threaded through `OrderEmailData` from `createOrder`) since a customer who
  closes the success page otherwise has no record of where to send payment.
- **Shipping confirmation email**: `updateOrderStatus` (`lib/actions/orders.ts`)
  fetches the order's prior status before writing the new one and fires
  `sendShippingConfirmation` (`emails/shipping-confirmation.tsx`) only on the
  transition *into* `shipped` (`existing.status !== 'shipped' && status ===
  'shipped'`) — re-saving while already shipped (e.g. editing tracking
  afterwards) must not re-send it. Pulls whatever `tracking_number`/
  `tracking_url` are already on the order at that moment; if the admin marks
  an order shipped before saving tracking, the email still sends without a
  tracking link (email template just omits that section) — save tracking
  first if you want it included.
- **`order_status_history`** (migration `20260918000001_order_status_history.sql`,
  applied 2026-09-18 via `supabase db push --linked`) backs the admin order
  Timeline. `createOrder` inserts the initial `pending` row;
  `updateOrderStatus` inserts one on every actual transition (skipped on a
  same-status resubmit) and only fires the shipping email on that same
  transition check. Both inserts are non-blocking (logged, not thrown) and
  `getOrderStatusHistory` returns `[]` on error, so a not-yet-applied
  migration degrades to the old "no history" Timeline instead of breaking
  order creation or status updates — same pattern as `site_settings`.
  `/admin/orders/[id]`'s Timeline card skips the bootstrap `pending` row
  (already represented by the "Created" line) via `history[0].status ===
  'pending'`, which only holds for orders created after this migration.
- **Order status update is a client component** (`OrderStatusPanel`,
  `components/admin/order-status-panel.tsx`) instead of the page's old
  inline `<form action={serverAction}>` + `redirect()` — that pattern gave no
  loading feedback until the full navigation landed (felt like a freeze).
  It calls `updateOrderStatus` directly, tracks its own `loading` state for
  the spinner, and calls `router.refresh()` on success instead of navigating.
  Selecting **Shipped** with no `tracking_number`/`tracking_url` saved opens
  a confirm dialog (`components/ui/dialog`, first real usage of that
  shadcn/base-ui primitive in this repo) before proceeding, since the
  shipping email silently omits the tracking section otherwise.
- **`deleteOrder`** (`lib/actions/orders.ts`, wired to a "Delete Order" button
  on `/admin/orders/[id]`, same confirm()-in-a-client-component pattern as
  `deleteProduct`/`DeleteButton`) restores each item's `stock_quantity`
  before deleting `order_status_history`/`order_items`/the order itself —
  explicit deletes, not relying on an unverified FK cascade. This is the
  general "undo" for a test order or one that needs voiding; it's also what
  cleaned up the 6 orders placed while testing bank transfer/shipping-email
  during 2026-09-18 (all from the owner's own email, verified against the
  full `orders` table before deleting — there were no real customer orders
  yet). Deliberately did **not** add an email-based "skip stock for my own
  orders" exception — that would silently stop decrementing stock for any
  future order from that address (including a real one) with nothing in the
  admin UI showing why, and it would stop testing the actual decrement code
  path. `deleteOrder` covers the same need without that risk.
- `localePrefix: 'always'` means every URL carries `/it/` or `/en/` — including the
  default locale. No bare `/` routes for public pages.
- Admin login redirects to `/admin/dashboard` on success, but the actual admin home
  is `app/admin/page.tsx`. Verify redirect target if adding admin pages.
- Hero backgrounds (`hero-bg-kaya.webp` desktop, `hero-mobile-kaya.webp` mobile) are
  logo-free by design — the logo (`/kaya-logo.png`, transparent PNG) is overlaid in JSX.
  Favicon comes from `app/icon.png` / `app/apple-icon.png` (Next file conventions).
  Don't reintroduce backgrounds with the logo baked in.
- **Supabase CLI is now usable from this repo (as of 2026-09-18).** Earlier
  notes said Supabase env vars weren't in `.env.local` and no migration
  tooling was wired up — both are now stale: `.env.local` has real
  `NEXT_PUBLIC_SUPABASE_URL`/anon/service-role values (local SSR of public
  pages should work), and the CLI is logged in with this project (`Fashion`,
  ref `snsjjyvleuirivsiytre`) already linked — `supabase/.temp/` is tracked
  in git (project ref + a credential-free pooler URL template, nothing
  secret) but there's still no committed `config.toml`. Before this date,
  every
  migration in `supabase/migrations/` had been applied by hand via the
  Supabase SQL editor, so the CLI's own bookkeeping (`supabase_migrations.
  schema_migrations`) didn't know about any of them — `supabase migration
  list --linked` showed all of them as local-only. Fixed by `supabase
  migration repair --status applied <versions...> --linked` for every
  pre-existing migration (verified each one's table/column actually existed
  first — never repair blind), then `supabase db push --linked` for the new
  one. Going forward, prefer `supabase db push --linked` for new migrations
  over asking the client to paste SQL manually — just verify state first if
  local and remote history might have drifted again.
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

- **Meta Pixel is consent-gated — it must not load before the visitor accepts.**
  `ConsentProvider` (`components/consent/consent-context.tsx`, mounted in the root
  `app/layout.tsx`) holds the choice in `localStorage` (`kaya-cookie-consent` =
  `granted`/`denied`); `CookieBanner` (in `app/[locale]/layout.tsx`, needs
  next-intl) shows while undecided. `FacebookPixel`
  (`components/analytics/facebook-pixel.tsx`) injects the base code only when
  `consent === 'granted'`, and fires one `PageView` per App Router route change
  (first effect run skipped — the inline snippet already fired the initial one).
  Pixel ID lives in `lib/config.ts → analytics.facebookPixelId` (public value, not
  an env var) behind `features.facebookPixel`. Event helpers: `lib/analytics/fpixel.ts`
  (`track()` no-ops until `window.fbq` exists, i.e. until consent). Standard events
  wired: ViewContent (`TrackViewContent` on the PDP), AddToCart (in
  `add-to-cart-button.tsx`), InitiateCheckout (`TrackInitiateCheckout` on the
  checkout page), Purchase (`TrackPurchase` on `/checkout/success`, reading the
  order from `sessionStorage` via `lib/analytics/order-tracking.ts` — never the URL).
  `content_ids` are Supabase product UUIDs; realign them if a Meta catalog/feed is
  added. No Conversions API yet (no token supplied). Privacy page has a stub
  cookies section — **TODO_CONFIRM: full privacy/cookie policy needs the client's
  legal review.**

- **First-party site analytics is separate from the Meta Pixel and NOT consent-gated.**
  `analytics_events` (Supabase) stores page views + the same four funnel events as the
  Pixel (`view_product`/`add_to_cart`/`checkout_start`/`purchase`), written only via
  `app/api/analytics/route.ts` using the service-role client — RLS on the table has
  zero policies, so the anon/authenticated keys get no access at all, by design.
  No persistent visitor id: `visitor_hash` is `sha256(salt+ip+ua+UTC date)`, rotates
  daily, IP itself is never stored — that's what makes it defensible without a
  consent click. `lib/analytics/site-track.ts` (`siteTrack()`, client, sendBeacon)
  fans out from the same trigger points as `lib/analytics/fpixel.ts` (see
  `TrackViewContent`/`add-to-cart-button.tsx`/`TrackInitiateCheckout`/`TrackPurchase`).
  Toggle via `features.siteAnalytics` in `lib/config.ts`. Admin view: `/admin/analytics`
  (`lib/actions/analytics.ts` fetches the date range and aggregates in JS — fine at
  this traffic volume, revisit with an RPC/materialized view if it ever gets slow).
  Vercel Web Analytics (`@vercel/analytics`, mounted in `app/layout.tsx`) runs
  alongside it for referrer/country/device breakdowns the Vercel dashboard already
  does well — no need to duplicate those in the admin table.

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
- **Supabase:** yes — auth (admin only), DB (products/orders/events/new_arrivals/categories/contacts/analytics_events), storage (product images)
- **Currency:** EUR · `€`

### Features enabled

- Product catalog with categories, variants (size/color), image gallery
- Cart (Zustand store) + checkout
- WhatsApp order flow (`enableWhatsAppOrder: true`)
- Bank transfer checkout (`enableBankTransfer: true`)
- Stripe card payments via hosted Checkout (`enableStripe: true`) — sandbox as of
  2026-09-18, see the gotcha above before touching payment/webhook code
- New Arrivals curated list (admin-managed, carousel on homepage)
- Events module (admin CRUD, public listing page)
- Contact form → Supabase `contact_requests` table
- Resend email (order confirmation + test endpoint at `/api/test-email`)
- Admin panel: products, categories, orders, new-arrivals, events, contacts
- Brands ticker (BARROW, VERSACE JEANS COUTURE, DS2, GIVENCHY, ALEXANDER MCQUEEN, NEW BALANCE, ICON)
- Store info page with map embed
- Cookie-consent banner (IT/EN) + consent-gated Meta Pixel with standard events (`features.facebookPixel`)
- First-party cookieless site analytics (`features.siteAnalytics`) + Vercel Web Analytics — `/admin/analytics`

### Features disabled

- Newsletter (`enableNewsletter: false`)
- Wishlist (`enableWishlist: false`)
- Reviews (`enableReviews: false`)

### Divergences from template

- Full e-commerce schema (products, categories, orders, product_variants, new_arrivals, events) — not the generic items/reservations schema
- next-intl multilingual (IT+EN) — template has no i18n
- No reservations system
- Events module added (not in template)
- New arrivals module added (not in template)
- Extra deps: `zustand`, `react-day-picker`, `date-fns`, `@base-ui/react`, `@vercel/analytics`
- Brands ticker component on homepage
- `lib/store-info.ts` and `lib/brands.ts` extracted from `lib/config.ts`

### External services & env vars

```
NEXT_PUBLIC_SITE_URL          # https://kayaoutlet.com
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key (public)
SUPABASE_SERVICE_ROLE_KEY     # Supabase service role (server-only)
RESEND_API_KEY                # Resend API key for transactional email
STRIPE_SECRET_KEY             # Stripe secret key (server-only; sk_test_... in sandbox)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY # Stripe publishable key (public; unused for now —
                               # hosted Checkout needs only the secret key server-side,
                               # kept for if Elements/Payment Element is ever added)
STRIPE_WEBHOOK_SECRET          # Signing secret for /api/webhooks/stripe — NOT YET SET,
                               # see the Stripe gotcha above
```

### Things the client must confirm (TODO_CONFIRM)

- Verified sender domain in Resend (required for production email delivery)
- Shipping rates / free shipping threshold (currently: free ≥ €150, standard €9.90, express €14.90)
- Tax rate (currently 22% VAT — confirm applies to all products)
- Facebook / TikTok handles (currently empty in config)
- Brand logo assets in `/public/brands/` (ticker uses text fallback for now)
- Admin dashboard redirect target (`/admin/dashboard` vs `/admin`)

### Open items (as of 2026-08-17)

- **The catalog has no photos.** The stock import wiped the bucket; 356 products
  are live with prices/variants and no images. Uploading them is the next job,
  and nothing links a photo to a SKU yet — the ODS files carry no photo
  reference, so the match has to be made by hand or by a new pipeline.
- **Brand names to confirm** with the owner: `BLNCG`, `POLO` (which Polo label?),
  `Richmond` (John Richmond?). Rendered conservatively in `parse-stock-ods.py`.
- 105 products share a name with another (the owner recorded distinct pieces
  identically, e.g. 6x "Plein Sport Shorts da spiaggia Blu"). Slugs are unique;
  the names need the owner's eye.
- 11 products imported with zero stock and `is_active = false`.
- **One product must be re-shot**: `IMG_6822`/`IMG_6823` were its only photos and
  both are unrecoverable (broken HEIC depth map), so it was never imported.
  `IMG_6857` and `IMG_7043` are also corrupt but their products kept one good photo.
- Landing grid now shows the three gender parents (Uomo, Donna, Accessori e
  Scarpe); the old Sneakers/Shirts cards went away with the category wipe.
- **Fixed 2026-08-20 — prefetch storm caused intermittent navigation 503s.**
  Category/products pages rendered every sibling category tab plus every
  `ProductCard` on screen as a `<Link>`, and Next prefetched all of them the
  moment they entered the viewport — 20-30 simultaneous RSC requests per page
  load, most hitting cold (never invoked) lambdas at once. Replaying that
  request pattern against production reproduced ~50% `503`s, including on the
  clicked navigation request itself, which forced Next to fall back to a full
  page reload — that was the "delay between tap and action" on category
  navigation. Fix: `prefetch={false}` on `ProductCard`'s link, the category-tab
  rows in `/category/[slug]` and `/products`, and Header's always-visible nav
  links (top-level category links, Tutto/Nuovi Arrivi/Eventi/Negozio) — they
  render on every page so they were adding to the baseline burst too. Clicking
  still navigates instantly (Next just fetches on click instead of prefetching
  ahead of time); it just no longer fires dozens of concurrent cold starts on
  every page load.
- **Stock CSV export**: `/api/admin/export-stock` (route handler, not a Server
  Action, so it can stream a file download) reuses the same `categoryId`/
  `status`/`search` filters as `/admin/products` — the "Export CSV" button
  passes through whatever's in the URL. Unlike the products list, its category
  filter expands a parent to its children (so picking "Uomo" exports all men's
  categories, not zero rows) — needed for the gender-filtered export use case.
  One row per variant (placeholder products with no variants get a single
  zero-stock row); UTF-8 BOM prefix so Excel doesn't mangle accented names.
  It is under `/api`, which the proxy matcher excludes from the `/admin` auth
  gate, so it re-checks `auth.getUser()` itself rather than relying on proxy.
- **Stock export by brand**: `/api/admin/export-stock-by-brand` is a second,
  separate export endpoint — real `.xlsx` (via `exceljs`, first new dependency
  added since template init) with one worksheet per brand. Brand = the first
  two SKU characters uppercased (`brandCodeForSku` in `lib/stock-export.ts`,
  e.g. `BRusd127-` -> sheet `BR`); rows with no/short SKU land in a fallback
  `ALTELE` sheet, sorted last. Row-building is shared with the flat CSV export
  via `getStockExportRows` in the same file — both endpoints take the same
  `categoryId`/`status`/`search` filters, so keep them in sync if the export
  columns change.
- **Stock export row order**: both exports sort products by `sku_prefix`
  ("BR-0016" -> brand "BR" + counter 16), not by name — the counter is what the
  owner reads off physical labels, and name order scattered them (a plain
  string sort of the SKU also breaks past 4 digits: "0002" < "00010" as text).
  Products with no parseable `sku_prefix` (the pre-2026-08-17 placeholders)
  sort last. Sizes within a product were already correctly ordered via
  `product_variants.sort_order`, set at import time by `sizeRank()` in
  `scripts/import-stock.mjs` (clothing letters in size order, then numeric —
  see that function before touching size sort anywhere else).
- **Wholesale discount applied 2026-09-19** via `scripts/apply-wholesale-discount.mjs`
  (`node --env-file=.env.local scripts/apply-wholesale-discount.mjs [--apply]`, dry-run by
  default). Brand = first 2 chars of `products.sku_prefix` before the hyphen (already
  the brand code, unlike `brandCodeForSku` in `lib/stock-export.ts` which parses a raw
  variant SKU — don't conflate the two). For each product in the `DISCOUNTS` map,
  `new base_price = (compare_at_price ?? old base_price) x (1 - discount%)`; when
  `compare_at_price` was null it's backfilled to the old `base_price` so the discount
  still shows crossed-out. Permanently overwrote retail prices for 270 products across
  13 brands (BL 40%, CK 40%, DI 35%, IC 50%, IB 35%, PK 40%, PS 40%, TH 40%, DS 40%,
  RI 50%, NB 50%, EX 40%, BR 50%) — confirmed with the owner this replaces the live
  price, not a separate wholesale tier. Brands not in that list (`MB` 39 products, `VS`,
  `GC`, `GV`, `PA`, `AM`, `AR`, `MS`, `PO`) were deliberately left untouched. No
  `product_variants.price_override` rows existed on any affected brand, so `base_price`
  alone drove the change — re-check that assumption if this is ever re-run after variant
  overrides get used. Re-running the script is idempotent-ish but NOT re-runnable for a
  second discount round as-is: it always reads from the current `compare_at_price`, so a
  second pass with different percentages should still work off the same math, but a
  second pass with the *same* percentages would re-discount an already-discounted price
  if `compare_at_price` reflects the reduced price rather than the original one — verify
  `compare_at_price` still holds the pre-wholesale price before reusing this script.
