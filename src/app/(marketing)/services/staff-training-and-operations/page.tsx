import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Coffee Shop Staff Training & Operations | Valley Specialty Roasters",
  description:
    "Barista training, extraction standards, milk steaming, and operational SOPs for new and growing coffee shops. Hands-on training from Valley's team in Arizona.",
  keywords: [
    "barista training",
    "coffee shop staff training",
    "coffee shop operations",
    "espresso extraction training",
    "coffee shop SOPs",
    "barista certification Arizona",
  ],
};

export default function StaffTrainingAndOperationsPage() {
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
            Service 04
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-6">
            Staff Training & Operations
          </h1>
          <p className="text-lg sm:text-xl text-foreground/70 leading-relaxed">
            Your baristas are the last mile between great coffee and a
            loyal customer. We train them — and give you the playbooks to
            keep them consistent as your team grows.
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
              "Hands-on espresso extraction training (dose, grind, yield, time)",
              "Milk steaming technique — microfoam, pour, consistency",
              "Drink standards and recipe cards for every menu item",
              "Machine maintenance and daily cleaning routines",
              "Customer-facing service standards and order-taking flow",
              "Open/close checklists and shift handoff procedures",
              "Train-the-trainer so your lead barista can onboard future staff",
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
            The best coffee in the world tastes mediocre when pulled from a
            mis-calibrated grinder by a barista who doesn't know what to
            look for. And coffee shops live or die on repeat customers —
            repeat customers live or die on consistency. Every cup has to
            taste like the last one.
          </p>
          <p className="text-foreground/80 leading-relaxed mb-5">
            The hard part isn't training one barista. It's keeping
            extraction dialed in when your opening barista quits, the new
            hire is two weeks in, and the machine is pulling slightly
            different shots than it was last month. That's an operational
            problem, not a skill problem. The fix is documented standards
            and a training path anyone can follow.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            Our training is designed to compound. You don't just get
            technique — you get a system. New hires come on faster, drinks
            stay consistent through turnover, and your lead barista has the
            tools to maintain quality without you watching every shift.
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
                title: "Equipment calibration",
                body: "We come to your shop, dial in your grinder and espresso machine against your chosen coffee, and document the baseline settings.",
              },
              {
                step: "2",
                title: "Hands-on training day",
                body: "A full day with your opening team — espresso pulls, milk steaming, drink assembly, machine care. Each barista pulls real shots under our guidance until their extractions are consistent.",
              },
              {
                step: "3",
                title: "Drink recipe cards",
                body: "We leave behind laminated recipe cards for every drink on your menu — dose, water temp, shot time, milk volume, glass size. Your opening playbook.",
              },
              {
                step: "4",
                title: "Open/close SOPs",
                body: "Documented procedures for opening, shift change, and closing. Nothing relies on tribal knowledge that walks out the door with an employee.",
              },
              {
                step: "5",
                title: "30/60/90-day check-ins",
                body: "We come back at 30 and 90 days to audit quality, retrain new hires, and adjust standards based on real customer feedback.",
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
                q: "Do my baristas need prior experience?",
                a: "Not required. We've trained experienced baristas and complete beginners. Most of our training is technique fundamentals that apply at every skill level.",
              },
              {
                q: "How many people can attend a training day?",
                a: "Up to 6 baristas per session, so everyone gets real hands-on time at the machine. Larger teams we split across two days.",
              },
              {
                q: "What happens when I hire someone new later?",
                a: "Your lead barista, who we train to train others, onboards them using the recipe cards and SOPs we leave behind. If you'd rather have us do it, we offer refresher training visits at an additional cost.",
              },
              {
                q: "Do you help if my shop is already open?",
                a: "Often yes — many partners come to us after they've been open a few months and quality is drifting. We audit current technique and retrain on whatever's slipping.",
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
            Let's train your team.
          </h2>
          <p className="text-foreground/70 text-lg mb-8">
            Whether you're pre-opening or trying to raise the bar at an
            existing shop, we'll build your staff into a consistent, proud
            coffee team.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
            >
              Schedule Training
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
