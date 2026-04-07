import type { Metadata } from "next";
import { Coffee, Globe, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Valley Specialty Roasters — our commitment to quality, our sourcing philosophy, and why we roast coffee differently.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-muted py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground leading-tight">
              Roasted with Purpose
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              At Valley Specialty Roasters, we believe great coffee starts with
              great relationships — with our farmers, our partners, and our community.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
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
                  that let those flavors shine. We roast in small batches — every order
                  is roasted fresh, never pulled from inventory.
                </p>
              </div>
            </div>
            <div className="bg-muted rounded-lg aspect-[4/3] flex items-center justify-center">
              <Coffee className="h-24 w-24 text-muted-foreground/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-center mb-16">
            What Drives Us
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "Ethical Sourcing",
                description:
                  "We pay premiums above market rate to our producers, investing in sustainable farming practices and long-term partnerships that benefit growing communities.",
              },
              {
                icon: Coffee,
                title: "Craft Roasting",
                description:
                  "Every batch is profiled, monitored, and adjusted with precision. We don't cut corners — our goal is to develop the full potential of each coffee we source.",
              },
              {
                icon: Heart,
                title: "Partner Success",
                description:
                  "Your success is our success. We provide training resources, brewing guidance, and dedicated support to help you serve the best coffee possible.",
              },
            ].map((value) => (
              <div key={value.title} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-6">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">
                  {value.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
