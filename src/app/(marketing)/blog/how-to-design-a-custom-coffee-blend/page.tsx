import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title:
    "How to Design a Custom Coffee Blend That Matches Your Café's Brand | Valley Specialty Roasters",
  description:
    "The step-by-step process of developing a custom coffee blend for your café — flavor profile interview, origin selection, roasting, cupping, and refinement.",
  keywords: [
    "custom coffee blend",
    "private label coffee",
    "signature coffee blend development",
    "house espresso blend",
    "coffee blending process",
  ],
};

export default function HowToDesignACustomCoffeeBlendPage() {
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
              Blend Development
            </span>
            <span className="text-foreground/40">·</span>
            <span className="text-foreground/60">10 min read</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            How to design a custom coffee blend that matches your café's
            brand
          </h1>
          <p className="text-foreground/60">Published April 23, 2026</p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-6 text-foreground/80 leading-relaxed">
          <p className="text-lg">
            A custom blend is one of the most underused tools in
            specialty coffee. When you serve a blend no other shop can
            serve, customers have a reason to come back that isn't price.
            But developing a blend is more craft than recipe. This is how
            it actually works, start to finish.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Step 1: Define the flavor profile
          </h2>
          <p>
            Every blend starts with words, not beans. Before anyone
            touches a grinder, you and the roaster have a conversation
            about what the coffee should taste like. Not in technical
            language — in customer language.
          </p>
          <p>
            Useful prompts to work through:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              What's the first word a customer should use to describe
              this coffee? (Rich, bright, smooth, bold, balanced?)
            </li>
            <li>
              Does it need to work well in milk, or primarily as straight
              espresso?
            </li>
            <li>
              What competitors do you admire? What would you want
              customers to prefer yours <em>to</em>?
            </li>
            <li>
              What don't you want it to taste like? (Too acidic, too
              burnt, too vegetal.)
            </li>
          </ul>
          <p>
            Most profile interviews land in one of four territories:
            bright and fruit-forward; balanced and versatile; rich and
            chocolaty; or bold and dark. Knowing which quadrant you want
            cuts the origin choices dramatically.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Step 2: Select the origins
          </h2>
          <p>
            A good blend typically uses 2–4 origins, each chosen to
            contribute a specific quality. Think of the origins as
            members of a band — the Brazilian brings body, the Ethiopian
            brings brightness, the Guatemalan brings sweetness and
            structure. One-origin "blends" are rare for a reason: a
            single origin can't play all those roles at once.
          </p>
          <p>
            Common base origins and what they contribute:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Brazil</strong> — nutty, chocolaty, low-acid body.
              The foundation of most espresso blends.
            </li>
            <li>
              <strong>Guatemala / Honduras / Costa Rica</strong> —
              balanced sweetness and structure. Reliable "filler" origins
              in the good sense.
            </li>
            <li>
              <strong>Colombia</strong> — caramel sweetness and medium
              acidity. Flexible middle ground.
            </li>
            <li>
              <strong>Ethiopia (washed)</strong> — floral, citrus,
              tea-like brightness. Adds lift to a dark base.
            </li>
            <li>
              <strong>Ethiopia (natural)</strong> — fruity, jammy,
              wine-like. More dramatic than washed — use sparingly.
            </li>
            <li>
              <strong>Sumatra</strong> — heavy body, earthy, low-acid.
              Adds depth to darker blends.
            </li>
          </ul>
          <p>
            You don't need all of these. A perfectly good espresso blend
            might be 60% Brazil, 30% Guatemala, 10% Ethiopia washed. The
            art is in the ratios and the roast.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Step 3: Build candidate recipes
          </h2>
          <p>
            A roaster who knows what they're doing will draft 3–5
            candidate blends based on your profile interview. Each uses
            different ratios or different origins to hit the target from
            different angles. Some will lean heavier on Brazilian body,
            some will experiment with more Ethiopian lift, some will push
            the roast darker, some lighter.
          </p>
          <p>
            This is where amateur blending goes wrong. It's tempting to
            just "combine everything good" and assume it'll work. It
            doesn't. A coffee blend is not a fruit salad — adding more
            components doesn't make it better. More is often worse.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Step 4: Blind cupping
          </h2>
          <p>
            The candidates go onto a cupping table. They're tasted blind
            — labeled with codes, not names — so the evaluators can't
            anchor to the theory of each blend. You taste what's in the
            cup, not what you <em>think</em> should be in the cup.
          </p>
          <p>
            At this stage, you're looking for a winner and a runner-up.
            Rarely does one blend dominate across every dimension — one
            might have the best aroma, another the best finish, another
            the best balance overall. Usually one rises to the top
            because it gets the important things right, even if others
            are individually stronger on specific attributes.
          </p>
          <p>
            Pro tip: taste the candidates alongside a reference coffee
            you already like. Maybe your favorite competitor's espresso,
            maybe a commercially available blend that's close to your
            target profile. The contrast makes subtle differences much
            easier to perceive.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Step 5: Refine
          </h2>
          <p>
            Rarely is the first candidate the final version. Usually
            there's a winner with one flaw: too much acidity in the
            finish, not enough body, a slightly roasty bitterness. The
            refinement round tweaks the ratios or roast level to address
            the one or two specific issues identified in the cupping.
          </p>
          <p>
            A good refinement round makes surgical changes — shift the
            Brazilian from 60% to 65%, pull the roast back 15 seconds,
            swap one Guatemalan lot for another. One round of refinement
            usually lands the final recipe. Two at most. If you're into
            round three, something's wrong with the foundational profile
            and it's worth revisiting Step 1.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Step 6: Lock it in and document
          </h2>
          <p>
            Once approved, the blend recipe is documented in detail:
            which specific lots of which specific origins, the exact
            ratios by weight, the roast profile (first crack time, drop
            temperature, total roast time). This becomes the reference
            every future batch is measured against.
          </p>
          <p>
            This matters because specialty coffee is seasonal. The
            Brazilian lot you used last fall won't be available next
            year. When your roaster needs to substitute, they need a
            reference profile to match against — otherwise the blend
            drifts silently and customers start saying "the coffee tastes
            different lately" six months down the road.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Common pitfalls to avoid
          </h2>
          <p>
            <strong>Designing by ingredient instead of by profile.</strong>{" "}
            Starting with "I want a blend with Ethiopian in it" leads to
            worse blends than starting with "I want a bright, balanced
            espresso." The profile dictates the origins, not the other
            way.
          </p>
          <p>
            <strong>Over-engineering.</strong> A 5-origin blend with tiny
            percentages of each is usually a sign of indecision. Three is
            almost always enough. Any origin at less than 10% is probably
            noise.
          </p>
          <p>
            <strong>Ignoring roast level.</strong> Two blends with
            identical components roasted differently taste like different
            coffees. The roast is part of the recipe. Don't treat it as
            an afterthought.
          </p>
          <p>
            <strong>Not testing in milk.</strong> An espresso blend has
            to hold up in a latte. Many blends that cup beautifully black
            completely vanish when you add milk. If milk drinks will be
            the majority of your volume, cupping with and without is
            essential.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            What "your blend" actually means
          </h2>
          <p>
            When you develop a custom blend with a specialty roaster,
            you own the recipe. It's your intellectual property — not
            the roaster's. A good roaster will put it in writing: this
            specific recipe is roasted exclusively for your shop and
            won't show up in any other partner's coffee. That exclusivity
            is the whole point. Otherwise you just bought a named SKU of
            a commodity coffee.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            The timeline
          </h2>
          <p>
            From first conversation to production-ready: typically 3–6
            weeks. Two weeks for the initial roast and first cupping. Two
            weeks for refinement. One or two more for final approval and
            production setup. It's not a same-week project — good blends
            take time to land.
          </p>

          <p>
            A well-designed blend is a long-term competitive advantage.
            Customers who fall in love with your house espresso can't get
            it anywhere else. That's a moat worth spending six weeks to
            build.
          </p>
        </div>
      </section>

      {/* Related service CTA */}
      <section className="bg-muted/40 py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-3">
            Related Service
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Custom Blend Development
          </h2>
          <p className="text-foreground/70 mb-6">
            Ready to develop your signature blend? We take wholesale
            partners through this exact process at our Gilbert roastery.
          </p>
          <Link
            href="/services/custom-blend-development"
            className="inline-flex items-center gap-1 text-primary font-semibold hover:gap-2 transition-all"
          >
            Learn about our custom blend service
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}
