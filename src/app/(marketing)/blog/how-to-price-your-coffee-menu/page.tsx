import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title:
    "How to Price Your Coffee Menu: A Framework for New Café Owners | Valley Specialty Roasters",
  description:
    "Cost-plus vs market pricing, how to model margin by drink, and the common mistakes new coffee shops make with their pricing — with worked examples.",
  keywords: [
    "coffee shop pricing",
    "how to price coffee drinks",
    "coffee shop menu pricing",
    "specialty coffee pricing strategy",
    "coffee shop margins",
  ],
};

export default function HowToPriceCoffeeMenuPage() {
  return (
    <article>
      <section className="bg-gradient-to-b from-muted/50 to-background py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          <div className="flex items-center gap-3 mb-5 text-xs uppercase tracking-wider">
            <span className="font-semibold text-primary">
              Menu & Pricing
            </span>
            <span className="text-foreground/40">·</span>
            <span className="text-foreground/60">9 min read</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            How to price your coffee menu: a framework for new café
            owners
          </h1>
          <p className="text-foreground/60">Published April 23, 2026</p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-6 text-foreground/80 leading-relaxed">
          <p className="text-lg">
            Menu pricing is one of the few decisions in a coffee shop
            that directly determines whether the business survives. Too
            high and customers bounce. Too low — the more common
            mistake — and you can't cover labor, rent, and cost of
            goods. This is a framework for pricing your coffee menu with
            eyes open.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Two approaches — and why you need both
          </h2>
          <p>
            There are two dominant philosophies to menu pricing, and new
            operators often treat them as a binary choice. They're not.
            You need both.
          </p>
          <p>
            <strong>Cost-plus pricing</strong> starts from what your
            drink costs to make, then adds your target margin. Useful
            because it tells you the floor — the price below which you
            lose money on every cup.
          </p>
          <p>
            <strong>Market pricing</strong> starts from what customers
            in your area will pay, by looking at competitors and local
            demographics. Useful because it tells you the ceiling — the
            price above which customers go elsewhere.
          </p>
          <p>
            Your actual price sits somewhere in that range. If the floor
            is above the ceiling, you have a business model problem, not
            a pricing problem.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Step 1: Model your cost of goods per drink
          </h2>
          <p>
            Start with a latte as the canonical example. A typical
            12 oz latte includes:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Espresso: ~18g of coffee</li>
            <li>Milk: ~10 oz</li>
            <li>Cup, lid, sleeve, straw</li>
            <li>Syrup (if flavored)</li>
          </ul>
          <p>
            Using approximate wholesale prices (these vary by market —
            use your own):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Coffee at $15/lb wholesale: 18g = ~$0.60
            </li>
            <li>Whole milk at $3/gallon: 10 oz = ~$0.23</li>
            <li>Cup + lid + sleeve: ~$0.30</li>
            <li>Total COGS: ~$1.15 per latte</li>
          </ul>
          <p>
            This is before any labor allocation or overhead. A latte
            priced at $5.50 has a product margin of about 80% — which
            sounds huge until you realize labor typically eats 30–35% of
            revenue in a coffee shop. Your real margin after paying the
            barista who made it is closer to 45–50%.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Step 2: Set your target margin
          </h2>
          <p>
            A financially healthy specialty coffee shop operates with
            gross margins in the 65–75% range on drinks (COGS only, not
            including labor). After labor, occupancy, and overhead,
            you're targeting 10–15% net margin on the full business.
          </p>
          <p>
            Translating that to per-drink pricing: if your latte costs
            $1.15 to make and you want 70% gross margin, the price needs
            to be at least $3.85. That's your floor. Below it, you're
            not even covering your non-labor costs with enough room to
            operate.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Step 3: Survey the market
          </h2>
          <p>
            Walk to every specialty coffee shop within a 10-minute drive
            of your location. Order their 12 oz latte. Note the price.
            Take a picture of the menu board. This sounds tedious but
            takes an afternoon and gives you real data instead of
            assumptions.
          </p>
          <p>
            You'll typically see a range. In a major metro in 2026, a
            12 oz latte at an independent specialty shop runs $5.25 to
            $6.25. Suburban and exurban markets run $4.75 to $5.75.
            Drive-thru and quick-service runs $4.00 to $5.00.
          </p>
          <p>
            Your price should sit in the band that matches your format
            and location. Pricing $0.50 below the band can feel like a
            smart differentiation — it's often a mistake. Customers
            associate low price with low quality, and the lost margin
            hurts for years.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Step 4: Structure the menu
          </h2>
          <p>
            Size tiers matter. Most shops price 12 oz / 16 oz / 20 oz at
            roughly $0.50 increments. The 12 oz anchor gets the quality
            buyer who wants a properly sized drink; the 20 oz gets the
            volume buyer. A well-structured size tier steers customers
            toward the middle option, which is usually your best-margin
            SKU.
          </p>
          <p>
            Flavored drinks get a syrup premium — typically $0.50 to
            $0.75 more than the plain version. Alternative milks get a
            premium too — usually $0.75 to $1.00 for oat, almond, or
            coconut.
          </p>
          <p>
            Specialty drinks — your honey lavender latte, your seasonal
            pumpkin something — can and should command a premium above
            your base latte. These are the menu items with the most
            pricing flexibility because they're not directly comparable
            to other shops.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Common pricing mistakes
          </h2>
          <p>
            <strong>Pricing down to "seem affordable."</strong> Every
            specialty shop that undercuts the market by a dollar ends up
            regretting it within a year. Customers don't choose specialty
            coffee on price. They choose it on perceived quality. Cheap
            signals cheap.
          </p>
          <p>
            <strong>Forgetting labor.</strong> Your COGS calculation is
            only the coffee and materials. If you don't bake labor into
            your pricing thinking, you'll run a shop with healthy-looking
            drink margins that somehow loses money every month.
          </p>
          <p>
            <strong>Round-number pricing.</strong> A $5.00 latte feels
            significantly more expensive than a $4.75 latte. Psychological
            pricing works in coffee. Most successful shops price in
            $0.25 increments ending in $0.25, $0.50, or $0.75.
          </p>
          <p>
            <strong>Never adjusting.</strong> Coffee and milk prices rise.
            Labor costs rise. If you priced in 2024 and haven't adjusted,
            you're effectively charging less today in real dollars.
            Annual pricing review is normal and necessary — most shops
            adjust $0.25 across the board every 12–18 months.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Worked example: an espresso menu
          </h2>
          <p>
            For a suburban specialty shop opening in 2026, a reasonable
            core espresso menu might land like this:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Espresso (single shot): $3.75</li>
            <li>Espresso (double shot): $4.25</li>
            <li>Americano 12 oz: $4.50</li>
            <li>Cortado: $4.75</li>
            <li>Cappuccino: $5.00</li>
            <li>Latte 12 / 16 / 20 oz: $5.25 / $5.75 / $6.25</li>
            <li>Flat white: $5.50</li>
            <li>Mocha 12 / 16 / 20 oz: $5.75 / $6.25 / $6.75</li>
          </ul>
          <p>
            Alt milk adds $0.75. Flavor shots add $0.50. These numbers
            move with your market — this is an illustrative baseline,
            not a prescription.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            What to do if your costs won't support the market ceiling
          </h2>
          <p>
            Occasionally a new operator runs the math and discovers that
            their cost structure requires prices above what the market
            will bear. This is a sign to rework the cost side, not the
            price side.
          </p>
          <p>
            Common fixes: negotiate a better wholesale coffee price (our
            partners often find 10–15% savings switching to a specialty
            roaster with the right volume), tighten labor scheduling,
            reduce waste (milk runoff during steaming is a surprising
            cost center), or find a less expensive lease. Pricing
            yourself above the market to cover an inefficient operation
            is how shops close.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            The takeaway
          </h2>
          <p>
            Start with costs. Survey the market. Place yourself in the
            band that matches your format and quality level. Avoid the
            discount trap. Review prices annually. That's the entire
            framework — the work is in the details underneath each step.
          </p>
          <p>
            Pricing is one of the few business decisions where
            discipline pays for years. A shop that gets it right builds
            margin that funds every other decision. A shop that gets it
            wrong fights to catch up for the whole life of the business.
          </p>
        </div>
      </section>

      <section className="bg-muted/40 py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
            Related Service
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Menu Building
          </h2>
          <p className="text-foreground/70 mb-6">
            Want help applying this framework to your specific menu and
            market? We build menu + pricing with wholesale partners as
            part of our consulting service.
          </p>
          <Link
            href="/services/menu-building"
            className="inline-flex items-center gap-1 text-primary font-semibold hover:gap-2 transition-all"
          >
            Learn about our menu building service
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}
