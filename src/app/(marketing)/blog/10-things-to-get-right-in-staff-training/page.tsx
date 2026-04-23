import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title:
    "The 10 Things You Need to Get Right in Coffee Shop Staff Training | Valley Specialty Roasters",
  description:
    "The 10 training fundamentals that separate coffee shops with loyal regulars from shops where every cup tastes different. From extraction to customer handoff.",
  keywords: [
    "coffee shop staff training",
    "barista training fundamentals",
    "coffee shop operations",
    "espresso extraction training",
    "coffee shop consistency",
  ],
};

export default function TenThingsStaffTrainingPage() {
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
            <span className="font-semibold text-primary">Operations</span>
            <span className="text-foreground/40">·</span>
            <span className="text-foreground/60">11 min read</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            The 10 things you need to get right in coffee shop staff
            training
          </h1>
          <p className="text-foreground/60">Published April 23, 2026</p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4 max-w-3xl space-y-6 text-foreground/80 leading-relaxed">
          <p className="text-lg">
            Consistency is the foundation of customer retention. And
            consistency doesn't come from having great baristas — it
            comes from having great training. Most shops that struggle
            with quality drift after six months aren't suffering from bad
            staff; they're suffering from training that didn't address
            the right fundamentals. Here are the ten that matter most.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            1. Extraction fundamentals, before anything else
          </h2>
          <p>
            Every barista needs to understand the four variables of
            extraction — dose, grind, yield, and time — and how they
            interact. Without this, they're just pressing buttons. When
            you ask a new barista to adjust a shot that's pulling too
            fast and they don't know whether to change dose or grind
            first, you've got a foundational gap.
          </p>
          <p>
            Spend the first training day on this alone. Everything else
            builds on it.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            2. Reading the shot, not the timer
          </h2>
          <p>
            Timers are a proxy. The actual signal is what the espresso
            looks like coming out of the basket — the color, the viscosity,
            the way the stream tails off. A 25-second shot can be perfect
            or underextracted depending on grind and dose. A barista who
            can <em>see</em> a shot is more valuable than one who can
            just time one.
          </p>
          <p>
            Teach this with side-by-side comparisons. Pull the same
            coffee at different grind settings. Let them taste what
            channeling looks like. Once they've seen it, they can't
            unsee it.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            3. Distribution and tamping as ritual
          </h2>
          <p>
            The prep work before the shot — distribution, tamping — is
            where consistency actually lives. Every barista needs a
            repeatable routine they do the same way every time, on their
            worst shift, on their twelfth hour. Not a technique they vary
            based on mood.
          </p>
          <p>
            Document the specific distribution technique your shop uses
            (WDT, tapping, leveler — pick one) and train everyone on the
            same one. Tamping pressure matters less than tamping
            <em>consistently</em>.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            4. Milk steaming fundamentals
          </h2>
          <p>
            Proper microfoam is the foundation of every milk drink. Train
            the fundamentals of steam wand positioning, whirlpool formation,
            and aeration timing so every pour lands with the same silky
            texture. Thin, flat milk makes even the best espresso taste
            flat — get this right and every latte, cappuccino, and flat
            white levels up.
          </p>
          <p>
            Teach texture by touch. Steam pitcher surface temperature is
            the most reliable indicator — when the pitcher is
            uncomfortably hot to hold, you're there. Too-hot milk burns
            and tastes of sulfur.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            5. Recipe cards for every drink
          </h2>
          <p>
            Every drink on your menu needs a documented recipe that any
            barista can follow — dose, water temp, shot volume, milk
            volume, final cup size, garnish. Laminate them. Put them on
            the bar. Don't rely on institutional memory.
          </p>
          <p>
            Recipe cards are what let a Tuesday hire pull the same latte
            as your opening barista. They're also what turns the "how do
            you make the honey cortado?" question into a 10-second
            reference check instead of a five-minute conversation during
            a rush.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            6. Dialing in the grinder
          </h2>
          <p>
            Grinders drift. Humidity changes, beans age, burrs wear.
            Every barista — not just the opener — needs to know how to
            check and adjust the grinder. They should test the first
            shot of their shift, taste it, and adjust if needed. Skipping
            this is the #1 cause of inconsistent coffee across a day.
          </p>
          <p>
            Put a "dial-in log" on the bar. Every shift, the opening
            barista logs grind setting, shot weight, and shot time.
            Patterns emerge fast — you'll catch a grinder that's drifting
            days before customers start complaining.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            7. Machine care, not just cleaning
          </h2>
          <p>
            Daily cleaning is the minimum. Deeper care — backflushing,
            portafilter brushing, steam wand purging, grouphead cleaning —
            is what keeps the machine delivering consistent shots. If
            your baristas only know the "wipe down" version of cleaning,
            your machine will be pulling like a different machine in six
            months.
          </p>
          <p>
            Build a cleaning checklist with daily, weekly, and monthly
            items. The lead barista signs off. No shortcuts on this —
            cutting maintenance corners is how $15k machines become $1k
            paperweights.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            8. Customer-facing order flow
          </h2>
          <p>
            Training isn't just behind the bar. How a barista greets a
            customer, takes an order, handles a modification request,
            and hands off the finished drink shapes the customer's
            memory of your shop as much as the coffee does.
          </p>
          <p>
            Standardize the order-taking language: "What can I get
            started for you?" instead of "Hi." Name every drink back to
            the customer before ringing it in. Call drinks by name when
            handing off, not by size. Small things, but the cumulative
            effect on service feel is huge.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            9. Open/close SOPs
          </h2>
          <p>
            Opening and closing procedures should be documented in
            checklist form. Not a "the opener knows what to do" tribal
            culture. When that opener leaves — and they will — their
            replacement inherits chaos unless the procedures are on
            paper.
          </p>
          <p>
            A good opening checklist gets the shop ready for the first
            customer in 30 minutes, not 90. A good closing checklist
            leaves the bar in a state where tomorrow morning starts on
            time. These are skills to train explicitly, not absorb by
            osmosis.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            10. Train your lead barista to train
          </h2>
          <p>
            You can't be the person training every new hire forever.
            Someone on your staff — usually whoever is most senior and
            most invested — needs to become your shop's training lead.
            That person needs to know not just how to pull a shot, but
            how to teach someone else to pull a shot.
          </p>
          <p>
            This is the single biggest operational multiplier. When your
            lead barista can onboard new staff to your standard without
            you in the room, your operation scales. Without that, every
            new hire is a step backward on quality until you personally
            retrain them.
          </p>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground pt-8">
            Putting it together
          </h2>
          <p>
            These ten items aren't a one-day training agenda. They're a
            program you run in the first month, reinforce in the second,
            and maintain forever. A shop that takes training seriously —
            documents it, revisits it, updates it — is a shop where the
            coffee on year three tastes the same as the coffee on month
            three.
          </p>
          <p>
            That's the real goal. Not a great opening week. Great
            cup-after-cup for years.
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
            Staff Training & Operations
          </h2>
          <p className="text-foreground/70 mb-6">
            Want hands-on training for your team? Valley comes onsite to
            train baristas, set dial-in standards, and leave you with
            the SOPs that make consistency stick.
          </p>
          <Link
            href="/services/staff-training-and-operations"
            className="inline-flex items-center gap-1 text-primary font-semibold hover:gap-2 transition-all"
          >
            Learn about our training service
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}
