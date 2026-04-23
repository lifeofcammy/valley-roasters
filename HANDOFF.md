# Valley Specialty Roasters — Handoff Guide

A premium B2B wholesale coffee website with a public marketing site, a customer
portal that reads order history live from Valley's Square account, and an admin
dashboard for managing customers, orders, and content.

**Live site:** https://valleyspecialtyroasters.com

---

## 📋 Companion Documents

- **[`VALLEY-REVIEW.md`](./VALLEY-REVIEW.md)** — Full copy review checklist for
  Jackie. Walk through every line of marketing copy on the live site and verify
  it before final launch.
- **[`SESSION-CONTINUE.md`](./SESSION-CONTINUE.md)** — Developer session
  context. Internal notes for whoever picks up the build next.
- **[`AGENTS.md`](./AGENTS.md)** — Important: this project uses Next.js 16
  which has breaking changes from prior versions. Server Components cannot
  pass component function references to client components.

---

## Architecture

```
                  ┌────────────────────────────────┐
                  │  valleyspecialtyroasters.com   │
                  │           (Vercel)             │
                  └────────┬───────────────────────┘
                           │
                ┌──────────┴────────────┐
                │                       │
                ▼                       ▼
   ┌───────────────────┐   ┌───────────────────────┐
   │  AUTH: Supabase   │   │  DATA: Square API     │
   │  - Login/sessions │   │  - Order history      │
   │  - Profiles table │   │  - Customer info      │
   │  - Admin approval │   │  - Custom pricing     │
   │  - Customer link  │──▶│  - (future) New orders│
   │    to Square ID   │   │  - (future) Payments  │
   └───────────────────┘   └───────────────────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │  Square dashboard     │
                           │  (Top Cup operates    │
                           │  Valley as a location │
                           │  here today — same    │
                           │  workflow continues)  │
                           └───────────────────────┘
```

**Key principle:** Square is the system of record. The website is a customer-
facing portal that both **reads from** and **writes back to** Square — every
portal order becomes a Square Order + draft Invoice automatically, and Square
webhook events are mirrored back into Supabase in real time. Valley never has
to maintain two systems.

---

## Accounts Valley Specialty Roasters owns

All accounts are under `info@valleyspecialtyroasters.com`. Whoever holds that
inbox holds the keys.

### 1. Domain — GoDaddy
- **Domain:** valleyspecialtyroasters.com (auto-renew on, expires 2028-04-21)
- **DNS:** Points to Vercel (A records `216.198.79.1` and `64.29.17.1` on `@`
  and `www`) plus Microsoft 365 mail records.

### 2. Email — Microsoft 365 via GoDaddy
- **Login:** https://email.godaddy.com
- **Address:** info@valleyspecialtyroasters.com
- **MFA:** Enabled (Microsoft Authenticator)

### 3. Hosting — Vercel
- **Login:** https://vercel.com/login
- **Team:** "Valley Specialty Roaster's projects" (Hobby / free plan)
- **Project name:** `valley-roasters`
- Auto-deploys from the GitHub repo on every push to `master`.

### 4. Database + Auth — Supabase
- **Login:** https://supabase.com/dashboard
- **Project name:** `valleyspecialtyroasters`
- **Project ref:** `tkvlbowzkeudvomdfzzt`
- **Region:** `us-west-1` (California)
- **Plan:** Free tier (50K monthly active users)

### 5. Payments + Orders — Square
- **Provider:** Square (Stripe was removed entirely; no Stripe code or accounts
  remain)
- **App:** Production access token already provisioned
- **Application ID:** `sq0idp-D9ddWtjh6LJ4PutoqDhUjg`
- **Location ID for Valley:** `LRA1MTWS2VGAM`
- **The website both reads from and writes to Square:**
  - Reads: order history, customer info, live coffee catalog (all SKUs +
    images + variations + prices), active subscriptions and recurring invoice
    patterns.
  - Writes: every portal order → Square Order + DRAFT Invoice; every recurring
    portal order → Square Subscription Plan + Subscription (Square runs the
    schedule).
