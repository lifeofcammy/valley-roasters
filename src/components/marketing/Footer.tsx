import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Valley Specialty Roasters"
                width={56}
                height={56}
                className="rounded-full"
              />
              <div>
                <p className="font-display font-bold text-lg text-secondary-foreground leading-tight">
                  Valley Specialty
                </p>
                <p className="font-display font-bold text-lg text-secondary-foreground leading-tight">
                  Roasters
                </p>
              </div>
            </div>
            <p className="text-sm text-secondary-foreground/50 max-w-sm leading-relaxed">
              Premium specialty coffee roasted to order for cafes, restaurants,
              and businesses. Sourced with care from the world&apos;s finest origins.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-secondary-foreground/70">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "About Us" },
                { href: "/wholesale", label: "Wholesale Program" },
                { href: "/contact", label: "Contact" },
                { href: "/login", label: "Wholesale Portal" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-secondary-foreground/50 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4 text-secondary-foreground/70">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-secondary-foreground/50">
              <li>
                <a
                  href="mailto:info@valleyspecialtyroasters.com"
                  className="hover:text-primary transition-colors"
                >
                  info@valleyspecialtyroasters.com
                </a>
              </li>
              <li>Gilbert, Arizona</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-secondary-foreground/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-secondary-foreground/30">
            &copy; {new Date().getFullYear()} Valley Specialty Roasters. All rights reserved.
          </p>
          <p className="text-sm text-secondary-foreground/30">
            Premium Wholesale Coffee &middot; Arizona
          </p>
        </div>
      </div>
    </footer>
  );
}
