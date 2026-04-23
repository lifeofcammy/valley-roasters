# Valley Specialty Roasters — Operator Cheat Sheet

**For Valley staff operating the website day-to-day.**

**Website:** https://valleyspecialtyroasters.com
**Login URL:** https://valleyspecialtyroasters.com/login

> Passwords are **not** stored in this document. They were provided
> separately (printed handoff sheet). After first login, change your
> password via "Forgot password" on the login page.

---

## 🔑 Who has access

### Admin (Valley employees)
- `info@valleyspecialtyroasters.com` — full admin

### Wholesale customers (9 accounts, all approved and Square-linked)
- Beanchain Coffee
- The Crepe Club
- Shaghf Cafe
- Shaghf Cafe Glendale
- 10:19 Coffee
- Foch Cafe
- Sip & Shop
- Grotti's Pizza
- Aj Jazzar

---

## 🛠 Admin Dashboard (`/admin`)

| Tab | What it does |
|---|---|
| **Dashboard** | Overview — total orders, revenue, active customers, recent orders |
| **Orders** | All wholesale orders (from website + Square). Click any to open detail + change status |
| **Messages** | Contact form submissions from the public site |
| **Customers** | Approve new buyers, manage who's active, impersonate ("View as") |
| **Products** | Square coffee catalog — mark "Featured" for homepage, add marketing copy |
| **Settings** | Account preferences |

---

## ✅ The 4-Status Order Workflow (admin's main tool)

On any order detail page, the **Status** dropdown has 4 options:

| Status | What happens |
|---|---|
| **Order received** | Default — internal only, no customer email |
| **In process** | Publishes Square invoice → Square automatically emails the buyer with pay link |
| **Shipped** | Marks order as shipped (status update visible on customer's portal) |
| **Rejected** | Requires a reason. Cancels Square invoice → Square emails buyer with the reason |

**Rule of thumb for Valley staff:**
1. Check `/admin/orders` — new orders = "Order received"
2. Can fulfill? → flip to **In process** (Square emails invoice)
3. Out of stock? → flip to **Rejected** with reason (Square emails cancellation)
4. Order boxed + shipped? → flip to **Shipped**

---

## 👥 Customer Portal (`/portal`)

| Tab | What customers see |
|---|---|
| **Orders** | Their order history with status + payment info from Square (live) |
| **Catalog** | Product availability showcase. Buyers browse what Valley offers. **No prices shown** — instead they click "Request pricing" to inquire. Charlie / Jackie respond with a custom quote. "New to you" vs "Previously ordered" badges help buyers discover items. |
| **Account** | Profile, company info, settings |

---

## 💬 Pricing model (hybrid — inquiry for new items, reorder for repeat)

**New items (no history yet):**
- **Catalog** = product availability only. No public prices.
- Buyer clicks **"Request pricing"** → inquiry lands in admin Messages tab
- Charlie / Jackie respond with a custom quote
- Jackie creates the order in admin once pricing is agreed

**Repeat items (already ordered before):**
- Buyer opens **Orders** tab → sees past orders
- Clicks **"Reorder"** on any past order → cart pre-fills with the same items at their previously-agreed prices
- Buyer tweaks quantities → submits → Square invoice drafted automatically
- No inquiry needed; their negotiated pricing is already in Square's order history

This way existing wholesalers keep fast self-serve reordering, while new products always go through Charlie / Jackie for a custom quote.

## 💰 Delivery

- **Free delivery** on orders **$300+**
- **$5 delivery fee** auto-added to orders under $300
- Buyers see a nudge: "Add $X to unlock free shipping"

---

## ⚡ Square Integration (live, automatic)

| Event | What happens |
|---|---|
| Customer places order on website | Creates draft Square invoice automatically |
| Admin flips to "In process" | Square emails the invoice to buyer |
| Customer pays in Square | Website payment status updates in real time (via webhook) |
| Admin flips to "Rejected" | Square cancels invoice + emails buyer the reason |

**Square is the source of truth** for products, prices, customers, and payments. The website is the operational UI.

---

## 🌐 Marketing Site (public)

| Page | Contents |
|---|---|
| Home | Logo hero, value props, coffee selection |
| About | Company story |
| Wholesale | Catalog, how-it-works, FAQ |
| Services | 5 subpages: Origin & Selection, Custom Blends, Menu Building, Staff Training, Equipment & Packaging |
| Blog | 5 SEO articles |
| Contact | Contact form (submissions appear in admin Messages tab) |

---

## ⚠️ Known limitations (future upgrades)

- Orders created directly in Square (Jackie's phone/POS) show on admin as **read-only** — manage those in Square
- Checkout happens via Square's invoice email, not embedded on the website (Web Payments SDK is a future upgrade)
- Per-customer wholesale pricing still lives in Supabase (future: move to Square)
- No "shipped" email sent automatically (status updates in portal; future: add via Square invoice comments)

---

## 🔒 Security

- Initial passwords are **temporary onboarding credentials** — everyone should change theirs
- Only `info@valleyspecialtyroasters.com` has admin access
- Supabase service-role key and Square API tokens live in Vercel environment variables, not shared

---

## 📞 Getting help

If something breaks or doesn't look right, contact the developer (Cam).
For API/account ownership details, see `HANDOFF.md` in this repo.
