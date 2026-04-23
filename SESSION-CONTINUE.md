# Valley Specialty Roasters — Session Continuation Guide

**Paste this into a new Claude Code session to pick up where we left off.**

> The source of truth for this project is **GitHub** — it's a handoff project
> owned by the client. Any local checkout on a dev's machine is transient; the
> canonical branch is `master` on https://github.com/lifeofcammy/valley-roasters.

---

## Context

Building a B2B wholesale coffee website for Valley Specialty Roasters (client
in Gilbert, AZ). The site is live at https://valleyspecialtyroasters.com and
is actively used for demos to Jackie Ludgate's leadership team.

- **GitHub (authoritative):** https://github.com/lifeofcammy/valley-roasters
- **Local checkout (if present):** `~/GitHub/valley-roasters`
- **Client contact:** Jackie Ludgate, Top Cup Coffee House, Gilbert AZ
- **Legal entity:** Valley Specialty Roasters LLC

### Live account IDs

- **Supabase project ref:** `tkvlbowzkeudvomdfzzt` (region `us-west-1`).
  ⚠️ NOT `poldnqhuuofgbdxkiyzj` — that ID is stale and will time out.
- **Supabase URL:** https://tkvlbowzkeudvomdfzzt.supabase.co
- **Vercel team:** `team_4B0koFUJp7NBX3DyLmiiyQEv` ("Valley Specialty Roaster's projects")
- **Vercel project:** `prj_4bVfLGbS3bVaFMPqkFTxVKLDCfQq` (name `valley-roasters`, Hobby plan)
- **Square application:** `sq0idp-D9ddWtjh6LJ4PutoqDhUjg`
- **Square location (Valley):** `LRA1MTWS2VGAM`
- **Domain:** GoDaddy, DNS → Vercel (A records `216.198.79.1` / `64.29.17.1`)
- **Admin login:** `info@valleyspecialtyroasters.com` — owns Vercel, Supabase, Square, GoDaddy, Microsoft 365

## Tech Stack

- **Next.js 16** (App Router) + **React 19** + TypeScript — breaking changes
  from older Next.js; see `AGENTS.md` and always consult
  `node_modules/next/dist/docs/` before touching Next-specific APIs.
- Tailwind CSS v4 + shadcn/ui (base-ui version, NOT Radix — no `asChild`,
  use `render` prop; `Select.onValueChange` passes `string | null`).
- Supabase (PostgreSQL + Auth + RLS) — login/session, profiles, and the
  local `orders`/`order_items`/`order_subscriptions` mirror tables.
- **Square API** — system of record for orders, catalog, customers, invoices,
  subscriptions. No Stripe anywhere.
- Vercel (Hobby plan, auto-deploys on push to `master`).
- Fonts: Playfair Display (display) + Inter (body).

## What's built & working

1. **Marketing pages** — Home (full-bleed logo hero), About, Wholesale
   (SEO-optimized, pulls live catalog from Square), Contact.
2. **Auth** — Email/password + magic link; register → admin-approve gate →
   pending-approval page → role-aware login redirect.
3. **Customer portal** — Order history (reads live from Square for any
   customer linked via `profiles.square_customer_id`), single order detail,
   Reorder with pre-fill from any past order (Square or Supabase-backed),
   Account settings, Subscriptions (pause/resume/cancel Square-native subs).
4. **Admin dashboard** — Overview, Orders list with live recurring-order
   detection from Square subs + invoice patterns, Order detail with status +
   internal notes, Customers (approve, custom pricing, impersonate as
   "View as customer"), Products CRUD, Messages (contact inbox), Settings.
5. **Square integration (shipped)**
   - `createSquareOrder` + `createSquareInvoice` mirror every portal order
     into Square (`src/app/api/orders/route.ts`).
   - `createSquareSubscriptionPlan` + `createSquareSubscription` handle
     recurring orders natively — Square runs the schedule; no cron on our end.
   - `fetchCoffeeCatalog` pulls every live coffee SKU (filters out Top Cup
     internal "TC-*" SKUs) with images and variations, used on the wholesale
     marketing page + admin products.
   - `fetchCustomerOrders` / `fetchOrderForCustomer` power the customer portal.
   - `/api/webhooks/square` receives invoice + subscription events, verifies
     the HMAC-SHA256 signature against `SQUARE_WEBHOOK_SIGNATURE_KEY`, and
     mirrors state changes into `orders.payment_status` /
     `orders.square_invoice_status` / `order_subscriptions.status`.