- **Webhook receiver** at `/api/webhooks/square` mirrors Square events back
  into Supabase (see "Square webhook setup" below).
- **In-portal credit card capture** (Square Web Payments SDK) is not yet
  wired — invoices are paid via the Square-hosted public link emailed to the
  customer. Adding the embedded card widget is in the pending list.

### 6. Source Code — GitHub
- **Repo:** https://github.com/lifeofcammy/valley-roasters (private)
- **Owner:** Cam (will transfer or grant collaborator access at final handoff)

---

## Environment variables (set in Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://tkvlbowzkeudvomdfzzt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from Supabase > Settings > API]
SUPABASE_SERVICE_ROLE_KEY=[from Supabase > Settings > API — secret]
NEXT_PUBLIC_SITE_URL=https://valleyspecialtyroasters.com

SQUARE_ACCESS_TOKEN=[Square Developer dashboard — production token, secret]
SQUARE_ENVIRONMENT=production
SQUARE_LOCATION_ID=LRA1MTWS2VGAM
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-D9ddWtjh6LJ4PutoqDhUjg
NEXT_PUBLIC_SQUARE_LOCATION_ID=LRA1MTWS2VGAM

SQUARE_WEBHOOK_SIGNATURE_KEY=[Square Developer dashboard > Webhooks > Signature key]
SQUARE_WEBHOOK_NOTIFICATION_URL=https://valleyspecialtyroasters.com/api/webhooks/square
```

All of the above are already set in Vercel's project environment, with the
exception of the two `SQUARE_WEBHOOK_*` vars — those need to be added when the
webhook subscription is registered (see "Square webhook setup" below).

---

## How the site works

### Public pages (no login)
- **`/`** — Homepage, hero, value props, current coffee selection, CTA
- **`/wholesale`** — Full product catalog, FAQ, how-it-works
- **`/about`** — Company story
- **`/contact`** — Contact form (writes to `contact_messages` table)

### Customer portal (login required)
1. **Register** at `/register` — fills out company info
2. **Admin approves** the account in the admin dashboard
3. **Login** at `/login` — email/password or magic link
4. **`/portal/orders`** — Order history. **For customers linked to a Square
   customer record (`profiles.square_customer_id`), the page reads orders live
   from Square.** Otherwise it reads from the Supabase `orders` table.
5. **`/portal/orders/[id]`** — Single order detail (Square or Supabase)
6. **`/portal/reorder`** — Browse products, build cart, place new order
7. **`/portal/account`** — Account settings

### Admin portal (login required, role = admin)
1. **`/admin`** — Dashboard with stats and recent orders
2. **`/admin/orders`** — All orders, status management
3. **`/admin/messages`** — Contact form submissions
4. **`/admin/customers`** — Approve/revoke customers, set custom pricing
5. **`/admin/products`** — CRUD coffee catalog

### Login routing
- Admins → `/admin`
- Approved customers → `/portal/orders`
- Unapproved customers → `/pending-approval`
(Handled in middleware + login page; both are role-aware.)

---

## Current accounts in Supabase

### Admin
- **Email:** `info@valleyspecialtyroasters.com`
- **Role:** `admin`, `is_approved=true`
- This is the account Jackie/Top Cup uses to log into both the Vercel and
  Supabase dashboards as well as the website admin.

### Beanchain Coffee — demo wholesaler (used for client walkthroughs)
- **Email:** `beanchain.demo@valleyspecialtyroasters.com`
- **Company:** Beanchain Coffee (David Baxter)
- **Role:** `customer`, `is_approved=true`
- **Linked to Square customer:** `WQSZ308EWEQ7WV03QS9PFK1PR0`
- When you sign in as this account, the portal pulls David's **real order
  history** from Square — every Brazil whole-bean order the cafe has placed
  with Valley over the past months. This is the "look how it would work for a
  real wholesaler" demo for Jackie's leadership team.

The other 14 wholesalers visible in Square (Shaghf, 10:19, Crepe Club, etc.)
have not yet been pre-created in Supabase — that's a fast batch task once
Jackie greenlights it (~30 min).

---

## What's live

✅ Marketing site at https://valleyspecialtyroasters.com (home, about, wholesale,
   contact) with the wholesale page pulling Valley's **live coffee catalog**
   from Square (every SKU, image, variation, price)
✅ SSL + custom domain via GoDaddy → Vercel
✅ Customer registration + login (email/password and magic link), admin
   approval gate, role-aware routing
✅ Admin dashboard — overview, orders (with live recurring-order detection
   from Square), order detail with status + notes, customers (approve, custom
   pricing, "View as customer" impersonation), products, messages, settings
✅ Customer portal showing **real Square order history** for any customer
   linked via `profiles.square_customer_id` (Beanchain is the demo)
✅ Order detail pages (Square or Supabase-backed)
✅ **Portal orders mirror into Square** — every `/portal/reorder` placement
   creates a Square Order + DRAFT Invoice (admin reviews + sends, or set
   `app_settings.auto_publish_invoices = true` to auto-publish)
✅ **Recurring orders use native Square Subscriptions** — Square runs the
   schedule, no cron on our end; pause/resume/cancel from `/portal/subscriptions`
✅ **Square webhook receiver** at `/api/webhooks/square` — HMAC-SHA256
   verified, mirrors invoice + subscription events back into Supabase in real
   time (payment_status, square_invoice_status, subscription state)
✅ Admin contact-message inbox
✅ All Next.js 16 / React 19 server-component compatibility issues resolved

---

## What's pending — next development sessions

🛠 **Simplify admin order status to 4 values** — consolidate the current 6
  statuses (`pending`, `confirmed`, `roasting`, `shipped`, `delivered`,
  `cancelled`) into the 4 the client locked in: **Order received**, **In
  process**, **Shipped**, **Rejected**. No auto-flip to "delivered" — the
  workflow ends at Shipped. Migration maps old → new; `delivered` stays in
  the schema for historical rows but is hidden from the admin selector.

🛠 **Square-only email notifications (no third-party provider)** — client
  chose to keep all customer email going through Square so there's nothing
  extra to maintain. Wiring on status change:
  - **In process** → publish the Square invoice (currently created as DRAFT).
    Square auto-emails the invoice to the buyer — that's the "we've started
    your order, here's how to pay" message.
  - **Shipped** → updates Supabase `orders.status` only. ⚠️ **No automated
    email here** — Square has no native "shipped" notification. Either Jackie
    sends a manual note from the Square Dashboard, or this gap is filled
    later by adding a small email provider (Resend) just for shipped.
  - **Rejected** → admin must type a rejection reason; we cancel the Square
    invoice with the reason added to the invoice memo. Square emails the
    buyer the cancellation notice automatically.

🛠 **`/portal/catalog` browse page** — `fetchCoffeeCatalog` already returns
  every Square SKU with images + prices; just needs a buyer-facing grid with
  "Add to order" deep-link into `/portal/reorder`.

🛠 **Merge admin-set status into buyer portal view** — for Square-backed
  customers, the buyer portal currently derives status from Square's order
  `state` (OPEN/COMPLETED/CANCELED). Admin-set `shipped` / `in_process` on
  the Supabase row doesn't surface. Fix: left-join Supabase orders by
  `square_order_id` and overlay our status.

🛠 **Square Web Payments SDK** — embedded credit card widget on a portal
  checkout page so customers can pay in-site instead of via the Square-hosted
  invoice link.

🛠 **Per-customer pricing from Square** — Square already holds Valley's
  custom per-customer wholesale prices; today we duplicate them in Supabase
  `customer_pricing`. Move to single-source-of-truth in Square.

🛠 **Pre-create Supabase accounts for the 14 other wholesalers** — same
  pattern as Beanchain demo (~30 min batch).

🛠 **Real product photography** — replace Unsplash placeholders with Valley's
  own photos when Jackie sends them.

🛠 **Vercel Analytics** setup.

🛠 **Square account decision** — Valley Specialty Roasters LLC is a new legal
  entity but currently operates as a location under Top Cup's Square merchant
  account (location `LRA1MTWS2VGAM`). Decide whether Valley should have its
  own Square merchant account for cleaner accounting and liability separation.

---

## Square webhook setup (one-time, before going fully live)

The code at `src/app/api/webhooks/square/route.ts` is ready and signature-
verified, but the webhook subscription itself must be registered in Square.

1. Log in to https://developer.squareup.com/apps with the Valley Square
   account (`info@valleyspecialtyroasters.com`).
2. Open the Valley app (`sq0idp-D9ddWtjh6LJ4PutoqDhUjg`) → **Webhooks**
   (production environment).
3. Click **Add subscription**.
   - **Notification URL:** `https://valleyspecialtyroasters.com/api/webhooks/square`
   - **API version:** `2024-10-17` (matches `SQUARE_VERSION` in the code)
   - **Events** (subscribe to these):
     - `invoice.created`
     - `invoice.published`
     - `invoice.updated`
     - `invoice.payment_made`
     - `invoice.canceled`
     - `subscription.updated`
     - `subscription.canceled`
