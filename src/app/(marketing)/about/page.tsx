import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Valley Specialty Roasters — our commitment to quality, our sourcing philosophy, and why we roast coffee differently.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero with image */}
      <section className="relative min-h-[50vh] flex items-center">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=80"
            alt="Coffee being prepared"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">
              Our Story
            </span>
            <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mt-3 leading-tight">
              Roasted with Purpose
            </h1>
            <p className="mt-6 text-xl text-white/80 leading-relaxed">
              At Valley Specialty Roasters, great coffee starts with great relationships —
              with our farmers, our partners, and our community.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-primary font-semibold text-sm uppercase tracking-widest">
                How We Started
              </span>
              <h2 className="font-display text-4xl font-bold mt-3 mb-6">Our Journey</h2>
              <div className="space-y-5 text-lg text-muted-foreground leading-relaxed">
                <p>
                  Valley Specialty Roasters was founded on a simple belief: businesses
                  deserve access to the same exceptional coffee that the best specialty
                  cafes serve.
                </p>
                <p>
                  We source our green coffee directly from producers across Ethiopia,
                  Colombia, Guatemala, Kenya, Brazil, Indonesia, and beyond. Every lot
                  is carefully cupped and evaluated before we commit to purchasing.
                </p>
                <p>
                  Our roasting approach is guided by the coffee itself. Each origin
                  has a unique story to tell, and our job is to develop roast profiles
                  that let those flavors shine.
                </p>
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80"
                alt="Coffee roasting facility"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">
              Our Values
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mt-3">
              What Drives Us
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                image: "https://images.unsplash.com/photo-1524350876685-274059332603?w=600&q=80",
                title: "Ethical Sourcing",
                description:
                  "We pay premiums above market rate to our producers, investing in sustainable farming practices and long-term partnerships.",
              },
              {
                image: "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=600&q=80",
                title: "Craft Roasting",
                description:
                  "Every batch is profiled, monitored, and adjusted with precision. We develop the full potential of each coffee we source.",
              },
              {
                image: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&q=80",
                title: "Partner Success",
                description:
                  "Your success is our success. We provide training resources, brewing guidance, and dedicated support.",
              },
            ].map((value) => (
              <div key={value.title} className="bg-white rounded-xl overflow-hidden shadow-lg">
                <div className="relative h-56">
                  <Image
                    src={value.image}
                    alt={value.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl font-bold mb-3">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl font-bold">
            Ready to Partner with Us?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We&apos;d love to supply your business with exceptional coffee.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-semibold px-8">
                Apply for Wholesale
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
