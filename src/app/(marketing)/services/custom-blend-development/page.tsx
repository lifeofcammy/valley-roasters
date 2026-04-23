import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Custom Coffee Blend Development | Valley Specialty Roasters",
  description:
    "Develop a proprietary house blend with Valley's head roaster. Tailored cup profiles, transparent iteration, and a signature coffee no competitor can copy — for Arizona wholesale partners.",
  keywords: [
    "custom coffee blend development",
    "private label coffee",
    "signature coffee blend",
    "house blend consulting",
    "custom espresso blend Arizona",
  ],
};

export default function CustomBlendDevelopmentPage() {
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
            Service 02
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Custom Blend Development
          </h1>
          <p className="text-lg sm:text-xl text-foreground/70 leading-relaxed">
            A blend that's yours alone. We sit at the cupping table with
            you and iterate until we land on a recipe that captures your
            brand in a cup.
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
              "Initial flavor profile interview — you describe; we translate to bean percentages",
              "3–5 candidate blends developed by our head roaster",
              "Side-by-side cuppings to compare and refine",
              "Roast profile development for both drip and espresso extraction",
              "Proprietary recipe documented — your IP, not ours",
              "Named and branded blend for your menu (optional)",
              "Ongoing QC so every future lot tastes the same",
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
            If you're serving the same blend every coffee shop in your zip
            code is serving, you're competing on price. That's a race to the
            bottom. A custom blend is how you break out of it.
          </p>
          <p className="text-foreground/80 leading-relaxed mb-5">
            When a customer falls in love with your house espresso, they
            can't get it anywhere else. That's a moat. It's how independent
            shops build followings in a market crowded with chains and
            third-wave pop-ups. Your baristas stop saying "we serve X
            Roasters" and start saying "this is our blend, we developed it
            for this shop."
          </p>
          <p className="text-foreground/80 leading-relaxed">
            A custom blend is also where margin lives. You're paying a
            wholesale price for a coffee that looks — to the customer —
            like a premium boutique offering. Done right, it pays for
            itself many times over the life of the business.
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
                title: "Profile interview",
                body: "We talk through what you want customers to taste. Bright and fruit-forward? Rich and chocolaty? Balanced and accessible? What do competitors serve and what's the white space?",
              },
              {
                step: "2",
                title: "First drafts",
                body: "Our head roaster drafts 3–5 candidate blends based on your profile. Each uses 2–4 origins at different ratios and roast levels.",
              },
              {
                step: "3",
                title: "Cupping session",
                body: "You come to Gilbert. We taste all candidates blind alongside a reference coffee (often your favorite competitor's espresso). You mark the ones closest to your vision.",
              },
              {
                step: "4",
                title: "Refinement round",
                body: "We iterate on the 1–2 finalists. Adjust ratios, try different lots of the same origin, or tweak roast. Typically one more round locks it in.",
              },
              {
                step: "5",
                title: "Production & QC",
                body: "The approved recipe goes into production. Every future lot is cupped against the approved reference before it ships. You taste drift early, not at the counter.",
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
                q: "Who owns the recipe?",
                a: "You do. The blend formula is your intellectual property. We roast it exclusively for your shop — it won't show up in any other partner's hopper.",
              },
              {
                q: "How long does the full process take?",
                a: "From first conversation to production-ready, typically 3–6 weeks. Faster if you're decisive; slower if you want multiple refinement rounds. We don't rush it.",
              },
              {
                q: "What's the minimum volume?",
                a: "We can develop a custom blend for any partner committing to at least 25 lbs per week. Below that, a selection from our existing offerings is usually the better economic choice.",
              },
              {
                q: "Can you replicate a competitor's flavor profile?",
                a: "Often yes, though we prefer to create something distinctive rather than imitate. If there's a specific espresso you admire, we can use it as a starting reference — but the goal is to make something that's yours, not theirs.",
              },
              {
                q: "What happens if one origin in the blend becomes unavailable?",
                a: "We find the closest substitute, test it against the approved profile, and only ship if it matches. If it doesn't match, we talk to you before making any change.",
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
            Ready to develop your blend?
          </h2>
          <p className="text-foreground/70 text-lg mb-8">
            Start with a conversation about your brand, your customer, and
            what you want in the cup. We'll take it from there.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
            >
              Start Your Blend
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
