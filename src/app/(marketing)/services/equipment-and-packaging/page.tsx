import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Coffee Shop Equipment & Packaging Guide | Valley Specialty Roasters",
  description:
    "Honest guidance on what equipment you actually need to open a coffee shop — espresso machines, grinders, brewers, and packaging — matched to your volume and budget.",
  keywords: [
    "coffee shop equipment list",
    "espresso machine selection",
    "coffee shop startup equipment",
    "commercial espresso grinder",
    "coffee packaging wholesale",
    "open a coffee shop equipment",
  ],
};

export default function EquipmentAndPackagingPage() {
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
            Service 05
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Equipment & Packaging
          </h1>
          <p className="text-lg sm:text-xl text-foreground/70 leading-relaxed">
            The single biggest capex decision you'll make is what goes on
            the espresso bar. We help you buy the right gear — not the
            most expensive gear — for your volume and budget.
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
              "Espresso machine recommendations matched to projected volume",
              "Grinder selection (often more important than the machine itself)",
              "Batch brewer, pour-over, and filter setup advice",
              "Water filtration guidance (the #1 cause of machine issues)",
              "Milk steaming pitchers, tamper, scale, distribution tools",
              "Retail bag design and packaging for to-go beans",
              "Sourcing — vendor recommendations and honest pricing context",
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
            Opening a coffee shop typically means spending $30k-$80k on
            equipment before you serve a single cup. Every vendor in the
            industry wants to sell you their most expensive option. The
            right answer almost never involves the top-of-the-line machine
            — it involves the machine that matches your cup count and won't
            bottleneck your bar during a morning rush.
          </p>
          <p className="text-foreground/80 leading-relaxed mb-5">
            We've seen new shops burn $20k on a 3-group espresso machine
            when a well-tuned 2-group would handle 3x their projected
            volume. We've seen shops skimp on the grinder to afford a
            fancier machine — and end up with inconsistent shots for two
            years. We've also seen shops skip water filtration, then
            replace a $15k machine after 18 months of scale buildup.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            Equipment decisions compound. Our job is to give you the same
            honest context we'd give a friend opening their first shop —
            with no commission on what you buy. You leave the conversation
            knowing which line items actually matter and which are vendor
            upsells dressed up as features.
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
                title: "Volume projection",
                body: "What do you expect in your first 90 days? Your first year? Peak rush hour? Equipment spec follows these numbers, not the other way around.",
              },
              {
                step: "2",
                title: "Spec sheet",
                body: "We draft a recommended spec — machine, grinder, brewer, accessories, water — with good/better/best tiers and pricing from multiple vendors.",
              },
              {
                step: "3",
                title: "Vendor walk-through",
                body: "We call the vendors with you. They know we're involved, which means you get straight pricing and real specs without the upsell theater.",
              },
              {
                step: "4",
                title: "Install support",
                body: "We help coordinate install day so your machine is plumbed, calibrated, and running before your first training session.",
              },
              {
                step: "5",
                title: "Packaging design",
                body: "For shops retailing bagged beans, we help with bag sizing, labels, and order volumes that keep your retail inventory fresh instead of stale.",
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
                q: "What's a realistic equipment budget for a new shop?",
                a: "For a typical small-format specialty shop: $35k-$50k covers a quality 2-group machine, two grinders (one for house espresso, one for decaf or single origin), batch brewer, water filtration, accessories, and a register. Cheaper is possible but you'll pay for it later in maintenance.",
              },
              {
                q: "Should I buy new or used?",
                a: "New, almost always, for the espresso machine and grinder. These are workhorses that benefit from warranty coverage and factory calibration. Batch brewers, shelving, furniture — fine used.",
              },
              {
                q: "What espresso machine do you recommend?",
                a: "It depends on your volume. For most new shops, a 2-group La Marzocco Linea or Slayer Espresso in the $15-20k range is the workhorse. Higher volume warrants a 3-group. We'll spec to your actual numbers, not a brand preference.",
              },
              {
                q: "Do you earn commission on equipment recommendations?",
                a: "No. We're independent. Our incentive is that you succeed as a wholesale partner, not that a specific vendor closes a sale.",
              },
              {
                q: "Can you help with retail bag design?",
                a: "Yes. We consult on bag format (250g vs 340g vs 12oz), label design, and valve selection. Valley can also produce private-label bags for partners hitting volume.",
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
            Let's spec your setup.
          </h2>
          <p className="text-foreground/70 text-lg mb-8">
            Bring us your volume projection and your budget. We'll hand
            you back a spec that matches both — with no commission
            pressure.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
            >
              Get Equipment Guidance
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
