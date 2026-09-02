# Integrare cu platforma de facturare (Italia) — analiză

**Data:** 2026-09-02 · **Branch:** `claude/facturare-italia-analysis-9jc39o`
**Scop:** stabilirea a ce avem azi în cod/DB, ce lipsește pentru fattura elettronica
(SDI) și cum expunem comenzile către platforma de facturare a clientului.

**Acest document nu conține cod implementat. Este doar analiză.**

---

## 0. Discrepanțe găsite înainte de orice altceva

Conform regulii „stop and report discrepancies", raportez întâi lucrurile care nu
corespund cu ce scrie în `CLAUDE.md` sau cu ce s-ar aștepta cineva:

1. **`CLAUDE.md` spune că `supabase/schema.sql` e schema veche de template
   (items/reservations) și că nu trebuie aplicată. Fișierul `supabase/schema.sql`
   nu există.** Există `schema.sql` în rădăcina repo-ului, și el **este** schema
   reală de e-commerce (products/orders/order_items/…). Mai mult, începe cu
   `DROP TABLE IF EXISTS reservations / items / site_settings CASCADE` — deci e
   scris exact ca înlocuitor al schemei de template. Nota din `CLAUDE.md` e
   învechită și induce în eroare.

2. **`orders` și `order_items` nu apar în nicio migrație din `supabase/migrations/`.**
   Singura lor definiție în repo e `schema.sql`. Nu există niciun mecanism prin
   care să verific că producția chiar corespunde cu acel fișier.

3. **Nu pot verifica DB-ul live.** Nu există `.env.local` în container și
   `CLAUDE.md` confirmă că variabilele Supabase nu sunt disponibile local. Deci
   tot ce urmează la punctul 1 este **schema din repo (`schema.sql`)**, nu un dump
   din Postgres. Înainte de a scrie migrația de facturare, trebuie făcut un
   `\d orders` real pe proiectul Supabase, ca să confirmăm că nu s-a driftat.

4. **Nu există niciun webhook de plată, nicio integrare Stripe activă, niciun
   `/api` în afară de `app/api/test-email/route.ts`.** Statusul comenzii se
   schimbă exclusiv manual, din admin.

---

## 1. Schema actuală, exact cum e în cod

Sursa: `schema.sql` (rădăcina repo-ului). Tipurile TypeScript corespondente:
`lib/types.ts`.

### 1.1 Ce **nu** există

Ca să nu presupună nimeni structuri care nu sunt acolo:

- **Nu există tabel `customers` / `clienti`.** Nu există conturi de client. Auth
  Supabase e folosit exclusiv pentru admin (`proxy.ts:11-49`). Datele
  cumpărătorului sunt copiate denormalizat pe fiecare rând din `orders`.
- **Nu există tabel `addresses`.** Adresele sunt coloane plate pe `orders`
  (`shipping_*`, `billing_*`).
- **Nu există tabel `payments` / `transactions`.** Există doar 3 coloane pe
  `orders`: `payment_method`, `payment_status`, `payment_intent_id` (ultima e
  moștenită din template pentru Stripe și nu e scrisă nicăieri în cod).
- **Nu există tabel `shipments`.** Doar `tracking_number` + `tracking_url` pe
  `orders`.
- **Nu există tabel `invoices` / `fatture`, nici vreo coloană de export.**
- **Nu există enum-uri Postgres.** Statusurile sunt `TEXT` + `CHECK`. Enum-urile
  există doar în TypeScript (`lib/types.ts:60-75`).

### 1.2 `orders` (`schema.sql:95-128`)

| Coloană | Tip | Constrângeri | Observații |
|---|---|---|---|
| `id` | `UUID` | PK, `DEFAULT gen_random_uuid()` | |
| `order_number` | `TEXT` | `NOT NULL`, `UNIQUE` | generat de trigger, vezi 1.5 |
| `status` | `TEXT` | `NOT NULL DEFAULT 'pending'`, `CHECK IN (...)` | 8 valori, vezi 1.6 |
| `customer_email` | `TEXT` | `NOT NULL` | |
| `customer_name` | `TEXT` | `NOT NULL` | un singur câmp, nume+prenume la un loc |
| `customer_phone` | `TEXT` | NULL | |
| `shipping_address_line1` | `TEXT` | `NOT NULL` | |
| `shipping_address_line2` | `TEXT` | NULL | |
| `shipping_city` | `TEXT` | `NOT NULL` | |
| `shipping_state` | `TEXT` | NULL | „provincia", text liber, fără validare |
| `shipping_postal_code` | `TEXT` | `NOT NULL` | |
| `shipping_country` | `TEXT` | `NOT NULL DEFAULT 'IT'` | text liber, nu ISO-validat |
| `billing_same_as_shipping` | `BOOLEAN` | `NOT NULL DEFAULT true` | |
| `billing_address_line1` | `TEXT` | NULL | |
| `billing_address_line2` | `TEXT` | NULL | |
| `billing_city` | `TEXT` | NULL | |
| `billing_state` | `TEXT` | NULL | |
| `billing_postal_code` | `TEXT` | NULL | |
| `billing_country` | `TEXT` | NULL | |
| `subtotal` | `DECIMAL(10,2)` | `NOT NULL` | |
| `shipping_cost` | `DECIMAL(10,2)` | `NOT NULL DEFAULT 0` | |
| `tax_amount` | `DECIMAL(10,2)` | `NOT NULL DEFAULT 0` | **calculat greșit, vezi 2.4** |
| `discount_amount` | `DECIMAL(10,2)` | `NOT NULL DEFAULT 0` | scris mereu `0` |
| `total` | `DECIMAL(10,2)` | `NOT NULL` | `= subtotal + shipping_cost` |
| `currency` | `TEXT` | `NOT NULL DEFAULT 'EUR'` | |
| `payment_method` | `TEXT` | `DEFAULT 'pending'` | **fără CHECK** — orice string trece |
| `payment_status` | `TEXT` | `NOT NULL DEFAULT 'unpaid'`, `CHECK IN ('unpaid','paid','refunded','failed')` | |
| `payment_intent_id` | `TEXT` | NULL | mort — nu e scris nicăieri |
| `tracking_number` | `TEXT` | NULL | |
| `tracking_url` | `TEXT` | NULL | |
| `notes` | `TEXT` | NULL | note interne admin |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` | menținut de trigger |

Indexuri (`schema.sql:130-133`): `idx_orders_number(order_number)`,
`idx_orders_status(status)`, `idx_orders_email(customer_email)`,
`idx_orders_created(created_at DESC)`.

> Nu există index pe `updated_at`. Contează pentru paginarea incrementală
> propusă la punctul 6.

### 1.3 `order_items` (`schema.sql:139-152`)

| Coloană | Tip | Constrângeri |
|---|---|---|
| `id` | `UUID` | PK, `DEFAULT gen_random_uuid()` |
| `order_id` | `UUID` | `NOT NULL REFERENCES orders(id) ON DELETE CASCADE` |
| `product_id` | `UUID` | `NOT NULL REFERENCES products(id)` (fără ON DELETE → RESTRICT) |
| `variant_id` | `UUID` | `NOT NULL REFERENCES product_variants(id)` (idem) |
| `product_name` | `TEXT` | `NOT NULL` — snapshot la momentul comenzii |
| `variant_size` | `TEXT` | `NOT NULL` |
| `variant_color` | `TEXT` | `NOT NULL` |
| `sku` | `TEXT` | NULL — **scris mereu `null`**, vezi 2.3 |
| `quantity` | `INTEGER` | `NOT NULL DEFAULT 1` (fără CHECK > 0) |
| `unit_price` | `DECIMAL(10,2)` | `NOT NULL` |
| `total_price` | `DECIMAL(10,2)` | `NOT NULL` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT now()` |

