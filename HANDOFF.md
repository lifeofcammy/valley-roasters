# Valley Specialty Roasters - Client Handoff Guide

## What This Is

This is the complete website for Valley Specialty Roasters — a premium B2B wholesale coffee ordering platform. It includes a public marketing website, a customer ordering portal with one-click reorder, Stripe payment processing, and an admin dashboard for managing orders, customers, products, and custom pricing.

---

## Accounts Valley Roasters Needs to Create

Valley Roasters should own all accounts. Here's what to set up:

### 1. Vercel (Website Hosting + Analytics)
- **Sign up**: https://vercel.com/signup (use a company email)
- **What it does**: Hosts the website, auto-deploys when code changes, provides analytics
- **Enable Analytics**: Go to Project > Analytics > Enable (free tier available)
- **Cost**: Free tier handles this site easily. Pro plan ($20/mo) adds more analytics.

### 2. Supabase (Database + User Authentication)
- **Sign up**: https://supabase.com/dashboard (use a company email)
- **What it does**: Stores all customer data, orders, products, pricing, and handles user login/registration
- **Create a project**: Name it "Valley Roasters", select region "US East"
- **Cost**: Free tier supports up to 50,000 monthly active users — more than enough
- **IMPORTANT**: After creating the project, you'll need to run the database migrations (6 SQL scripts provided below)

### 3. Stripe (Payment Processing)
- **Sign up**: https://dashboard.stripe.com/register (requires business info + bank account)
- **What it does**: Processes all online payments from wholesale customers
- **Cost**: 2.9% + $0.30 per transaction (industry standard, no monthly fee)
- **Setup steps**:
  1. Complete business verification
  2. Get API keys from https://dashboard.stripe.com/apikeys
  3. Set up webhook endpoint: `https://valleyspecialtyroasters.com/api/stripe/webhook`
  4. Subscribe to events: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`

### 4. GitHub (Source Code - Optional)
- **Current repo**: https://github.com/lifeofcammy/valley-roasters
- **Option A**: Transfer repo to Valley Roasters' GitHub account
- **Option B**: Keep it under developer's account and add Valley Roasters as collaborator
- **What it does**: Stores all website code, Vercel auto-deploys from here

### 5. GoDaddy (Domain - Already Owned)
- **Domain**: valleyspecialtyroasters.com
- **Action needed**: Point DNS to Vercel (instructions below)

---

## Environment Variables

After creating all accounts, set these in Vercel (Project > Settings > Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[from Supabase > Settings > API > anon public]
SUPABASE_SERVICE_ROLE_KEY=[from Supabase > Settings > API > service_role — KEEP SECRET]
STRIPE_SECRET_KEY=[from Stripe > Developers > API keys > Secret key]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[from Stripe > Developers > API keys > Publishable key]
STRIPE_WEBHOOK_SECRET=[from Stripe > Developers > Webhooks > Signing secret]
NEXT_PUBLIC_SITE_URL=https://valleyspecialtyroasters.com
```

---

## Database Setup (Supabase)

After creating the Supabase project, go to SQL Editor and run these 6 migrations in order. The migrations create all tables, security policies, and helper functions.

The migrations are stored in the GitHub repo and were already applied to the development database. For a fresh Supabase project, run them from the Supabase SQL Editor in this order:

1. `create_profiles_table` — User profiles with company info
2. `create_products_table` — Coffee product catalog
3. `create_customer_pricing_table` — Per-customer price overrides
4. `create_orders_tables` — Orders and order line items
5. `create_rls_policies` — Row-level security (data isolation)
6. `create_helper_functions` — Pricing calculation function

---

## How the Site Works

### Public Pages (No Login Required)
- **Homepage** (`/`) — Hero with logo, value props, featured coffees, testimonial
- **Wholesale** (`/wholesale`) — Full product catalog, FAQ, how-it-works
- **About** (`/about`) — Company story, values, sourcing philosophy
- **Contact** (`/contact`) — Contact form and info

### Customer Flow
1. **Register** (`/register`) — Customer fills out company info
2. **Admin approves** the account in the admin dashboard
3. **Login** (`/login`) — Email/password or magic link
4. **View Orders** (`/portal/orders`) — See all past orders with status
5. **Reorder** — Click "Reorder" on any past order → cart pre-fills → checkout via Stripe
6. **New Order** (`/portal/reorder`) — Browse products at custom pricing, build cart, checkout

