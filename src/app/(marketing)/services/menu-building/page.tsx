import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Coffee Shop Menu Building Consulting | Valley Specialty Roasters",
  description:
    "Design a coffee menu that sells — espresso, brew methods, seasonal drinks, and pricing that protects margin. Menu consulting for Arizona wholesale partners.",
  keywords: [
    "coffee shop menu consulting",
    "coffee menu design",
    "coffee shop pricing strategy",
    "specialty coffee menu",
    "coffee drink menu Arizona",
  ],
};

export default function MenuBuildingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16 sm:py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            href="/services"
            className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4" /> All services
          </Link>
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4">
            Service 03
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Menu Building
          </h1>
          <p className="text-lg sm:text-xl text-foreground/70 leading-relaxed">
            The menu is the product. We help you design one that customers
            understand, baristas can execute consistently, and your P&L
            will thank you for.
          </p>
        </div>
      </section>

      {/* What's included */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-3xl font-bold text-foreground mb-8">
            What's Included
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              "Core espresso menu — what drinks to offer and what to skip",
              "Brew method selection — pour over, batch, cold brew, nitro",
              "Milk, alternative milk, and syrup standards",
              "Signature drink development — 2–3 items only your shop has",
              "Seasonal rotation planning for the year",
              "Pricing strategy based on your cost of goods and local market",
              "Menu board layout advice — what customers actually read",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Why it matters */}
      <section className="bg-muted/40 py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-foreground mb-6">
            Why This Matters
          </h2>
          <p className="text-foreground/80 leading-relaxed mb-5">
            Most coffee shops overbuild their menu. Twenty-five drinks on
            the board, half of which nobody orders. This costs you three
            times: SKU complexity eats inventory, decision paralysis slows
            the line, and barista consistency drops the more drinks they
            need to keep in their head.
          </p>
          <p className="text-foreground/80 leading-relaxed mb-5">
            A tight menu beats a sprawling one. The best coffee shops offer
            10–15 clearly-named drinks, three of which account for 60% of
            orders. The rest are there to signal range, not drive volume.
            Menu building is the discipline of cutting the right items.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            Pricing is the second trap. New shops often underprice to seem
            competitive, then realize after three months they can't cover
            labor. We help you price with eyes open — what your coffee
            actually costs per cup, what the neighborhood will pay, and
            where the margin needs to come from.
          </p>
        </div>
      </section>

      {/* Our process */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-3xl font-bold text-foreground mb-8 text-center">
            Our Process
          </h2>
          <div className="space-y-6">
            {[
              {
                step: "1",
                title: "Brand & customer snapshot",
                body: "Who walks in? Morning commuters, afternoon remote workers, weekend strollers? Menu decisions cascade from this.",
              },
              {
                step: "2",
                title: "Core menu build",
                body: "We draft the essential espresso list — single shot, latte, cappuccino, americano, cortado, flat white — plus hot/iced and size tiers. Each drink has a reason to exist.",
              },
              {
                step: "3",
                title: "Signature drinks",
                body: "Two or three signature drinks — seasonal, themed, or built around your house blend — that customers come for specifically and can't get elsewhere.",
              },
              {
                step: "4",
                title: "Cost & price modeling",
                body: "We model cost of goods for every drink, factor in labor and waste, and set prices that give you the margin you need at realistic volume.",
              },
              {
                step: "5",
                title: "Menu board & documentation",
                body: "Final menu document your baristas train from, plus menu board copy tested for readability. Revisions after opening are included.",
              },
            ].map((p) => (
              <div
                key={p.step}
                className="flex gap-5 border border-border rounded-2xl p-6 bg-card"
              >
                <div className="inline-flex w-10 h-10 rounded-full bg-primary text-white font-bold items-center justify-center flex-shrink-0">
                  {p.step}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold mb-1">
                    {p.title}
                  </h3>
                  <p className="text-foreground/70 leading-relaxed">
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-foreground mb-8">
            Common Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "How many drinks should my menu have?",
                a: "For most specialty coffee shops, 10–15 clearly-named drinks is the sweet spot. Fewer if you're drive-thru volume; more only if you genuinely have distinct offerings (e.g., a full tea program). Complexity kills speed.",
              },
              {
                q: "Should I price based on competitors or on my costs?",
                a: "Both. Competitors set the ceiling; your costs set the floor. We model both and find your workable range. Underpricing is the more common mistake — shops feel pressure to match chains, then struggle to survive.",
              },
              {
                q: "Do you help with non-coffee menu items like food and retail?",
                a: "We focus on the coffee side. We can give you a framework for pairing food items (pastries, grab-and-go) with your coffee program, but full food menu design is better done with a food consultant or your kitchen lead.",
              },
              {
                q: "How often should I refresh the menu?",
                a: "Core espresso menu: rarely, if ever — consistency builds trust. Seasonal features: 3–4 times a year. Pricing: review annually or when your costs move more than 10%.",
              },
            ].map((f) => (
              <details
                key={f.q}
                className="group border border-border rounded-xl bg-card"
              >
                <summary className="cursor-pointer px-5 py-4 font-semibold text-foreground flex items-center justify-between">
                  {f.q}
                  <ArrowRight className="h-4 w-4 text-primary group-open:rotate-90 transition-transform flex-shrink-0 ml-4" />
                </summary>
                <p className="px-5 pb-5 text-foreground/70 leading-relaxed">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-foreground mb-4">
            Let's design your menu.
          </h2>
          <p className="text-foreground/70 text-lg mb-8">
            Whether you're pre-opening or refreshing an existing program,
            we'll help you build a menu that your customers love and your
            P&L respects.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
            >
              Start Menu Planning
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