Index: `idx_order_items_order(order_id)`.

Nu există pe linie: cotă TVA, natura IVA, discount pe linie, unitate de măsură.

### 1.4 Tabele conexe relevante pentru facturare

`products` (`schema.sql:29-51`) — relevante: `name`, `slug`, `base_price`,
`compare_at_price`, `currency`, `category_id`, `sku_prefix`. **Nu are cotă TVA,
nu are cod produs pentru facturare, nu are cod vamale/HS.**

`product_variants` (`schema.sql:57-73`) — are `sku TEXT` (unic global, derivat la
import din SKU produs + mărime, vezi `CLAUDE.md`), `size`, `color_name`,
`color_hex`, `price_override`, `stock_quantity`.

> `product_variants.sku` este singurul identificator „de business" per articol și
> **nu ajunge azi în `order_items.sku`.** Vezi 2.3.

### 1.5 Triggere / funcții

```sql
-- schema.sql:184-196
CREATE FUNCTION generate_order_number() ...
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(),'YYYYMMDD') || '-' ||
                      UPPER(SUBSTRING(NEW.id::TEXT, 1, 4));
CREATE TRIGGER set_order_number BEFORE INSERT ON orders ...

-- schema.sql:201-215
CREATE FUNCTION update_updated_at() ... NEW.updated_at = now();
CREATE TRIGGER products_updated_at BEFORE UPDATE ON products ...
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders ...
```

**Problemă:** `order_number` are doar 4 caractere hex din UUID per zi → 65 536 de
valori. Coliziune → violare de `UNIQUE` → insert eșuat, comandă pierdută, fără
retry. Improbabil la volumul actual, dar e o bombă cu ceas și `order_number`
urmează să devină cheia de corelare cu platforma de facturare. Recomand
înlocuirea cu o secvență (`ORD-2026-000123`), care e și mai apropiată de logica
de numerotare a facturilor.

### 1.6 Statusuri

`orders.status` (CHECK în DB, `OrderStatus` în `lib/types.ts:60-69`):
`pending` · `confirmed` · `paid` · `processing` · `shipped` · `delivered` ·
`cancelled` · `refunded`.

`orders.payment_status` (CHECK în DB, `PaymentStatus` în `lib/types.ts:71`):
`unpaid` · `paid` · `refunded` · `failed`.

`payment_method` — **fără CHECK în DB.** În TS: `'stripe' | 'whatsapp' |
'bank_transfer' | 'pending'` (`lib/types.ts:72`). În practică se scriu doar
`whatsapp` și `bank_transfer` (Stripe e dezactivat, `lib/config.ts:79`).

Nu există istoric de tranziții de status. `updated_at` e singura urmă și e
suprascris de orice update (inclusiv salvarea de tracking sau de note).

### 1.7 RLS

```sql
-- schema.sql:239-241
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orders admin access" ON orders FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items admin access" ON order_items FOR ALL USING (auth.role() = 'authenticated');
```

Consecințe pentru integrare:

- RLS e **on**, cu o singură policy: orice utilizator autentificat Supabase are
  acces total (`FOR ALL`) la toate comenzile. Nu există separare per client.
- **Nu există policy de INSERT pentru anon.** Comenzile se scriu exclusiv prin
  `createSupabaseAdminClient()` (service role, `lib/supabase.ts:12-18`), care
  ocolește RLS. Deci cheia anon nu poate crea comenzi — corect.
- Nu există niciun rol dedicat integrării. Dacă platforma de facturare ar primi
  o cheie Supabase, ar trebui să fie service role (acces total la tot proiectul)
  sau un utilizator auth (acces total la comenzi + tot restul). **Ambele sunt
  prea largi** — argument principal pentru endpoint propriu la punctul 6.

### 1.8 Migrațiile Supabase relevante

**Niciuna.** Enumerate integral, migrațiile existente sunt:

| Fișier | Conținut | Relevant pt. facturare |
|---|---|---|
| `20260621000000_new_arrivals.sql` | tabel `new_arrivals` | nu |
| `20260621000001_events.sql` | tabel `events` | nu |
| `20260621000002_deactivate_new_arrivals_category.sql` | data fix | nu |
| `20260628000000_products_indexes.sql` | indexuri `products` | nu |
| `20260628000001_category_slugs_en.sql` | slug-uri categorii | nu |
| `20260727000000_category_show_on_landing.sql` | `categories.show_on_landing` | nu |
| `20260818000000_site_settings.sql` | tabel `site_settings` (k/v) | indirect (flag-uri admin) |
| `20260818000001_category_image.sql` | `categories.image_url` | nu |
| `20260818000002_category_image_list.sql` | `categories.image_urls` | nu |

`orders` / `order_items` **nu au migrație**. Toată munca de facturare va fi prima
migrație care le atinge, deci primul pas obligatoriu este un
`supabase/migrations/<ts>_orders_baseline.sql` care reflectă starea reală din
producție, ca să nu construim peste o presupunere.

---

## 2. Fluxul complet al unei comenzi în cod

### 2.1 Traseul

```
PDP  components/product/add-to-cart-button.tsx
      → useCartStore.addItem()            lib/store/cart.ts  (zustand persist, localStorage)
/cart app/[locale]/cart/page.tsx → components/cart/cart-page-client.tsx
/checkout app/[locale]/checkout/page.tsx  (Server Component: AnnouncementBar/Header/Footer)
      → components/checkout/checkout-page-client.tsx  ('use client', citește coșul)
      → components/checkout/checkout-form.tsx         ('use client', formularul)
          submit → createOrder(formData, cartItems)   lib/actions/orders.ts:73
                     ├─ INSERT orders          (status 'pending', payment_status 'unpaid')
                     ├─ INSERT order_items[]
                     ├─ UPDATE product_variants.stock_quantity  (loop, per variantă)
                     └─ Resend: sendOrderConfirmation + sendNewOrderNotification
          ├─ dacă payment_method = 'whatsapp'  → window.open(wa.me/...) + redirect
          └─ altfel (bank_transfer)            → redirect
      → /checkout/success?order=ORD-...   app/[locale]/checkout/success/page.tsx
```