4. After creating the subscription, copy its **Signature key** and set:
   - `SQUARE_WEBHOOK_SIGNATURE_KEY` in Vercel project env (Production +
     Preview)
   - `SQUARE_WEBHOOK_NOTIFICATION_URL` = `https://valleyspecialtyroasters.com/api/webhooks/square`
5. Redeploy from Vercel so the new env vars are picked up.
6. From Square's webhook dashboard, click **Send test event** for
   `invoice.payment_made` and confirm a 200 response. (Untracked invoice IDs
   ack with `{ ok: true, ignored: "untracked invoice" }` — that's expected.)

Without this step, Square won't push payment / cancellation / subscription
events, and the portal will only learn about state changes when a customer
refreshes (which still works — every Square read is `cache: no-store` —
but is slower than the webhook-driven update).

---

## Tech stack

| Layer        | Technology               | Purpose                            |
|--------------|--------------------------|------------------------------------|
| Frontend     | Next.js 16 (App Router)  | React framework, server rendering  |
| UI           | Tailwind v4 + shadcn/ui  | Design system (base-ui, not Radix) |
| Database     | Supabase (Postgres + RLS)| Auth, profiles, orders, products   |
| Orders/POS   | Square API               | Live order history, customer data  |
| Hosting      | Vercel                   | Deploys, CDN, analytics            |
| Fonts        | Playfair Display + Inter | Premium typography                 |
| Source       | GitHub                   | Version control                    |

---

## Brand identity

- **Primary:** Amber/Gold `#c8720c` (desert sunset from logo)
- **Secondary:** Rich Coffee Brown `#1c1210`
- **Background:** Warm White `#fefcf9`
- **Logo:** `public/logo.png` (desert sunset coffee bean with cacti)

---

## Day-to-day operations

- **Code changes:** Push to GitHub → Vercel auto-deploys in ~1 minute
- **Database admin:** Supabase dashboard for data management
- **Order management (today):** Square dashboard (existing Top Cup workflow)
- **Customer admin (website):** `/admin` for approving registrations and
  managing portal-only state

---

## Recurring monthly costs

| Item                 | Cost          |
|----------------------|---------------|
| Vercel hosting       | $0 (free tier)|
| Supabase database    | $0 (free tier)|
| GoDaddy domain       | ~$1.92/mo     |
| Microsoft 365 email  | (current bill)|
| Square (per-txn fees)| 2.6%+$0.10 in-person, 2.9%+$0.30 online |

**~$2/month recurring** until usage exceeds the free tiers.
