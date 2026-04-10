import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Valley Specialty Roasters — our commitment to quality, our sourcing philosophy, and why we roast coffee differently.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero with image + Ken Burns */}
      <section className="relative min-h-[60vh] sm:min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&q=80"
            alt="Coffee being prepared"
            fill
            className="object-cover animate-ken-burns"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 w-full">
          <div className="max-w-3xl">
            <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
              Our Story
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mt-3 leading-tight">
              Roasted with Purpose
            </h1>
            <p className="mt-5 sm:mt-6 text-lg sm:text-xl text-white/80 leading-relaxed max-w-2xl">
              At Valley Specialty Roasters, great coffee starts with great relationships —
              with our farmers, our partners, and our community.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="fade-up-on-scroll">
              <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
                How We Started
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-6">Our Journey</h2>
              <div className="space-y-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
                <p>
                  Valley Specialty Roasters was founded on a simple belief: businesses
                  deserve access to the same exceptional coffee that the best specialty
                  cafes serve.
                </p>
                <p>
                  Our roasting approach is guided by the coffee itself. Each origin
                  has a unique story to tell, and our job is to develop roast profiles
                  that let those flavors shine.
                </p>
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl fade-up-delay-1">
              <Image
                src="https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80"
                alt="Coffee roasting facility"
                fill
                className="object-cover animate-ken-burns"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 sm:py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16 fade-up-on-scroll">
            <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
              Our Values
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3">
              What Drives Us
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                image: "https://images.unsplash.com/photo-1524350876685-274059332603?w=600&q=80",
                title: "Ethical Sourcing",
                description:
                  "We build long-term relationships with producers, investing in sustainable farming practices and quality at the source.",
                delay: "fade-up-on-scroll",
              },
              {
                image: "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=600&q=80",
                title: "Craft Roasting",
                description:
                  "Every batch is profiled, monitored, and adjusted with precision. We develop the full potential of each coffee we source.",
                delay: "fade-up-delay-1",
              },
              {
                image: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&q=80",
                title: "Partner Success",
                description:
                  "Your success is our success. We're a true partner — responsive, flexible, and invested in your business.",
                delay: "fade-up-delay-2",
              },
            ].map((value) => (
              <div key={value.title} className={`group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${value.delay}`}>
                <div className="relative h-56 overflow-hidden">
                  <Image
                    src={value.image}
                    alt={value.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
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

      {/* Visit Us */}
      <section className="py-16 sm:py-20 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 fade-up-on-scroll">
            <div className="flex items-start gap-4">
              <MapPin className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-display text-lg font-semibold">Visit the Roastery</p>
                <p className="text-muted-foreground mt-1 leading-relaxed">
                  7131 S Val Vista Dr, Suite 103
                  <br />
                  Gilbert, AZ 85298
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="h-6 w-6 text-primary mt-1 shrink-0" />
              <div>
                <p className="font-display text-lg font-semibold">Get in Touch</p>
                <a
                  href="mailto:info@valleyspecialtyroasters.com"
                  className="text-muted-foreground hover:text-primary transition-colors mt-1 inline-block break-all"
                >
                  info@valleyspecialtyroasters.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center fade-up-on-scroll">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold">
            Ready to Partner with Us?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            We&apos;d love to supply your business with exceptional coffee.
          </p>
          <div className="mt-8">
            <Link href="/contact">
              <Button size="lg" className="btn-lift bg-primary hover:bg-primary/90 text-white font-semibold px-8">
                Contact Us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
