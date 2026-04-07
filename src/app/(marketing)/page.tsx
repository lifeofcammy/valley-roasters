import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { Coffee, Truck, Users, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .limit(4);

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-foreground text-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground via-foreground/95 to-primary/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Small-Batch Roasted Coffee for{" "}
              <span className="text-secondary">Discerning Businesses</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-background/70 max-w-2xl leading-relaxed">
              Premium specialty coffee sourced from the world&apos;s finest origins,
              roasted to order, and delivered fresh to your business. Elevate your
              coffee program with Valley Specialty Roasters.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/wholesale">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base px-8">
                  Become a Partner
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-background/30 text-background hover:bg-background/10 text-base px-8">
                  Our Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-20 sm:py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Why Partner With Us
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              We&apos;re committed to quality at every step, from sourcing to delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Coffee,
                title: "Sourced with Care",
                description:
                  "Direct relationships with farmers across the world's premier growing regions. Every lot is carefully evaluated and selected for exceptional quality.",
              },
              {
                icon: Truck,
                title: "Roasted to Order",
                description:
                  "Your coffee is roasted fresh when you order it — never sitting on a shelf. Small-batch precision ensures peak flavor in every bag.",
              },
              {
                icon: Users,
                title: "Dedicated Support",
                description:
                  "A personal account representative, custom pricing, and a streamlined ordering portal. We make wholesale coffee easy.",
              },
            ].map((item) => (
              <Card key={item.title} className="border-0 shadow-sm bg-background">
                <CardContent className="pt-8 pb-6 px-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-6">
                    <item.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-3">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Coffees */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              Our Coffee Selection
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Exceptional single origins and carefully crafted blends,
              available exclusively to our wholesale partners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products?.map((product) => (
              <Card key={product.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-full h-48 bg-muted rounded-md mb-4 flex items-center justify-center">
                    <Coffee className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-secondary uppercase tracking-wider">
                      {product.origin}
                    </p>
                    <h3 className="font-display text-lg font-semibold group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {product.flavor_notes?.slice(0, 3).map((note: string) => (
                        <span
                          key={note}
                          className="inline-block text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/wholesale">
              <Button variant="outline" size="lg">
                View Full Catalog
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 sm:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <blockquote>
            <p className="font-display text-2xl sm:text-3xl font-medium italic leading-relaxed">
              &ldquo;Valley Specialty Roasters transformed our coffee program. The quality
              is unmatched, and the reorder process couldn&apos;t be simpler.&rdquo;
            </p>
            <footer className="mt-8">
              <p className="font-semibold text-lg">Local Cafe Owner</p>
              <p className="text-primary-foreground/60">Wholesale Partner</p>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            Ready to Elevate Your Coffee Program?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our growing family of wholesale partners and experience the
            difference that specialty-grade, small-batch roasted coffee makes.
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
      </section>
    </>
  );
}
