# KAYA Studio Outlet — `kayaoutlet.com`

Magazin online pentru KAYA Studio Outlet, un outlet de modă premium din Borgo Podgora (Latina), Italia. Site-ul combină catalog de produse cu variante, coș de cumpărături, checkout prin WhatsApp/transfer bancar, panou de administrare și un modul de evenimente.

---

## Stack

- **Next.js 16** App Router · React 19 · TypeScript
- **Tailwind CSS v4** — tokeni de design în `globals.css @theme inline`
- **shadcn/ui** (base-nova) · lucide-react
- **Supabase** — auth (admin), DB (produse, comenzi, evenimente), storage (imagini)
- **Resend** — email tranzacțional (confirmare comandă)
- **next-intl** — bilingv IT (implicit) + EN
- **Zustand** — state coș de cumpărături
- **Vercel** — hosting, push-to-deploy pe `main`

---

## Setup local

### Variabile de mediu

```bash
cp .env.local.example .env.local  # dacă există; altfel creează manual
```

Completează în `.env.local`:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
```

### Pornire

```bash
npm install
npm run dev        # http://localhost:3000
npm run email:dev  # preview template-uri email (port 3001)
```

> **Schema DB:** aplică fișierele din `supabase/migrations/` în ordine. Nu folosi `supabase/schema.sql` — acela e schema generică de template, neaplicabilă acestui proiect.

---

## Structura principală

```
app/
  [locale]/              # Toate rutele publice (IT/EN via next-intl)
    page.tsx             # Homepage: hero, categorii, new arrivals, brands
    products/            # Listing produse
    product/[slug]/      # Pagina produs + variante + add to cart
    category/[slug]/     # Produse filtrate pe categorie
    new-arrivals/        # Pagina New Arrivals
    cart/                # Coș de cumpărături
    checkout/            # Formular checkout + confirmare
    events/              # Listing evenimente
    contact/             # Formular contact
    store/               # Pagina magazin fizic cu hartă
    privacy/ · terms/    # Pagini legale

  admin/                 # Panou administrare (autentificat via Supabase)
    page.tsx             # Dashboard cu statistici
    products/            # CRUD produse + variante + upload imagini
    categories/          # CRUD categorii
    orders/              # Vizualizare + gestionare comenzi
    new-arrivals/        # Curatare listă New Arrivals
    events/              # CRUD evenimente
    contacts/            # Formulare contact primite

  api/
    test-email/          # Endpoint test trimitere email (dev only)

components/
  layout/                # Header, footer, nav mobil, ticker, announcement bar
  product/               # ProductCard, ProductGrid, VariantSelector, Gallery
  cart/                  # CartDrawer, CartItem, CartSummary
  checkout/              # CheckoutForm, OrderSummary
  admin/                 # AdminShell, ProductForm, VariantManager, ImageUploader

lib/
  config.ts              # ← configurare principală (brand, checkout, features)
  store-info.ts          # Date contact și program magazin fizic
  brands.ts              # Lista branduri pentru ticker

supabase/
  migrations/            # Schema reală a proiectului (aplică în ordine)
  schema.sql             # ⚠ Schema template generică — NU aplica în producție
```

---

## Configurare brand

Editează `lib/config.ts` pentru:
- URL site, monedă, accent color
- Praguri livrare gratuită și costuri transport
- Activare/dezactivare metode de checkout
- Sluguri categorii afișate pe homepage
- Categorii cu mărimi de încălțăminte vs îmbrăcăminte

---

## Deploy

Push pe `main` → Vercel face deploy automat.

Asigură-te că variabilele de mediu sunt setate în **Vercel → Settings → Environment Variables**, inclusiv `NEXT_PUBLIC_SITE_URL=https://kayaoutlet.com`.

---

## Admin

Accesează `/admin/login` cu contul Supabase configurat. Autentificarea este gestionată de `proxy.ts` (echivalentul `middleware.ts` în Next.js 16).

Funcționalități admin:
- Adaugă/editează/șterge produse cu variante și imagini multiple
- Gestionează categorii și ordinea lor
- Procesează comenzi primite prin WhatsApp/transfer bancar
- Curatează lista New Arrivals (poziție manuală)
- Publică/ascunde evenimente
- Vizualizează formularele de contact
