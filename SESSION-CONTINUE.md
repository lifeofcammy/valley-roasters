# Valley Specialty Roasters - Session Continuation Guide

**Paste this into a new Claude Code session to pick up where we left off.**

---

## Context

I'm building a B2B wholesale coffee website for Valley Specialty Roasters (client in Gilbert, AZ). The site is functional and needs refinement before client presentation.

**GitHub Repo**: https://github.com/lifeofcammy/valley-roasters
**Local Path**: C:\Users\moali\valley-roasters
**Supabase Project ID**: poldnqhuuofgbdxkiyzj (project name: "Valley Roasters", region: us-east-1)
**Supabase URL**: https://poldnqhuuofgbdxkiyzj.supabase.co
**Domain**: valleyspecialtyroasters.com (GoDaddy)
**Client Contact**: Jackie Ludgate, Top Cup Coffee House, Gilbert AZ

## Tech Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui (base-ui version, NOT Radix — no `asChild`, use `render` prop)
- Supabase (PostgreSQL + Auth + RLS)
- Stripe Checkout for payments
- Vercel for hosting
- Fonts: Playfair Display (display/headings) + Inter (body)

## What's Built & Working
1. Marketing pages: Homepage (full-screen hero with logo), About, Wholesale (SEO-optimized), Contact
2. Auth: Login (email/password + magic link), Register (with admin approval gate), Pending Approval page
3. Customer Portal: Order history, Order detail, Reorder page (pre-fills cart from past orders), Account settings
4. Stripe Integration: Checkout API route, Webhook handler for payment confirmation
5. Admin Dashboard: Overview with stats, Orders list + status management, Customer list + approval + custom pricing editor, Products CRUD
6. Database: 6 migrations applied, 8 coffee products seeded, RLS policies enforced
7. SEO: Sitemap, robots.txt, JSON-LD schemas, meta tags
8. Logo: Real logo at public/logo.png (desert sunset coffee bean with cacti)
9. Handoff doc: HANDOFF.md with full setup instructions for the client

## What Still Needs Work
- [ ] Deploy to Vercel (needs to connect GitHub repo, add env vars)
- [ ] Get Supabase service_role key and add to .env.local
- [ ] Set up Stripe test account and add keys
- [ ] Test full auth flow (register → admin approve → login → order → pay)
- [ ] Wholesale and About pages need the same visual treatment as homepage (full-bleed images, dramatic layouts)
- [ ] Contact form needs backend (currently client-side only)
- [ ] Replace Unsplash placeholder images with Valley Roasters' actual photos when available
- [ ] Replace placeholder testimonial with real customer quote (Jackie Ludgate already connected)
- [ ] Vercel Analytics setup
- [ ] Consider adding Square POS info to handoff doc (client may use Square in-store + Stripe online)
- [ ] Mobile testing and polish
- [ ] Final commit and push to GitHub with latest visual changes

## Key Design Decisions
- Colors: Amber/gold primary (#c8720c) matching logo's desert sunset, rich brown secondary (#1c1210)
- Logo is displayed LARGE (280px) as the hero centerpiece — user specifically requested this
- User wants premium, vibrant, dramatic design inspired by Onyx Coffee Lab, Ceremony Coffee, Intelligentsia
- User does NOT want muddy/flat brown — wants contrast and visual energy
- Full-bleed image sections, not contained cards
- B2B wholesale first, DTC retail expansion planned later

## Important Notes
- shadcn/ui uses base-ui (NOT Radix) in this version — DialogTrigger uses `render` prop instead of `asChild`
- Select `onValueChange` passes `string | null`, not `string` — handle null with fallback
- The `src/app/page.tsx` (default Next.js page) was deleted — homepage is at `src/app/(marketing)/page.tsx`
- .env.local is gitignored — keys are NOT in the repo
- Client's logo was emailed by Jackie Ludgate from Top Cup Coffee House
- The user (Cam) wants a handoff doc (HANDOFF.md) that Valley Roasters can follow to set up their own accounts (Supabase, Vercel, Stripe)
