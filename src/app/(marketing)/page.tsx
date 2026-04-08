import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, MapPin } from "lucide-react";

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
      {/* HERO - Logo-centered, dramatic, Ken Burns background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background - dark roasted beans with slow Ken Burns motion */}
        <div className="absolute inset-0 bg-[#0c0705]">
          <Image
            src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=85"
            alt="Coffee art"
            fill
            className="object-cover opacity-30 animate-ken-burns"
            priority
          />
          {/* Vignette overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
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
                Become a Wholesale Partner
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
              <span className="text-primary font-bold text-6xl sm:text-7xl font-display leading-none">01</span>
              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mt-4 mb-5">
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
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
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
              <span className="text-primary font-bold text-6xl sm:text-7xl font-display leading-none">02</span>
              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold mt-4 mb-5">
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

      {/* Coffee Selection */}
      <section className="py-20 sm:py-24 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 sm:mb-16 gap-4 fade-up-on-scroll">
            <div>
              <span className="text-primary font-semibold text-xs sm:text-sm uppercase tracking-widest">
                Our Selection
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mt-3">
                Current Offerings
              </h2>
            </div>
            <Link href="/wholesale">
              <Button variant="outline" className="btn-lift font-semibold">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {products?.map((product, index) => {
              const coffeeImages = [
                "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80",
                "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=400&q=80",
                "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&q=80",
                "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80",
              ];
              const delayClasses = ["fade-up-on-scroll", "fade-up-delay-1", "fade-up-delay-2", "fade-up-delay-3"];
              return (
                <div
                  key={product.id}
                  className={`group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${delayClasses[index % 4]}`}
                >
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={coffeeImages[index % coffeeImages.length]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {product.origin}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {product.flavor_notes?.slice(0, 3).map((note: string) => (
                        <span
                          key={note}
                          className="text-xs px-2.5 py-1 bg-muted rounded-full text-foreground/60 font-medium"
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 uppercase tracking-wider font-medium">
                      {product.roast_level} roast
                    </p>
                  </div>
                </div>
              );
            })}
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
            Ready to Elevate Your
            <br />
            <span className="text-primary">Coffee Program?</span>
          </h2>
          <p className="mt-5 sm:mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join our growing family of wholesale partners across Arizona.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="btn-lift w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 font-semibold shadow-lg shadow-primary/25"
              >
                Apply for Wholesale Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="btn-lift w-full sm:w-auto text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 font-semibold"
              >
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