6. **Database** — Migrations applied; RLS enforced; `square_customer_id`,
   `square_order_id`, `square_invoice_id`, `square_invoice_status` columns on
   `orders`; `order_subscriptions` mirror table with `square_subscription_id`.
7. **SEO** — Sitemap, robots.txt, JSON-LD, meta tags.
8. **Logo + brand** — Real logo at `public/logo.png` (desert sunset coffee
   bean with cacti).

## What's still pending

- [ ] **Simplify admin status dropdown to 4 values** — consolidate `pending`,
      `confirmed`, `roasting`, `shipped`, `delivered`, `cancelled` into
      `received` / `in_process` / `shipped` / `rejected` per client request.
      No auto-flip to delivered — workflow ends at Shipped. `delivered` stays
      in the schema for historical rows but is hidden from the admin selector.
- [ ] **Square-only email notifications** (client decision — no Resend / no
      third-party email provider). Wiring on status change:
      - **In process** → call `/v2/invoices/{id}/publish` on the existing
        DRAFT invoice. Square auto-emails the buyer.
      - **Shipped** → DB-only. ⚠️ Known gap: Square has no "shipped"
        notification, so the buyer is not auto-emailed. Jackie can send a
        manual note from the Square Dashboard, or revisit later.
      - **Rejected** → admin must type a rejection reason (required field).
        We cancel the Square invoice via `/v2/invoices/{id}/cancel` and write
        the reason into the invoice memo. Square auto-emails the cancellation.
- [ ] **`/portal/catalog` browse page** — `fetchCoffeeCatalog` already returns
      every SKU; build a buyer-facing grid with **"Add to order"** that
      deep-links into `/portal/reorder?sku=<variation_id>` and pre-fills the
      cart with that variation (default behavior, per client).
- [ ] **Merge admin-set status into buyer portal** — for Square-backed
      customers, `status` in the portal is derived from Square's order `state`,
      so admin-set `shipped`/`in_process` on the Supabase row doesn't surface.
      Fix: left-join Supabase orders by `square_order_id` and overlay.
- [ ] **Square Web Payments SDK** — embedded card widget on a portal checkout
      page so customers pay in-site instead of via the Square-hosted invoice
      link. Today invoices link out to `public_url`.
- [ ] **Register webhook in Square dev dashboard** — code is ready; URL
      `https://valleyspecialtyroasters.com/api/webhooks/square` must be added
      as a subscription with the events listed in HANDOFF.md, and
      `SQUARE_WEBHOOK_SIGNATURE_KEY` set in Vercel.
- [ ] **Per-customer pricing from Square** — today lives in Supabase
      `customer_pricing`; move to Square so Jackie edits one place.
- [ ] **Pre-create Supabase accounts for the 14 other wholesalers** — same
      pattern as Beanchain demo account (~30 min batch).
- [ ] **Contact form backend** — currently client-side only; needs to write
      to `contact_messages` and notify info@.
- [ ] **Vercel Analytics** setup.
- [ ] **Real product photography** — replace Unsplash placeholders when Jackie
      sends photos.
- [ ] **Mobile polish** — final pass across portal + admin.

## Key Design Decisions (do not soften)

- **Colors:** Amber/gold primary `#c8720c` (desert sunset from logo), rich
  brown secondary `#1c1210`, warm white `#fefcf9` background.
- **Hero:** Logo shown LARGE (280px) as centerpiece — explicitly requested.
- **Vibe:** Premium, vibrant, dramatic — Onyx Coffee Lab / Ceremony /
  Intelligentsia. NOT muddy or flat brown. Full-bleed imagery, not contained
  cards.
- **B2B wholesale first.** DTC retail expansion planned later.

## Operational gotchas

- **shadcn/ui is base-ui here, not Radix.** `DialogTrigger` uses `render`,
  not `asChild`. `Select.onValueChange` passes `string | null` — handle the
  null case.
- **`src/app/page.tsx` was deleted.** Homepage is at
  `src/app/(marketing)/page.tsx`.
- **`.env.local` is gitignored.** To recover, pull from Vercel with the PAT
  — don't guess. Vercel is the live source.
- **Supabase ref drift** — an earlier session wrote `poldnqhuuofgbdxkiyzj` in
  docs. That project doesn't exist. Live ref is `tkvlbowzkeudvomdfzzt`.
  Always verify via `vercel env pull` or Supabase Management API before
  running SQL.
- **Next.js 16 breaking changes** — read `node_modules/next/dist/docs/`
  before writing Next-specific code; your training data is almost certainly
  out of date. Server Components cannot pass component function refs to
  client components.
