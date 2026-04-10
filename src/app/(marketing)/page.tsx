import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin } from "lucide-react";
import {
  fetchTopSellingItems,
  isSquareConfigured,
  type SquareTopItem,
} from "@/lib/square/client";


import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Valley Specialty Roasters | Wholesale Coffee Roasted to Order",
  description:
    "Organic, specialty-grade wholesale coffee roasted in small batches in Gilbert, Arizona. Custom blends, sustainable sourcing, and dedicated wholesale support for cafes and restaurants.",
};

export default async function HomePage() {
  // Pull Valley's actual top-selling coffee SKUs from Square (cached 1h)
  let topSellers: SquareTopItem[] = [];
  if (isSquareConfigured()) {
    try {
      topSellers = (await fetchTopSellingItems(12)).filter(
        (item) => !item.name.startsWith("TC ")
      ).slice(0, 8);
    } catch {
      topSellers = [];
    }
  }

  return (
    <>
      {/* HERO - Logo-centered, dramatic, Ken Burns background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image — full visibility with a soft vignette so text stays readable */}
        <div className="absolute inset-0 bg-[#1c1210]">
          <Image
            src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=85"
            alt="Coffee art"
            fill
            className="object-cover opacity-80 animate-ken-burns"
            priority
          />
          {/* Vignette overlay — light enough to keep the photo bright and warm */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/35" />
        </div>


        {/* Content centered */}
        <div className="relative text-center px-4 sm:px-6 py-20 max-w-5xl">
          {/* Large logo - responsive sizing */}
          <div className="mb-6 sm:mb-8">
            <Image
              src="/logo.png"
              alt="Valley Specialty Roasters"
              width={280}
              height={280}
              className="mx-auto rounded-full shadow-2xl ring-4 ring-white/10 w-[170px] h-[170px] sm:w-[220px] sm:h-[220px] lg:w-[280px] lg:h-[280px]"
              priority
            />
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight max-w-4xl mx-auto">
            Specialty Coffee
            <br />
            <span className="text-primary">Roasted to Order</span>
          </h1>
          <p className="mt-5 sm:mt-6 text-lg sm:text-xl lg:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed px-2">
            Premium wholesale coffee for Arizona&apos;s finest cafes, restaurants,
            and businesses.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-white/40">
            <MapPin className="h-4 w-4" />
            <span className="text-xs sm:text-sm uppercase tracking-widest">Gilbert, Arizona</span>
          </div>

          <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/wholesale" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="btn-lift w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 font-semibold shadow-lg shadow-primary/25"
              >
                Become a Wholesale Customer
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="btn-lift w-full sm:w-auto bg-transparent border-2 border-white/40 text-white hover:bg-white/15 hover:border-white/70 hover:text-white text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 font-semibold backdrop-blur-sm"
              >
                Our Story
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* Split Feature - Image + Text */}
      <section className="py-0">
        {/* Row 1 (was Row 2) - Small-Batch Roasted */}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh] lg:min-h-[70vh]">
          <div className="flex items-center px-6 sm:px-12 lg:px-20 py-16 sm:py-20 bg-white order-2 lg:order-1 fade-up-on-scroll">
            <div className="max-w-lg">
              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-5">
                Small-Batch Roasted
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Your coffee is never pulled from a shelf. Every order is roasted fresh in small
                batches with precision profiles developed for each origin. Peak flavor, every time.
              </p>
            </div>
          </div>
          <div className="relative order-1 lg:order-2 min-h-[280px] lg:min-h-0 bg-[#0c0705]">
            <video
              data-autoplay
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/images/coffee-brewing-poster.jpg"
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/videos/coffee-brewing.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[60vh] lg:min-h-[70vh]">
          <div className="relative min-h-[280px] lg:min-h-0">
            <Image
              src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=960&q=80"
              alt="Coffee farm landscape"
              fill
              className="object-cover animate-ken-burns"
            />
          </div>
          <div className="flex items-center px-6 sm:px-12 lg:px-20 py-16 sm:py-20 bg-secondary text-secondary-foreground fade-up-on-scroll">
            <div className="max-w-lg">
              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mb-5">
                Effortless Ordering
              </h3>
              <p className="text-base sm:text-lg text-secondary-foreground/70 leading-relaxed">
                Your own wholesale portal with custom pricing, order history, and one-click
                reordering. Place an order in under 60 seconds. Dedicated account support
                and flexible sizing from 5lb to 50lb bags.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialty Grade + Custom Blends */}
      <section className="py-20 sm:py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="fade-up-on-scroll">
              <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
                Specialty Grade
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 leading-tight">
                Coffee That Speaks
                <br />
                for Itself
              </h2>
              <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
                Every bean we source is specialty grade &mdash; scoring 80+ on the SCA
                scale. We work directly with sustainable farms in Brazil,
                Guatemala, and Honduras, selecting lots for their distinct
                flavor profiles and consistency season over season.
              </p>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                All of our coffee is organic, roasted in small batches at our
                facility in Gilbert, Arizona, and shipped within days of
                roasting.
              </p>
            </div>
            <div className="relative fade-up-delay-1">
              <div className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=85"
                  alt="Specialty grade coffee beans"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          {/* Custom Blends */}
          <div className="mt-20 sm:mt-28 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative order-2 lg:order-1 fade-up-delay-1">
              <div className="relative h-[400px] sm:h-[500px] rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=85"
                  alt="Custom coffee blend development"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 fade-up-on-scroll">
              <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
                Made for You
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 leading-tight">
                Custom Blends for
                <br />
                Your Menu
              </h2>
              <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
                Request a custom coffee blend tailored to your menu &mdash; a
                house espresso, a signature drip, a blend that&apos;s yours
                alone. We develop the roast profile with you and produce
                it on your schedule.
              </p>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                Whether you need a single origin or a custom blend, we&apos;ll
                work with you to get it right.
              </p>
              <div className="mt-8">
                <Link href="/contact">
                  <Button className="btn-lift bg-primary hover:bg-primary/90 text-white font-semibold px-8">
                    Let&apos;s Talk
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-24 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center fade-up-on-scroll">
          <Image
            src="/logo.png"
            alt="Valley Specialty Roasters"
            width={120}
            height={120}
            className="rounded-full mx-auto mb-8 sm:mb-10 shadow-lg w-[100px] h-[100px] sm:w-[120px] sm:h-[120px]"
          />
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Join Our Family of
            <br />
            <span className="text-primary">Wholesale Customers</span>
          </h2>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="btn-lift w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 font-semibold shadow-lg shadow-primary/25"
              >
                Contact Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
