# Clothing Store — Setup Guide

## Live URL

https://clothing-store-lime.vercel.app

## 1. Schema SQL (REQUIRED — run manually)

The database schema must be applied manually via the Supabase SQL Editor.

1. Go to https://supabase.com/dashboard/project/snsjjyvleuirivsiytre/sql/new
2. Copy the contents of `schema.sql` from this repo
3. Paste and click **Run**

This creates all tables (categories, products, product_variants, product_images, orders, order_items, contact_requests), triggers, RLS policies, and seed data.

## 2. Supabase Storage Bucket (REQUIRED for image upload)

1. Go to https://supabase.com/dashboard/project/snsjjyvleuirivsiytre/storage/buckets
2. Click **New bucket**
3. Name: `product-images`
4. Toggle **Public bucket** to ON
5. Click **Save**

## 3. Create First Admin User

1. Go to https://supabase.com/dashboard/project/snsjjyvleuirivsiytre/auth/users
2. Click **Add user** → **Create new user**
3. Enter email + password
4. The user can log in at `/admin/login`

## 4. Environment Variables on Vercel

Already set via CLI. If you need to add new ones:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://snsjjyvleuirivsiytre.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (see .env.local) |
| `SUPABASE_SERVICE_ROLE_KEY` | (see .env.local) |
| `RESEND_API_KEY` | Get from resend.com |
| `ADMIN_EMAIL` | Your email for order notifications |
| `NEXT_PUBLIC_SITE_URL` | `https://clothing-store-lime.vercel.app` |

## 5. Config Customization

Edit `lib/config.ts` to update:
- Brand name (replace `[Brand]`)
- Contact email, phone, WhatsApp number
- Shipping costs and thresholds
- Social links (Instagram, Facebook, TikTok)

## 6. Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## What Works

- Homepage with hero, category blocks, featured products grid
- Product catalog (`/products`) with all products
- Category pages (`/category/[slug]`)
- Individual product pages with color/size selector, gallery, add to cart
- Cart (persistent in localStorage) with drawer + full page
- Checkout with WhatsApp order or bank transfer payment
- Order confirmation page + email notifications (when RESEND_API_KEY is set)
- Contact form
- Admin dashboard (requires Supabase auth):
  - Products: CRUD with variant manager + image uploader
  - Orders: list, detail, status update, tracking
  - Categories: CRUD
  - Contacts: read messages

## What's Placeholder

- Product images — using SVG placeholder. Add real images via Admin → Products → Edit → Images
- Brand name — currently `[Brand]`, update in `lib/config.ts`
- Contact info — update phone, email, WhatsApp in `lib/config.ts`
- Stripe payment — prepared in config (`enableStripe: false`), activate when ready
- Newsletter — disabled in config (`enableNewsletter: false`)

## TODO

1. **Run schema.sql** on Supabase (see step 1 above)
2. **Create storage bucket** `product-images` (see step 2)
3. **Create admin user** on Supabase Auth (see step 3)
4. **Set `RESEND_API_KEY`** on Vercel for email notifications
5. **Set `ADMIN_EMAIL`** on Vercel for order notification emails
6. Update brand name and contact info in `lib/config.ts`
7. Add real product images via admin dashboard
8. Configure custom domain on Vercel
9. Set up Stripe when ready (set `enableStripe: true` in config)
