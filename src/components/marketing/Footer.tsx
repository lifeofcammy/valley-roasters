import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex flex-col items-start gap-1">
              <span className="font-display font-bold text-xl text-background tracking-wider">
                VALLEY
              </span>
              <span className="font-sans font-medium text-[9px] tracking-[0.3em] text-background/60 uppercase">
                Specialty Roasters
              </span>
            </div>
            <p className="text-sm text-background/60 max-w-xs">
              Small-batch specialty coffee roasted to order for
              discerning businesses.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-sans font-semibold text-sm uppercase tracking-wider mb-4 text-background/80">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/about", label: "About Us" },
                { href: "/wholesale", label: "Wholesale Program" },
                { href: "/contact", label: "Contact" },
                { href: "/login", label: "Wholesale Portal" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/60 hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-sans font-semibold text-sm uppercase tracking-wider mb-4 text-background/80">
              Contact
            </h3>
            <ul className="space-y-2 text-sm text-background/60">
              <li>
                <a href="mailto:info@valleyspecialtyroasters.com" className="hover:text-background transition-colors">
                  info@valleyspecialtyroasters.com
                </a>
              </li>
              <li>Valley Specialty Roasters</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/10 text-center text-sm text-background/40">
          &copy; {new Date().getFullYear()} Valley Specialty Roasters. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
