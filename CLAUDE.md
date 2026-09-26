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
- Vercel: hosting, push-to-deploy on `main`. **DNS is on Cloudflare**
  (arnold/tess.ns.cloudflare.com) — all DNS/email-routing changes happen in the
  Cloudflare dashboard, not Vercel

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
- **Stripe card payments — LIVE (real money) in production.** Built and tested in
  sandbox 2026-09-18; production switched to live keys (`pk_live_`/`sk_live_`) and a
  live-mode webhook endpoint + `STRIPE_WEBHOOK_SECRET` were added in Vercel on
  2026-09-19. Verified 2026-09-26 by the owner: a real card purchase on kayaoutlet.com,
  then refunded from the Stripe Dashboard. `.env.local` deliberately keeps **test** keys
  (`sk_test_`/`pk_test_`) — never put live keys in local env. `enableStripe` has been
  `true` since the initial build, so no older branch/worktree can disable it by merge.
  **Refunds** are issued from the Stripe Dashboard and mirrored by the webhook's
  `charge.refunded` handler (`markStripeOrderRefunded`, since 2026-09-26): full refund →
  order + payment status `refunded` (+ timeline row, drops out of sales stats);
  partial → a dated line in the order notes, status unchanged. Matched by
  `payment_intent_id`, falling back to the Checkout Session's `client_reference_id`.
  Stock is never restored automatically. The live Dashboard endpoint must be
  subscribed to **both** `checkout.session.completed` and `charge.refunded`.
  Original sandbox notes follow (`checkout.enableStripe:
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
  Webhook secrets are per endpoint and per mode: production uses the live Dashboard
  endpoint's secret (Vercel env); local testing needs its own test-mode secret
  (`stripe listen --forward-to localhost:3000/api/webhooks/stripe` prints a
  `whsec_...`) — the two never share a value.
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
  Claude Design files. **Since 2026-09-26 the whole public site is dark** — cart,
  cart drawer, checkout, success, contact, new-arrivals, privacy, terms and the 404
  were converted too (no Claude Design file for those; they reuse the category-page
  header). There is **no light/dark mode switch**: themes are fixed per surface —
  public = dark, `/admin` = light. The root layout picks the `<body>` colours from
  the `x-next-intl-locale` header (present on public requests only), so overscroll
  never flashes white. The shadcn `.dark` tokens in `globals.css` are template
  leftovers; public pages that use shadcn inputs wrap in `dark kaya-dark`, which
  re-points the tokens at the brand palette (and `--radius: 0`). Shared pieces:
  `DarkPageHeader` (breadcrumb + eyebrow + Archivo title), `KayaCta` (bracketed
  solid-gold / outline CTA, link or button), `.legal-prose` (the typography plugin
  is NOT installed — `prose` classes do nothing). New public pages: use these,
  never `bg-white`/`text-gray-*`. The unused `next-themes` dep only feeds the
  admin Toaster; the add-to-cart toast was removed (the drawer is the feedback).
  `app/[locale]/[...rest]` sends unknown URLs to the branded `[locale]/not-found`.
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
  `KayaCta` (store, cart, checkout, contact, 404) and `/events`' RSVP links. The homepage hero CTA and
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

- **Google tag (GA4 `G-F9KBCYVES4`) is consent-gated exactly like the Pixel** (added 2026-09-23).
  `GoogleTag` (`components/analytics/google-tag.tsx`, root layout) loads gtag.js only on
  `consent === 'granted'` and never on an internal-visitor device; it sends Consent Mode v2
  as all-`granted` since it never loads otherwise. Events via `gtagEvent` (`lib/analytics/gtag.ts`)
  at the same four trigger points: `view_item`/`add_to_cart`/`begin_checkout`/`purchase`
  (`transaction_id` = order number, dedupes reloads). No manual `page_view` — GA4 enhanced
  measurement tracks history changes; adding one double-counts. GA4 property 555632142 is
  linked to Google Ads 489-718-9421; the Ads conversion is `purchase` imported from GA4
  (mark it a key event in GA4 first). Privacy/cookie texts name Google — keep them in sync.

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
  Since 2026-09-24 `/admin/analytics` has tabs (Overview / Products / Pages / Sources).
  **Orders and revenue come from the `orders` table, never from `purchase` events** —
  events have no link to the order, so deleted/refunded test orders used to linger in
  the stats; `isCountedOrder()` also skips unpaid Stripe orders. "Visitors" are
  visitor-days (the hash rotates daily). Source = UTM tag on the landing page_view
  (migration `20260925000000`, ingest falls back to no-UTM insert until applied), else
  the referrer — counted per visitor-day, because `document.referrer` never changes
  on client-side navigation. Brand is derived from the product name
  (`lib/brand-names.ts`, mirror of the importer's BRANDS table).
  Vercel Web Analytics (`@vercel/analytics`, mounted in `app/layout.tsx`) runs
  alongside it for referrer/country/device breakdowns the Vercel dashboard already
  does well — no need to duplicate those in the admin table.

- **Trust block** (`components/trust/trust-badges.tsx`, `trust.*` keys): authenticity
  guarantee (full refund if not original — owner-confirmed 2026-09-23), physical store,
  14-day returns, Stripe payment + Visa/Mastercard/Stripe marks (`payment-logos.tsx`,
  simple-icons paths inlined — no dependency). Shown on the PDP (`columns={1}`) and under
  the checkout submit. Returns wording must match `/terms` (which is still English-only
  and hardcoded). Apple Pay is not advertised: the session uses `payment_method_types: ['card']`.
- **Owner traffic is excluded from analytics** by device: `AdminShell` sets
  `localStorage['kaya-internal-visitor']`, and `siteTrack`, the Meta Pixel `call()` and
  Vercel Analytics (`beforeSend` in `components/analytics/vercel-analytics.tsx`) all
  skip that device afterwards. Each device must open `/admin` once; rows logged before
  2026-09-23 still include test traffic.
- `CheckoutPageClient` must gate its "empty cart → /cart" redirect on `hasHydrated` —
  before that fix a direct load of `/checkout` (refresh, Stripe `cancel_url`) bounced a
  full cart to `/cart`. The checkout form was fully English until 2026-09-23; keep all
  its strings in `checkout.*`.

- **PDP photo viewer** (`components/product/product-lightbox.tsx`, `product.gallery.*`):
  tapping the inline gallery opens a fullscreen, portal-rendered viewer (object-contain,
  swipe, tap-to-zoom + pan, grid of all photos, thumbnail strip, arrows/Esc on desktop).
  It pushes a history entry on open so the phone's Back closes it instead of leaving the
  PDP; X/Esc call `history.back()` to pop that entry — keep the two in sync. The inline
  gallery is `object-contain` too (it used to crop with `object-cover`).

- **Every admin Server Action must start with `await requireAdmin()`** (`lib/auth/require-admin.ts`).
  Each export of a `'use server'` file is a public POST endpoint with a build-stable id;
  the proxy's `/admin` redirect only covers page navigations, and these actions use the
  service-role client (RLS bypassed). Until 2026-09-23 none of them checked auth —
  verified locally that an anonymous POST ran `getOrdersAdmin`. Public actions (catalog
  reads, `createOrder`, `createStripeCheckoutSession`, `getOrderByNumber`, `submitContact`)
  stay open. Never export something from a `'use server'` file that only a trusted caller
  may run: `markStripeOrderPaid` lives in `lib/orders/payment.ts` (plain module) so only
  the signature-verified webhook can reach it. "Logged in = admin" assumes Supabase
  public sign-up is disabled — keep it that way.

- **Product copy is bilingual since migration `20260924000000`**: `description_en` /
  `short_description_en` fall back to the Italian fields via `productCopy()`
  (`lib/product-copy.ts`) — use it anywhere product copy is rendered.
  `product_images.is_label` flags brand-label shots (admin checkbox; PDP shows a note).
  AI-drafted descriptions are parked on branch `claude/kaya-descriptions-reviews`
  (needs `@anthropic-ai/sdk` + `ANTHROPIC_API_KEY`, postponed by the owner).
- **Google reviews replaced the invented homepage testimonials** (fake reviews are an
  unfair commercial practice under the EU Omnibus rules — never reintroduce
  placeholder testimonials). `lib/google-reviews.ts` calls Places API (New) Place
  Details, cached 24h per locale; reviews are shown unfiltered and unedited with
  Google Maps attribution. The "leave a review" CTA uses `STORE_INFO.googleReviewUrl`
  (Business Profile short link, live since 2026-09-24); rating + texts additionally need
  `googlePlaceId` + `GOOGLE_PLACES_API_KEY`. Use the business's Place ID
  (`clothing_store`), not `ChIJeXlPr9V0JRMRCJN0DTUs4c4` — that one is the street address. The
  shipping email carries the same review link. Still no `aggregateRating` JSON-LD.

- **Consent-based visitor id `kaya_vid` (phase 2, 2026-09-24)** — full description for the
  lawyer in `docs/legal/tracking-and-cookies.md`: **update that doc (register + changelog)
  and the privacy texts in the same commit as any change to cookies, tracked data or
  retention.** Cookie is set/cleared only server-side (`/api/analytics/visitor`, HttpOnly,
  13 months, never renewed — a JS-set cookie would die after 7 days on Safari). The ingest
  route and `createOrder` read it into `analytics_events.visitor_id` / `orders.visitor_id`
  (both fall back on PGRST204 so a missing migration never loses events or blocks a sale).
  `ConsentProvider` stores `{value, at}` and expires the choice after 12 months (as the
  policy says), creates/deletes the cookie on grant/deny, and on withdrawal clears
  `_ga*`/`_fbp`/`_fbc` and reloads; `openPreferences()` (footer "Cookie preferences")
  re-opens the banner without resetting consent, so Pixel/GA don't re-init.
  Retention runs in `purge_expired_visitor_ids()` (id after 13 months, events after 25),
  called whenever an admin opens analytics — no cron yet. Admin tab "Visitors & orders".

- **Never trust cart prices (fixed 2026-09-26).** The cart is zustand-in-localStorage,
  so every `CartItem` field is client-controlled. Until this date `createOrder` summed
  `cartItems[].price` and `createStripeCheckoutSession` built Stripe line items from
  the client cart — a €0.01 edit in devtools would have been charged €0.01 and marked
  paid. Now `priceCart` (`lib/orders/cart-pricing.ts`, plain module) re-prices every
  line from the DB (`price_override ?? base_price`, active variant+product, qty ≤
  stock) and supplies name/size/colour/SKU; on any mismatch `createOrder` returns
  `error: 'cart_changed'` + `cartUpdates`, the form calls `useCartStore.syncCart` and
  shows `checkout.cartChanged` (never charge a price the customer didn't see). The
  Stripe session reads `order_items` and refuses non-stripe/already-paid orders.
  Stock check-then-decrement is still not atomic (two buyers, last piece) — fine at
  current volume; move to an RPC with `stock_quantity >= qty` if it ever matters.
- **SEO metadata**: every indexable page builds its metadata with `pageMetadata()`
  (`lib/seo/page-metadata.ts`) — title, description, canonical/hreflang and a full OG
  block with its own `og:url`. Next *replaces* the layout's `openGraph` when a page
  sets one, and until 2026-09-26 every page inherited `og:url = homepage`. Product
  pages without copy get a templated description (`meta.product.*`, lists in-stock
  sizes); Product JSON-LD `brand` is the label from `brandFromProductName`, never the
  shop, plus `itemCondition`, `shippingDetails` and `hasMerchantReturnPolicy` mirroring
  `/terms`. PostgREST returns embedded variants unordered — `getProduct`/
  `getProductAdmin` sort by `sort_order` (the PDP used to show "S XL XXL L M").
- **Security headers** in `next.config.ts` (`X-Frame-Options`, `nosniff`,
  `Referrer-Policy`, `Permissions-Policy`); no CSP yet (Pixel/GA/Maps/Stripe would
  need allow-listing).
- **Email (set up 2026-09-26).** DNS is on Cloudflare. *Outbound*: Resend (EU region)
  sends from `orders@kayaoutlet.com` (`lib/email/config.ts`); its records live on the
  `send.` subdomain + `resend._domainkey` — never delete them. *Inbound*: Cloudflare
  Email Routing (root MX `route{1,2,3}.mx.cloudflare.net`) forwards `orders@` to the
  store's Gmail; the store replies as `orders@` from Gmail via Resend SMTP
  (`smtp.resend.com`, its own sending-only API key, separate from the site's).
  `OWNER_EMAIL` (Vercel, sensitive) = the store Gmail since 2026-09-26 — new-order and
  contact-form notifications. DMARC `p=none` via Cloudflare DMARC Management; move
  to `p=quarantine` once reports are clean (~late Oct 2026). Account logins for these
  services are deliberately not recorded in this public repo.
- **Seller identity** (impresa individuale, from the Registro Imprese extract) lives in
  `STORE_INFO.legalName/legalAddress/vatNumber/reaNumber/pec` and renders in the footer
  (art. 35 DPR 633/72 requires the P.IVA on the site), `/privacy`, `/terms` and the
  Organization JSON-LD (`vatID`). Never publish the owner's codice fiscale or home
  address — both are in the extract, neither is required. `/terms` (Condizioni
  generali di vendita, `terms.*` keys) is the Codice del Consumo disclosure: keep its
  withdrawal/returns text in sync with `trust.returnsBody`. Don't link the EU ODR
  platform — it was shut down in July 2025. Owner-confirmed 2026-09-26: customer pays
  return shipping; the site ships to **Italy only** (`shipping.countries`, checkout
  country is read-only and `createOrder` rejects anything else) — EU orders go via
  WhatsApp. Public contact email (`STORE_INFO.email`) is the store Gmail.
- **The `/store` Google Maps iframe is consent-gated** (`components/store/store-map.tsx`):
  it sets Google cookies, so it renders only when `useConsent()` is `granted` — it
  appears live the moment the banner is accepted, no reload — or after a one-off
  "show map" tap that does not change the site-wide choice. Never embed another
  third-party iframe (YouTube, Instagram…) without the same gate.

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
- Stripe card payments via hosted Checkout (`enableStripe: true`) — **live, takes real
  payments**; see the gotcha above before touching payment/webhook code
- New Arrivals curated list (admin-managed, carousel on homepage)
- Events module (admin CRUD, public listing page)
- Contact form → Supabase `contact_requests` table
- Resend email (order confirmation, new-order/contact notifications, shipping confirmation).
  The `/api/test-email` endpoint was deleted 2026-09-26 — test emails by placing and
  then deleting (`deleteOrder`) a bank-transfer order.
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
STRIPE_SECRET_KEY             # Stripe secret key (server-only; sk_live_ in Vercel prod,
                               # sk_test_ in .env.local)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY # Stripe publishable key (public; unused for now —
                               # hosted Checkout needs only the secret key server-side,
                               # kept for if Elements/Payment Element is ever added)
STRIPE_WEBHOOK_SECRET          # Signing secret for /api/webhooks/stripe — set in
                               # Vercel prod (live endpoint); local uses its own
GOOGLE_PLACES_API_KEY          # Google reviews on the homepage (server-only; restrict
                               # the key to Places API (New))
```

### Things the client must confirm (TODO_CONFIRM)

- Shipping rates / free shipping threshold (currently: free ≥ €150, standard €9.90, express €14.90)
- Tax rate (currently 22% VAT — confirm applies to all products)
- Facebook page URL (empty in config — owner checking the page is active). TikTok is
  set: `STORE_INFO.tiktok` → footer + Organization `sameAs`.
- Variant `MB-0033-UNIVERSAL` (Marcelo Burlon Cappello) has color `TODO_CONFIRM` —
  the only one left in the DB as of 2026-09-26; fix it from the admin.
- Brand logo assets in `/public/brands/` (ticker uses text fallback for now)
- Admin dashboard redirect target (`/admin/dashboard` vs `/admin`)
- `GOOGLE_PLACES_API_KEY` — Place ID is set (2026-09-26); the key is blocked on a
  Google Cloud billing sign-up error, so homepage review texts stay hidden until then

### Open items

- **Photos (updated 2026-09-26):** most products are photographed; products still
  without a photo are hidden via the `hide_products_without_images` toggle.
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
- **`MB` added to the `DISCOUNTS` map at 50%** (2026-09-22) — was one of the brands
  deliberately left untouched in the 2026-09-19 run above. **Applied to the DB** (owner confirmed
  2026-09-24 — MB prices on the site are discounted). Do not re-run it for MB.
  `DISCOUNTS` now keeps every brand ever processed (a historical record), so a bare
  `--apply` reprocesses all of them, not just the newest addition — added an optional
  `--brand=MB` (comma-separated) filter to scope a run to specific brands without
  touching ones already applied in an earlier run.
