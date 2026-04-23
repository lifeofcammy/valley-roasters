import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Coffee Origin & Selection Consulting | Valley Specialty Roasters",
  description:
    "Choose the right coffee for your shop — single origin or blend. Valley helps wholesale partners in Arizona evaluate cup profiles, origin stories, and pricing to match their brand.",
  keywords: [
    "coffee origin consulting",
    "coffee selection guide",
    "single origin vs blend",
    "specialty coffee origins",
    "coffee sourcing Arizona",
  ],
};

export default function OriginAndSelectionPage() {
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
            Service 01
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Origin & Coffee Selection
          </h1>
          <p className="text-lg sm:text-xl text-foreground/70 leading-relaxed">
            The single most important decision you'll make as a coffee shop
            is which coffee goes in the hopper. We help you make that choice
            with clear criteria — not vibes.
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
              "Guided cupping sessions across multiple origins at our Gilbert roastery",
              "Detailed tasting notes and cup scores for every coffee we evaluate",
              "Head-to-head comparisons of Brazilian, Central American, and African origins",
              "Honest conversation about pricing tiers and what they buy you",
              "Review of competitor offerings in your market to position your program",
              "Final recommendation matched to your brand, clientele, and volume",
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
        <div className="container mx-auto px-4 max-w-3xl prose prose-lg">
          <h2 className="font-display text-3xl font-bold text-foreground mb-6">
            Why This Matters
          </h2>
          <p className="text-foreground/80 leading-relaxed mb-5">
            Most new coffee shops pick their beans one of two ways: they go
            with whatever the regional roaster's rep pushes hardest, or they
            chase the trendiest single origin without thinking about who
            their actual customer is. Both approaches leave margin on the
            table and create menus that don't fit the neighborhood.
          </p>
          <p className="text-foreground/80 leading-relaxed mb-5">
            The right coffee for your shop depends on three things: the
            flavor profile your target customer already enjoys, the price
            point your neighborhood will pay, and the story you want to tell
            at the counter. A high-acidity Ethiopian natural is a beautiful
            coffee — but it will confuse 80% of customers in a suburban
            strip-mall cafe expecting a classic latte.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            Our job is to match your coffee program to your reality.
            Sometimes that means a bright, fruit-forward single origin as a
            feature offering. Sometimes it means a balanced Central American
            blend as your house espresso. Most of the time it's a mix — a
            house blend that does 80% of the volume, with a rotating single
            origin that gives regulars something to try.
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
                title: "Brand audit",
                body: "We review your concept, location demographics, and existing menu (if any). If you don't have these yet, we help shape them.",
              },
              {
                step: "2",
                title: "Cupping session at our roastery",
                body: "You visit Gilbert for a half-day cupping. We pull 6–10 coffees, taste them blind, and score them against your brand criteria.",
              },
              {
                step: "3",
                title: "Shortlist & pricing",
                body: "We present a shortlist of 2–3 coffees with transparent pricing at each volume tier, plus projected per-cup cost.",
              },
              {
                step: "4",
                title: "Decision & order",
                body: "You pick. We roast. Your first sample batch lands within a week so you can test in your own environment.",
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
                q: "Should I carry single origin or a blend as my house espresso?",
                a: "For most wholesale partners we recommend a blend as the house espresso — it's more forgiving on the machine, easier to train baristas on, and more familiar to walk-in customers. A single origin works well as a rotating feature for regulars who want variety.",
              },
              {
                q: "How many coffees should I offer on my menu?",
                a: "One house espresso, one decaf, and one single-origin filter offering is the sweet spot for shops under $15k/month in coffee revenue. More than that and your baristas lose consistency and your inventory gets expensive.",
              },
              {
                q: "Do you help with seasonal rotations?",
                a: "Yes. If you want a rotating single origin, we'll keep you updated when new lots arrive from our partner farms — typically 3–4 times a year. You pick which ones to feature.",
              },
              {
                q: "Can I taste samples before committing?",
                a: "Absolutely. Every wholesale conversation starts with samples. You'll brew and taste on your own equipment before we finalize any order.",
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
            Want to cup some coffees?
          </h2>
          <p className="text-foreground/70 text-lg mb-8">
            Book a visit to our Gilbert roastery. We'll walk you through our
            current offerings and help you pick the ones that fit your shop.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
            >
              Schedule a Cupping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