### Admin Flow
1. **Dashboard** (`/admin`) — Overview with stats (orders, revenue, customers)
2. **Orders** (`/admin/orders`) — View all orders, update status: pending → confirmed → roasting → shipped → delivered
3. **Customers** (`/admin/customers`) — Approve/revoke accounts, set custom per-product pricing
4. **Products** (`/admin/products`) — Add, edit, deactivate coffee products

### Payment Flow
```
Customer places order → Stripe Checkout → Payment confirmed via webhook → Order auto-updates to "confirmed"
```

---

## Creating the First Admin Account

1. Go to `/register` and create an account with Valley Roasters' email
2. Go to Supabase Dashboard > SQL Editor
3. Run:
   ```sql
   UPDATE public.profiles
   SET role = 'admin', is_approved = true
   WHERE email = 'admin@valleyspecialtyroasters.com';
   ```
4. Login at `/login` — the Admin Dashboard link appears in the sidebar

---

## Domain Setup (GoDaddy → Vercel)

1. In **Vercel**: Project Settings > Domains > Add `valleyspecialtyroasters.com`
2. In **GoDaddy DNS settings**, add:
   - **A Record**: `@` → `76.76.21.21`
   - **CNAME Record**: `www` → `cname.vercel-dns.com`
3. Vercel auto-provisions SSL certificate (HTTPS)
4. Update `NEXT_PUBLIC_SITE_URL` env var to `https://valleyspecialtyroasters.com`

---

## Analytics (Vercel)

1. In Vercel Dashboard, go to your project
2. Click **Analytics** tab
3. Click **Enable** (free tier: 2,500 events/month, Pro: unlimited)
4. Tracks: page views, unique visitors, top pages, referrers, countries, devices
5. No code changes needed — Vercel Analytics is built into the hosting

For more detailed analytics, consider adding Google Analytics (GA4) later.

---

## Products (Pre-loaded)

| Product | Origin | Roast | Base Price/lb |
|---------|--------|-------|---------------|
| Ethiopian Yirgacheffe | Ethiopia | Light | $14.95 |
| Colombian Supremo | Colombia | Medium | $12.95 |
| Guatemala Antigua | Guatemala | Medium-Dark | $13.95 |
| Brazil Santos Natural | Brazil | Medium | $10.95 |
| Sumatra Mandheling | Indonesia | Dark | $13.95 |
| Valley House Blend | Blend | Medium | $11.95 |
| Espresso Classico | Blend | Medium-Dark | $12.95 |
| Kenya AA Nyeri | Kenya | Light | $16.95 |

Editable from Admin > Products. These are base prices — each customer can have custom pricing set by the admin.

---

## Custom Pricing

Each customer can have unique per-product wholesale pricing:

1. Admin > Customers > Click customer name
2. "Custom Pricing" section shows all products
3. Enter custom $/lb price (leave blank = use base price)
4. Click "Save Pricing"
5. Customer automatically sees their custom price when ordering

---

## Tech Stack Reference

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 | React framework, server rendering, SEO |
| Styling | Tailwind CSS + shadcn/ui | Design system and components |
| Hosting | Vercel | Deployment, CDN, analytics |
| Database | Supabase (PostgreSQL) | Data storage with row-level security |
| Auth | Supabase Auth | User registration, login, sessions |
| Payments | Stripe Checkout | Secure payment processing |
| Fonts | Playfair Display + Inter | Premium typography |
| Source | GitHub | Version control |

---

## SEO

Optimized for: "Wholesale Coffee", "Roasted Coffee", "Specialty Coffee Roaster", "Coffee Supplier"

Built-in:
- JSON-LD structured data (Organization + FAQ schemas)
- Dynamic sitemap at `/sitemap.xml`
- `robots.txt` blocking portal/admin from search engines
- Meta titles and descriptions on all pages
- Mobile-responsive design

---

## Brand Identity

- **Primary Color**: Amber/Gold `#c8720c` (desert sunset from logo)
- **Secondary Color**: Rich Coffee Brown `#1c1210`
- **Background**: Warm White `#fefcf9`
- **Fonts**: Playfair Display (headings) + Inter (body text)
- **Logo**: Desert sunset coffee bean with cacti — `public/logo.png`

---

## Support & Maintenance

- **Code changes**: Push to GitHub → Vercel auto-deploys in ~1 minute
- **Database**: Supabase dashboard for data management
- **Payments**: Stripe dashboard for viewing payments, issuing refunds
- **Orders**: Admin dashboard at `/admin` for day-to-day operations
- **Customer issues**: Admin can approve/revoke accounts, reset custom pricing
