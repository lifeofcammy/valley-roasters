import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, ClipboardList, DollarSign, RotateCcw } from "lucide-react";

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

const coffeeImages = [
  "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&q=80",
  "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=500&q=80",
  "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500&q=80",
  "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80",
  "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500&q=80",
  "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=500&q=80",
  "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&q=80",
  "https://images.unsplash.com/photo-1524350876685-274059332603?w=500&q=80",
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

      {/* Hero — dramatic image background with Ken Burns */}
      <section className="relative min-h-[65vh] sm:min-h-[75vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0c0705]">
          <Image
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=85"
            alt="Coffee roasting process"
            fill
            className="object-cover opacity-40 animate-ken-burns"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 w-full">
          <div className="max-w-3xl">
            <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
              Wholesale Program
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mt-3 leading-tight">
              Premium Wholesale Coffee
              <br />
              <span className="text-primary">for Your Business</span>
            </h1>
            <p className="mt-5 sm:mt-6 text-lg sm:text-xl text-white/80 leading-relaxed max-w-2xl">
              Specialty-grade roasted coffee sourced directly from the world&apos;s
              finest growing regions. Custom wholesale pricing, a streamlined
              ordering portal, and coffee roasted fresh when you order it.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="btn-lift w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-base sm:text-lg px-8 py-6 font-semibold shadow-lg shadow-primary/25">
                  Apply for Wholesale Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="btn-lift w-full sm:w-auto bg-transparent border-2 border-white/40 text-white hover:bg-white/15 hover:border-white/70 hover:text-white text-base sm:text-lg px-8 py-6 font-semibold backdrop-blur-sm">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 fade-up-on-scroll">
            <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
              Simple Process
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3">
              How It Works
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
            {[
              {
                step: "01",
                icon: ClipboardList,
                title: "Apply & Get Approved",
                description:
                  "Submit a quick application. We'll review it and set up your account with custom wholesale pricing tailored to your business.",
                delay: "fade-up-on-scroll",
              },
              {
                step: "02",
                icon: DollarSign,
                title: "Browse & Order",
                description:
                  "Log into your wholesale portal to see your personalized pricing. Browse our selection and place your order in minutes.",
                delay: "fade-up-delay-1",
              },
              {
                step: "03",
                icon: RotateCcw,
                title: "Reorder with One Click",
                description:
                  "Need the same order again? Just hit the reorder button on any past order. It's that simple.",
                delay: "fade-up-delay-2",
              },
            ].map((item) => (
              <div key={item.step} className={`text-center ${item.delay}`}>
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 mb-5 sm:mb-6 ring-4 ring-primary/5">
                  <item.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <p className="text-sm font-bold text-primary mb-2 tracking-widest">{item.step}</p>
                <h3 className="font-display text-xl sm:text-2xl font-semibold mb-3">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
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
          <div className="text-center mb-12 sm:mb-16 fade-up-on-scroll">
            <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
              The Selection
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3">
              Our Wholesale Coffee
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Premium single origins and signature blends available in 5lb, 25lb, and 50lb bags.
            </p>
          </div>

          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {products.map((product, index) => {
                const delayClasses = ["fade-up-on-scroll", "fade-up-delay-1", "fade-up-delay-2", "fade-up-delay-3"];
                return (
                  <div
                    key={product.id}
                    className={`group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${delayClasses[index % 4]}`}
                  >
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={coffeeImages[index % coffeeImages.length]}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-4 left-4">
                        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          {product.origin}
                        </span>
                      </div>
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="text-xs font-medium text-primary uppercase tracking-wider">
                        {product.roast_level} roast
                      </p>
                      <h3 className="font-display text-lg sm:text-xl font-bold mt-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {product.flavor_notes?.slice(0, 3).map((note: string) => (
                          <span
                            key={note}
                            className="text-xs px-2.5 py-1 bg-muted rounded-full text-foreground/60 font-medium"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-3">
                        Available: {product.available_sizes?.join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground fade-up-on-scroll">
              <p className="text-lg">Our full catalog is loading — check back soon.</p>
              <p className="mt-2 text-sm">Or <Link href="/contact" className="text-primary hover:underline">contact us</Link> for current offerings.</p>
            </div>
          )}

          <div className="text-center mt-12 sm:mt-16 fade-up-on-scroll">
            <p className="text-muted-foreground mb-4 text-base sm:text-lg">
              Wholesale pricing is available in your portal after approval.
            </p>
            <Link href="/register">
              <Button size="lg" className="btn-lift bg-primary hover:bg-primary/90 text-white font-semibold">
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
          <div className="text-center mb-10 sm:mb-12 fade-up-on-scroll">
            <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
              FAQ
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3">
              Frequently Asked
            </h2>
          </div>
          <div className="space-y-6">
            {faqItems.map((item, index) => {
              const delayClasses = ["fade-up-on-scroll", "fade-up-delay-1", "fade-up-delay-2", "fade-up-delay-3"];
              return (
                <div key={item.question} className={`border-b border-border pb-6 ${delayClasses[index % 4]}`}>
                  <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
