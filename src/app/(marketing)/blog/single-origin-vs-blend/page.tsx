import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title:
    "Single Origin vs Blend: Which Fits Your Coffee Shop? | Valley Specialty Roasters",
  description:
    "A practical framework for choosing between single origin, blend, or both on your coffee shop menu — with decision criteria based on brand, customer base, and operations.",
  keywords: [
    "single origin vs blend",
    "coffee shop menu",
    "house espresso blend",
    "specialty coffee selection",
    "single origin espresso",
  ],
};

export default function SingleOriginVsBlendPage() {
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
              Coffee Selection
            </span>
            <span className="text-foreground/40">·</span>
            <span className="text-foreground/60">8 min read</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Single origin vs blend: which fits your coffee shop's brand?
          </h1>
          <p className="text-foreground/60">
            Published April 23, 2026
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-6 text-foreground/80 leading-relaxed">
          <p className="text-lg">
            If you're opening a coffee shop — or rethinking the menu at an
            established one — this is one of the first real decisions you
            face. Do you anchor your program on a house blend? Feature a
            rotating single origin? Offer both? The answer shapes every
            downstream choice: training, pricing, marketing, even the
            kind of customer you attract.
          </p>

          <p>
            There's no universally right answer. There is, however, a
            right answer <em>for your shop</em>, and it comes down to
            three variables: who your customer is, how your brand tells
            its story, and what your team can execute consistently every
            day. Let's walk through each.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            The quick definitions
          </h2>
          <p>
            A <strong>single origin</strong> is coffee from one specific
            farm, cooperative, or region. Because it reflects the
            conditions where it grew, single origins tend to have
            distinctive flavor profiles — a bright Ethiopian natural
            tastes nothing like a balanced Guatemalan washed. Single
            origins are typically the domain of specialty shops
            communicating terroir.
          </p>
          <p>
            A <strong>blend</strong> is two or more origins combined in a
            specific ratio. Blends are engineered — a roaster selects
            components for how they complement each other. A good blend
            delivers a consistent, balanced cup that holds up in milk,
            stays stable across seasons, and works reliably on espresso.
            Most commercial coffee — from corner cafes to the biggest
            chains — is blended.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Variable #1: Who is your customer?
          </h2>
          <p>
            Start here because everything else follows. Walk the
            neighborhood where you're opening. Who's on the sidewalk at 9
            a.m.? What do other shops in the area serve? What's your
            customer used to ordering?
          </p>
          <p>
            If your morning traffic is commuters grabbing a latte on the
            way to work, they want familiarity and consistency. They're
            not there for a coffee education; they're there for their
            usual. A balanced, chocolaty blend with low acidity is going
            to feel like what they expect coffee to taste like. A bright
            Kenyan single origin pulled as espresso is going to feel
            weird to them, and they'll order it once.
          </p>
          <p>
            On the other hand, if you're in a neighborhood with a savvy
            specialty scene — customers who follow roasters on Instagram,
            who talk about "natural process" and ask about tasting notes —
            they expect rotating single origins. Serving the same house
            blend forever in that market signals "not serious." These
            customers want discovery.
          </p>
          <p>
            Most neighborhoods are mixed. A commuter crowd in the morning
            and a lingering remote-work crowd in the afternoon. That's
            why most well-run shops carry both.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Variable #2: What does your brand say?
          </h2>
          <p>
            Your coffee choice is a brand statement whether you mean it
            to be or not. A rotating single origin menu telegraphs
            "curated, educational, coffee-forward." A single house blend
            featured prominently telegraphs "warm, welcoming, classic."
            Both are valid — but they attract different customers and
            build different reputations.
          </p>
          <p>
            Consider which of these you want customers telling their
            friends:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              "Their Ethiopian this month is incredible — super floral,
              almost like tea."
            </li>
            <li>
              "Their house espresso is the best in town. It's always
              amazing."
            </li>
          </ul>
          <p>
            Neither is better. But they lead customers to see your shop
            differently, and that affects everything from how you price
            your drinks to what shows up in your Instagram feed.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Variable #3: What can your team execute?
          </h2>
          <p>
            This is the variable most often ignored, and it sinks shops.
            Single origins are harder to pull consistently than blends.
            They have narrower sweet spots, they're more sensitive to
            grind adjustment, and they change character as they age.
            Running three rotating single origins means dialing in three
            different recipes every week and training your baristas to
            spot when each is drifting.
          </p>
          <p>
            A well-designed blend is forgiving. It's engineered to taste
            good across a wider window of extraction, which means it
            holds up better during a morning rush when your baristas
            don't have time to re-dial between shots. If your staff is
            new or turnover is high, a blend-forward menu will maintain
            consistency where a single-origin-forward menu would drift.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            The recommendation for most new shops
          </h2>
          <p>
            For shops opening their first location, the setup we see
            succeed most often is:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>One house espresso blend</strong> — balanced,
              chocolaty, works in milk. Does 70–80% of your volume. This
              is your brand anchor.
            </li>
            <li>
              <strong>One decaf blend</strong> — always available, never
              an afterthought.
            </li>
            <li>
              <strong>One rotating single origin</strong> — featured as a
              filter offering or a "guest espresso." Rotates every 4–6
              weeks. Gives regulars something to discover and keeps your
              specialty credentials intact.
            </li>
          </ul>
          <p>
            That setup gives you the best of both. Commuters get
            consistency. Curious customers get rotation. Your baristas
            only have to dial in one espresso recipe at a time (the
            house), with the rotating single origin served on a
            slower-paced brew method where variance matters less.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            When to skip single origin entirely
          </h2>
          <p>
            High-volume shops (500+ drinks a day), drive-thrus, and shops
            in markets with no specialty coffee culture often do better
            with a pure blend program. Single origins add complexity your
            operation can't absorb at that scale, and your customer base
            isn't asking for them anyway.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            When to skip blends entirely
          </h2>
          <p>
            Rarely. The shops that go single-origin-only tend to be
            coffee-forward specialty cafes in major metros — shops whose
            entire brand is built on origin storytelling and whose
            baristas are experienced enough to dial in new coffees every
            week. If you're not certain that describes you, a blend
            belongs on the menu.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            The takeaway
          </h2>
          <p>
            Pick the configuration that fits your customer first, your
            brand second, and your team's capabilities third. Most shops
            land on a house blend plus a rotating single origin — not
            because it's the trendy answer, but because it balances every
            constraint well.
          </p>
          <p>
            When in doubt, start simpler. It's much easier to add a
            single origin to a blend-anchored menu than to fix the
            operational chaos of a menu with three rotating coffees and
            inconsistent shots.
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
            Origin & Coffee Selection
          </h2>
          <p className="text-foreground/70 mb-6">
            Want help applying this framework to your specific shop? We
            cup coffees with wholesale partners and help them make this
            call with real data.
          </p>
          <Link
            href="/services/origin-and-selection"
            className="inline-flex items-center gap-1 text-primary font-semibold hover:gap-2 transition-all"
          >
            Learn about our origin & selection service
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}
