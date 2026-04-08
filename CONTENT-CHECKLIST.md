# Valley Specialty Roasters - Content to Replace

This document lists ALL placeholder/filler content on the website that needs to be replaced with real information from Valley Specialty Roasters. Nothing goes live until these are confirmed.

---

## QUESTIONNAIRE FOR VALLEY ROASTERS

Please answer these questions so we can update the site with accurate information:

### Company Info
- [ ] What is your full business address?
- [ ] What is your business phone number?
- [ ] What is your primary contact email? (we used info@valleyspecialtyroasters.com)
- [ ] What city/state are you based in? (we assumed Gilbert, Arizona)
- [ ] Do you have a tagline or slogan you use?

### Your Story (About Page)
- [ ] How did Valley Specialty Roasters get started? Who founded it and why?
- [ ] What is your roasting philosophy? What makes your approach different?
- [ ] What countries/regions do you currently source from?
- [ ] Do you have any certifications? (Organic, Fair Trade, B-Corp, etc.)
- [ ] How many years have you been roasting?
- [ ] Any awards or recognition?

### Products
- [ ] Are the 8 products we listed accurate? (Ethiopian Yirgacheffe, Colombian Supremo, Guatemala Antigua, Brazil Santos Natural, Sumatra Mandheling, Valley House Blend, Espresso Classico, Kenya AA Nyeri)
- [ ] Are the descriptions, origins, and flavor notes correct for each?
- [ ] What are your actual wholesale base prices per lb?
- [ ] What bag sizes do you offer? (we assumed 5lb, 25lb, 50lb)
- [ ] What is the minimum order quantity?
- [ ] Are there products we should add or remove?
- [ ] Do you have product photos we can use?

### Customers & Testimonials
- [ ] How many wholesale customers do you currently have? (we said "15+")
- [ ] Can we use a real testimonial quote? From whom? (we made up a quote attributed to Jackie Ludgate / Top Cup Coffee House — is she okay with this?)
- [ ] Are there other customers willing to provide quotes?

### Wholesale Program
- [ ] What is your typical roast-to-ship turnaround? (we said "48 hours")
- [ ] Do you offer custom blends or private labeling? (we said yes)
- [ ] How quickly do you typically approve new wholesale accounts? (we said "1 business day")
- [ ] Do you offer samples for prospective partners?
- [ ] What payment terms do you offer? (net 30, due on delivery, etc.)

### Photos
- [ ] Do you have photos of your roastery/facility?
- [ ] Do you have photos of your coffee bags/packaging?
- [ ] Do you have photos of your team?
- [ ] Do you have photos of coffee being roasted?
- [ ] Any photos of partner cafes using your coffee?

(Currently using Unsplash stock photos as placeholders — these MUST be replaced with real photos before launch)

---

## PLACEHOLDER CONTENT LOCATIONS

### Homepage (`src/app/(marketing)/page.tsx`)

| Line/Section | Current Placeholder | Needs |
|-------------|-------------------|-------|
| Hero subtitle | "Arizona's finest cafes, restaurants, and businesses" | Confirm region/market |
| Location badge | "Gilbert, Arizona" | Confirm city |
| Stats: "8+" | "8+ Single Origins" | Real number of origins |
| Stats: "15+" | "15+ Wholesale Partners" | Real customer count |
| Stats: "100%" | "100% Specialty Grade" | Confirm this is accurate |
| Stats: "48hr" | "48hr Roast to Ship" | Real turnaround time |
| Feature 01 text | "Ethiopia, Colombia, Guatemala, Kenya, and beyond" | Real sourcing origins |
| Testimonial quote | "Valley Specialty Roasters completely transformed our coffee program. The quality is unmatched." | NEED REAL QUOTE — this is completely made up |
| Testimonial attribution | "Jackie Ludgate, Top Cup Coffee House, Gilbert, AZ" | NEED PERMISSION to use her name, or use a different customer |
| All images | Unsplash stock photos | Replace with real Valley Roasters photography |

### About Page (`src/app/(marketing)/about/page.tsx`)

| Section | Current Placeholder | Needs |
|---------|-------------------|-------|
| Hero text | "great coffee starts with great relationships" | Confirm or rewrite |
| "Our Journey" paragraph 1 | Generic founding story | REAL founding story |
| "Our Journey" paragraph 2 | "Ethiopia, Colombia, Guatemala, Kenya, Brazil, Indonesia" | Real sourcing list |
| "Our Journey" paragraph 3 | Generic roasting philosophy | REAL roasting philosophy |
| "Ethical Sourcing" | "We pay premiums above market rate" | Confirm this is true |
| "Craft Roasting" | Generic quality statement | Real details about their process |
| "Partner Success" | "training resources, brewing guidance" | Confirm they offer this |
| All images | Unsplash stock photos | Replace with real photos |

### Wholesale Page (`src/app/(marketing)/wholesale/page.tsx`)

| Section | Current Placeholder | Needs |
|---------|-------------------|-------|
| "minimum order is 5 lbs" | FAQ answer | Confirm minimum order |
| "roasted within 24-48 hours" | FAQ answer | Confirm turnaround |
| "custom blends and private labeling" | FAQ answer | Confirm they offer this |
| "approve accounts within 1 business day" | FAQ answer | Confirm timeline |
| Product listings | 8 products from database | Verify all products are accurate |

### Contact Page (`src/app/(marketing)/contact/page.tsx`)

| Item | Current | Needs |
|------|---------|-------|
| Email | info@valleyspecialtyroasters.com | Confirm real email |
| Phone | "Available upon request" | Real phone number |
| Location | "Gilbert, Arizona" | Real city |

### Footer (`src/components/marketing/Footer.tsx`)

| Item | Current | Needs |
|------|---------|-------|
| Email | info@valleyspecialtyroasters.com | Confirm |
| Location | "Gilbert, Arizona" | Confirm |

### Product Database (Supabase)

All 8 products need verification:
- [ ] Product names correct?
- [ ] Descriptions accurate?
- [ ] Flavor notes accurate?
- [ ] Origins correct?
- [ ] Roast levels correct?
- [ ] Base prices correct?
- [ ] Available sizes correct?
- [ ] Any products to add or remove?

---

## STOCK IMAGES TO REPLACE

These Unsplash images are placeholders and should be replaced with Valley Roasters' real photography:

| Location | Current Image | Replace With |
|----------|--------------|-------------|
| Homepage hero background | Coffee art stock photo | Roastery photo or product shot |
| Feature section 1 | Green coffee beans stock | Their sourcing/green coffee |
| Feature section 2 | Coffee cup stock | Their roasting process |
| Feature section 3 | Coffee farm stock | Their packaging or delivery |
| Product card 1 | Coffee beans stock | Actual product photo |
| Product card 2 | Coffee beans stock | Actual product photo |
| Product card 3 | Coffee beans stock | Actual product photo |
| Product card 4 | Coffee drink stock | Actual product photo |
| Testimonial background | Barista stock | Their cafe partner photo |
| About hero | Coffee prep stock | Their team or roastery |
| About story section | Coffee facility stock | Their actual facility |
| About values cards (3) | Various stock | Their real photos |

---

## ONCE QUESTIONNAIRE IS COMPLETE

1. Update all text content in the files listed above
2. Replace stock images with real photos (add to `public/` folder)
3. Update product data in Supabase database
4. Get written permission for any customer testimonials
5. Final review with Valley Roasters before going live
