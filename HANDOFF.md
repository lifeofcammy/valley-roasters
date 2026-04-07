# Valley Specialty Roasters - Website Handoff Guide

## Overview

This is the complete website for Valley Specialty Roasters, a premium B2B wholesale coffee platform. It includes a public marketing website, a customer ordering portal with one-click reorder, and an admin dashboard for managing orders, customers, and products.

**Live URL**: (will be added after Vercel deployment)
**Domain**: valleyspecialtyroasters.com (GoDaddy)

---

## Tech Stack

| Service | Purpose | Dashboard URL |
|---------|---------|---------------|
| **Vercel** | Website hosting | https://vercel.com/dashboard |
| **Supabase** | Database, auth, storage | https://supabase.com/dashboard/project/poldnqhuuofgbdxkiyzj |
| **Stripe** | Payment processing | https://dashboard.stripe.com |
| **GitHub** | Source code | https://github.com/lifeofcammy/valley-roasters |
| **GoDaddy** | Domain registrar | https://dcc.godaddy.com |

---

## Accounts & Access

### Supabase (Database & Authentication)
- **Project Name**: Valley Roasters
- **Project ID**: `poldnqhuuofgbdxkiyzj`
- **Region**: US East (N. Virginia)
- **Dashboard**: https://supabase.com/dashboard/project/poldnqhuuofgbdxkiyzj
- **API URL**: https://poldnqhuuofgbdxkiyzj.supabase.co

### Stripe (Payments)
- **Status**: Needs setup
- **Steps to activate**:
  1. Go to https://dashboard.stripe.com and create account
  2. Get your API keys from https://dashboard.stripe.com/apikeys
  3. Update the environment variables in Vercel (see Environment Variables section)
  4. Register webhook endpoint: `https://valleyspecialtyroasters.com/api/stripe/webhook`
  5. Subscribe to events: `checkout.session.completed`, `payment_intent.payment_failed`, `charge.refunded`

### Vercel (Hosting)
- **Status**: Needs deployment
- **Steps**: Connect GitHub repo to Vercel, add environment variables, deploy

---

## Environment Variables

These need to be set in Vercel project settings (Settings > Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://poldnqhuuofgbdxkiyzj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(get from Supabase dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=(get from Supabase dashboard > Settings > API - KEEP SECRET)
STRIPE_SECRET_KEY=(from Stripe dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(from Stripe dashboard)
STRIPE_WEBHOOK_SECRET=(from Stripe webhook setup)
NEXT_PUBLIC_SITE_URL=https://valleyspecialtyroasters.com
```

---

## How It Works

### For Customers (Wholesale Buyers)

1. **Register**: Go to `/register`, fill out company info
2. **Wait for Approval**: Admin approves the account in the admin dashboard
3. **Login**: Go to `/login`, sign in with email/password
4. **Browse & Order**: Go to "New Order" to see products at their custom wholesale pricing
5. **Checkout**: Click "Proceed to Checkout" to pay via Stripe
6. **Reorder**: On the Orders page, click "Reorder" on any past order to instantly re-fill the cart

### For Valley Roasters Staff (Admin)

1. **Login**: Use an admin account at `/login`
2. **Dashboard** (`/admin`): See overview of orders, revenue, and customers
3. **Orders** (`/admin/orders`): View all orders, click into any order to update status (pending > confirmed > roasting > shipped > delivered)
4. **Customers** (`/admin/customers`):
   - **Approve new customers**: Click "Approve" next to pending accounts
   - **Set custom pricing**: Click into a customer, set per-product custom prices
5. **Products** (`/admin/products`): Add, edit, or deactivate coffee products

### Order Status Flow

```
pending → confirmed → roasting → shipped → delivered
```

- `pending`: Order placed, awaiting payment
- `confirmed`: Payment received (automatic via Stripe webhook)
- `roasting`: Staff marks when roasting begins
- `shipped`: Staff marks when shipped
- `delivered`: Staff marks when delivered

---

## Creating the First Admin Account

1. Go to `/register` and create an account
2. Go to Supabase dashboard > SQL Editor
3. Run this SQL (replace the email with the admin's actual email):
   ```sql
   UPDATE public.profiles
   SET role = 'admin', is_approved = true
   WHERE email = 'admin@valleyspecialtyroasters.com';
   ```
4. Now login at `/login` - you'll see the Admin Dashboard link in the sidebar

---

## Products (Pre-loaded)

The following 8 coffees are already in the database:

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

These can be edited, added to, or removed from the Admin > Products page.

---

## Custom Pricing

Each customer can have unique per-product pricing. To set custom prices:

1. Go to Admin > Customers
2. Click on a customer name
3. In the "Custom Pricing" section, enter the custom $/lb price for each product
4. Leave blank to use the base price
5. Click "Save Pricing"

The customer will automatically see their custom price when placing orders.

---

## Domain Setup (GoDaddy → Vercel)

After deploying to Vercel:

1. In Vercel: Go to Project Settings > Domains > Add `valleyspecialtyroasters.com`
2. In GoDaddy: Update DNS records as Vercel instructs (typically an A record to `76.76.21.21` and CNAME for `www`)
3. Vercel will automatically provision an SSL certificate

---

## SEO

The site is optimized for these keywords:
- "Wholesale Coffee"
- "Roasted Coffee"
- "Specialty Coffee Roaster"
- "Wholesale Coffee Beans"
- "Coffee Supplier"

Key SEO features:
- JSON-LD structured data (Organization schema + FAQ schema on /wholesale)
- Dynamic sitemap at `/sitemap.xml`
- robots.txt blocking portal/admin from search engines
- Meta titles and descriptions on all pages
- Mobile-responsive design

---

## Brand Identity

- **Primary Color**: Deep burgundy `#7c2d2d` (coffee/mahogany tones)
- **Secondary Color**: Warm copper `#c4956a`
- **Background**: Warm off-white `#faf9f6`
- **Fonts**: Playfair Display (headings) + Inter (body text)
- **Logo**: Text-mark "VALLEY / SPECIALTY ROASTERS" with coffee bean icon

---

## Support & Maintenance

- **Source code**: GitHub (all changes should go through here)
- **Database**: Supabase dashboard for data management
- **Payments**: Stripe dashboard for payment management, refunds
- **Hosting**: Vercel auto-deploys when code is pushed to GitHub

To make code changes: Edit files in GitHub → Vercel auto-deploys in ~1 minute.
