import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Coffee, ArrowRight, ClipboardList, DollarSign, RotateCcw } from "lucide-react";

export const metadata: Metadata = {
  title: "Wholesale Coffee Program",
  description:
    "Partner with Valley Specialty Roasters for premium wholesale roasted coffee. Custom pricing, easy reordering, and dedicated account support for cafes, restaurants, and businesses.",
  keywords: [
    "wholesale coffee",
    "roasted coffee",
    "wholesale coffee beans",
    "coffee supplier",
    "B2B coffee",
    "bulk coffee wholesale",
    "specialty coffee wholesale",
    "wholesale roasted coffee beans",
  ],
};

const faqItems = [
  {
    question: "What is the minimum order quantity?",
    answer:
      "Our minimum order is 5 lbs per product. Most of our partners order 25-50 lb bags for optimal freshness and value.",
  },
  {
    question: "How does wholesale pricing work?",
    answer:
      "Every partner receives custom pricing based on volume and product selection. Your dedicated pricing is visible in your wholesale portal after approval.",
  },
  {
    question: "How quickly do you roast and ship?",
    answer:
      "All orders are roasted within 24-48 hours of placement and shipped immediately. Most partners receive their coffee within 3-5 business days.",
  },
  {
    question: "Can I reorder my previous orders easily?",
    answer:
      "Yes! Our wholesale portal features a one-click reorder button. Just click reorder on any past order and it will pre-fill your cart with the same items.",
  },
  {
    question: "Do you offer custom blends or private labeling?",
    answer:
      "Absolutely. We work with partners to develop custom blends tailored to their needs. Contact us to discuss private label options.",
  },
];

export default async function WholesalePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-muted py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Premium Wholesale Coffee for Your Business
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Specialty-grade roasted coffee sourced directly from the world&apos;s
              finest growing regions. Custom wholesale pricing, a streamlined
              ordering portal, and coffee roasted fresh when you order it.
            </p>
            <div className="mt-8">
              <Link href="/register">
                <Button size="lg" className="text-base px-8">
                  Apply for Wholesale Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-16">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: ClipboardList,
                title: "Apply & Get Approved",
                description:
                  "Submit a quick application. We'll review it and set up your account with custom wholesale pricing within 1 business day.",
              },
              {
                step: "02",
                icon: DollarSign,
                title: "Browse & Order",
                description:
                  "Log into your wholesale portal to see your personalized pricing. Browse our selection and place your order in minutes.",
              },
              {
                step: "03",
                icon: RotateCcw,
                title: "Reorder with One Click",
                description:
                  "Need the same order again? Just hit the reorder button on any past order. It's that simple.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-bold text-secondary mb-2">{item.step}</p>
                <h3 className="font-display text-xl font-semibold mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Catalog */}
      <section className="py-20 sm:py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Our Wholesale Coffee Selection
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Premium single origins and signature blends available in 5lb, 25lb, and 50lb bags.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products?.map((product) => (
              <Card key={product.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="w-full h-40 bg-muted rounded-md mb-4 flex items-center justify-center">
                    <Coffee className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                  <p className="text-xs font-medium text-secondary uppercase tracking-wider">
                    {product.origin} &middot; {product.roast_level}
                  </p>
                  <h3 className="font-display text-lg font-semibold mt-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {product.flavor_notes?.map((note: string) => (
                      <span
                        key={note}
                        className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Available: {product.available_sizes?.join(", ")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Wholesale pricing is available in your portal after approval.
            </p>
            <Link href="/register">
              <Button size="lg">
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqItems.map((item) => (
              <div key={item.question} className="border-b border-border pb-6">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  {item.question}
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
