import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Coffee Shop Operator's Blog | Valley Specialty Roasters",
  description:
    "Practical guides for coffee shop operators — menu design, blend development, staff training, equipment selection. Written by Valley's team from experience.",
  keywords: [
    "coffee shop blog",
    "coffee shop operator resources",
    "coffee shop startup guide",
    "specialty coffee industry",
    "coffee shop consulting",
  ],
};

/* Post registry. Each post has a detail page at /blog/{slug}. */
const posts = [
  {
    slug: "single-origin-vs-blend",
    title:
      "Single origin vs blend: which fits your coffee shop's brand?",
    excerpt:
      "A practical framework for deciding whether to anchor your menu on a signature blend, feature a rotating single origin, or offer both — and how that choice shapes your brand.",
    date: "2026-04-23",
    readTime: "8 min read",
    category: "Coffee Selection",
  },
  {
    slug: "how-to-design-a-custom-coffee-blend",
    title:
      "How to design a custom coffee blend that matches your café's brand",
    excerpt:
      "The actual process of developing a signature blend from scratch — flavor profile interview, origin selection, cup testing, and refinement. Plus pitfalls to avoid.",
    date: "2026-04-23",
    readTime: "10 min read",
    category: "Blend Development",
  },
  {
    slug: "10-things-to-get-right-in-staff-training",
    title:
      "The 10 things you need to get right in coffee shop staff training",
    excerpt:
      "Consistency is the foundation of customer retention. Here are the 10 training fundamentals that separate shops with loyal regulars from shops where every cup tastes different.",
    date: "2026-04-23",
    readTime: "11 min read",
    category: "Operations",
  },
  {
    slug: "how-to-price-your-coffee-menu",
    title:
      "How to price your coffee menu: a framework for new café owners",
    excerpt:
      "Cost-plus vs market pricing, how to model margin by drink, and the common mistakes new shops make with their pricing structure — with worked examples.",
    date: "2026-04-23",
    readTime: "9 min read",
    category: "Menu & Pricing",
  },
  {
    slug: "coffee-shop-equipment-checklist",
    title:
      "The complete equipment checklist for opening a coffee shop (and what each costs)",
    excerpt:
      "A line-by-line checklist of every piece of equipment a specialty coffee shop needs to open — with realistic price ranges, which items matter most, and where to save money.",
    date: "2026-04-23",
    readTime: "12 min read",
    category: "Equipment",
  },
] as const;

export default function BlogPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-muted/50 to-background py-16 sm:py-24">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-4">
            Valley Journal
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Field Notes for Coffee Shop Operators
          </h1>
          <p className="text-lg sm:text-xl text-foreground/70 leading-relaxed">
            Practical guides on the decisions that actually matter —
            menus, blends, pricing, training, and the gear you need to
            open the doors.
          </p>
        </div>
      </section>

      {/* Post list */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block border border-border rounded-2xl p-6 sm:p-8 hover:border-primary hover:shadow-lg transition-all bg-card"
              >
                <div className="flex items-center gap-3 mb-4 text-xs uppercase tracking-wider">
                  <span className="font-semibold text-primary">
                    {post.category}
                  </span>
                  <span className="text-foreground/40">·</span>
                  <span className="text-foreground/60">{post.readTime}</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                <p className="text-foreground/70 leading-relaxed mb-4">
                  {post.excerpt}
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                  Read article
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-muted/40 py-16 sm:py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Want to talk about your coffee program?
          </h2>
          <p className="text-foreground/70 text-lg mb-8">
            These guides cover what we'd tell you in the first
            conversation. Ready for a real one?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Contact Valley
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
