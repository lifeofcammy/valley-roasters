import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Globe,
  FlaskConical,
  ClipboardList,
  UserCheck,
  Package,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Coffee Shop Consulting Services | Valley Specialty Roasters",
  description:
    "A-to-Z coffee shop consulting for wholesale partners — origin selection, custom blend development, menu building, staff training, and equipment guidance. Free with every Valley wholesale account in Arizona.",
  keywords: [
    "coffee shop consulting",
    "coffee wholesale services",
    "custom coffee blend development",
    "coffee shop menu consulting",
    "coffee shop staff training",
    "coffee shop equipment guide",
    "specialty coffee consultant Arizona",
  ],
};

const services = [
  {
    slug: "origin-and-selection",
    title: "Origin & Coffee Selection",
    icon: Globe,
    summary:
      "We help you choose the right beans — single origin or blend — based on your brand, your clientele, and the flavor profile you want to serve.",
  },
  {
    slug: "custom-blend-development",
    title: "Custom Blend Development",
    icon: FlaskConical,
    summary:
      "Your own signature blend, developed with our head roaster. We iterate on cup profiles until you have a proprietary recipe no other shop can copy.",
  },
  {
    slug: "menu-building",
    title: "Menu Building",
    icon: ClipboardList,
    summary:
      "Designing a coffee menu that sells: espresso offerings, brew methods, seasonal drinks, and sensible pricing that protects your margins.",
  },
  {
    slug: "staff-training-and-operations",
    title: "Staff Training & Operations",
    icon: UserCheck,
    summary:
      "We train your baristas on extraction, milk steaming, and consistency. Plus standard operating procedures so day-to-day runs smoothly.",
  },
  {
    slug: "equipment-and-packaging",
    title: "Equipment & Packaging",
    icon: Package,
    summary:
      "What espresso machine, grinder, and packaging you actually need to open — with honest recommendations based on your volume and budget.",
  },
];

export default function ServicesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4">
            For Wholesale Partners
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            A-to-Z Coffee Shop Consulting
          </h1>
          <p className="text-lg sm:text-xl text-foreground/70 mb-8 leading-relaxed">
            When you source coffee through Valley, you get more than beans.
            You get a team that's helped cafes and restaurants across Arizona
            open their doors, design their menus, train their staff, and
            build loyal customer followings.
          </p>
          <p className="text-base text-foreground/60 mb-10">
            These services are included — no separate consulting fee — for
            every wholesale partner.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
            >
              Start a Conversation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Services grid */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What's Included
            </h2>
            <p className="text-foreground/70 text-lg">
              Five services covering every stage of opening and running a
              specialty coffee program.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="group flex flex-col border border-border rounded-2xl p-6 hover:border-primary hover:shadow-lg transition-all bg-card"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-3">
                    {service.title}
                  </h3>
                  <p className="text-foreground/70 text-sm leading-relaxed flex-1 mb-4">
                    {service.summary}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center mb-12">
            How We Work With New Partners
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Discovery call",
                body: "We talk through your concept, timeline, location, and volume projections. No sales pitch — just listening.",
              },
              {
                step: "2",
                title: "Tailored plan",
                body: "We scope which of the five services you actually need, in what order. A pre-opening plan looks different from an established shop refreshing their menu.",
              },
              {
                step: "3",
                title: "Roll out & refine",
                body: "We execute alongside you — cupping sessions, training days, menu iterations — and adjust as the shop opens and real customer feedback comes in.",
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="inline-flex w-10 h-10 rounded-full bg-primary text-white font-bold items-center justify-center mb-4">
                  {s.step}
                </div>
                <h3 className="font-display text-lg font-bold mb-2">
                  {s.title}
                </h3>
                <p className="text-foreground/70 text-sm leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to Open or Relaunch?
          </h2>
          <p className="text-foreground/70 text-lg mb-8">
            Whether you're months away from opening your first shop or
            rethinking the coffee program at an established restaurant, we're
            ready to help. Reach out and let's talk.
          </p>
          <Link href="/contact">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-8"
            >
              Contact Valley
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
