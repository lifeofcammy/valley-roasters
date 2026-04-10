import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { fetchCoffeeCatalog, type SquareCoffeeItem } from "@/lib/square/client";
import { ArrowRight } from "lucide-react";

type HighlightRow = {
  square_catalog_object_id: string;
  is_featured: boolean;
  sort_order: number;
  marketing_description: string | null;
};

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
    question: "Are your beans organic?",
    answer:
      "Yes. We source certified organic beans from sustainable farms in Brazil, Guatemala, and Honduras. Our roasting facility maintains organic handling practices throughout the process.",
  },
  {
    question: "How fresh is the coffee?",
    answer:
      "Every order is roasted within 24–48 hours of placement. We don't hold inventory — your coffee is roasted to order and shipped immediately.",
  },
  {
    question: "What is the minimum order?",
    answer:
      "5 lbs per product. Most of our partners order 25–50 lb bags.",
  },
  {
    question: "Do you offer custom blends or private labeling?",
    answer:
      "Yes. We work with partners to develop blends tailored to their menu. Contact us to discuss private label options.",
  },
  {
    question: "How does pricing work?",
    answer:
      "Every partner receives custom pricing based on volume and product mix. Reach out and we'll put together a quote for your business.",
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

type FeaturedCoffee = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  sort_order: number;
};

export default async function WholesalePage() {
  const supabase = await createClient();

  // Live Square catalog joined with our highlights table.
  // Highlights live in Supabase (admin-curated) — Square is the
  // source of truth for what SKUs exist. If a featured SKU is
  // removed in Square, it just disappears from this page.
  let catalog: SquareCoffeeItem[] = [];
  try {
    catalog = await fetchCoffeeCatalog();
  } catch {
    catalog = [];
  }

  const { data: highlightRows } = await supabase
    .from("catalog_highlights")
    .select("square_catalog_object_id, is_featured, sort_order, marketing_description");
  const highlights = (highlightRows ?? []) as HighlightRow[];
  const highlightById = new Map<string, HighlightRow>(
    highlights.map((h) => [h.square_catalog_object_id, h])
  );

  const featured: FeaturedCoffee[] = catalog
    .map((item) => {
      const h = highlightById.get(item.id);
      if (!h?.is_featured) return null;
      const description =
        (h.marketing_description && h.marketing_description.trim()) ||
        item.description?.trim() ||
        "";
      return {
        id: item.id,
        name: item.name,
        description,
        imageUrl: item.primary_image_url,
        sort_order: h.sort_order ?? 0,
      } satisfies FeaturedCoffee;
    })
    .filter((x): x is FeaturedCoffee => x !== null)
    .sort((a, b) => a.sort_order - b.sort_order);

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
              Wholesale Coffee
              <br />
              <span className="text-primary">Roasted with Care</span>
            </h1>
            <p className="mt-5 sm:mt-6 text-lg sm:text-xl text-white/80 leading-relaxed max-w-2xl">
              Organic, small-batch roasted beans sourced from sustainable farms.
              Every order is roasted fresh and shipped within days — never
              sitting on a shelf.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/contact" className="w-full sm:w-auto">
                <Button size="lg" className="btn-lift w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-base sm:text-lg px-8 py-6 font-semibold shadow-lg shadow-primary/25">
                  Contact Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>



      {/* Product Catalog */}
      <section className="py-20 sm:py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 fade-up-on-scroll">
            <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
              What We Roast
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3">
              Our Coffees
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Single origins and blends, all organic, roasted in small batches in Gilbert, Arizona.
            </p>
          </div>

          {featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {featured.map((product, index) => {
                const delayClasses = ["fade-up-on-scroll", "fade-up-delay-1", "fade-up-delay-2", "fade-up-delay-3"];
                const imgSrc = product.imageUrl ?? coffeeImages[index % coffeeImages.length];
                const useUnoptimized = Boolean(product.imageUrl);
                return (
                  <div
                    key={product.id}
                    className={`group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${delayClasses[index % 4]}`}
                  >
                    <div className="relative h-56 overflow-hidden">
                      <Image
                        src={imgSrc}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        unoptimized={useUnoptimized}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="p-5 sm:p-6">
                      <h3 className="font-display text-lg sm:text-xl font-bold mt-1 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-4 border-t border-border pt-3">
                        Available in 5lb, 25lb, and 50lb bags
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
            <Link href="/contact">
              <Button size="lg" className="btn-lift bg-primary hover:bg-primary/90 text-white font-semibold">
                Contact Us
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
