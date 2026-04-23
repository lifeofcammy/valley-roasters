import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title:
    "The Complete Equipment Checklist for Opening a Coffee Shop (and What Each Costs) | Valley Specialty Roasters",
  description:
    "A line-by-line checklist of every piece of equipment a specialty coffee shop needs to open — with realistic 2026 price ranges, priority levels, and where to save.",
  keywords: [
    "coffee shop equipment list",
    "open a coffee shop cost",
    "coffee shop startup equipment",
    "espresso machine cost",
    "coffee shop equipment budget",
  ],
};

export default function EquipmentChecklistPage() {
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
            <span className="font-semibold text-primary">Equipment</span>
            <span className="text-foreground/40">·</span>
            <span className="text-foreground/60">12 min read</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            The complete equipment checklist for opening a coffee shop
            (and what each costs)
          </h1>
          <p className="text-foreground/60">Published April 23, 2026</p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-6 text-foreground/80 leading-relaxed">
          <p className="text-lg">
            Opening a specialty coffee shop typically means spending
            $35,000 to $80,000 on equipment before you've sold a single
            cup. Every vendor pushes their most expensive option. Here's
            what you actually need, how much each piece realistically
            costs in 2026, and which items are worth paying for vs.
            where to save.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            The bar essentials ($25k–$50k)
          </h2>

          <h3 className="font-display text-xl font-bold text-foreground pt-4">
            Espresso machine — $10,000 to $25,000
          </h3>
          <p>
            The centerpiece. For a new specialty shop, a 2-group
            commercial machine from La Marzocco, Slayer, or Synesso is
            the workhorse. Expect $15,000–$20,000 new for a 2-group
            Linea. Higher volume warrants a 3-group at $22,000–$30,000.
            Below $10,000 new, you're looking at semi-commercial gear
            that won't survive a busy morning.
          </p>
          <p>
            <em>Don't save here.</em> The espresso machine is the
            single most important piece of equipment in your shop. A
            cheap machine will produce inconsistent shots that bleed
            customers for years.
          </p>

          <h3 className="font-display text-xl font-bold text-foreground pt-4">
            Espresso grinder — $2,500 to $5,000
          </h3>
          <p>
            Arguably more important than the machine itself. A good
            grinder (Mahlkönig E65S, EK43, Mazzer Robur) produces the
            consistent particle size that makes the espresso actually
            taste good. Budget grinders grind inconsistently, which
            sabotages every shot.
          </p>
          <p>
            <em>Don't save here either.</em> If you have to choose
            between a fancier machine and a better grinder, pick the
            grinder.
          </p>

          <h3 className="font-display text-xl font-bold text-foreground pt-4">
            Second grinder (decaf or single origin) — $1,500 to $3,000
          </h3>
          <p>
            Mandatory if you serve both regular and decaf. You cannot
            use the same grinder for both without cross-contamination of
            grounds. A dedicated decaf grinder can be a step down from
            your main — something like a Mazzer Super Jolly works fine
            since decaf volume is typically low.
          </p>

          <h3 className="font-display text-xl font-bold text-foreground pt-4">
            Batch brewer — $2,500 to $5,000
          </h3>
          <p>
            For drip coffee. A Marco or Fetco batch brewer is standard.
            Skip the 4-pot home setups — they're false economy for a
            commercial operation. A proper 1.5-gallon commercial brewer
            keeps pace with morning rush without holding coffee past
            its freshness window.
          </p>

          <h3 className="font-display text-xl font-bold text-foreground pt-4">
            Water filtration — $500 to $2,000
          </h3>
          <p>
            The most commonly underestimated piece of equipment.
            Municipal water has minerals that destroy espresso machines
            through scale buildup. A proper filtration system (Everpure,
            3M, Optipure) extends machine life by years and improves
            cup quality.
          </p>
          <p>
            <em>Do not skip water filtration.</em> Replacing a scaled
            espresso machine after 18 months is a $15,000 mistake. A
            $1,000 filter system is cheap insurance.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Barista tools and accessories ($1,500–$2,500)
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Milk steaming pitchers (3–6 in different sizes): $150</li>
            <li>Tamper (58mm, calibrated): $75–$200</li>
            <li>Portafilter baskets (VST or IMS): $100–$200</li>
            <li>Knockbox: $50–$150</li>
            <li>Barista scale (Acaia or similar): $200</li>
            <li>Temperature gauges and thermometers: $100</li>
            <li>Timer(s) on bar: $50</li>
            <li>Distribution tool (WDT or leveler): $50–$150</li>
            <li>Cleaning supplies (Cafiza, brushes, cloths): $150</li>
            <li>Syrup pumps and bottles: $100</li>
          </ul>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Refrigeration and prep ($3,000–$7,000)
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Undercounter refrigerator for milk and cold drinks:
              $1,500–$3,500
            </li>
            <li>
              Reach-in refrigerator for backup / pastries:
              $2,000–$4,000
            </li>
            <li>
              Freezer (if serving frozen drinks or storing beans):
              $1,000–$2,500
            </li>
            <li>Ice machine: $2,000–$4,000</li>
            <li>
              Milk pitchers rinser / rinser-basin combo: $300–$600
            </li>
          </ul>
          <p>
            <em>Ice machine note:</em> if you serve iced drinks, a
            proper ice machine is essential. Countertop ice makers will
            get overwhelmed by mid-morning on a hot day.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Point of sale and digital ($1,500–$3,500)
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>POS system (Square, Toast, Clover): $0 upfront to $2,000</li>
            <li>iPad or terminal hardware: $500–$1,200</li>
            <li>Receipt printer: $200–$400</li>
            <li>Card reader: $100–$400</li>
            <li>Cash drawer: $100–$200</li>
            <li>
              Customer display / menu board screens: $500–$2,000
            </li>
          </ul>
          <p>
            Square's Hobby-tier hardware starter kit covers most of
            this for under $1,000. Toast and Clover get more expensive
            but offer more enterprise features. For most first-location
            specialty shops, Square is sufficient and keeps monthly
            overhead low.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Furniture and build-out ($5,000–$25,000)
          </h2>
          <p>
            Hugely variable depending on your space size and design
            ambition. Core items:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Bar counter and back bar (custom or modular): $3,000–$15,000</li>
            <li>Tables and chairs: $2,000–$8,000</li>
            <li>Merchandising shelves (retail bean display): $500–$2,000</li>
            <li>Signage (interior and exterior): $1,500–$5,000</li>
            <li>Lighting fixtures: $500–$3,000</li>
          </ul>
          <p>
            Furniture is where to save. Used commercial tables and
            chairs from restaurant closeouts are fine. Custom millwork
            for the bar counter is where to invest, since it's front
            and center for every customer.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Cups, bags, and recurring supplies ($500–$1,500 initial)
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To-go cups (hot, cold, sizes): $300–$500 per case</li>
            <li>Lids: $150–$300</li>
            <li>Sleeves: $100</li>
            <li>Straws and stirrers: $100</li>
            <li>Retail bean bags with valves: $500 for 1,000 bags</li>
            <li>Napkins and printed supplies: $200</li>
          </ul>
          <p>
            These are recurring costs, but you need to stock your first
            month before opening. Budget $1,000–$1,500 for initial
            inventory.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Often forgotten
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Fire extinguisher and first aid kit</strong>
              (health code): $150
            </li>
            <li>
              <strong>Hand-washing sink</strong> (separate from ware
              sink; code requirement): $800–$1,500
            </li>
            <li>
              <strong>Mop sink</strong> (code requirement in most
              jurisdictions): $600
            </li>
            <li>
              <strong>Three-compartment sink</strong> for ware washing:
              $1,500–$3,000
            </li>
            <li>
              <strong>Hood vent</strong> if your build includes any
              cooking: $3,000–$10,000
            </li>
            <li>
              <strong>Security cameras and alarm system</strong>:
              $800–$2,500
            </li>
            <li>
              <strong>WiFi network</strong> (for customers and POS):
              $300–$1,500 setup
            </li>
            <li>
              <strong>Music system</strong> (commercial streaming
              license + speakers): $400–$1,500
            </li>
          </ul>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Total budget ranges
          </h2>
          <p>
            Putting it together, a realistic equipment budget for a
            first-location specialty coffee shop in 2026:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Lean build:</strong> $35,000–$45,000 (used
              furniture, basic POS, mid-range espresso machine)
            </li>
            <li>
              <strong>Standard build:</strong> $50,000–$70,000
              (good-quality espresso machine, dedicated decaf grinder,
              proper build-out)
            </li>
            <li>
              <strong>Premium build:</strong> $80,000–$120,000 (top-tier
              espresso machine, custom millwork, full design treatment)
            </li>
          </ul>
          <p>
            These exclude lease improvements, permits, and the coffee
            shop's initial inventory. Add 15–25% for those.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Where to save vs. where to spend
          </h2>
          <p>
            <strong>Spend on:</strong> espresso machine, grinders, water
            filtration, bar counter, signage. These are the pieces
            customers interact with or that affect cup quality every
            single day.
          </p>
          <p>
            <strong>Save on:</strong> furniture (used is fine), ice
            machine (rent vs. buy), POS hardware (Square starter kit),
            shelving, signage inside back areas.
          </p>
          <p>
            <strong>Rent, don't buy:</strong> ice machines, large
            display coolers, grease traps, and any equipment with
            frequent maintenance. Rental contracts often include
            service, which adds up to savings over a 5-year lease term.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            The takeaway
          </h2>
          <p>
            Equipment is a one-time investment that affects daily
            operations for years. Under-spend on the bar and you pay in
            customer quality complaints. Over-spend on furniture and
            you're paying interest on chairs for half a decade. The
            right spread puts your money into the pieces customers
            taste and touch.
          </p>
          <p>
            When in doubt, bias spending toward the bar. A $6,000
            espresso setup in a plain room will build a loyal customer
            base faster than a $30,000 build-out around a mediocre
            espresso machine.
          </p>
        </div>
      </section>

      <section className="bg-muted/40 py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
            Related Service
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Equipment & Packaging
          </h2>
          <p className="text-foreground/70 mb-6">
            We help wholesale partners spec out exactly this list — with
            honest vendor recommendations and no commission pressure.
          </p>
          <Link
            href="/services/equipment-and-packaging"
            className="inline-flex items-center gap-1 text-primary font-semibold hover:gap-2 transition-all"
          >
            Learn about our equipment service
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}