Tot ce urmează după inserare e **manual**, din admin:

```
/admin/orders            app/admin/orders/page.tsx        (listă)
/admin/orders/[id]       app/admin/orders/[id]/page.tsx   (detaliu)
   handleStatusUpdate   → updateOrderStatus(id, status)     lib/actions/orders.ts:45
   handleTrackingUpdate → updateOrderTracking(id, nr, url)   lib/actions/orders.ts:54
   handleNotesUpdate    → updateOrderNotes(id, notes)        lib/actions/orders.ts:66
```

### 2.2 Funcțiile, una câte una

Toate în `lib/actions/orders.ts` (`'use server'`):

| Funcție | Linie | Ce face |
|---|---|---|
| `createOrder(formData, cartItems)` | 73 | calculează totaluri, inserează `orders` + `order_items`, decrementează stocul, trimite 2 emailuri, `revalidatePath('/admin/orders')` |
| `getOrdersAdmin({status, search, limit})` | 10 | listă cu `*, items:order_items(*)`, sortare `created_at DESC` |
| `getOrderAdmin(id)` | 33 | o comandă + liniile ei |
| `updateOrderStatus(id, status)` | 45 | `UPDATE orders SET status` — **fără validare, fără istoric** |
| `updateOrderTracking(id, nr, url)` | 54 | `UPDATE orders SET tracking_number, tracking_url` |
| `updateOrderNotes(id, notes)` | 66 | `UPDATE orders SET notes` |
| `getDashboardStats()` | 182 | agregări pentru dashboard |

Email: `lib/email/send.ts` — `sendOrderConfirmation()` (către client) și
`sendNewOrderNotification()` (către `OWNER_NOTIFICATION_EMAIL`, `lib/email/config.ts`).
Template-uri: `emails/order-confirmation.tsx`, `emails/new-order-notification.tsx`.
Sunt trimise cu `Promise.allSettled` — eșecul nu blochează comanda, dar **nici nu
e înregistrat nicăieri în DB**.

### 2.3 La ce evenimente se schimbă statusul

**La niciunul automat.**

- Nu există webhook Stripe. Nu există `app/api/webhooks/*`. Singurul route
  handler din proiect e `app/api/test-email/route.ts`.
- `enableStripe: false` (`lib/config.ts:79`). `payment_intent_id` rămâne mereu
  `NULL`.
- Plata prin bonifico nu are confirmare automată — nu există integrare bancară.
- Comanda se naște `status='pending'`, `payment_status='unpaid'` și rămâne acolo
  până când proprietara schimbă manual din `/admin/orders/[id]`.

**Consecință directă pentru facturare:** nu avem azi niciun eveniment de încredere
„plata a intrat" pe care platforma de facturare să se declanșeze. Momentul de
emitere a facturii va trebui legat de o tranziție manuală de status
(`payment_status → 'paid'`, sau `status → 'confirmed'`) — și acea tranziție
trebuie să devină un eveniment înregistrat, nu doar un `UPDATE` care suprascrie
`updated_at`.

### 2.4 Bug-uri și găuri găsite pe flux (relevante pentru facturare)

1. **`tax_amount` e calculat greșit** (`lib/actions/orders.ts:85`):
   ```ts
   const taxAmount = subtotal * SITE_CONFIG.checkout.taxRate  // subtotal * 0.22
   const total = subtotal + shippingCost                      // tax NU intră în total
   ```
   Prețurile afișate sunt IVA inclusa — `components/checkout/order-summary.tsx:60`
   afișează chiar `t('taxesIncluded')`. Deci TVA-ul corect *scorporato* ar fi
   `subtotal - subtotal/1.22 = subtotal * 0.1803...`, nu `subtotal * 0.22`.
   Valoarea scrisă azi în `orders.tax_amount` este **cu ~22% mai mare decât TVA-ul
   real** și nu corespunde cu `total`. Trebuie corectată înainte de orice export,
   altfel trimitem cifre false către facturare.

2. **`shipping_cost` nu are TVA declarată separat.** Transportul e la 22% în
   Italia (accesoriu la vânzarea principală), dar în DB e o simplă sumă fără cotă.

3. **`order_items.sku` e scris hardcodat `null`** (`lib/actions/orders.ts:135`),
   deși `product_variants.sku` există și e unic. Coșul (`CartItem`, `lib/store/cart.ts:6-17`)
   nici nu transportă SKU-ul. Fără el, liniile de factură nu au cod articol.

4. **Fără idempotency la checkout.** `createOrder` e apelat direct din client
   (`checkout-form.tsx:60` și `:78`). Dublu-click / retry de rețea → două comenzi
   și **stoc decrementat de două ori**. Decrementarea e un read-then-write în
   buclă (`lib/actions/orders.ts:143-155`), fără tranzacție și fără lock → race
   condition la comenzi simultane.

5. **Zero validare pe server.** `createOrder` acceptă `formData` așa cum vine de
   la client. Nu există schemă de validare (nu e nici `zod` în `package.json`).
   Un client poate trimite `email: "x"`, `postal_code: ""`, sau **prețuri**: nu,
   prețurile sunt luate din `cartItems`, care vin tot de la client
   (`item.price`, linia 84 și 139) → **prețul comenzii e controlat de browser**.
   Pentru facturare asta e inacceptabil: prețul trebuie recitit din DB pe server.

