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
facing portal that reads from Square (today) and will write back to Square
(in a future session). Valley never has to maintain two systems.

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
- **Provider:** Square (replaces the original Stripe plan)
- **App:** Production access token already provisioned
- **Application ID:** `sq0idp-D9ddWtjh6LJ4PutoqDhUjg`
- **Location ID for Valley:** `LRA1MTWS2VGAM`
- **Today the website only READS from Square** (order history, customer info).
  Writing new orders + accepting payments through the website is the next
  development phase — see "What's pending" below.

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
```

All of the above are already set in Vercel's project environment.

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

## What's live as of 2026-04-08

✅ Marketing site at https://valleyspecialtyroasters.com (home, about, wholesale,
   contact)
✅ SSL + custom domain via GoDaddy → Vercel
✅ Customer registration + login (email/password and magic link)
✅ Admin dashboard with role-based routing
✅ Customer portal showing **real Square order history** for any customer
   linked via `profiles.square_customer_id` (Beanchain is the demo)
✅ Order detail pages reading from Square
✅ Admin contact-message inbox
✅ All Next.js 16 / React 19 server-component compatibility issues resolved
   (cookies adapter, client/server icon serialization, missing "use client"
   directives on base-ui wrappers)

---

## What's pending — next development session

🛠 **Write new orders into Square** — When a customer places an order on
  `/portal/reorder`, the order should be created in Square so it appears in
  Top Cup's normal Square dashboard alongside in-store sales.

🛠 **Square Web Payments SDK** — Embedded credit card widget on the checkout
  page so customers can pay online. Funds settle into Valley's Square account.

🛠 **Pull product catalog from Square** — Replace the 8 placeholder coffees
  in the Supabase `products` table with Valley's real Square catalog so the
  website always reflects what Valley actually sells, automatically.

🛠 **Per-customer pricing from Square** — Square already holds Valley's custom
  per-customer wholesale prices. Pull those into the order calculation rather
  than maintaining them separately in Supabase.

🛠 **Pre-create Supabase accounts for the 14 other wholesalers** — Same
  pattern as Beanchain. Each gets a login that immediately shows their real
  order history.

🛠 **Email notifications** — Order confirmation, contact form forwarding,
  password reset (Supabase Auth handles this; needs sender configured).

🛠 **Real product photography** — Replace Unsplash placeholders with Valley's
  own photos when Jackie sends them.

🛠 **Square account decision** — The handoff doc notes Valley Specialty
  Roasters LLC is a new legal entity but currently operates as a location
  under Top Cup's Square merchant account (location `LRA1MTWS2VGAM`). Decide
  whether Valley should have its own Square merchant account for cleaner
  accounting and liability separation.

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