6. **Formularul de checkout are textele hardcodate în engleză**
   (`checkout-form.tsx` — „Shipping Address", „Full Name *", „Place Order"),
   contrar regulii 4 din `CLAUDE.md`. Cheile `checkout.*` din `messages/it.json`
   există parțial dar nu sunt folosite în formular. Orice câmp nou (CF, P.IVA,
   SDI) trebuie adăugat prin next-intl, iar cele existente migrate în aceeași
   trecere.

7. **Câmpurile `billing_state` și `billing_address_line2` nu sunt randate**
   în blocul de facturare (`checkout-form.tsx:145-170`), dar sunt citite cu
   `get('billing_state')` (`checkout-form.tsx:52`) → ajung mereu `''` în DB.
   Provincia de facturare e obligatorie pentru SDI. Vezi punctul 5.

---

## 3. Ce colectăm efectiv în checkout, câmp cu câmp

Sursa: `components/checkout/checkout-form.tsx` (randare + `handleSubmit`),
tipul `CheckoutFormData` (`lib/types.ts:150-168`).

| Câmp form (`name=`) | Etichetă UI | Obligatoriu în UI | `NOT NULL` în DB | Validare | Observații |
|---|---|---|---|---|---|
| `email` | Email * | **da** (`required`) | da (`customer_email`) | doar `type="email"` (browser) | fără validare server |
| `phone` | Phone | nu | nu | `type="tel"`, niciuna | |
| `name` | Full Name * | **da** | da (`customer_name`) | niciuna | nume+prenume într-un singur string |
| `address_line1` | Address * | **da** | da | niciuna | |
| `address_line2` | Apartment, suite, etc. | nu | nu | niciuna | |
| `city` | City * | **da** | da | niciuna | |
| `postal_code` | Postal Code * | **da** | da | niciuna | CAP-ul italian nu e validat (5 cifre) |
| `state` | Province | **nu** | nu | niciuna | text liber; placeholder „MI" |
| `country` | Country | **nu** | da (`shipping_country`) | niciuna | `defaultValue="IT"`, fallback `'IT'` în cod |
| `billing_same_as_shipping` | Billing same as shipping | — | da | — | checkbox, **default bifat** |
| `billing_address_line1` | Billing Address * | da, doar dacă e debifat | nu | niciuna | |
| `billing_city` | City * | da, doar dacă e debifat | nu | niciuna | |
| `billing_postal_code` | Postal Code * | da, doar dacă e debifat | nu | niciuna | |
| `billing_country` | Country | nu | nu | niciuna | `defaultValue="IT"` |
| `billing_address_line2` | — | — | nu | — | **nu e randat**, mereu `''` |
| `billing_state` | — | — | nu | — | **nu e randat**, mereu `''` |
| `payment` (radio) | Order via WhatsApp / Bank Transfer | — | nu (`payment_method`) | — | default `whatsapp` |

**Ce NU colectăm deloc:** codice fiscale, partita IVA, codice destinatario SDI,
PEC, denumire societate, provincia ca siglă validată, tip client (persoană fizică
vs firmă), consimțământ pentru factură.

Notă: când `billing_same_as_shipping` e bifat (cazul implicit), câmpurile
`billing_*` sunt copiate din shipping în client (`checkout-form.tsx:48-53`), dar
`createOrder` le scrie **`null`** în DB (`lib/actions/orders.ts:98-104`) și se
bazează pe flag. Consumatorul API-ului va trebui să facă el fallback-ul — sau,
mai bine, îl facem noi în răspuns (vezi 6.4).

---

## 4. Exemplu de JSON al unei comenzi complete, așa cum arată datele **azi**

Structură reală (`orders` + `order_items` embed, exact ce întoarce
`getOrderAdmin`), date fictive. Am marcat cu comentarii ce e problematic.

```json
{
  "id": "3f8a1c2e-9b44-4d17-8e5a-2c7f0d1b6e93",
  "order_number": "ORD-20260902-3F8A",
  "status": "pending",
  "customer_email": "giulia.rossi@example.it",
  "customer_name": "Giulia Rossi",
  "customer_phone": "+39 340 1122334",

  "shipping_address_line1": "Via Giuseppe Verdi 14",
  "shipping_address_line2": "Interno 3B",
  "shipping_city": "Latina",
  "shipping_state": "LT",
  "shipping_postal_code": "04100",
  "shipping_country": "IT",

  "billing_same_as_shipping": true,
  "billing_address_line1": null,
  "billing_address_line2": null,
  "billing_city": null,
  "billing_state": null,
  "billing_postal_code": null,
  "billing_country": null,

  "subtotal": "268.00",
  "shipping_cost": "0.00",
  "tax_amount": "58.96",
  "discount_amount": "0.00",
  "total": "268.00",
  "currency": "EUR",

  "payment_method": "bank_transfer",
  "payment_status": "unpaid",
  "payment_intent_id": null,

  "tracking_number": null,
  "tracking_url": null,
  "notes": null,

  "created_at": "2026-09-02T10:14:27.882Z",
  "updated_at": "2026-09-02T10:14:27.882Z",

  "items": [
    {
      "id": "b21d7f40-5a3c-4e88-91f2-77d0a4c1e005",
      "order_id": "3f8a1c2e-9b44-4d17-8e5a-2c7f0d1b6e93",
      "product_id": "c9e14a77-2b31-4f6d-a0c8-8e5b31d90f42",
      "variant_id": "7d4b0e19-6c22-4a3f-b8d1-1f9c4e7a2b50",
      "product_name": "Barrow T-shirt con logo Nera",
      "variant_size": "L",
      "variant_color": "Nero",
      "sku": null,
      "quantity": 1,
      "unit_price": "89.00",
      "total_price": "89.00",
      "created_at": "2026-09-02T10:14:27.882Z"
    },
    {
      "id": "e0c3a5b8-1d47-4b90-83aa-4c6e2f81d773",
      "order_id": "3f8a1c2e-9b44-4d17-8e5a-2c7f0d1b6e93",
      "product_id": "45a2c810-7e63-4d29-9f11-b3d78e4a0c66",
      "variant_id": "9b8f2d31-4a05-47c6-8e72-0d5a1c93f8b4",
      "product_name": "New Balance 9060 Sneakers Grigie",
      "variant_size": "42",
      "variant_color": "Grigio",
      "sku": null,
      "quantity": 1,
      "unit_price": "179.00",
      "total_price": "179.00",
      "created_at": "2026-09-02T10:14:27.882Z"
    }
  ]
}
```

Citit ca input de facturare, JSON-ul de mai sus e **inutilizabil ca atare**:

- `tax_amount: 58.96` = `268.00 × 0.22`, dar `total` e tot `268.00` → cifrele nu
  se închid. TVA-ul real inclus în 268,00 € este 48,33 €, imponibile 219,67 €.
- `sku: null` pe ambele linii → nu există cod articol.
- Fără cotă TVA per linie.
- Fără CF / P.IVA / codice destinatario → SDI respinge documentul.
- `billing_*` toate `null`, cu flag `true` → consumatorul trebuie să știe regula.
- `shipping_state: "LT"` e corect aici, dar e noroc: câmpul e text liber.

---

## 5. GAP ANALYSIS — fattura elettronica / SDI

### 5.1 Context minim (o dată, nu îl repet)

SDI (Sistema di Interscambio) e nodul Agenziei delle Entrate prin care trec
obligatoriu facturile electronice în Italia. Formatul e `FatturaPA` (XML). Fiecare
factură are nevoie de: identificarea univocă a cedente/prestatore (noi) și a
cessionario/committente (clientul), un canal de livrare pentru destinatar
(`CodiceDestinatario` de 7 caractere sau adresă PEC), linii cu imponibile +
aliquota IVA, și un rezumat TVA (`DatiRiepilogo`) per cotă.

Limita relevantă: **noi nu emitem factura**. Platforma clientului o emite. Rolul
nostru se oprește la a-i livra un set de date complet și corect. Dar dacă ne
lipsește un câmp obligatoriu, factura e respinsă de SDI — deci gap-ul e al
nostru.

Notă de business, nu tehnică: pentru vânzări online B2C, comerciantul italian
poate în multe cazuri să certifice prin *corrispettivi telematici* în loc de
factură, emițând factură doar la cerere. **Cine decide asta e contabilul
clientului, nu noi.** Însă cei doi consumatori de date sunt diferiți, așa că
prima întrebare pentru client e mai jos, la finalul secțiunii.

### 5.2 Tabel de gap-uri

Legendă: „Coloană DB" = ce adăugăm în `orders` / `order_items` prin migrație nouă.

#### A. Identificare fiscală client

| Câmp SDI | Avem? | Coloană DB de adăugat | Câmp în checkout | Validare |
|---|---|---|---|---|
| Tip client (privat / firmă / PA) | **nu** | `orders.customer_type TEXT NOT NULL DEFAULT 'private' CHECK (customer_type IN ('private','business','pa'))` | radio/toggle „Persona fisica / Azienda", sus de tot în secțiunea de facturare — comută restul câmpurilor | obligatoriu; determină ce e required mai jos |
| `CodiceFiscale` (persoană fizică) | **nu** | `orders.customer_tax_code TEXT` | input „Codice Fiscale", required când `customer_type='private'` | 16 caractere alfanumerice, pattern `^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$`, + verificarea cifrei de control (CIN); uppercase la normalizare |
| `IdFiscaleIVA.IdCodice` (partita IVA) | **nu** | `orders.customer_vat_number TEXT` | input „Partita IVA", required când `customer_type='business'` | 11 cifre pentru IT + checksum Luhn-italian; pentru non-IT, format VIES (opțional validare VIES) |
| `IdFiscaleIVA.IdPaese` | **nu** (deducem din `billing_country`) | `orders.customer_vat_country TEXT DEFAULT 'IT'` | derivat din țara de facturare | ISO 3166-1 alpha-2 |
| `Denominazione` (ragione sociale) | **nu** — avem doar `customer_name` | `orders.customer_company_name TEXT` | input „Ragione sociale", required când `customer_type='business'` | non-empty, max 80 |
| `Nome` / `Cognome` separate | **nu** — `customer_name` e un singur câmp | `orders.customer_first_name TEXT`, `orders.customer_last_name TEXT` | două inputuri în loc de „Full Name" | ambele required când `customer_type='private'`, max 60 fiecare |

> Despre `customer_name`: FatturaPA cere `Nome` și `Cognome` **separat** pentru
> persoane fizice. Splitarea unui string liber la primul spațiu e greșită
> („Maria Grazia De Luca"). Trebuie două câmpuri în formular. `customer_name`
> rămâne, populat prin concatenare, ca să nu spargem admin-ul și emailurile.

#### B. Canal de livrare a facturii

| Câmp SDI | Avem? | Coloană DB | Câmp în checkout | Validare |
|---|---|---|---|---|
| `CodiceDestinatario` | **nu** | `orders.sdi_recipient_code TEXT` | input „Codice Destinatario SDI", opțional | exact 7 caractere alfanumerice pentru B2B; `0000000` pentru B2C sau când clientul dă doar PEC; `XXXXXXX` pentru client extra-UE |
| `PECDestinatario` | **nu** | `orders.sdi_pec_email TEXT` | input „PEC", opțional | format email; obligatoriu dacă `customer_type='business'` **și** `sdi_recipient_code` e gol sau `0000000` |

Regula de validare încrucișată (una singură, dar contează): pentru
`customer_type='business'` trebuie **cel puțin unul** din `sdi_recipient_code`
(≠ `0000000`) sau `sdi_pec_email`. Pentru `private`, ambele pot lipsi și se
completează `0000000` la export.

#### C. Adresa de facturare

| Câmp SDI | Avem? | Ce lipsește | Fix |
|---|---|---|---|
| `Sede.Indirizzo` | da (`billing_address_line1`) | e `NULL` când billing = shipping | fallback la export (vezi 6.4), nu schimbare de schemă |
| `Sede.CAP` | da (`billing_postal_code`) | fără validare | `CHECK`/validare `^\d{5}$` pentru `IT` |
| `Sede.Comune` | da (`billing_city`) | — | non-empty |
| `Sede.Provincia` | **parțial** — coloana `billing_state` există, dar **inputul nu e randat** în formular (`checkout-form.tsx:145-170`) și e mereu `''` | **da** | adaugă inputul lipsă; validare: exact 2 litere majuscule, dintr-o listă închisă a celor 106 provincii; ideal `<select>`, nu text liber. Același fix și pentru `shipping_state` (azi text liber). |
| `Sede.Nazione` | da (`billing_country`) | text liber | `CHECK (billing_country ~ '^[A-Z]{2}$')` + `<select>` de țări |

> `Provincia` e obligatorie în FatturaPA doar pentru `Nazione = IT`, dar e cea mai
> frecventă cauză de respingere. Trebuie tratată ca required pentru IT.

#### D. TVA și sume

| Câmp SDI | Avem? | Coloană DB | Fix |
|---|---|---|---|
| `AliquotaIVA` pe linie | **nu** | `order_items.vat_rate NUMERIC(5,2) NOT NULL DEFAULT 22.00` | copiată la inserare dintr-o nouă `products.vat_rate NUMERIC(5,2) NOT NULL DEFAULT 22.00` (snapshot, ca `unit_price`) |
| `Natura` (când `AliquotaIVA = 0`) | **nu** | `order_items.vat_nature TEXT` (`N1`…`N7`) | necesar doar dacă apar vânzări scutite / non-UE; `NULL` altfel |
| `PrezzoUnitario` fără TVA | **nu** — `unit_price` e IVA inclusa | `order_items.unit_price_net NUMERIC(10,2)` **sau** calcul la export | recomand **calcul la export**, o singură sursă de adevăr (prețul brut). Vezi 5.3. |
| `ImponibileImporto` / `Imposta` per cotă | **nu** | — | agregare la export din liniile cu aceeași `vat_rate` |
| `orders.tax_amount` corect | **nu — greșit azi** | (coloana există) | `lib/actions/orders.ts:85` trebuie schimbat în TVA *scorporato*; vezi 2.4 |
| TVA pe transport | **nu** | `orders.shipping_vat_rate NUMERIC(5,2) NOT NULL DEFAULT 22.00` | transportul devine linie proprie de factură la export |
| `ScontoMaggiorazione` pe linie | **nu** | `order_items.discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0` | azi `discount_amount` e doar la nivel de comandă și mereu `0`. Reducerile de outlet sunt deja aplicate în `base_price` la import (vezi `CLAUDE.md`), deci pe factură nu apar — dar coloana e ieftină și evită o migrație viitoare |
| `Divisa` | da (`currency`) | — | mereu `EUR` |

#### E. Date de plată și document

| Câmp SDI | Avem? | Coloană DB | Fix |
|---|---|---|---|
| `ModalitaPagamento` (`MP05` bonifico, `MP08` card, `MP01` contanti) | **nu direct** | mapare din `payment_method` | `bank_transfer → MP05`; `whatsapp` **nu e o metodă de plată**, e un canal de comandă — plata reală e decisă offline. Trebuie ori un câmp separat `orders.actual_payment_method`, ori admin-ul setează metoda la confirmare. **Aceasta e o decizie de business, o notez ca TODO_CONFIRM.** |
| `DataScadenzaPagamento` / `CondizioniPagamento` | **nu** | `orders.payment_due_date DATE` (opțional) | `TP02` (pagamento completo) în majoritatea cazurilor |
| Data plății efective | **nu** | `orders.paid_at TIMESTAMPTZ` | setat când `payment_status → 'paid'`; e data care determină momentul emiterii facturii |
| `TipoDocumento` (`TD01` fattura) | n/a | — | îl pune platforma lor |
| Numărul și data facturii | **nu** | `orders.invoice_number TEXT`, `orders.invoice_date DATE`, `orders.invoice_status TEXT` | **numerotarea aparține platformei lor**, nu nouă. Le stocăm doar ca write-back, ca să vedem în admin ce s-a facturat |
| Date cedente (noi): P.IVA, CF, REA, regime fiscale, sede legale | **nu în cod** | — | `lib/store-info.ts` are doar adresa comercială. Sunt config-ul platformei lor, nu al nostru — dar dacă vrem să le afișăm în footer/factură proformă, trebuie cerute. **TODO_CONFIRM** |

#### F. Corelare și audit

| Nevoie | Avem? | Coloană / tabel |
|---|---|---|
| Cheie stabilă de corelare comandă↔factură | parțial (`order_number`) | păstrăm `order_number`, dar cu secvență, nu hash de UUID (vezi 1.5) |
| Marcaj „exportat către facturare" | **nu** | tabel nou `order_exports (order_id UUID PK REFERENCES orders(id) ON DELETE CASCADE, exported_at TIMESTAMPTZ, external_invoice_id TEXT, status TEXT, last_error TEXT, attempts INT DEFAULT 0)` |
| Istoric tranziții de status | **nu** | tabel nou `order_status_history (id, order_id, from_status, to_status, changed_by, changed_at)` — necesar ca să știm *când* a devenit plătită, nu doar că e |

### 5.3 Recomandare pe TVA: brut ca sursă de adevăr

Prețurile din catalog sunt IVA inclusa și așa sunt afișate. Nu stoca și net, și
brut — divergează inevitabil la rotunjiri. Stochează **brut + cotă** și calculează
netul la export, o singură dată, cu rotunjire pe 2 zecimale la nivel de linie:

```
imponibile_linie = round(total_price / (1 + vat_rate/100), 2)
imposta_linie    = total_price - imponibile_linie
```

și agregă pe cotă pentru `DatiRiepilogo`. Documentăm formula în API ca parte din
contract, ca să nu recalculeze ei altfel și să iasă diferențe de un cent.

### 5.4 Ordinea de execuție recomandată

1. Migrație de baseline pentru `orders`/`order_items` (adevărul din producție).
2. Fix `tax_amount` + `order_items.sku` + prețul recitit din DB pe server
   (`lib/actions/orders.ts`). Astea sunt bug-uri, nu features — se fac oricum.
3. Migrație câmpuri fiscale (A–E de mai sus) + `order_status_history` +
   `order_exports`.
4. Validare server-side în `createOrder` (adaugă `zod` — dependință nouă, cere
   aprobare conform `CLAUDE.md`).
5. Refacere formular checkout: next-intl pentru tot, split nume, câmpuri fiscale
   condiționate de tip client, `<select>` provincie/țară.
6. Endpoint-ul de la punctul 6.

### 5.5 De confirmat cu clientul (TODO_CONFIRM)

- Numele platformei de facturare (Fatture in Cloud? Aruba? TeamSystem? altul) —
  fiecare are un format de import propriu; asta schimbă forma payload-ului.
- Factură per comandă B2C, sau doar corrispettivi + factură la cerere?
- Cine deține numerotarea facturilor (presupun ei).
- P.IVA / CF / regime fiscale / sede legale ale KAYA Studio Outlet.
- Ce înseamnă „plătit" pentru comenzile WhatsApp (plata reală: bonifico? card la
  ridicare? cash în magazin?) — determină `ModalitaPagamento`.
- Vând și către clienți din alte țări UE / extra-UE? (schimbă regulile de TVA:
  OSS, non-imponibile, `Natura`).

---

## 6. Propunere de integrare

### 6.1 Alegerea de bază: pull (REST) ca mecanism principal, push (webhook) ca adaos

**Recomand pull.** Motive, în ordinea greutății:

1. **Nu avem un eveniment de încredere.** Statusul se schimbă manual din admin.
   Un push s-ar declanșa pe un `UPDATE` făcut de om, care poate fi corectat
   imediat după (a pus `paid` din greșeală). Pull-ul cu filtru pe status lasă
   corecția să se întâmple înainte ca ei să citească.
2. **Zero infrastructură de livrare la noi.** Push înseamnă retry cu backoff,
   dead-letter, monitorizare — pe Vercel, într-un Server Action sau route
   handler fără coadă. Costul e real și nu-l justifică nimic la volumul actual.
3. **Ei controlează cadența.** Platformele de facturare importă de obicei o dată
   pe zi sau la comandă manuală. Un pull se potrivește natural.
4. **Debug trivial.** Un `curl` reproduce exact ce văd ei.

Push-ul rămâne util pentru latență (factura emisă în minute, nu a doua zi). Îl
propun ca **fază 2**, peste aceeași reprezentare de date.

### 6.2 Autentificare: API key în header, **nu** service role Supabase

**Nu dăm service role.** Motivele sunt structurale, nu de preferință:

- Service role ocolește RLS pe **tot** proiectul: produse, evenimente,
  `contact_requests` (date personale), storage. Un partener extern nu are ce
  căuta acolo.
- Nu poate fi rotită per-partener — e cheia proiectului. Rotația ne rupe și
  aplicația noastră.
- Nu poate fi restricționată la citire.
- E deja un istoric de scurgere de chei în acest repo (`CLAUDE.md`, incidentul
  `scripts/seed-products.mjs`). Nu repetăm modelul.

Un utilizator Supabase auth dedicat nu e nici el o soluție: policy-ul actual e
`FOR ALL USING (auth.role() = 'authenticated')` — orice cont autentificat poate
și **scrie** comenzi.

**Propunere:** cheie proprie, în header, verificată în route handler:

```
GET /api/integrations/invoicing/orders
Authorization: Bearer <INVOICING_API_KEY>
```

- `Authorization: Bearer` în loc de `X-API-Key`: e standard, e redactat implicit
  de majoritatea loggerelor și proxy-urilor, și nu invită la a fi pus în query
  string.
- Cheia în env Vercel (`INVOICING_API_KEY`), niciodată `NEXT_PUBLIC_*`.
- Comparație cu `crypto.timingSafeEqual` pe hash-urile SHA-256 ale celor două
  valori (evită și timing attack, și diferența de lungime care aruncă).
- Suport pentru **două** chei simultan (`INVOICING_API_KEY`,
  `INVOICING_API_KEY_NEXT`) ca rotația să nu necesite downtime coordonat.
- Handler-ul folosește intern `createSupabaseAdminClient()` — service role rămâne
  la noi pe server, nu iese niciodată.

Notă de rutare: `proxy.ts:56` exclude `/api` din matcher, deci ruta **nu** trece
prin middleware-ul de auth admin și **nu** primește prefix de locale. Autentificarea
trebuie făcută explicit în handler. Ruta merge sub `app/api/...`, nu sub `app/[locale]/`.

### 6.3 Contractul endpoint-ului

```
GET /api/integrations/invoicing/orders
```

**Query params**

| Param | Tip | Default | Rol |
|---|---|---|---|
| `updated_since` | ISO 8601 | — | livrare incrementală; filtrează pe `updated_at >= x` |
| `created_from` / `created_to` | ISO 8601 date | — | fereastră pe `created_at`, pentru reconcilieri de perioadă |
| `status` | CSV | `confirmed,paid,processing,shipped,delivered` | statusuri de comandă |
| `payment_status` | CSV | `paid` | recomand ca ei să ceară explicit `paid` |
| `exported` | `true`/`false`/`all` | `all` | filtrare pe `order_exports` |
| `limit` | int 1–200 | `50` | |
| `cursor` | opac (base64) | — | paginare keyset |

**De ce keyset și nu `offset`:** cu `offset`, o comandă nouă inserată între două
pagini decalează totul și pot **sări** comenzi — exact eșecul pe care nu-l vrei
într-o integrare de facturare. Cursorul e `base64({updated_at, id})`, ordonarea
`ORDER BY updated_at ASC, id ASC`, filtrul `(updated_at, id) > (cursor.updated_at, cursor.id)`.
Ascendent, nu descendent: consumatorul avansează monoton și poate relua de unde a
rămas după o cădere.

Necesită index nou:
```sql
CREATE INDEX idx_orders_updated_id ON orders (updated_at, id);
```

**Răspuns**

```json
{
  "data": [ /* comenzi, forma de la 6.4 */ ],
  "pagination": {
    "next_cursor": "eyJ1IjoiMjAyNi0wOS0wMlQxMDoxNDoyNy44ODJaIiwiaSI6IjNmOGEuLi4ifQ==",
    "has_more": true
  }
}
```

Fără `total_count`: e un `COUNT(*)` scump pe fiecare pagină și nu-l folosește
nimeni când paginezi cu cursor.

**Endpointuri auxiliare**

```
GET  /api/integrations/invoicing/orders/{order_number}   -- o comandă, pentru re-fetch
POST /api/integrations/invoicing/orders/{order_number}/ack
     body: { "external_invoice_id": "FT/2026/00123", "invoice_date": "2026-09-03", "status": "issued" }
```

`ack` e piesa care închide bucla: ei confirmă ce au facturat, noi scriem în
`order_exports` + `orders.invoice_number`. Fără el, „exported" e o presupunere și
nu putem afișa în admin dacă o comandă e facturată.

**Idempotency**

Trei straturi, fiecare cu rolul lui:

1. **GET-urile sunt idempotente prin natură.** Nu au nevoie de key. Repetarea
   aceleiași pagini dă același rezultat cât timp nu s-a schimbat `updated_at`.
2. **`order_number` e cheia de deduplicare la ei.** E stabil, unic, și e singurul
   lucru pe care trebuie să-l țină minte. Contractul spune explicit: *nu crea o a
   doua factură pentru un `order_number` deja procesat.*
3. **`POST /ack` acceptă `Idempotency-Key`** (header). Stocăm cheia pe
   `order_exports` și la retry cu aceeași cheie returnăm `200` cu corpul
   original, fără efect secundar. Un `ack` repetat cu **altă** cheie și alt
   `external_invoice_id` întoarce `409 Conflict` — semnal că cineva a facturat de
   două ori, nu ceva de înghițit în tăcere.

**Coduri de eroare:** `401` cheie lipsă/greșită, `400` param invalid (cu numele
paramului în body), `409` conflict de ack, `429` rate limit, `500` restul. Corp
uniform: `{ "error": { "code": "...", "message": "..." } }`.

**Rate limiting:** simplu, per cheie, ~60 req/min. Fără el, un client care
paginează într-un `while(true)` prost scris ne consumă lambdas — și `CLAUDE.md`
documentează deja un incident de 503 din exces de cereri simultane.

### 6.4 Forma datelor în răspuns: normalizată, nu rândul brut din DB

**Nu returna rândul din `orders` ca atare.** Motive:

- E cuplaj direct între schema noastră internă și un consumator extern. Orice
  refactor devine breaking change pentru ei.
- `billing_*` sunt `NULL` când billing = shipping. Ar trebui ca **ei** să
  cunoască regula. Nu. Rezolvăm fallback-ul la noi și livrăm mereu o adresă de
  facturare completă.
- Sumele trebuie livrate cu TVA descompus corect, nu cu `tax_amount`-ul greșit
  de azi.

Forma propusă (după ce câmpurile de la punctul 5 există):

```json
{
  "order_number": "ORD-2026-000123",
  "order_date": "2026-09-02T10:14:27.882Z",
  "paid_at": "2026-09-03T08:02:11.000Z",
  "status": "paid",
  "payment_status": "paid",
  "payment_method": "bank_transfer",
  "sdi_payment_mode": "MP05",
  "currency": "EUR",

  "customer": {
    "type": "private",
    "first_name": "Giulia",
    "last_name": "Rossi",
    "company_name": null,
    "email": "giulia.rossi@example.it",
    "phone": "+39 340 1122334",
    "tax_code": "RSSGLI90A41H501X",
    "vat_number": null,
    "vat_country": "IT",
    "sdi_recipient_code": "0000000",
    "sdi_pec_email": null
  },

  "billing_address": {
    "line1": "Via Giuseppe Verdi 14",
    "line2": "Interno 3B",
    "city": "Latina",
    "province": "LT",
    "postal_code": "04100",
    "country": "IT"
  },
  "shipping_address": { "...": "aceeași formă" },

  "lines": [
    {
      "line_number": 1,
      "sku": "BRW-TS-LOGO-NER-L",
      "description": "Barrow T-shirt con logo Nera — Nero / L",
      "quantity": 1,
      "unit_price_gross": "89.00",
      "unit_price_net": "72.95",
      "line_total_gross": "89.00",
      "line_total_net": "72.95",
      "vat_rate": "22.00",
      "vat_amount": "16.05",
      "vat_nature": null,
      "discount_amount": "0.00"
    },
    {
      "line_number": 2,
      "sku": "NB-9060-GRI-42",
      "description": "New Balance 9060 Sneakers Grigie — Grigio / 42",
      "quantity": 1,
      "unit_price_gross": "179.00",
      "unit_price_net": "146.72",
      "line_total_gross": "179.00",
      "line_total_net": "146.72",
      "vat_rate": "22.00",
      "vat_amount": "32.28",
      "vat_nature": null,
      "discount_amount": "0.00"
    },
    {
      "line_number": 3,
      "sku": "SHIPPING",
      "description": "Spese di spedizione",
      "quantity": 1,
      "unit_price_gross": "0.00",
      "unit_price_net": "0.00",
      "line_total_gross": "0.00",
      "line_total_net": "0.00",
      "vat_rate": "22.00",
      "vat_amount": "0.00",
      "vat_nature": null,
      "discount_amount": "0.00"
    }
  ],

  "vat_summary": [
    { "vat_rate": "22.00", "taxable_amount": "219.67", "vat_amount": "48.33", "vat_nature": null }
  ],

  "totals": {
    "net": "219.67",
    "vat": "48.33",
    "shipping_gross": "0.00",
    "discount": "0.00",
    "gross": "268.00"
  },

  "shipment": { "tracking_number": null, "tracking_url": null },
  "export": { "exported_at": null, "external_invoice_id": null }
}
```

Transportul apare ca **linie**, nu ca total separat: platformele de facturare
îl vor oricum ca rând pe factură, cu propria cotă.

Toate sumele sunt **string-uri**, nu float — evită erorile binare de virgulă
mobilă la parsare. `DECIMAL` din Postgres ajunge oricum string prin PostgREST.

### 6.5 Varianta push (webhook), faza 2

```
POST <URL-ul lor>
Content-Type: application/json
X-Kaya-Event: order.paid
X-Kaya-Delivery: <uuid, unic per încercare>
X-Kaya-Signature: sha256=<HMAC-SHA256(body, WEBHOOK_SECRET)>
Idempotency-Key: <order_number>:order.paid
```

- **Semnătură HMAC, nu API key în header.** O cheie statică trimisă către ei
  dovedește doar cine sună; HMAC-ul dovedește că **payload-ul** nu a fost
  modificat, și e ce așteaptă orice platformă serioasă.
- **`Idempotency-Key = order_number:event`** — un retry al aceluiași eveniment
  poartă aceeași cheie, deci ei pot dedupe fără să ghicească.
- **Trigger:** tranziția `payment_status → 'paid'`, emisă din
  `updateOrderStatus` (`lib/actions/orders.ts:45`) **după** ce scriem
  `order_status_history`. Nu dintr-un trigger Postgres: vrem controlul retry-ului
  în aplicație.
- **Retry:** 3 încercări cu backoff (30 s, 5 min, 30 min), apoi marcăm
  `order_exports.status = 'failed'` cu `last_error`. Fără coadă, un
  `after()`/`waitUntil` din Next 16 e suficient la volumul actual.
- **Webhook-ul nu înlocuiește pull-ul.** E optimizare de latență. Pull-ul rămâne
  plasa de siguranță pentru tot ce s-a pierdut — și trebuie spus explicit în
  contract: *sursa de adevăr e GET-ul, webhook-ul e o notificare*.

### 6.6 Ce **nu** propun și de ce

- **Fișiere XML/JSON pe SFTP.** Clientul a menționat schimb de fișiere ca
  alternativă. E mai multă muncă (generare, storage, retenție, naming, curățenie),
  fără niciun avantaj față de un GET — și fără feedback: nu afli niciodată dacă
  fișierul a fost citit. Merită doar dacă platforma lor **nu** poate consuma
  REST. Prima întrebare către ei ar trebui să fie exact asta.
- **Generarea XML FatturaPA la noi.** Ar însemna să preluăm numerotarea,
  regimul fiscal, semnătura și transmisia către SDI — adică să devenim noi
  furnizorul de facturare. Nu e ce cere clientul și e o responsabilitate legală
  pe care nu vrem să o purtăm.
- **Acces direct la Postgres / PostgREST pentru ei.** Vezi 6.2.

---

## 7. Rezumat: ce trebuie făcut, în ordine

| # | Ce | Unde | Blocant pentru facturare |
|---|---|---|---|
| 1 | Dump real al schemei din producție + migrație baseline | `supabase/migrations/` | **da** |
| 2 | Corectat nota despre `schema.sql` | `CLAUDE.md` | nu, dar induce în eroare |
| 3 | Fix `tax_amount` (TVA scorporato) | `lib/actions/orders.ts:85` | **da** |
| 4 | Populat `order_items.sku` din `product_variants.sku` | `lib/actions/orders.ts:135` + `lib/store/cart.ts` | **da** |
| 5 | Prețul recitit din DB pe server, nu luat din coș | `lib/actions/orders.ts:84,139` | **da** (corectitudine fiscală) |
| 6 | Migrație câmpuri fiscale (secțiunea 5.2) | migrație nouă | **da** |
| 7 | `order_status_history` + `paid_at` | migrație nouă | **da** |
| 8 | `order_exports` | migrație nouă | **da** |
| 9 | Validare server-side (`zod` — dependință nouă, necesită aprobare) | `lib/actions/orders.ts` | **da** |
| 10 | Refacere formular checkout (i18n + câmpuri fiscale + provincie) | `components/checkout/checkout-form.tsx`, `messages/*.json` | **da** |
| 11 | `order_number` pe secvență | migrație + trigger | recomandat |
| 12 | Idempotency la checkout + tranzacție pe decrementarea stocului | `lib/actions/orders.ts` | nu, dar e bug real |
| 13 | Endpoint GET + ack | `app/api/integrations/invoicing/` | **da** |
| 14 | Index `(updated_at, id)` pe `orders` | migrație | da (performanță paginare) |
| 15 | Webhook push | fază 2 | nu |
